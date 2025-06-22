// 文件系统工具类
class FileSystemHelper {
  constructor() {
    this.isSupported = 'showDirectoryPicker' in window;
  }

  // 检查是否支持文件系统API
  isFileSystemAccessSupported() {
    return this.isSupported;
  }

  // 选择文件夹
  async selectDirectory() {
    if (!this.isSupported) {
      throw new Error('当前浏览器不支持文件夹选择功能');
    }

    try {
      const directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
      
      return {
        name: directoryHandle.name,
        path: directoryHandle.name, // 浏览器环境下无法获取完整路径
        handle: directoryHandle
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('用户取消了文件夹选择');
      }
      throw new Error(`文件夹选择失败: ${error.message}`);
    }
  }

  // 验证文件夹权限
  async verifyPermission(directoryHandle, readWrite = true) {
    const options = {};
    if (readWrite) {
      options.mode = 'readwrite';
    }

    // 检查是否已有权限
    if ((await directoryHandle.queryPermission(options)) === 'granted') {
      return true;
    }

    // 请求权限
    if ((await directoryHandle.requestPermission(options)) === 'granted') {
      return true;
    }

    return false;
  }

  // 创建文件夹（如果不存在）
  async createDirectory(parentHandle, name) {
    try {
      return await parentHandle.getDirectoryHandle(name, { create: true });
    } catch (error) {
      throw new Error(`创建文件夹失败: ${error.message}`);
    }
  }

  // 获取文件夹路径的显示名称
  getDisplayPath(directoryInfo) {
    if (directoryInfo.path && directoryInfo.path !== directoryInfo.name) {
      return directoryInfo.path;
    }
    return `选中文件夹: ${directoryInfo.name}`;
  }

  // 降级方案：使用input[type=file]
  async selectDirectoryFallback() {
    return new Promise((resolve, reject) => {
      // 创建隐藏的input元素
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;
      input.style.display = 'none';

      input.onchange = (event) => {
        const files = event.target.files;
        if (files.length > 0) {
          // 获取第一个文件的路径信息
          const firstFile = files[0];
          const pathParts = firstFile.webkitRelativePath.split('/');
          const folderName = pathParts[0];
          
          resolve({
            name: folderName,
            path: folderName,
            files: Array.from(files)
          });
        } else {
          reject(new Error('未选择任何文件夹'));
        }
        
        // 清理
        document.body.removeChild(input);
      };

      input.oncancel = () => {
        reject(new Error('用户取消了文件夹选择'));
        document.body.removeChild(input);
      };

      // 添加到DOM并触发点击
      document.body.appendChild(input);
      input.click();
    });
  }

  // 统一的文件夹选择接口
  async selectFolder() {
    try {
      if (this.isSupported) {
        return await this.selectDirectory();
      } else {
        return await this.selectDirectoryFallback();
      }
    } catch (error) {
      throw error;
    }
  }

  // 获取推荐的下载路径
  getRecommendedPaths() {
    const paths = [];
    
    // 添加常用路径
    paths.push({
      label: '桌面',
      value: 'Desktop',
      icon: '🖥️'
    });
    
    paths.push({
      label: '下载文件夹',
      value: 'Downloads',
      icon: '📥'
    });
    
    paths.push({
      label: '文档',
      value: 'Documents',
      icon: '📄'
    });
    
    paths.push({
      label: '视频',
      value: 'Videos',
      icon: '🎬'
    });

    return paths;
  }
}

// 创建全局实例
const fileSystemHelper = new FileSystemHelper();

export default fileSystemHelper;
