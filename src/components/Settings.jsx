import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Space,
  Typography,
  Divider,
  message,
  InputNumber,
  Card,
  Radio,
  Alert,
  Tooltip
} from 'antd';
import {
  FolderOpenOutlined,
  SaveOutlined,
  ReloadOutlined,
  HomeOutlined,
  DesktopOutlined,
  DownloadOutlined,
  FolderAddOutlined
} from '@ant-design/icons';
import fileSystemHelper from '../utils/fileSystem';

const { Text, Title } = Typography;
const { Option } = Select;

const Settings = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [settings, setSettings] = useState({
    downloadPath: './downloads',
    pathType: 'relative', // 'relative', 'absolute', 'preset', 'system'
    defaultFormat: '',
    maxConcurrent: 3,
    autoStart: false,
    showNotifications: true,
    theme: 'light',
    language: 'zh-CN'
  });
  const [systemPaths, setSystemPaths] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);

  // 获取系统路径
  const fetchSystemPaths = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/system-paths');
      const paths = await response.json();
      setSystemPaths(paths);
    } catch (error) {
      console.error('Failed to fetch system paths:', error);
    }
  };

  // 预设路径选项（动态生成）
  const getPresetPaths = () => {
    if (!systemPaths) {
      return [
        { label: '项目目录/downloads', value: './downloads', icon: <FolderOpenOutlined /> }
      ];
    }

    return [
      { label: '项目目录/downloads', value: './downloads', icon: <FolderOpenOutlined /> },
      { label: '桌面/downloads', value: `${systemPaths.desktop}/downloads`, icon: <DesktopOutlined /> },
      { label: '系统下载文件夹', value: systemPaths.downloads, icon: <DownloadOutlined /> },
      { label: '用户目录/yt-dlp-downloads', value: `${systemPaths.home}/yt-dlp-downloads`, icon: <HomeOutlined /> }
    ];
  };

  // 加载设置和系统路径
  useEffect(() => {
    const savedSettings = localStorage.getItem('yt-dlp-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      form.setFieldsValue(parsed);
    }

    // 获取系统路径
    if (visible) {
      fetchSystemPaths();
    }
  }, [form, visible]);

  // 保存设置
  const saveSettings = () => {
    form.validateFields().then(values => {
      // 合并当前设置和表单值
      const finalSettings = {
        ...settings,
        ...values,
        pathType: settings.pathType // 确保路径类型被保存
      };

      // 如果是系统选择类型，确保路径正确
      if (settings.pathType === 'system' && selectedFolder) {
        finalSettings.downloadPath = selectedFolder.path || selectedFolder.name;
      }

      setSettings(finalSettings);
      localStorage.setItem('yt-dlp-settings', JSON.stringify(finalSettings));

      message.success('设置已保存');
      onClose();
    }).catch(error => {
      console.error('表单验证失败:', error);
      message.error('设置保存失败，请检查输入');
    });
  };

  // 重置设置
  const resetSettings = () => {
    const presetPaths = getPresetPaths();
    const defaultSettings = {
      downloadPath: presetPaths[1].value, // 使用Downloads文件夹作为默认
      pathType: 'preset',
      defaultFormat: '',
      maxConcurrent: 3,
      autoStart: false,
      showNotifications: true,
      theme: 'light',
      language: 'zh-CN'
    };
    setSettings(defaultSettings);
    form.setFieldsValue(defaultSettings);
    message.success('设置已重置');
  };

  // 选择系统文件夹
  const selectSystemFolder = async () => {
    setIsSelectingFolder(true);
    try {
      const folderInfo = await fileSystemHelper.selectFolder();
      setSelectedFolder(folderInfo);

      const newSettings = {
        ...settings,
        pathType: 'system',
        downloadPath: folderInfo.path || folderInfo.name
      };
      setSettings(newSettings);
      form.setFieldsValue(newSettings);

      message.success(`已选择文件夹: ${folderInfo.name}`);
    } catch (error) {
      if (error.message !== '用户取消了文件夹选择') {
        message.error(error.message);
      }
    } finally {
      setIsSelectingFolder(false);
    }
  };

  // 处理路径类型变化
  const handlePathTypeChange = (type) => {
    const presetPaths = getPresetPaths();
    const newSettings = { ...settings, pathType: type };
    if (type === 'preset') {
      newSettings.downloadPath = presetPaths[0].value;
    } else if (type === 'relative') {
      newSettings.downloadPath = './downloads';
    } else if (type === 'system' && selectedFolder) {
      newSettings.downloadPath = selectedFolder.path || selectedFolder.name;
    }
    setSettings(newSettings);
    form.setFieldsValue(newSettings);
  };

  // 获取当前路径显示
  const getCurrentPathDisplay = () => {
    const currentPath = form.getFieldValue('downloadPath') || settings.downloadPath;
    if (settings.pathType === 'relative') {
      return `相对路径: ${currentPath}`;
    } else if (settings.pathType === 'preset') {
      const presetPaths = getPresetPaths();
      const preset = presetPaths.find(p => p.value === currentPath);
      return preset ? preset.label : currentPath;
    } else if (settings.pathType === 'system') {
      return selectedFolder ?
        `系统文件夹: ${fileSystemHelper.getDisplayPath(selectedFolder)}` :
        '请选择系统文件夹';
    } else {
      return `绝对路径: ${currentPath}`;
    }
  };

  return (
    <Modal
      title="设置"
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="reset" onClick={resetSettings} icon={<ReloadOutlined />}>
          重置默认
        </Button>,
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={saveSettings} icon={<SaveOutlined />}>
          保存设置
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={settings}
      >
        <Card title="下载设置" size="small" style={{ marginBottom: 16 }}>
          <Form.Item label="路径类型">
            <Radio.Group
              value={settings.pathType}
              onChange={(e) => handlePathTypeChange(e.target.value)}
            >
              <Radio.Button value="relative">相对路径</Radio.Button>
              <Radio.Button value="preset">预设路径</Radio.Button>
              <Radio.Button value="system">
                <Tooltip title={fileSystemHelper.isFileSystemAccessSupported() ?
                  "使用系统文件夹选择器" : "使用文件夹选择（兼容模式）"}>
                  系统选择
                </Tooltip>
              </Radio.Button>
              <Radio.Button value="absolute">自定义路径</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {settings.pathType === 'preset' && (
            <Form.Item
              label="选择预设路径"
              name="downloadPath"
              rules={[{ required: true, message: '请选择下载路径' }]}
            >
              <Select placeholder="选择预设路径">
                {getPresetPaths().map(path => (
                  <Option key={path.value} value={path.value}>
                    <Space>
                      {path.icon}
                      {path.label}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {settings.pathType === 'system' && (
            <Form.Item
              label="系统文件夹"
              name="downloadPath"
              help="点击按钮选择系统文件夹"
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  value={selectedFolder ? selectedFolder.path || selectedFolder.name : ''}
                  placeholder="请选择文件夹"
                  readOnly
                  prefix={<FolderOpenOutlined />}
                />
                <Button
                  icon={<FolderAddOutlined />}
                  onClick={selectSystemFolder}
                  loading={isSelectingFolder}
                  type="dashed"
                  style={{ width: '100%' }}
                >
                  {isSelectingFolder ? '正在选择文件夹...' :
                   selectedFolder ? `重新选择文件夹` : '选择下载文件夹'}
                </Button>

                {!fileSystemHelper.isFileSystemAccessSupported() && (
                  <Alert
                    message="兼容模式"
                    description="当前浏览器使用兼容模式的文件夹选择功能"
                    type="info"
                    showIcon
                    size="small"
                  />
                )}
              </Space>
            </Form.Item>
          )}

          {(settings.pathType === 'relative' || settings.pathType === 'absolute') && (
            <Form.Item
              label={settings.pathType === 'relative' ? '相对路径' : '绝对路径'}
              name="downloadPath"
              rules={[{ required: true, message: '请输入下载路径' }]}
              help={settings.pathType === 'relative' ? '相对于项目根目录' : '完整的文件系统路径'}
            >
              <Input
                placeholder={settings.pathType === 'relative' ? './downloads' : 'C:\\Users\\用户名\\Downloads'}
                prefix={<FolderOpenOutlined />}
              />
            </Form.Item>
          )}

          <Alert
            message="当前路径"
            description={getCurrentPathDisplay()}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            label="默认下载格式"
            name="defaultFormat"
            help="留空表示自动选择最佳质量"
          >
            <Select placeholder="选择默认格式" allowClear>
              <Option value="">自动选择最佳质量</Option>
              <Option value="best[height<=720]">720p</Option>
              <Option value="best[height<=1080]">1080p</Option>
              <Option value="best[height<=1440]">1440p</Option>
              <Option value="best[height<=2160]">4K</Option>
              <Option value="worst">最低质量（节省空间）</Option>
              <Option value="bestaudio">仅音频</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="最大并发下载数"
            name="maxConcurrent"
            rules={[{ required: true, message: '请输入并发数' }]}
          >
            <InputNumber
              min={1}
              max={10}
              style={{ width: '100%' }}
              placeholder="同时下载的最大任务数"
            />
          </Form.Item>
        </Card>

        <Card title="界面设置" size="small" style={{ marginBottom: 16 }}>
          <Form.Item
            label="主题"
            name="theme"
          >
            <Select>
              <Option value="light">浅色主题</Option>
              <Option value="dark">深色主题</Option>
              <Option value="auto">跟随系统</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="语言"
            name="language"
          >
            <Select>
              <Option value="zh-CN">简体中文</Option>
              <Option value="en-US">English</Option>
            </Select>
          </Form.Item>
        </Card>

        <Card title="行为设置" size="small">
          <Form.Item
            name="autoStart"
            valuePropName="checked"
          >
            <Space>
              <Switch />
              <Text>获取视频信息后自动开始下载</Text>
            </Space>
          </Form.Item>

          <Form.Item
            name="showNotifications"
            valuePropName="checked"
          >
            <Space>
              <Switch />
              <Text>显示下载完成通知</Text>
            </Space>
          </Form.Item>
        </Card>
      </Form>
    </Modal>
  );
};

export default Settings;
