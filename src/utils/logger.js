// 前端日志管理工具
class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // 最大日志条数
    this.listeners = [];
  }

  // 添加日志监听器
  addListener(callback) {
    this.listeners.push(callback);
  }

  // 移除日志监听器
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // 通知监听器
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.logs));
  }

  // 记录日志
  log(level, message, source = 'CLIENT', details = null) {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      level,
      message,
      source,
      details
    };

    this.logs.push(logEntry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 同时输出到控制台
    this.outputToConsole(logEntry);

    // 通知监听器
    this.notifyListeners();

    // 发送到服务器（可选）
    this.sendToServer(logEntry);

    return logEntry;
  }

  // 输出到控制台
  outputToConsole(logEntry) {
    const { level, message, source, details } = logEntry;
    const prefix = `[${new Date(logEntry.timestamp).toLocaleTimeString()}] [${source}]`;
    
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
  }

  // 发送日志到服务器
  async sendToServer(logEntry) {
    try {
      await fetch('http://localhost:3001/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      // 静默处理发送失败，避免循环日志
      console.warn('Failed to send log to server:', error.message);
    }
  }

  // 便捷方法
  error(message, source, details) {
    return this.log('error', message, source, details);
  }

  warn(message, source, details) {
    return this.log('warn', message, source, details);
  }

  info(message, source, details) {
    return this.log('info', message, source, details);
  }

  debug(message, source, details) {
    return this.log('debug', message, source, details);
  }

  // 获取所有日志
  getLogs() {
    return [...this.logs];
  }

  // 按级别获取日志
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  // 搜索日志
  searchLogs(query) {
    const lowerQuery = query.toLowerCase();
    return this.logs.filter(log => 
      log.message.toLowerCase().includes(lowerQuery) ||
      log.source.toLowerCase().includes(lowerQuery) ||
      (log.details && log.details.toLowerCase().includes(lowerQuery))
    );
  }

  // 清空日志
  clear() {
    this.logs = [];
    this.notifyListeners();
  }

  // 导出日志
  export(format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(this.logs, null, 2);
      case 'text':
        return this.logs.map(log => 
          `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}${log.details ? '\n  ' + log.details : ''}`
        ).join('\n');
      case 'csv':
        const headers = 'Timestamp,Level,Source,Message,Details\n';
        const rows = this.logs.map(log => 
          `"${log.timestamp}","${log.level}","${log.source}","${log.message.replace(/"/g, '""')}","${(log.details || '').replace(/"/g, '""')}"`
        ).join('\n');
        return headers + rows;
      default:
        return this.export('json');
    }
  }

  // 获取日志统计
  getStats() {
    const stats = {
      total: this.logs.length,
      error: 0,
      warn: 0,
      info: 0,
      debug: 0,
      sources: {}
    };

    this.logs.forEach(log => {
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

    return stats;
  }

  // 设置最大日志数量
  setMaxLogs(max) {
    this.maxLogs = max;
    if (this.logs.length > max) {
      this.logs = this.logs.slice(-max);
      this.notifyListeners();
    }
  }
}

// 创建全局日志实例
const logger = new Logger();

// 捕获全局错误
window.addEventListener('error', (event) => {
  logger.error(
    `Uncaught Error: ${event.message}`,
    'GLOBAL',
    `File: ${event.filename}:${event.lineno}:${event.colno}`
  );
});

// 捕获未处理的Promise拒绝
window.addEventListener('unhandledrejection', (event) => {
  logger.error(
    `Unhandled Promise Rejection: ${event.reason}`,
    'PROMISE',
    event.reason?.stack || ''
  );
});

// 记录页面加载
logger.info('Application started', 'APP');

export default logger;
