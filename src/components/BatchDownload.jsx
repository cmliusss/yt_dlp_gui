import React, { useState } from 'react';
import { 
  Modal, 
  Input, 
  Button, 
  List, 
  Space, 
  Typography, 
  message,
  Divider,
  Tag,
  Select
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  DownloadOutlined,
  LinkOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;
const { Text } = Typography;
const { Option } = Select;

const API_BASE = 'http://localhost:3001/api';

const BatchDownload = ({ visible, onClose, onDownloadStart }) => {
  const [urls, setUrls] = useState([]);
  const [inputUrl, setInputUrl] = useState('');
  const [batchText, setBatchText] = useState('');
  const [defaultFormat, setDefaultFormat] = useState('');
  const [downloading, setDownloading] = useState(false);

  // 添加单个URL
  const addUrl = () => {
    if (!inputUrl.trim()) {
      message.error('请输入有效的URL');
      return;
    }
    
    if (urls.includes(inputUrl.trim())) {
      message.error('URL已存在');
      return;
    }
    
    setUrls([...urls, inputUrl.trim()]);
    setInputUrl('');
  };

  // 批量添加URL
  const addBatchUrls = () => {
    if (!batchText.trim()) {
      message.error('请输入URL列表');
      return;
    }
    
    const newUrls = batchText
      .split('\n')
      .map(url => url.trim())
      .filter(url => url && !urls.includes(url));
    
    if (newUrls.length === 0) {
      message.error('没有找到新的有效URL');
      return;
    }
    
    setUrls([...urls, ...newUrls]);
    setBatchText('');
    message.success(`成功添加 ${newUrls.length} 个URL`);
  };

  // 删除URL
  const removeUrl = (index) => {
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls);
  };

  // 开始批量下载
  const startBatchDownload = async () => {
    if (urls.length === 0) {
      message.error('请先添加要下载的URL');
      return;
    }

    // 获取用户设置的下载路径
    const savedSettings = localStorage.getItem('yt-dlp-settings');
    const settings = savedSettings ? JSON.parse(savedSettings) : {};
    const downloadPath = settings.downloadPath || './downloads';

    setDownloading(true);
    let successCount = 0;
    let failCount = 0;

    for (const url of urls) {
      try {
        await axios.post(`${API_BASE}/download`, {
          url,
          format: defaultFormat,
          outputPath: downloadPath
        });
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`下载失败: ${url}`, error);
      }
    }

    setDownloading(false);
    
    if (successCount > 0) {
      message.success(`成功启动 ${successCount} 个下载任务`);
      if (onDownloadStart) {
        onDownloadStart();
      }
    }
    
    if (failCount > 0) {
      message.error(`${failCount} 个任务启动失败`);
    }

    // 清空列表并关闭对话框
    setUrls([]);
    onClose();
  };

  // 清空所有URL
  const clearAll = () => {
    setUrls([]);
    setInputUrl('');
    setBatchText('');
  };

  return (
    <Modal
      title="批量下载"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="clear" onClick={clearAll}>
          清空所有
        </Button>,
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button 
          key="download" 
          type="primary" 
          onClick={startBatchDownload}
          loading={downloading}
          disabled={urls.length === 0}
          icon={<DownloadOutlined />}
        >
          开始批量下载 ({urls.length})
        </Button>
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 默认格式选择 */}
        <div>
          <Text strong>默认下载格式：</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            placeholder="选择默认格式（可选）"
            value={defaultFormat}
            onChange={setDefaultFormat}
            allowClear
          >
            <Option value="">最佳质量</Option>
            <Option value="best[height<=720]">720p</Option>
            <Option value="best[height<=1080]">1080p</Option>
            <Option value="worst">最低质量</Option>
            <Option value="bestaudio">仅音频</Option>
          </Select>
        </div>

        <Divider />

        {/* 单个URL添加 */}
        <div>
          <Text strong>添加单个URL：</Text>
          <Space.Compact style={{ width: '100%', marginTop: 8 }}>
            <Input
              placeholder="粘贴视频URL"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onPressEnter={addUrl}
              prefix={<LinkOutlined />}
            />
            <Button type="primary" onClick={addUrl} icon={<PlusOutlined />}>
              添加
            </Button>
          </Space.Compact>
        </div>

        {/* 批量URL添加 */}
        <div>
          <Text strong>批量添加URL：</Text>
          <TextArea
            style={{ marginTop: 8 }}
            rows={4}
            placeholder="每行一个URL，支持批量粘贴"
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
          />
          <Button 
            style={{ marginTop: 8 }}
            onClick={addBatchUrls}
            icon={<PlusOutlined />}
          >
            批量添加
          </Button>
        </div>

        <Divider />

        {/* URL列表 */}
        <div>
          <Space>
            <Text strong>待下载列表：</Text>
            <Tag color="blue">{urls.length} 个URL</Tag>
          </Space>
          
          {urls.length > 0 ? (
            <List
              style={{ marginTop: 8, maxHeight: 300, overflow: 'auto' }}
              size="small"
              bordered
              dataSource={urls}
              renderItem={(url, index) => (
                <List.Item
                  actions={[
                    <Button 
                      size="small" 
                      danger 
                      icon={<DeleteOutlined />}
                      onClick={() => removeUrl(index)}
                    >
                      删除
                    </Button>
                  ]}
                >
                  <Text ellipsis style={{ maxWidth: 500 }} title={url}>
                    {url}
                  </Text>
                </List.Item>
              )}
            />
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 0', 
              color: '#999',
              marginTop: 8,
              border: '1px dashed #d9d9d9',
              borderRadius: 6
            }}>
              暂无URL，请添加要下载的视频链接
            </div>
          )}
        </div>
      </Space>
    </Modal>
  );
};

export default BatchDownload;
