import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, 
  List, 
  Typography, 
  Space, 
  Button, 
  Select, 
  Input,
  Tag,
  Card,
  Divider,
  message,
  Tooltip
} from 'antd';
import { 
  ClearOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  BugOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

const API_BASE = 'http://localhost:3001/api';

const LogViewer = ({ visible, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logLevel, setLogLevel] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef(null);

  // 日志级别配置
  const logLevels = {
    error: { color: 'red', icon: <CloseCircleOutlined />, label: '错误' },
    warn: { color: 'orange', icon: <WarningOutlined />, label: '警告' },
    info: { color: 'blue', icon: <InfoCircleOutlined />, label: '信息' },
    debug: { color: 'gray', icon: <BugOutlined />, label: '调试' }
  };

  // 获取日志
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/logs`);
      setLogs(response.data);
    } catch (error) {
      console.error('获取日志失败:', error);
      message.error('获取日志失败');
    } finally {
      setLoading(false);
    }
  };

  // 清空日志
  const clearLogs = async () => {
    try {
      await axios.delete(`${API_BASE}/logs`);
      setLogs([]);
      message.success('日志已清空');
    } catch (error) {
      message.error('清空日志失败');
    }
  };

  // 导出日志
  const exportLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yt-dlp-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('日志已导出');
  };

  // 过滤日志
  useEffect(() => {
    let filtered = logs;
    
    // 按级别过滤
    if (logLevel !== 'all') {
      filtered = filtered.filter(log => log.level === logLevel);
    }
    
    // 按搜索文本过滤
    if (searchText) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchText.toLowerCase()) ||
        log.source?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    setFilteredLogs(filtered);
  }, [logs, logLevel, searchText]);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  // 定期刷新日志
  useEffect(() => {
    if (visible) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [visible]);

  // 格式化时间
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 获取日志级别统计
  const getLogStats = () => {
    const stats = { error: 0, warn: 0, info: 0, debug: 0 };
    logs.forEach(log => {
      if (stats.hasOwnProperty(log.level)) {
        stats[log.level]++;
      }
    });
    return stats;
  };

  const stats = getLogStats();

  return (
    <Modal
      title="系统日志"
      open={visible}
      onCancel={onClose}
      width={900}
      height={600}
      footer={[
        <Button key="clear" danger onClick={clearLogs} icon={<ClearOutlined />}>
          清空日志
        </Button>,
        <Button key="export" onClick={exportLogs} icon={<DownloadOutlined />}>
          导出日志
        </Button>,
        <Button key="refresh" onClick={fetchLogs} loading={loading} icon={<ReloadOutlined />}>
          刷新
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          关闭
        </Button>
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 日志统计 */}
        <Card size="small">
          <Space wrap>
            <Text strong>日志统计：</Text>
            {Object.entries(stats).map(([level, count]) => (
              <Tag 
                key={level} 
                color={logLevels[level]?.color} 
                icon={logLevels[level]?.icon}
              >
                {logLevels[level]?.label}: {count}
              </Tag>
            ))}
            <Text type="secondary">总计: {logs.length}</Text>
          </Space>
        </Card>

        {/* 过滤控件 */}
        <Card size="small">
          <Space wrap>
            <Search
              placeholder="搜索日志内容"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
              allowClear
            />
            <Select
              value={logLevel}
              onChange={setLogLevel}
              style={{ width: 120 }}
              prefix={<FilterOutlined />}
            >
              <Option value="all">全部级别</Option>
              {Object.entries(logLevels).map(([level, config]) => (
                <Option key={level} value={level}>
                  {config.icon} {config.label}
                </Option>
              ))}
            </Select>
            <Button
              type={autoScroll ? 'primary' : 'default'}
              size="small"
              onClick={() => setAutoScroll(!autoScroll)}
            >
              自动滚动
            </Button>
          </Space>
        </Card>

        {/* 日志列表 */}
        <div 
          ref={listRef}
          style={{ 
            height: 400, 
            overflow: 'auto',
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            padding: 8
          }}
        >
          {filteredLogs.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 0', 
              color: '#999' 
            }}>
              {loading ? '加载中...' : '暂无日志'}
            </div>
          ) : (
            <List
              size="small"
              dataSource={filteredLogs}
              renderItem={(log, index) => (
                <List.Item 
                  key={index}
                  style={{ 
                    padding: '8px 0',
                    borderBottom: index < filteredLogs.length - 1 ? '1px solid #f0f0f0' : 'none'
                  }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size={0}>
                    <Space>
                      <Tag 
                        color={logLevels[log.level]?.color} 
                        icon={logLevels[log.level]?.icon}
                        size="small"
                      >
                        {log.level.toUpperCase()}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {formatTime(log.timestamp)}
                      </Text>
                      {log.source && (
                        <Tag size="small" color="default">
                          {log.source}
                        </Tag>
                      )}
                    </Space>
                    <Paragraph 
                      style={{ 
                        margin: 0, 
                        fontSize: '13px',
                        fontFamily: 'Monaco, Consolas, "Courier New", monospace'
                      }}
                      copyable={log.message.length > 50}
                    >
                      {log.message}
                    </Paragraph>
                    {log.details && (
                      <Text 
                        type="secondary" 
                        style={{ 
                          fontSize: '12px',
                          fontFamily: 'Monaco, Consolas, "Courier New", monospace'
                        }}
                      >
                        {log.details}
                      </Text>
                    )}
                  </Space>
                </List.Item>
              )}
            />
          )}
        </div>
      </Space>
    </Modal>
  );
};

export default LogViewer;
