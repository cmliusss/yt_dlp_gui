# YT-DLP GUI - 可视化视频下载器

<div align="center">

![YT-DLP GUI](https://img.shields.io/badge/YT--DLP-GUI-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-16+-339933?style=for-the-badge&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

一个基于 React + Ant Design + Node.js 的现代化视频下载工具，为 yt-dlp 提供美观易用的图形界面。

[功能特性](#功能特性) • [安装使用](#安装使用) • [支持网站](#支持的网站) • [贡献代码](#贡献) • [许可证](#许可证)

</div>

## 📸 项目截图

> 注：项目截图将在后续版本中添加

## 🌟 项目亮点

- 🎯 **功能完整** - 从基础下载到高级管理，功能一应俱全
- 🎨 **界面美观** - 现代化设计，用户体验优秀
- 🚀 **性能优秀** - 实时进度显示，多任务并行下载
- 🛡️ **稳定可靠** - 完善的错误处理和日志系统
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🌍 **多语言支持** - 完整的中文本地化界面

## 🚀 功能特性

### 🎯 核心功能
- **🔍 智能解析** - 自动获取视频标题、时长、上传者、缩略图等详细信息
- **📊 格式选择** - 支持多种视频格式和质量选择（720p、1080p、4K等）
- **⚡ 实时下载** - 实时显示下载进度、速度和剩余时间
- **📋 任务管理** - 支持多任务并行下载、任务取消和历史记录
- **📦 批量下载** - 支持批量添加URL，一键下载多个视频

### 🎨 界面特色
- **🎭 现代化设计** - 基于 Ant Design 5 的美观界面
- **📱 响应式布局** - 完美适配桌面和移动设备
- **✨ 流畅动画** - 丰富的交互动画和过渡效果
- **🌏 中文界面** - 完整的中文本地化支持
- **🎨 渐变主题** - 美观的紫色渐变背景

### 🛠️ 高级功能
- **📝 日志系统** - 完整的日志记录、搜索和导出功能
- **⚙️ 设置管理** - 下载路径、格式、并发数等个性化配置
- **🔄 实时通信** - WebSocket 实时更新下载状态
- **🛡️ 错误处理** - 完善的错误提示和异常处理
- **🌐 跨平台** - 支持 Windows、macOS、Linux

## 📋 系统要求

### 必需软件
- **Node.js** (版本 16 或更高) - [下载地址](https://nodejs.org/)
- **yt-dlp** (最新版本) - 视频下载核心引擎

### yt-dlp 安装方法

<details>
<summary>🪟 Windows</summary>

```bash
# 方法1: 使用 pip (推荐)
pip install yt-dlp

# 方法2: 使用 winget
winget install yt-dlp

# 方法3: 下载可执行文件
# 从 https://github.com/yt-dlp/yt-dlp/releases 下载 yt-dlp.exe
# 放到 PATH 环境变量中的任意目录
```
</details>

<details>
<summary>🍎 macOS</summary>

```bash
# 方法1: 使用 Homebrew (推荐)
brew install yt-dlp

# 方法2: 使用 pip
pip install yt-dlp

# 方法3: 使用 MacPorts
sudo port install yt-dlp
```
</details>

<details>
<summary>🐧 Linux</summary>

```bash
# 方法1: 使用 pip (推荐)
pip install yt-dlp

# 方法2: 使用包管理器
# Ubuntu/Debian
sudo apt install yt-dlp

# Arch Linux
sudo pacman -S yt-dlp

# Fedora
sudo dnf install yt-dlp
```
</details>

## 🚀 安装使用

### 1️⃣ 克隆项目
```bash
git clone https://github.com/cmliusss/yt_dlp_gui.git
cd yt-dlp-gui
```

### 2️⃣ 安装依赖
```bash
npm install
```

### 3️⃣ 启动应用
```bash
# 一键启动 (推荐)
npm start

# 或者分别启动
npm run server  # 后端服务器 (端口 3001)
npm run dev     # 前端开发服务器 (端口 5173)
```

### 4️⃣ 访问应用
打开浏览器访问: **http://localhost:5173**

> 💡 **提示**: 首次启动可能需要几秒钟来初始化服务

## 📖 使用说明

### 🎯 基本使用流程
1. **📝 输入视频URL** - 在输入框中粘贴视频链接
2. **🔍 获取视频信息** - 点击"获取信息"按钮，自动解析视频详情
3. **⚙️ 选择格式** - 从下拉菜单中选择想要的视频格式和质量
4. **🚀 开始下载** - 点击"开始下载"按钮
5. **📊 监控进度** - 在下载任务列表中查看实时进度

### 🔥 高级功能使用

<details>
<summary>📦 批量下载</summary>

1. 点击顶部的"批量下载"按钮
2. 添加多个视频URL（支持单个添加或批量粘贴）
3. 选择默认下载格式
4. 点击"开始批量下载"
</details>

<details>
<summary>📋 任务管理</summary>

- 查看所有下载任务的状态和进度
- 随时取消正在进行的下载任务
- 查看下载历史记录
- 重新下载失败的任务
</details>

<details>
<summary>📝 日志查看</summary>

1. 点击顶部的"日志"按钮
2. 查看系统运行日志
3. 使用搜索和过滤功能定位问题
4. 导出日志文件用于问题排查
</details>

<details>
<summary>⚙️ 设置配置</summary>

- **下载路径设置**: 支持相对路径、预设路径、自定义路径
- **格式设置**: 配置默认下载格式和质量
- **并发控制**: 设置同时下载的任务数量
- **界面设置**: 主题、语言等个性化配置
</details>

## 🌐 支持的网站

<div align="center">

| 🎥 视频平台 | 🎵 音乐平台 | 📱 社交媒体 | 🎓 教育平台 |
|------------|------------|------------|------------|
| YouTube | SoundCloud | Twitter/X | Coursera |
| Bilibili | Spotify | Instagram | edX |
| Vimeo | Bandcamp | TikTok | Khan Academy |
| Dailymotion | Mixcloud | Facebook | Udemy |

</div>

**以及 yt-dlp 支持的 1000+ 网站** - [完整列表](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)

## 🏗️ 项目结构

```
yt-dlp-gui/
├── 📁 public/                    # 静态资源
│   └── vite.svg                 # Vite 图标
├── 📁 src/                      # 前端源码
│   ├── 📁 components/           # React 组件
│   │   ├── BatchDownload.jsx    # 批量下载组件
│   │   ├── Settings.jsx         # 设置管理组件
│   │   ├── LogViewer.jsx        # 日志查看器组件
│   │   └── index.js             # 组件导出
│   ├── 📁 utils/                # 工具函数
│   │   ├── logger.js            # 日志管理工具
│   │   └── fileSystem.js        # 文件系统工具
│   ├── 📁 assets/               # 静态资源
│   │   └── react.svg            # React 图标
│   ├── App.jsx                  # 主应用组件
│   ├── App.css                  # 应用样式
│   ├── main.jsx                 # 应用入口
│   └── index.css                # 全局样式
├── 📁 downloads/                # 下载文件目录
│   └── .gitkeep                 # 保持目录结构
├── server.js                    # 后端服务器
├── package.json                 # 项目配置
├── vite.config.js               # Vite 配置
├── eslint.config.js             # ESLint 配置
├── .gitignore                   # Git 忽略文件
├── 使用说明.md                   # 详细使用说明
└── README.md                    # 项目说明
```

## 🛠️ 技术栈

### 前端技术
- **⚛️ React 19** - 最新的 React 框架
- **🎨 Ant Design 5** - 企业级 UI 设计语言
- **⚡ Vite** - 下一代前端构建工具
- **🎯 Axios** - HTTP 客户端库
- **📱 响应式设计** - 适配各种设备

### 后端技术
- **🟢 Node.js** - JavaScript 运行时
- **🚀 Express** - Web 应用框架
- **📁 Multer** - 文件上传中间件
- **🌐 CORS** - 跨域资源共享

### 开发工具
- **📝 ESLint** - 代码质量检查
- **🔧 Concurrently** - 并行运行脚本
- **🎨 CSS3** - 现代样式技术

## ❓ 常见问题

<details>
<summary>🔧 安装和配置问题</summary>

**Q: 提示找不到 yt-dlp 命令**
- 确保已正确安装 yt-dlp
- 检查 yt-dlp 是否在系统 PATH 中
- 尝试在命令行中运行 `yt-dlp --version` 验证安装

**Q: Node.js 版本不兼容**
- 确保 Node.js 版本 >= 16
- 使用 `node --version` 检查当前版本
- 建议使用 Node.js LTS 版本

**Q: 端口被占用**
- 检查端口 3001 和 5173 是否被占用
- 可以修改 `server.js` 和 `vite.config.js` 中的端口配置
</details>

<details>
<summary>📥 下载问题</summary>

**Q: 下载速度很慢**
- 取决于网络环境和视频源服务器
- 尝试选择不同的视频格式和质量
- 检查网络连接是否稳定

**Q: Bilibili 视频下载失败**
- 选择"最佳 MP4 格式"而不是"最佳质量"
- 尝试选择"720p 及以下"或"1080p 及以下"
- 某些视频可能需要登录或有地区限制

**Q: 某些网站无法下载**
- 确保 yt-dlp 是最新版本
- 查看日志了解详细错误信息
- 某些网站可能需要特殊配置或代理
</details>

<details>
<summary>💾 文件和路径问题</summary>

**Q: 下载的文件保存在哪里**
- 默认保存在项目根目录的 `downloads` 文件夹中
- 可以在设置中修改下载路径
- 支持相对路径和绝对路径

**Q: 如何修改下载路径**
- 点击设置按钮进入设置页面
- 在"下载路径设置"中选择或输入新路径
- 支持预设路径（桌面、下载文件夹等）
</details>

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](CONTRIBUTING.md) 了解详细信息。

### 贡献方式
- 🐛 报告 Bug
- 💡 提出新功能建议
- 🔧 提交代码修复
- 📖 改进文档
- 🌍 翻译界面

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议。

## ⭐ Star History

如果这个项目对您有帮助，请给我们一个 ⭐ Star！

## 📞 联系我们

- 📧 提交 Issue: [GitHub Issues](https://github.com/your-username/yt-dlp-gui/issues)
- 💬 讨论交流: [GitHub Discussions](https://github.com/your-username/yt-dlp-gui/discussions)

---

<div align="center">

**🎉 享受您的视频下载体验！**

Made with ❤️ by [cmliusss]

</div>
