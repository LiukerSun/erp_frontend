import { getToken } from './auth';

export interface WebSocketMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  content: string;
  timestamp: string;
  data?: any;
}

export interface WebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: (code: number, reason: string) => void;
  onError?: (error: Event) => void;
  onQueryHistoryUpdate?: (data: any) => void; // 新增：查询历史更新回调
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number; // 心跳间隔（毫秒）
  heartbeatTimeout?: number; // 心跳超时时间（毫秒）
  autoRequestHistory?: boolean; // 新增：连接后是否自动请求历史数据
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private options: WebSocketOptions;
  private isConnecting = false;
  private isConnected = false;
  private lastHeartbeatTime = 0;
  private connectionStartTime = 0; // 连接开始时间
  private connectionMonitorInterval: NodeJS.Timeout | null = null; // 新增：连接监控定时器
  private manuallyDisconnected = false; // 新增：标记是否为手动断开连接

  constructor(options: WebSocketOptions = {}) {
    this.options = {
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 15000, // 改为15秒发送一次心跳（更频繁）
      heartbeatTimeout: 8000, // 改为8秒心跳超时（更严格）
      autoRequestHistory: true, // 默认连接后自动请求历史数据
      ...options,
    };
  }

  // 获取WebSocket URL
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NODE_ENV === 'development' ? 'localhost:8080' : window.location.host;
    const token = getToken();
    return `${protocol}//${host}/api/ws/connect?token=${token}`;
  }

  // 连接WebSocket
  public connect(): void {
    if (this.isConnecting || this.isConnected) return;

    // 重置手动断开标记
    this.manuallyDisconnected = false;

    this.isConnecting = true;
    this.connectionStartTime = Date.now();

    try {
      const wsUrl = this.getWebSocketUrl();

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat(); // 启动心跳

        // 连接成功后自动请求历史数据
        if (this.options.autoRequestHistory) {
          this.requestQueryHistory();
        }

        this.options.onConnect?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // 处理心跳响应
          if (data.type === 'heartbeat' || data.type === 'pong') {
            this.handleHeartbeatResponse(data);
            return;
          }

          // 处理查询历史更新
          if (data.type === 'query_history_update') {
            this.options.onQueryHistoryUpdate?.(data.data);
            return;
          }

          const message = this.parseMessage(data);
          this.options.onMessage?.(message);
        } catch (error) {
          console.error('解析WebSocket消息失败:', error);
          const errorMessage: WebSocketMessage = {
            id: Date.now().toString(),
            type: 'error',
            title: '消息解析错误',
            content: `无法解析消息: ${event.data}`,
            timestamp: new Date().toISOString(),
          };
          this.options.onMessage?.(errorMessage);
        }
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;
        this.isConnecting = false;
        this.stopHeartbeat(); // 停止心跳
        this.stopConnectionMonitor(); // 停止连接监控
        this.options.onDisconnect?.(event.code, event.reason);

        // 只有在非手动断开连接且启用自动重连时才重连
        if (
          !this.manuallyDisconnected &&
          this.options.autoReconnect &&
          this.reconnectAttempts < (this.options.maxReconnectAttempts || 5)
        ) {
          const delay = Math.min(
            (this.options.reconnectDelay || 1000) * Math.pow(2, this.reconnectAttempts),
            30000,
          );
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, delay);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket连接错误:', error);
        console.error('错误详情:', {
          type: error.type,
          target: error.target,
          readyState: this.ws?.readyState,
          url: this.ws?.url,
        });
        this.isConnecting = false;
        this.options.onError?.(error);
      };
    } catch (error) {
      console.error('创建WebSocket连接失败:', error);
      this.isConnecting = false;
    }
  }

  // 断开WebSocket连接
  public disconnect(): void {
    // 标记为手动断开连接
    this.manuallyDisconnected = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopHeartbeat(); // 停止心跳
    this.stopConnectionMonitor(); // 停止连接监控

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // 发送消息
  public send(message: any): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }

  // 请求查询历史数据
  public requestQueryHistory(): void {
    if (this.ws && this.isConnected) {
      const requestMessage = {
        type: 'request_query_history',
        timestamp: Date.now(),
      };

      this.ws.send(JSON.stringify(requestMessage));
    } else {
      console.warn('WebSocket未连接，无法请求查询历史数据');
    }
  }

  // 请求最近十条数据（保留向后兼容）
  public requestRecentData(): void {
    if (this.ws && this.isConnected) {
      const requestMessage = {
        type: 'request_recent_data',
        timestamp: Date.now(),
        data: { count: 10 },
      };

      this.ws.send(JSON.stringify(requestMessage));
    } else {
      console.warn('WebSocket未连接，无法请求数据');
    }
  }

  // 请求特定类型的数据（保留向后兼容）
  public requestDataByType(dataType: string, count: number = 10): void {
    if (this.ws && this.isConnected) {
      const requestMessage = {
        type: 'request_data',
        timestamp: Date.now(),
        data: {
          dataType: dataType,
          count: count,
        },
      };

      this.ws.send(JSON.stringify(requestMessage));
    } else {
      console.warn('WebSocket未连接，无法请求数据');
    }
  }

  // 解析消息
  private parseMessage(data: any): WebSocketMessage {
    if (data.type) {
      return {
        id: data.id || Date.now().toString(),
        type: data.type,
        title: data.title || '系统消息',
        content: data.content || data.message || JSON.stringify(data),
        timestamp: data.timestamp || new Date().toISOString(),
        data: data.data,
      };
    } else {
      return {
        id: Date.now().toString(),
        type: 'info',
        title: '收到消息',
        content: typeof data === 'string' ? data : JSON.stringify(data),
        timestamp: new Date().toISOString(),
        data: data,
      };
    }
  }

  // 获取连接状态
  public getConnectionStatus(): {
    isConnected: boolean;
    isConnecting: boolean;
    reconnectAttempts: number;
  } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  // 获取连接统计信息
  public getConnectionStats(): {
    connectionDuration: number;
    lastHeartbeatAge: number;
    reconnectAttempts: number;
    isConnected: boolean;
    isConnecting: boolean;
  } {
    const connectionDuration =
      this.connectionStartTime > 0 ? Date.now() - this.connectionStartTime : 0;
    const lastHeartbeatAge = this.lastHeartbeatTime > 0 ? Date.now() - this.lastHeartbeatTime : 0;

    return {
      connectionDuration,
      lastHeartbeatAge,
      reconnectAttempts: this.reconnectAttempts,
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
    };
  }

  // 更新自动重连设置
  public updateAutoReconnectSettings(
    autoReconnect: boolean,
    maxReconnectAttempts?: number,
    reconnectDelay?: number,
  ): void {
    this.options.autoReconnect = autoReconnect;
    if (maxReconnectAttempts !== undefined) {
      this.options.maxReconnectAttempts = maxReconnectAttempts;
    }
    if (reconnectDelay !== undefined) {
      this.options.reconnectDelay = reconnectDelay;
    }

    // 如果禁用了自动重连，清除当前的重连定时器
    if (!autoReconnect && this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // 更新心跳设置
  public updateHeartbeatSettings(heartbeatInterval?: number, heartbeatTimeout?: number): void {
    if (heartbeatInterval !== undefined) {
      this.options.heartbeatInterval = heartbeatInterval;
    }
    if (heartbeatTimeout !== undefined) {
      this.options.heartbeatTimeout = heartbeatTimeout;
    }

    // 如果连接已建立，重新启动心跳以应用新设置
    if (this.isConnected) {
      this.startHeartbeat();
    }
  }

  // 更新自动请求历史数据设置
  public updateAutoRequestHistorySettings(autoRequestHistory: boolean): void {
    this.options.autoRequestHistory = autoRequestHistory;
  }

  // 手动重连
  public reconnect(): void {
    // 重置手动断开标记，允许重连
    this.manuallyDisconnected = false;
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }

  // 获取关闭代码说明
  private getCloseCodeDescription(code: number): string {
    const descriptions: { [key: number]: string } = {
      1000: '正常关闭',
      1001: '端点离开',
      1002: '协议错误',
      1003: '不支持的数据类型',
      1004: '保留',
      1005: '无状态码',
      1006: '异常关闭',
      1007: '数据类型不一致',
      1008: '消息违反策略',
      1009: '消息过大',
      1010: '客户端需要扩展',
      1011: '服务器遇到错误',
      1012: '服务器重启',
      1013: '临时错误',
      1014: '网关错误',
      1015: 'TLS握手失败',
    };
    return descriptions[code] || `未知关闭代码: ${code}`;
  }

  // 启动心跳
  private startHeartbeat(): void {
    this.stopHeartbeat();

    if (this.options.heartbeatInterval && this.options.heartbeatInterval > 0) {
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
      }, this.options.heartbeatInterval);
    }
  }

  // 停止心跳
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  // 发送心跳
  private sendHeartbeat(): void {
    if (this.ws && this.isConnected) {
      const heartbeatMessage = {
        type: 'heartbeat',
        timestamp: Date.now(),
        data: { clientTime: new Date().toISOString() },
      };

      try {
        this.ws.send(JSON.stringify(heartbeatMessage));
        this.lastHeartbeatTime = Date.now();

        // 设置心跳超时检查
        this.setupHeartbeatTimeout();
      } catch (error) {
        console.error('发送心跳失败:', error);
        this.handleHeartbeatTimeout();
      }
    }
  }

  // 设置心跳超时检查
  private setupHeartbeatTimeout(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }

    if (this.options.heartbeatTimeout && this.options.heartbeatTimeout > 0) {
      this.heartbeatTimeout = setTimeout(() => {
        this.handleHeartbeatTimeout();
      }, this.options.heartbeatTimeout);
    }
  }

  // 处理心跳超时
  private handleHeartbeatTimeout(): void {
    console.warn('心跳超时，连接可能已断开');
    if (this.ws) {
      this.ws.close(1000, 'heartbeat_timeout');
    }
  }

  // 处理心跳响应
  private handleHeartbeatResponse(data: any): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }

    console.log('收到心跳响应:', data);
  }

  // 停止连接监控
  private stopConnectionMonitor(): void {
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
      this.connectionMonitorInterval = null;
    }
  }
}

// 创建全局WebSocket实例
let globalWebSocketService: WebSocketService | null = null;

// 获取全局WebSocket服务
export const getGlobalWebSocketService = (options?: WebSocketOptions): WebSocketService => {
  if (!globalWebSocketService) {
    globalWebSocketService = new WebSocketService(options);
  }
  return globalWebSocketService;
};

// 销毁全局WebSocket服务
export const destroyGlobalWebSocketService = (): void => {
  if (globalWebSocketService) {
    globalWebSocketService.disconnect();
    globalWebSocketService = null;
  }
};
