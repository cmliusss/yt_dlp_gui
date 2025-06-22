# 贡献指南

感谢您对 YT-DLP GUI 项目的关注！我们欢迎各种形式的贡献。

## 🤝 如何贡献

### 报告 Bug
1. 在 [Issues](https://github.com/your-username/yt-dlp-gui/issues) 页面搜索是否已有相同问题
2. 如果没有，请创建新的 Issue
3. 请提供详细的错误描述、复现步骤和系统环境信息

### 提出功能建议
1. 在 [Issues](https://github.com/your-username/yt-dlp-gui/issues) 页面创建新的功能请求
2. 详细描述您希望添加的功能和使用场景
3. 如果可能，请提供设计草图或参考示例

### 提交代码
1. Fork 本仓库
2. 创建功能分支: `git checkout -b feature/your-feature-name`
3. 提交您的更改: `git commit -am 'Add some feature'`
4. 推送到分支: `git push origin feature/your-feature-name`
5. 创建 Pull Request

## 📋 开发环境设置

### 前置要求
- Node.js >= 16
- npm 或 yarn
- yt-dlp (最新版本)

### 本地开发
```bash
# 克隆项目
git clone https://github.com/your-username/yt-dlp-gui.git
cd yt-dlp-gui

# 安装依赖
npm install

# 启动开发服务器
npm start
```

## 🎯 代码规范

### JavaScript/React
- 使用 ESLint 进行代码检查
- 遵循 React Hooks 最佳实践
- 组件名使用 PascalCase
- 文件名使用 camelCase

### 提交信息
请使用清晰的提交信息格式：
```
type(scope): description

[optional body]

[optional footer]
```

类型包括：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

## 🧪 测试

在提交 PR 之前，请确保：
- [ ] 代码通过 ESLint 检查
- [ ] 功能在本地环境正常工作
- [ ] 没有破坏现有功能
- [ ] 添加了必要的文档说明

## 📖 文档贡献

我们也欢迎文档方面的贡献：
- 改进 README.md
- 添加使用示例
- 翻译文档到其他语言
- 修正错别字和语法错误

## 🌍 国际化

如果您想为项目添加多语言支持：
1. 在 `src/locales` 目录下添加语言文件
2. 更新语言选择器组件
3. 测试所有界面元素的翻译

## 📞 联系我们

如果您有任何问题或建议，可以通过以下方式联系我们：
- 创建 GitHub Issue
- 发起 GitHub Discussion
- 发送邮件到项目维护者

再次感谢您的贡献！🎉
