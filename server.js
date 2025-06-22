const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// 存储下载任务
const downloadTasks = new Map();
let taskIdCounter = 1;

// 存储日志
const logs = [];
const MAX_LOGS = 1000;

// 日志记录函数
function logMessage(level, message, source = 'SERVER', details = null) {
    const logEntry = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        level,
        message,
        source,
        details
    };

    logs.push(logEntry);

    // 限制日志数量
    if (logs.length > MAX_LOGS) {
        logs.splice(0, logs.length - MAX_LOGS);
    }

    // 输出到控制台
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${source}] [${level.toUpperCase()}]`;

    switch (level) {
        case 'error':
            console.error(prefix, message, details || '');
            break;
        case 'warn':
            console.warn(prefix, message, details || '');
            break;
        case 'info':
            console.info(prefix, message, details || '');
            break;
        case 'debug':
            console.debug(prefix, message, details || '');
            break;
        default:
            console.log(prefix, message, details || '');
    }

    return logEntry;
}

// 获取视频信息
app.post('/api/video-info', (req, res) => {
    const { url } = req.body;

    if (!url) {
        logMessage('warn', 'Video info request missing URL', 'API');
        return res.status(400).json({ error: '请提供视频URL' });
    }

    logMessage('info', `Getting video info for: ${url}`, 'API');

    const ytDlp = spawn('yt-dlp', [
        '--dump-json',
        '--no-playlist',
        '--no-warnings',
        '--ignore-errors',
        url
    ]);

    let output = '';
    let error = '';

    ytDlp.stdout.on('data', (data) => {
        output += data.toString();
    });

    ytDlp.stderr.on('data', (data) => {
        error += data.toString();
    });

    ytDlp.on('close', (code) => {
        if (code === 0) {
            try {
                const videoInfo = JSON.parse(output);
                logMessage('info', `Successfully got video info: ${videoInfo.title}`, 'YT-DLP');
                res.json({
                    title: videoInfo.title,
                    duration: videoInfo.duration,
                    uploader: videoInfo.uploader,
                    thumbnail: videoInfo.thumbnail,
                    formats: videoInfo.formats?.map(f => ({
                        format_id: f.format_id,
                        ext: f.ext,
                        quality: f.quality,
                        filesize: f.filesize,
                        format_note: f.format_note,
                        height: f.height,
                        width: f.width
                    })) || []
                });
            } catch (e) {
                logMessage('error', 'Failed to parse video info', 'YT-DLP', e.message);
                res.status(500).json({ error: '解析视频信息失败' });
            }
        } else {
            logMessage('error', `Failed to get video info for ${url}`, 'YT-DLP', error);
            res.status(500).json({ error: error || '获取视频信息失败' });
        }
    });
});

// 获取可用格式列表
app.post('/api/list-formats', (req, res) => {
    const { url } = req.body;

    if (!url) {
        logMessage('warn', 'List formats request missing URL', 'API');
        return res.status(400).json({ error: '请提供视频URL' });
    }

    logMessage('info', `Listing formats for: ${url}`, 'API');

    const ytDlp = spawn('yt-dlp', [
        '--list-formats',
        '--no-warnings',
        url
    ]);

    let output = '';
    let error = '';

    ytDlp.stdout.on('data', (data) => {
        output += data.toString();
    });

    ytDlp.stderr.on('data', (data) => {
        error += data.toString();
    });

    ytDlp.on('close', (code) => {
        if (code === 0) {
            logMessage('info', `Successfully listed formats for: ${url}`, 'YT-DLP');
            res.json({ formats: output });
        } else {
            logMessage('error', `Failed to list formats for ${url}`, 'YT-DLP', error);
            res.status(500).json({ error: error || '获取格式列表失败' });
        }
    });
});

// 开始下载
app.post('/api/download', (req, res) => {
    const { url, format, outputPath = './downloads' } = req.body;

    if (!url) {
        logMessage('warn', 'Download request missing URL', 'API');
        return res.status(400).json({ error: '请提供视频URL' });
    }

    const taskId = taskIdCounter++;
    logMessage('info', `Starting download task ${taskId} for: ${url}`, 'API');

    // 处理路径（支持相对路径、绝对路径和系统路径）
    let resolvedPath = outputPath;
    try {
        logMessage('info', `Processing download path: ${outputPath}`, 'SERVER');

        // 处理不同类型的路径
        if (!outputPath || outputPath === '') {
            // 如果路径为空，使用用户下载文件夹作为默认路径
            const userHome = os.homedir();
            resolvedPath = path.join(userHome, 'Downloads');
            logMessage('info', `Using default user downloads path: ${resolvedPath}`, 'SERVER');
        } else if (path.isAbsolute(outputPath)) {
            // 绝对路径 - 直接使用
            resolvedPath = outputPath;
            logMessage('info', `Using absolute path: ${resolvedPath}`, 'SERVER');
        } else if (outputPath.startsWith('./') || outputPath.startsWith('../')) {
            // 明确的相对路径 - 相对于项目目录
            resolvedPath = path.resolve(process.cwd(), outputPath);
            logMessage('info', `Resolved relative path: ${resolvedPath}`, 'SERVER');
        } else {
            // 其他情况 - 尝试解析为绝对路径
            resolvedPath = path.resolve(outputPath);
            logMessage('info', `Resolved path: ${resolvedPath}`, 'SERVER');
        }

        // 验证路径是否有效
        if (!resolvedPath || resolvedPath.length === 0) {
            throw new Error('Resolved path is empty');
        }

        // 确保下载目录存在
        if (!fs.existsSync(resolvedPath)) {
            fs.mkdirSync(resolvedPath, { recursive: true });
            logMessage('info', `Created download directory: ${resolvedPath}`, 'SERVER');
        } else {
            logMessage('info', `Download directory exists: ${resolvedPath}`, 'SERVER');
        }

        // 验证目录是否可写
        try {
            fs.accessSync(resolvedPath, fs.constants.W_OK);
            logMessage('info', `Download directory is writable: ${resolvedPath}`, 'SERVER');
        } catch (accessError) {
            throw new Error(`Directory is not writable: ${resolvedPath}`);
        }

    } catch (error) {
        logMessage('error', `Failed to process download directory: ${outputPath}`, 'SERVER', error.message);
        return res.status(500).json({
            error: `无法创建或访问下载目录: ${error.message}`,
            details: `原始路径: ${outputPath}, 解析路径: ${resolvedPath}`
        });
    }

    const args = [
        '--progress',
        '--newline',
        '--no-warnings',
        '-o', `${resolvedPath}/%(title)s.%(ext)s`
    ];

    // 智能格式选择
    if (format && format !== 'auto' && format !== '') {
        args.push('-f', format);
        logMessage('info', `Using format: ${format}`, 'YT-DLP');
    } else {
        // 检测网站类型并使用合适的格式
        if (url.includes('bilibili.com')) {
            // Bilibili 特殊处理 - 使用更通用的格式选择
            args.push('--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            args.push('--referer', 'https://www.bilibili.com/');
            // 不指定具体格式，让 yt-dlp 自动选择最佳可用格式
            logMessage('info', 'Using Bilibili auto format selection', 'YT-DLP');
        } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
            // YouTube 格式
            args.push('-f', 'best[ext=mp4]/best[ext=webm]/best');
            logMessage('info', 'Using YouTube format: best[ext=mp4]/best[ext=webm]/best', 'YT-DLP');
        } else {
            // 通用格式 - 不指定格式，让yt-dlp自动选择
            logMessage('info', 'Using auto format selection', 'YT-DLP');
        }
    }

    args.push(url);

    logMessage('info', `Executing: yt-dlp ${args.join(' ')}`, 'YT-DLP');
    const ytDlp = spawn('yt-dlp', args, {
        stdio: ['ignore', 'pipe', 'pipe']
    });

    const task = {
        id: taskId,
        url,
        format,
        status: 'downloading',
        progress: 0,
        speed: '',
        eta: '',
        process: ytDlp,
        output: '',
        error: '',
        startTime: new Date().toISOString()
    };

    downloadTasks.set(taskId, task);

    // 处理进程启动错误
    ytDlp.on('error', (error) => {
        logMessage('error', `Failed to start yt-dlp process for task ${taskId}`, 'YT-DLP', error.message);
        task.status = 'failed';
        task.error = `进程启动失败: ${error.message}`;
    });

    ytDlp.stdout.on('data', (data) => {
        const output = data.toString();
        task.output += output;

        // 更详细的进度解析
        const lines = output.split('\n');
        lines.forEach(line => {
            // 解析下载进度 [download] 12.5% of 45.6MiB at 1.2MiB/s ETA 00:32
            const downloadMatch = line.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+[\d.]+\w+\s+at\s+([\d.]+\w+\/s)\s+ETA\s+(\d+:\d+)/);
            if (downloadMatch) {
                task.progress = parseFloat(downloadMatch[1]);
                task.speed = downloadMatch[2];
                task.eta = downloadMatch[3];
                logMessage('debug', `Task ${taskId} progress: ${task.progress}%`, 'YT-DLP');
            }

            // 简单的进度匹配
            const simpleProgressMatch = line.match(/(\d+\.?\d*)%/);
            if (simpleProgressMatch && !downloadMatch) {
                task.progress = parseFloat(simpleProgressMatch[1]);
            }

            // 速度匹配
            const speedMatch = line.match(/([\d.]+\w+\/s)/);
            if (speedMatch && !downloadMatch) {
                task.speed = speedMatch[1];
            }

            // ETA匹配
            const etaMatch = line.match(/ETA\s+(\d+:\d+)/);
            if (etaMatch && !downloadMatch) {
                task.eta = etaMatch[1];
            }
        });
    });

    ytDlp.stderr.on('data', (data) => {
        const errorOutput = data.toString();
        task.error += errorOutput;
        logMessage('warn', `Task ${taskId} stderr: ${errorOutput.trim()}`, 'YT-DLP');
    });

    ytDlp.on('close', (code) => {
        logMessage('info', `Task ${taskId} finished with code: ${code}`, 'YT-DLP');
        if (code === 0) {
            task.status = 'completed';
            task.progress = 100;
            task.endTime = new Date().toISOString();

            // 检查下载的文件
            try {
                const files = fs.readdirSync(resolvedPath);
                const downloadedFiles = files.filter(file =>
                    file.includes(taskId.toString()) ||
                    file.toLowerCase().includes('太阳能主机') ||
                    file.endsWith('.mp4') ||
                    file.endsWith('.mkv') ||
                    file.endsWith('.webm')
                );

                if (downloadedFiles.length > 0) {
                    const filePath = path.join(resolvedPath, downloadedFiles[0]);
                    const stats = fs.statSync(filePath);
                    task.fileSize = stats.size;
                    task.fileName = downloadedFiles[0];
                    task.filePath = filePath;

                    logMessage('info', `Task ${taskId} completed successfully. File: ${downloadedFiles[0]}, Size: ${stats.size} bytes`, 'YT-DLP');
                } else {
                    logMessage('warn', `Task ${taskId} completed but no output file found in ${resolvedPath}`, 'YT-DLP');
                }
            } catch (error) {
                logMessage('error', `Failed to check downloaded files for task ${taskId}`, 'YT-DLP', error.message);
            }
        } else {
            task.status = 'failed';
            task.endTime = new Date().toISOString();
            logMessage('error', `Task ${taskId} failed with code ${code}`, 'YT-DLP', task.error);
        }
    });

    res.json({ taskId, message: '下载任务已开始' });
});

// 获取下载进度
app.get('/api/download/:taskId', (req, res) => {
    const taskId = parseInt(req.params.taskId);
    const task = downloadTasks.get(taskId);
    
    if (!task) {
        return res.status(404).json({ error: '任务不存在' });
    }

    res.json({
        id: task.id,
        status: task.status,
        progress: task.progress,
        speed: task.speed,
        eta: task.eta,
        error: task.error
    });
});

// 获取所有下载任务
app.get('/api/downloads', (req, res) => {
    const tasks = Array.from(downloadTasks.values()).map(task => ({
        id: task.id,
        url: task.url,
        format: task.format,
        status: task.status,
        progress: task.progress,
        speed: task.speed,
        eta: task.eta,
        fileName: task.fileName,
        fileSize: task.fileSize,
        filePath: task.filePath,
        startTime: task.startTime,
        endTime: task.endTime
    }));

    res.json(tasks);
});

// 取消下载
app.delete('/api/download/:taskId', (req, res) => {
    const taskId = parseInt(req.params.taskId);
    const task = downloadTasks.get(taskId);
    
    if (!task) {
        return res.status(404).json({ error: '任务不存在' });
    }

    if (task.process && !task.process.killed) {
        task.process.kill();
        task.status = 'cancelled';
    }

    res.json({ message: '任务已取消' });
});

// 获取日志
app.get('/api/logs', (req, res) => {
    const { level, limit = 100, search } = req.query;
    let filteredLogs = [...logs];

    // 按级别过滤
    if (level && level !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    // 按搜索关键词过滤
    if (search) {
        const searchLower = search.toLowerCase();
        filteredLogs = filteredLogs.filter(log =>
            log.message.toLowerCase().includes(searchLower) ||
            log.source.toLowerCase().includes(searchLower) ||
            (log.details && log.details.toLowerCase().includes(searchLower))
        );
    }

    // 限制返回数量并按时间倒序
    const limitedLogs = filteredLogs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, parseInt(limit));

    res.json(limitedLogs.reverse()); // 最终按时间正序返回
});

// 添加日志
app.post('/api/logs', (req, res) => {
    const { level, message, source = 'CLIENT', details } = req.body;

    if (!level || !message) {
        return res.status(400).json({ error: '缺少必要的日志参数' });
    }

    const logEntry = logMessage(level, message, source, details);
    res.json({ success: true, logId: logEntry.id });
});

// 清空日志
app.delete('/api/logs', (req, res) => {
    logs.length = 0;
    logMessage('info', 'Logs cleared', 'SERVER');
    res.json({ success: true, message: '日志已清空' });
});

// 获取日志统计
app.get('/api/logs/stats', (req, res) => {
    const stats = {
        total: logs.length,
        error: 0,
        warn: 0,
        info: 0,
        debug: 0,
        sources: {}
    };

    logs.forEach(log => {
        // 按级别统计
        if (stats.hasOwnProperty(log.level)) {
            stats[log.level]++;
        }

        // 按来源统计
        if (!stats.sources[log.source]) {
            stats.sources[log.source] = 0;
        }
        stats.sources[log.source]++;
    });

    res.json(stats);
});

// 获取系统路径信息
app.get('/api/system-paths', (req, res) => {
    try {
        const userHome = os.homedir();
        const systemPaths = {
            home: userHome,
            desktop: path.join(userHome, 'Desktop'),
            downloads: path.join(userHome, 'Downloads'),
            documents: path.join(userHome, 'Documents'),
            current: process.cwd(),
            temp: os.tmpdir()
        };

        res.json(systemPaths);
    } catch (error) {
        logMessage('error', 'Failed to get system paths', 'SERVER', error.message);
        res.status(500).json({ error: '获取系统路径失败' });
    }
});

// 图片代理（解决跨域问题）
app.get('/api/proxy-image', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: '缺少图片URL参数' });
    }

    try {
        const https = require('https');
        const http = require('http');

        const protocol = url.startsWith('https:') ? https : http;

        protocol.get(url, (imageRes) => {
            // 设置响应头
            res.setHeader('Content-Type', imageRes.headers['content-type'] || 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.setHeader('Access-Control-Allow-Origin', '*');

            // 管道传输图片数据
            imageRes.pipe(res);
        }).on('error', (error) => {
            logMessage('error', 'Image proxy error', 'SERVER', error.message);
            res.status(500).json({ error: '图片加载失败' });
        });
    } catch (error) {
        logMessage('error', 'Image proxy error', 'SERVER', error.message);
        res.status(500).json({ error: '图片代理失败' });
    }
});

// 打开文件所在文件夹
app.post('/api/open-file-location', (req, res) => {
    const { filePath } = req.body;

    if (!filePath) {
        return res.status(400).json({ error: '缺少文件路径参数' });
    }

    try {
        const { exec } = require('child_process');
        const os = require('os');

        let command;
        const platform = os.platform();

        if (platform === 'win32') {
            // Windows: 使用 explorer 选中文件
            command = `explorer /select,"${filePath}"`;
        } else if (platform === 'darwin') {
            // macOS: 使用 Finder 显示文件
            command = `open -R "${filePath}"`;
        } else {
            // Linux: 使用默认文件管理器打开文件夹
            const dir = path.dirname(filePath);
            command = `xdg-open "${dir}"`;
        }

        exec(command, (error) => {
            if (error) {
                logMessage('error', 'Failed to open file location', 'SERVER', error.message);
                res.status(500).json({ error: '无法打开文件位置' });
            } else {
                logMessage('info', `Opened file location: ${filePath}`, 'SERVER');
                res.json({ success: true, message: '文件位置已打开' });
            }
        });
    } catch (error) {
        logMessage('error', 'Error opening file location', 'SERVER', error.message);
        res.status(500).json({ error: '打开文件位置失败' });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'YT-DLP GUI Server is running' });
});

app.listen(PORT, () => {
    logMessage('info', `服务器运行在 http://localhost:${PORT}`, 'SERVER');
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
