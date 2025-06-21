import { clearQueryHistory } from '@/services/erp/product';
import { WebSocketService, getGlobalWebSocketService } from '@/utils/websocket';
import { DiagnosticResult, WebSocketDiagnostic } from '@/utils/websocket-diagnostic';
import {
  ApiOutlined,
  BugOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  HistoryOutlined,
  LinkOutlined,
  MessageOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Button,
  Card,
  Col,
  Divider,
  InputNumber,
  List,
  Modal,
  Row,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const { Text } = Typography;

const WebSocketPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'error'
  >('disconnected');
  const [, setErrorMessage] = useState<string>('');
  const [, setReconnectAttempts] = useState(0);
  const [diagnosticVisible, setDiagnosticVisible] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<{
    backend: DiagnosticResult;
    token: DiagnosticResult;
    websocket: DiagnosticResult[];
  } | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [heartbeatInterval, setHeartbeatInterval] = useState(15000); // 改为15秒
  const [heartbeatTimeout, setHeartbeatTimeout] = useState(8000); // 改为8秒
  const [heartbeatEnabled, setHeartbeatEnabled] = useState(true);
  const [autoRequestHistory, setAutoRequestHistory] = useState(true); // 新增：自动请求历史数据
  const [connectionStats, setConnectionStats] = useState({
    totalConnections: 0,
    successfulConnections: 0,
    failedConnections: 0,
    totalReconnects: 0,
    lastConnectionTime: null as string | null,
  });
  const [queryHistory, setQueryHistory] = useState<any[]>([]); // 重命名：查询历史数据
  const [isLoadingQueryHistory, setIsLoadingQueryHistory] = useState(false); // 重命名
  const [lastQueryHistoryUpdateTime, setLastQueryHistoryUpdateTime] = useState<string | null>(null); // 重命名

  const wsServiceRef = useRef<WebSocketService | null>(null);

  // 处理查询历史更新
  const handleQueryHistoryUpdate = (data: any) => {
    setIsLoadingQueryHistory(false);
    setLastQueryHistoryUpdateTime(new Date().toISOString());

    if (Array.isArray(data)) {
      setQueryHistory(data);
      messageApi.success(`成功获取${data.length}条产品查询历史数据`);
    } else {
      messageApi.error('接收到的产品查询历史数据格式不正确');
    }
  };

  // 清空查询历史数据
  const handleClearQueryHistory = async () => {
    Modal.confirm({
      title: '确认清空查询历史',
      content: '此操作将清空所有产品查询历史记录，无法恢复。确定要继续吗？',
      okText: '确定清空',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await clearQueryHistory();
          if (response.success) {
            messageApi.success(response.message || '查询历史已清空');
            setQueryHistory([]);
            setLastQueryHistoryUpdateTime(null);
          } else {
            messageApi.error(response.error || '清空查询历史失败');
          }
        } catch (error) {
          messageApi.error('清空查询历史失败');
          console.error('清空查询历史失败:', error);
        }
      },
    });
  };

  // 初始化WebSocket服务
  useEffect(() => {
    const wsService = getGlobalWebSocketService({
      onMessage: (message) => {
        // 处理查询历史更新消息
        if (message.type === 'info' && message.title === '收到消息') {
          try {
            const data = JSON.parse(message.content);
            if (data.type === 'query_history_update' && data.data) {
              handleQueryHistoryUpdate(data.data);
              return;
            }
          } catch (error) {
            // 如果不是JSON格式，继续正常处理
          }
        }
        // 其他消息可以在这里处理，目前不需要显示
      },
      onQueryHistoryUpdate: (data) => {
        // 处理查询历史更新
        handleQueryHistoryUpdate(data);
      },
      onConnect: () => {
        setConnectionStatus('connected');
        setErrorMessage('');
        setReconnectAttempts(0);
        setConnectionStats((prev) => ({
          ...prev,
          totalConnections: prev.totalConnections + 1,
          successfulConnections: prev.successfulConnections + 1,
          lastConnectionTime: new Date().toISOString(),
        }));

        messageApi.success('WebSocket连接已建立，开始接收实时消息');
      },
      onDisconnect: (code: number) => {
        setConnectionStatus('disconnected');
        setConnectionStats((prev) => ({
          ...prev,
          totalReconnects: prev.totalReconnects + 1,
        }));
        messageApi.warning(`WebSocket连接已断开 (代码: ${code})`);
      },
      onError: () => {
        setConnectionStatus('error');
        setErrorMessage('连接失败，请检查网络和认证状态');
        setConnectionStats((prev) => ({
          ...prev,
          totalConnections: prev.totalConnections + 1,
          failedConnections: prev.failedConnections + 1,
        }));
        messageApi.error('WebSocket连接失败');
      },
      autoReconnect: autoReconnect,
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: heartbeatEnabled ? heartbeatInterval : 0,
      heartbeatTimeout: heartbeatTimeout,
      autoRequestHistory: autoRequestHistory, // 新增：自动请求历史数据设置
    });

    wsServiceRef.current = wsService;

    // 组件卸载时清理
    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }
    };
  }, []);

  // 更新自动重连设置
  useEffect(() => {
    if (wsServiceRef.current) {
      wsServiceRef.current.updateAutoReconnectSettings(autoReconnect);
    }
  }, [autoReconnect]);

  // 更新心跳设置
  useEffect(() => {
    if (wsServiceRef.current) {
      wsServiceRef.current.updateHeartbeatSettings(
        heartbeatEnabled ? heartbeatInterval : 0,
        heartbeatTimeout,
      );
    }
  }, [heartbeatEnabled, heartbeatInterval, heartbeatTimeout]);

  // 更新自动请求历史数据设置
  useEffect(() => {
    if (wsServiceRef.current) {
      wsServiceRef.current.updateAutoRequestHistorySettings(autoRequestHistory);
    }
  }, [autoRequestHistory]);

  // 更新连接状态
  useEffect(() => {
    const updateStatus = () => {
      if (wsServiceRef.current) {
        const status = wsServiceRef.current.getConnectionStatus();
        setConnectionStatus(
          status.isConnected ? 'connected' : status.isConnecting ? 'connecting' : 'disconnected',
        );
        setReconnectAttempts(status.reconnectAttempts);
      }
    };

    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // 连接WebSocket
  const connectWebSocket = () => {
    if (wsServiceRef.current) {
      wsServiceRef.current.connect();
    }
  };

  // 断开WebSocket连接
  const disconnectWebSocket = () => {
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
    }
  };

  // 发送测试消息
  const sendTestMessage = () => {
    if (wsServiceRef.current) {
      const testMessage = {
        type: 'test',
        content: '这是一条测试消息',
        timestamp: new Date().toISOString(),
      };

      wsServiceRef.current.send(testMessage);
      messageApi.info('已发送测试消息到服务器');
    } else {
      messageApi.warning('WebSocket未连接');
    }
  };

  // 手动发送心跳
  const sendHeartbeat = () => {
    if (wsServiceRef.current) {
      const heartbeatMessage = {
        type: 'heartbeat',
        timestamp: Date.now(),
        data: { clientTime: new Date().toISOString() },
      };

      wsServiceRef.current.send(heartbeatMessage);
      messageApi.info('已手动发送心跳消息到服务器');
    } else {
      messageApi.warning('WebSocket未连接');
    }
  };

  // 运行诊断
  const runDiagnostic = async () => {
    setIsDiagnosing(true);
    setDiagnosticVisible(true);

    try {
      const results = await WebSocketDiagnostic.runFullDiagnostic();
      setDiagnosticResults(results);
    } catch (error) {
      messageApi.error('诊断过程中发生错误');
      console.error('诊断错误:', error);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // 获取状态标签颜色
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'blue';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  // 获取状态文本
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '已连接';
      case 'connecting':
        return '连接中...';
      case 'error':
        return '连接错误';
      default:
        return '未连接';
    }
  };

  const getDiagnosticSuggestions = () => {
    if (!diagnosticResults) return [];
    return WebSocketDiagnostic.getDiagnosticSuggestions(diagnosticResults);
  };

  return (
    <PageContainer title="WebSocket 实时消息" subTitle="建立WebSocket连接，接收实时消息推送">
      <Row gutter={[16, 16]}>
        {/* 连接控制面板 */}
        <Col span={24}>
          <Card title="连接控制" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Space>
                  <ApiOutlined style={{ fontSize: '20px' }} />
                  <Text strong>连接状态</Text>
                  <Tag color={getStatusColor()}>{getStatusText()}</Tag>
                </Space>
                <Space>
                  <Button icon={<BugOutlined />} onClick={runDiagnostic} loading={isDiagnosing}>
                    诊断连接
                  </Button>
                </Space>
              </div>

              {/* 连接统计信息 */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                <Space>
                  <Text type="secondary">总连接次数: {connectionStats.totalConnections}</Text>
                  <Text type="success">成功: {connectionStats.successfulConnections}</Text>
                  <Text type="danger">失败: {connectionStats.failedConnections}</Text>
                  <Text type="warning">重连: {connectionStats.totalReconnects}</Text>
                </Space>
                {connectionStats.lastConnectionTime && (
                  <Text type="secondary">
                    最后连接: {new Date(connectionStats.lastConnectionTime).toLocaleTimeString()}
                  </Text>
                )}
              </div>

              <Space>
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  onClick={connectWebSocket}
                  loading={connectionStatus === 'connecting'}
                  disabled={connectionStatus === 'connected'}
                >
                  连接
                </Button>
                <Button
                  danger
                  icon={<DisconnectOutlined />}
                  onClick={disconnectWebSocket}
                  disabled={connectionStatus !== 'connected'}
                >
                  断开
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    if (wsServiceRef.current) {
                      wsServiceRef.current.reconnect();
                    }
                  }}
                  disabled={connectionStatus === 'connecting'}
                >
                  重连
                </Button>
                <Button
                  icon={<MessageOutlined />}
                  onClick={sendTestMessage}
                  disabled={connectionStatus !== 'connected'}
                >
                  发送测试消息
                </Button>
                <Button
                  icon={<ApiOutlined />}
                  onClick={sendHeartbeat}
                  disabled={connectionStatus !== 'connected' || !heartbeatEnabled}
                >
                  发送心跳
                </Button>
              </Space>

              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Space>
                  <Text>自动重连:</Text>
                  <Switch
                    checked={autoReconnect}
                    onChange={setAutoReconnect}
                    disabled={connectionStatus === 'connected'}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {autoReconnect ? '启用' : '禁用'}
                  </Text>
                </Space>
                {autoReconnect && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    连接断开时将自动重连 (最多5次)
                  </Text>
                )}
              </div>

              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Space>
                  <Text>心跳机制:</Text>
                  <Switch
                    checked={heartbeatEnabled}
                    onChange={setHeartbeatEnabled}
                    disabled={connectionStatus === 'connected'}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {heartbeatEnabled ? '启用' : '禁用'}
                  </Text>
                </Space>
                {heartbeatEnabled && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    定期发送心跳保持连接
                  </Text>
                )}
              </div>

              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Space>
                  <Text>自动请求历史:</Text>
                  <Switch
                    checked={autoRequestHistory}
                    onChange={setAutoRequestHistory}
                    disabled={connectionStatus === 'connected'}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {autoRequestHistory ? '启用' : '禁用'}
                  </Text>
                </Space>
                {autoRequestHistory && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    连接成功后自动请求查询历史数据
                  </Text>
                )}
              </div>

              {heartbeatEnabled && (
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Space>
                    <Text>心跳间隔:</Text>
                    <InputNumber
                      min={5000}
                      max={300000}
                      step={5000}
                      value={heartbeatInterval}
                      onChange={(value) => setHeartbeatInterval(value || 30000)}
                      disabled={connectionStatus === 'connected'}
                      addonAfter="ms"
                      style={{ width: 120 }}
                    />
                  </Space>
                  <Space>
                    <Text>超时时间:</Text>
                    <InputNumber
                      min={1000}
                      max={60000}
                      step={1000}
                      value={heartbeatTimeout}
                      onChange={(value) => setHeartbeatTimeout(value || 10000)}
                      disabled={connectionStatus === 'connected'}
                      addonAfter="ms"
                      style={{ width: 120 }}
                    />
                  </Space>
                </div>
              )}
            </Space>
          </Card>
        </Col>

        {/* 查询历史数据面板 */}
        <Col span={24}>
          <Card
            title={
              <Space>
                <HistoryOutlined />
                最近十次产品查询记录
                <Tag color="blue">{queryHistory.length}</Tag>
                {isLoadingQueryHistory && <Tag color="processing">加载中...</Tag>}
              </Space>
            }
            extra={
              <Space>
                {queryHistory.length > 0 && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleClearQueryHistory}
                    disabled={connectionStatus !== 'connected'}
                  >
                    清空历史
                  </Button>
                )}
                {queryHistory.length > 0 && (
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      const codes = queryHistory
                        .slice(0, 10)
                        .map((item) => item.product_code)
                        .join('\n');
                      navigator.clipboard.writeText(codes);
                      messageApi.success(
                        `已复制${queryHistory.slice(0, 10).length}个产品代码到剪贴板`,
                      );
                    }}
                  >
                    复制全部代码
                  </Button>
                )}
                {lastQueryHistoryUpdateTime && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    最后更新: {new Date(lastQueryHistoryUpdateTime).toLocaleTimeString()}
                  </Text>
                )}
              </Space>
            }
            size="small"
          >
            {queryHistory.length > 0 ? (
              <List
                size="small"
                dataSource={queryHistory.slice(0, 10)}
                renderItem={(item, index) => (
                  <List.Item
                    style={{
                      padding: '12px 16px',
                      border: '1px solid #f0f0f0',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      backgroundColor: '#fafafa',
                    }}
                    actions={[
                      <Button
                        key="copy"
                        type="text"
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(item.product_code);
                          messageApi.success(`已复制产品代码: ${item.product_code}`);
                        }}
                        style={{ color: '#1890ff' }}
                      >
                        复制代码
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#1890ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 'bold',
                          }}
                        >
                          {index + 1}
                        </div>
                      }
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                            {item.product_code || '未知代码'}
                          </Text>
                          <Tag color="blue">产品ID: {item.product_id || '未知'}</Tag>
                        </div>
                      }
                      description={
                        <div style={{ marginTop: '4px' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            查询时间:{' '}
                            {item.query_time
                              ? new Date(item.query_time).toLocaleString()
                              : item.created_at
                              ? new Date(item.created_at).toLocaleString()
                              : '未知时间'}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <HistoryOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <div>暂无产品查询历史数据</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: 8 }}>
                  {connectionStatus === 'connected'
                    ? '点击"请求产品查询历史"按钮获取历史数据'
                    : '请先连接WebSocket'}
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 诊断结果模态框 */}
      <Modal
        title="WebSocket 连接诊断"
        open={diagnosticVisible}
        onCancel={() => setDiagnosticVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDiagnosticVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {diagnosticResults && (
          <Space direction="vertical" style={{ width: '100%' }}>
            {/* 后端服务检查 */}
            <Card size="small" title="后端服务检查">
              <Space>
                {diagnosticResults.backend.success ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                )}
                <Text>{diagnosticResults.backend.message}</Text>
                <Tag color={diagnosticResults.backend.success ? 'success' : 'error'}>
                  {diagnosticResults.backend.success ? '通过' : '失败'}
                </Tag>
              </Space>
              {diagnosticResults.backend.details && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    详情: {JSON.stringify(diagnosticResults.backend.details)}
                  </Text>
                </div>
              )}
            </Card>

            {/* Token检查 */}
            <Card size="small" title="JWT Token检查">
              <Space>
                {diagnosticResults.token.success ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                )}
                <Text>{diagnosticResults.token.message}</Text>
                <Tag color={diagnosticResults.token.success ? 'success' : 'error'}>
                  {diagnosticResults.token.success ? '通过' : '失败'}
                </Tag>
              </Space>
              {diagnosticResults.token.details && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    详情: {JSON.stringify(diagnosticResults.token.details)}
                  </Text>
                </div>
              )}
            </Card>

            {/* WebSocket连接测试 */}
            <Card size="small" title="WebSocket连接测试">
              <List
                size="small"
                dataSource={diagnosticResults.websocket}
                renderItem={(result, index) => (
                  <List.Item>
                    <Space>
                      {result.success ? (
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      )}
                      <Text>
                        测试 {index + 1}: {result.message}
                      </Text>
                      <Tag color={result.success ? 'success' : 'error'}>
                        {result.success ? '成功' : '失败'}
                      </Tag>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>

            <Divider />

            {/* 建议 */}
            <Card size="small" title="诊断建议">
              <List
                size="small"
                dataSource={getDiagnosticSuggestions()}
                renderItem={(suggestion) => (
                  <List.Item>
                    <Text>{suggestion}</Text>
                  </List.Item>
                )}
              />
            </Card>
          </Space>
        )}
      </Modal>
    </PageContainer>
  );
};

export default WebSocketPage;
