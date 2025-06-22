import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Input,
  Button,
  Select,
  Progress,
  List,
  Typography,
  Space,
  message,
  Row,
  Col,
  Divider,
  Tag,
  Avatar,
  Spin,
  Alert,
  Dropdown,
  Menu
} from 'antd';
import {
  DownloadOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  ReloadOutlined,
  YoutubeOutlined,
  VideoCameraOutlined,
  SettingOutlined,
  AppstoreOutlined,
  MenuOutlined,
  FileTextOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';
import axios from 'axios';
import BatchDownload from './components/BatchDownload';
import Settings from './components/Settings';
import LogViewer from './components/LogViewer';
import logger from './utils/logger';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadTasks, setDownloadTasks] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [availableFormats, setAvailableFormats] = useState('');

  // 获取视频信息
  const getVideoInfo = async () => {
    if (!url.trim()) {
      message.error('请输入视频URL');
      logger.warn('User attempted to get video info without URL', 'UI');
      return;
    }

    setLoading(true);
    logger.info(`Getting video info for: ${url}`, 'UI');

    try {
      const response = await axios.post(`${API_BASE}/video-info`, { url });
      setVideoInfo(response.data);
      message.success('视频信息获取成功');
      logger.info(`Successfully got video info: ${response.data.title}`, 'UI');
    } catch (error) {
      const errorMsg = error.response?.data?.error || '获取视频信息失败';
      message.error(errorMsg);
      logger.error(`Failed to get video info: ${errorMsg}`, 'UI', error.message);
      setVideoInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // 开始下载
  const startDownload = async () => {
    if (!url.trim()) {
      message.error('请输入视频URL');
      logger.warn('User attempted to start download without URL', 'UI');
      return;
    }

    // 获取用户设置的下载路径
    const savedSettings = localStorage.getItem('yt-dlp-settings');
    const settings = savedSettings ? JSON.parse(savedSettings) : {};
    // 如果没有设置，使用空字符串让服务器使用默认的用户下载文件夹
    const downloadPath = settings.downloadPath || '';

    logger.info(`Starting download for: ${url} with format: ${selectedFormat || 'auto'}`, 'UI');
    logger.info(`Using download path: ${downloadPath} (pathType: ${settings.pathType})`, 'UI');

    try {
      const response = await axios.post(`${API_BASE}/download`, {
        url,
        format: selectedFormat,
        outputPath: downloadPath
      });
      message.success('下载任务已开始');
      logger.info(`Download task started: ${response.data.taskId}`, 'UI');
      fetchDownloadTasks();
    } catch (error) {
      const errorMsg = error.response?.data?.error || '开始下载失败';
      message.error(errorMsg);
      logger.error(`Failed to start download: ${errorMsg}`, 'UI', error.message);
    }
  };

  // 获取下载任务列表
  const fetchDownloadTasks = async () => {
    try {
      const response = await axios.get(`${API_BASE}/downloads`);
      setDownloadTasks(response.data || []);
    } catch (error) {
      console.error('获取下载任务失败:', error);
      // 不显示错误消息，避免干扰用户
      logger.warn('Failed to fetch download tasks', 'UI', error.message);
    }
  };

  // 获取可用格式
  const getAvailableFormats = async () => {
    if (!url.trim()) {
      message.error('请先输入视频URL');
      return;
    }

    setLoading(true);
    logger.info(`Getting available formats for: ${url}`, 'UI');

    try {
      const response = await axios.post(`${API_BASE}/list-formats`, { url });
      setAvailableFormats(response.data.formats);
      message.success('格式列表获取成功');
      logger.info('Successfully got available formats', 'UI');
    } catch (error) {
      const errorMsg = error.response?.data?.error || '获取格式列表失败';
      message.error(errorMsg);
      logger.error(`Failed to get formats: ${errorMsg}`, 'UI', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 取消下载
  const cancelDownload = async (taskId) => {
    try {
      await axios.delete(`${API_BASE}/download/${taskId}`);
      message.success('任务已取消');
      fetchDownloadTasks();
    } catch (error) {
      message.error('取消任务失败');
    }
  };

  // 定期更新下载进度
  useEffect(() => {
    const interval = setInterval(() => {
      // 只有在有下载任务时才刷新
      if (downloadTasks.length > 0) {
        fetchDownloadTasks();
      }
    }, 3000); // 增加间隔时间，减少请求频率
    return () => clearInterval(interval);
  }, [downloadTasks.length]);

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // 打开文件所在文件夹
  const openFileLocation = async (filePath) => {
    if (!filePath) {
      message.error('文件路径不存在');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/open-file-location`, { filePath });
      message.success('文件位置已打开');
      logger.info(`Opened file location: ${filePath}`, 'UI');
    } catch (error) {
      // 如果API调用失败，显示文件路径信息
      message.info(`文件保存在: ${filePath}`);
      logger.warn(`Failed to open file location, showing path instead: ${filePath}`, 'UI');
    }
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'downloading': return 'processing';
      case 'failed': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  return (
    <Layout className="layout">
      <Header className="header">
        <div className="logo">
          <YoutubeOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            YT-DLP 可视化下载器
          </Title>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Space>
            <Button
              type="text"
              style={{ color: 'white' }}
              icon={<AppstoreOutlined />}
              onClick={() => setBatchModalVisible(true)}
            >
              批量下载
            </Button>
            <Button
              type="text"
              style={{ color: 'white' }}
              icon={<SettingOutlined />}
              onClick={() => setSettingsModalVisible(true)}
            >
              设置
            </Button>
            <Button
              type="text"
              style={{ color: 'white' }}
              icon={<FileTextOutlined />}
              onClick={() => setLogModalVisible(true)}
            >
              日志
            </Button>
          </Space>
        </div>
      </Header>

      <Content style={{ padding: '24px', minHeight: 'calc(100vh - 134px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* URL输入区域 */}
          <Card title="视频下载" style={{ marginBottom: '24px' }}>
            <Space.Compact style={{ width: '100%', marginBottom: '16px' }}>
              <Input
                placeholder="请输入YouTube、Bilibili等视频URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPressEnter={getVideoInfo}
                prefix={<VideoCameraOutlined />}
              />
              <Button
                type="primary"
                onClick={getVideoInfo}
                loading={loading}
                icon={<PlayCircleOutlined />}
              >
                获取信息
              </Button>
              <Button
                onClick={getAvailableFormats}
                loading={loading}
                icon={<ReloadOutlined />}
              >
                获取格式
              </Button>
            </Space.Compact>
          </Card>

          {/* 视频信息显示 */}
          {videoInfo && (
            <Card title="视频信息" style={{ marginBottom: '24px' }}>
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  {videoInfo.thumbnail ? (
                    <img
                      src={`${API_BASE}/proxy-image?url=${encodeURIComponent(videoInfo.thumbnail)}`}
                      alt="视频缩略图"
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        maxHeight: '200px'
                      }}
                      onError={(e) => {
                        console.error('缩略图加载失败:', e);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                      onLoad={() => {
                        console.log('缩略图加载成功');
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '200px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999'
                    }}>
                      <VideoCameraOutlined style={{ fontSize: '48px' }} />
                    </div>
                  )}
                  <div style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    flexDirection: 'column'
                  }}>
                    <VideoCameraOutlined style={{ fontSize: '48px', marginBottom: '8px' }} />
                    <Text type="secondary">缩略图加载失败</Text>
                  </div>
                </Col>
                <Col xs={24} md={16}>
                  <Title level={4}>{videoInfo.title}</Title>
                  <Paragraph>
                    <Text strong>上传者：</Text> {videoInfo.uploader}<br/>
                    <Text strong>时长：</Text> {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, '0')}<br/>
                  </Paragraph>

                  <Divider />

                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>选择格式：</Text>
                    <Select
                      style={{ width: '100%' }}
                      placeholder="选择下载格式"
                      value={selectedFormat}
                      onChange={setSelectedFormat}
                    >
                      <Option value="">最佳质量 (推荐)</Option>
                      <Option value="best[ext=mp4]">最佳 MP4 格式</Option>
                      <Option value="best[height<=720]">720p 及以下</Option>
                      <Option value="best[height<=1080]">1080p 及以下</Option>
                      <Option value="worst">最低质量 (节省空间)</Option>
                      <Option value="bestaudio">仅音频</Option>
                      <Divider style={{ margin: '8px 0' }} />
                      {videoInfo.formats?.slice(0, 8).map(format => (
                        <Option key={format.format_id} value={format.format_id}>
                          {format.format_note} - {format.ext}
                          {format.height && ` (${format.height}p)`}
                          {format.filesize && ` - ${formatFileSize(format.filesize)}`}
                        </Option>
                      ))}
                    </Select>

                    <Button
                      type="primary"
                      size="large"
                      onClick={startDownload}
                      icon={<DownloadOutlined />}
                      style={{ width: '100%' }}
                    >
                      开始下载
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>
          )}

          {/* 可用格式显示 */}
          {availableFormats && (
            <Card title="可用格式列表" style={{ marginBottom: '24px' }}>
              <Alert
                message="格式说明"
                description="以下是该视频的所有可用格式，您可以复制格式ID到上面的格式选择中使用"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <div style={{
                background: '#f5f5f5',
                padding: '12px',
                borderRadius: '6px',
                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                fontSize: '12px',
                maxHeight: '300px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {availableFormats}
              </div>
              <Button
                style={{ marginTop: 8 }}
                size="small"
                onClick={() => setAvailableFormats('')}
              >
                关闭格式列表
              </Button>
            </Card>
          )}

          {/* 下载任务列表 */}
          <Card
            title={
              <Space>
                <Text>下载任务</Text>
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={fetchDownloadTasks}
                >
                  刷新
                </Button>
              </Space>
            }
          >
            {downloadTasks.length === 0 ? (
              <Alert
                message="暂无下载任务"
                description="请先添加视频URL并开始下载"
                type="info"
                showIcon
              />
            ) : (
              <List
                itemLayout="vertical"
                dataSource={downloadTasks}
                renderItem={(task) => (
                  <List.Item
                    key={task.id}
                    actions={[
                      task.status === 'completed' && task.filePath ? (
                        <Button
                          size="small"
                          icon={<FolderOpenOutlined />}
                          onClick={() => openFileLocation(task.filePath)}
                        >
                          查看文件
                        </Button>
                      ) : (
                        <Button
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => cancelDownload(task.id)}
                          disabled={task.status === 'completed'}
                        >
                          取消
                        </Button>
                      )
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<VideoCameraOutlined />} />}
                      title={
                        <Space>
                          <Text ellipsis style={{ maxWidth: '400px' }}>
                            {task.url}
                          </Text>
                          <Tag color={getStatusColor(task.status)}>
                            {task.status === 'downloading' ? '下载中' :
                             task.status === 'completed' ? '已完成' :
                             task.status === 'failed' ? '失败' : '已取消'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {task.format && <Text type="secondary">格式: {task.format}</Text>}
                          {task.fileName && (
                            <Text type="secondary">文件名: {task.fileName}</Text>
                          )}
                          {task.fileSize && (
                            <Text type="secondary">文件大小: {formatFileSize(task.fileSize)}</Text>
                          )}
                          {task.status === 'downloading' && (
                            <>
                              <Progress
                                percent={Math.round(task.progress)}
                                status={task.progress === 100 ? 'success' : 'active'}
                              />
                              <Space>
                                {task.speed && <Text type="secondary">速度: {task.speed}</Text>}
                                {task.eta && <Text type="secondary">剩余时间: {task.eta}</Text>}
                              </Space>
                            </>
                          )}
                          {task.status === 'completed' && (
                            <>
                              <Progress percent={100} status="success" />
                              <Text type="success">
                                ✅ 下载完成！文件已保存到: {task.filePath || '下载目录'}
                              </Text>
                            </>
                          )}
                          {task.status === 'failed' && (
                            <Progress percent={task.progress} status="exception" />
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </div>
      </Content>

      <Footer style={{ textAlign: 'center' }}>
        YT-DLP GUI ©2024 Created with React + Ant Design
      </Footer>

      {/* 批量下载对话框 */}
      <BatchDownload
        visible={batchModalVisible}
        onClose={() => setBatchModalVisible(false)}
        onDownloadStart={fetchDownloadTasks}
      />

      {/* 设置对话框 */}
      <Settings
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
      />

      {/* 日志查看器 */}
      <LogViewer
        visible={logModalVisible}
        onClose={() => setLogModalVisible(false)}
      />
    </Layout>
  );
}

export default App;
