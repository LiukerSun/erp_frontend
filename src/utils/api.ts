import { request } from '@umijs/max';
import { message } from 'antd';

// 通用请求配置
const defaultOptions = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// 通用错误处理
const handleError = (error: any, defaultMessage: string) => {
  console.error('API Error:', error);

  let errorMessage = defaultMessage;

  if (error?.response?.data) {
    const errorData = error.response.data;
    errorMessage = errorData.error || errorData.message || errorMessage;
  } else if (error?.message) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  message.error(errorMessage);
  return false;
};

// 通用API请求方法
export const apiRequest = async <T>(
  url: string,
  options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    params?: any;
    paramsSerializer?: (params: any) => string;
  } = { method: 'GET' },
): Promise<T> => {
  const { method, data, params, paramsSerializer } = options;

  const requestOptions = {
    method,
    ...(data && { data }),
    ...(params && { params }),
    ...(paramsSerializer && { paramsSerializer }),
    ...defaultOptions,
  };

  return request<T>(url, requestOptions) as Promise<T>;
};

// 通用CRUD操作
export const createApi = <T, R = any>(baseUrl: string, transformData?: (data: T) => any) => {
  return {
    // 获取列表
    getList: async (params?: any): Promise<R> => {
      return apiRequest<R>(baseUrl, {
        method: 'GET',
        params,
        paramsSerializer: (params) => {
          const searchParams = new URLSearchParams();
          Object.keys(params).forEach((key) => {
            const value = params[key];
            if (value !== undefined && value !== null && value !== '') {
              if (Array.isArray(value)) {
                value.forEach((item) => {
                  if (item !== undefined && item !== null && item !== '') {
                    searchParams.append(key, item.toString());
                  }
                });
              } else {
                searchParams.append(key, value.toString());
              }
            }
          });
          return searchParams.toString();
        },
      });
    },

    // 获取详情
    getById: async (id: number): Promise<R> => {
      return apiRequest<R>(`${baseUrl}/${id}`, { method: 'GET' });
    },

    // 创建
    create: async (data: T): Promise<R> => {
      const requestData = transformData ? transformData(data) : data;
      return apiRequest<R>(baseUrl, {
        method: 'POST',
        data: requestData,
      });
    },

    // 更新
    update: async (id: number, data: Partial<T>): Promise<R> => {
      const requestData = transformData ? transformData(data as T) : data;
      return apiRequest<R>(`${baseUrl}/${id}`, {
        method: 'PUT',
        data: requestData,
      });
    },

    // 删除
    delete: async (id: number): Promise<R> => {
      return apiRequest<R>(`${baseUrl}/${id}`, { method: 'DELETE' });
    },
  };
};

// 通用表单提交处理
export const handleFormSubmit = async <T>(
  submitFn: () => Promise<T>,
  successMessage: string,
  errorMessage: string,
): Promise<boolean> => {
  try {
    const response = await submitFn();
    if (response && (response as any).success !== false) {
      message.success(successMessage);
      return true;
    } else {
      message.error((response as any)?.message || errorMessage);
      return false;
    }
  } catch (error) {
    handleError(error, errorMessage);
    return false;
  }
};
