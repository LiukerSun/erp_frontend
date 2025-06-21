import { getToken } from './auth';

export interface DiagnosticResult {
  success: boolean;
  message: string;
  details?: any;
}

export class WebSocketDiagnostic {
  /**
   * 检查后端服务是否可访问
   */
  static async checkBackendHealth(): Promise<DiagnosticResult> {
    try {
      const baseUrl =
        process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : window.location.origin;
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return {
          success: true,
          message: '后端服务正常运行',
          details: { status: response.status, statusText: response.statusText },
        };
      } else {
        return {
          success: false,
          message: `后端服务响应异常: ${response.status} ${response.statusText}`,
          details: { status: response.status, statusText: response.statusText },
        };
      }
    } catch (error) {
      return {
        success: false,
        message: '无法连接到后端服务',
        details: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * 检查JWT Token是否有效
   */
  static checkToken(): DiagnosticResult {
    const token = getToken();

    if (!token) {
      return {
        success: false,
        message: '未找到JWT Token，请先登录',
      };
    }

    try {
      // 简单的Token格式检查
      const parts = token.split('.');
      if (parts.length !== 3) {
        return {
          success: false,
          message: 'JWT Token格式无效',
        };
      }

      // 检查Token是否过期
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < now) {
        return {
          success: false,
          message: 'JWT Token已过期',
          details: {
            expiredAt: new Date(payload.exp * 1000).toLocaleString(),
            currentTime: new Date().toLocaleString(),
          },
        };
      }

      return {
        success: true,
        message: 'JWT Token有效',
        details: {
          userId: payload.user_id,
          username: payload.username,
          role: payload.role,
          expiresAt: new Date(payload.exp * 1000).toLocaleString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'JWT Token解析失败',
        details: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * 测试WebSocket连接
   */
  static testWebSocketConnection(url: string, timeout: number = 10000): Promise<DiagnosticResult> {
    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout | undefined;
      let ws: WebSocket | undefined;

      try {
        ws = new WebSocket(url);

        timeoutId = setTimeout(() => {
          if (ws) ws.close();
          resolve({
            success: false,
            message: 'WebSocket连接超时',
            details: { url, timeout },
          });
        }, timeout);

        ws.onopen = () => {
          if (timeoutId) clearTimeout(timeoutId);
          if (ws) ws.close();
          resolve({
            success: true,
            message: 'WebSocket连接成功',
            details: { url },
          });
        };

        ws.onerror = (error) => {
          if (timeoutId) clearTimeout(timeoutId);
          resolve({
            success: false,
            message: 'WebSocket连接错误',
            details: { url, error },
          });
        };

        ws.onclose = (event) => {
          if (timeoutId) clearTimeout(timeoutId);
          if (event.code !== 1000) {
            // 不是正常关闭
            resolve({
              success: false,
              message: `WebSocket连接关闭 (代码: ${event.code})`,
              details: { url, code: event.code, reason: event.reason },
            });
          }
        };
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        resolve({
          success: false,
          message: '创建WebSocket连接失败',
          details: { url, error: error instanceof Error ? error.message : String(error) },
        });
      }
    });
  }

  /**
   * 运行完整诊断
   */
  static async runFullDiagnostic(): Promise<{
    backend: DiagnosticResult;
    token: DiagnosticResult;
    websocket: DiagnosticResult[];
  }> {
    // 检查后端服务
    const backend = await this.checkBackendHealth();
    // 检查Token
    const token = this.checkToken();
    // 测试WebSocket连接
    const websocket: DiagnosticResult[] = [];

    if (token.success) {
      const baseUrl =
        process.env.NODE_ENV === 'development' ? 'localhost:8080' : window.location.host;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const tokenValue = getToken()!;

      const testUrls = [
        `${protocol}//${baseUrl}/api/ws/connect?token=${tokenValue}`,
        `${protocol}//${baseUrl}/api/ws/connect`,
        `${protocol}//${baseUrl}/ws/connect?token=${tokenValue}`,
        `${protocol}//${baseUrl}/ws/connect`,
      ];

      for (const url of testUrls) {
        const result = await this.testWebSocketConnection(url);
        websocket.push(result);
        // 如果连接成功，停止测试
        if (result.success) {
          break;
        }
      }
    }

    return { backend, token, websocket };
  }

  /**
   * 获取诊断建议
   */
  static getDiagnosticSuggestions(results: {
    backend: DiagnosticResult;
    token: DiagnosticResult;
    websocket: DiagnosticResult[];
  }): string[] {
    const suggestions: string[] = [];

    if (!results.backend.success) {
      suggestions.push('1. 检查后端服务是否启动');
      suggestions.push('2. 确认后端服务运行在端口8080');
      suggestions.push('3. 检查防火墙设置');
    }

    if (!results.token.success) {
      suggestions.push('4. 重新登录获取有效的JWT Token');
    }

    if (results.websocket.length > 0 && !results.websocket.some((r) => r.success)) {
      suggestions.push('5. 检查WebSocket路径配置');
      suggestions.push('6. 确认后端支持WebSocket协议');
      suggestions.push('7. 检查认证方式是否匹配');
    }

    if (suggestions.length === 0) {
      suggestions.push('所有检查都通过，WebSocket应该可以正常工作');
    }

    return suggestions;
  }
}
