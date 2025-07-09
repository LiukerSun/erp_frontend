import { apiRequest } from '@/utils/api';

// 基础API路径
const API_PATHS = {
  USER: '/api/user',
  PRODUCT: '/api/product',
  SOURCE: '/api/source',
  TAG: '/api/tag',
  COLOR: '/api/color',
  OSS: '/api/oss',
} as const;

// 通用CRUD操作
export const createCrudApi = <T>(basePath: string) => ({
  getList: (params?: any) => apiRequest<API.BaseResponse<any>>(basePath, { method: 'GET', params }),
  getById: (id: number) => apiRequest<API.BaseResponse<T>>(`${basePath}/${id}`, { method: 'GET' }),
  create: (data: any) => apiRequest<API.BaseResponse<T>>(basePath, { method: 'POST', data }),
  update: (id: number, data: any) =>
    apiRequest<API.BaseResponse<T>>(`${basePath}/${id}`, { method: 'PUT', data }),
  delete: (id: number) =>
    apiRequest<API.BaseResponse<string>>(`${basePath}/${id}`, { method: 'DELETE' }),
});

// 用户相关API
export const userApi = {
  ...createCrudApi<API.UserInfo>(`${API_PATHS.USER}/admin/users`),
  login: (data: API.LoginRequest) =>
    apiRequest<API.BaseResponse<API.LoginResponse>>(`${API_PATHS.USER}/login`, {
      method: 'POST',
      data,
    }),
  register: (data: API.RegisterRequest) =>
    apiRequest<API.BaseResponse<API.UserResponse>>(`${API_PATHS.USER}/register`, {
      method: 'POST',
      data,
    }),
  getProfile: () =>
    apiRequest<API.BaseResponse<API.UserResponse>>(`${API_PATHS.USER}/profile`, { method: 'GET' }),
  updateProfile: (data: API.UpdateProfileRequest) =>
    apiRequest<API.BaseResponse<API.UserResponse>>(`${API_PATHS.USER}/profile`, {
      method: 'PUT',
      data,
    }),
  changePassword: (data: API.ChangePasswordRequest) =>
    apiRequest<API.BaseResponse<string>>(`${API_PATHS.USER}/change_password`, {
      method: 'POST',
      data,
    }),
  resetPassword: (id: number, data: API.AdminResetPasswordRequest) =>
    apiRequest<API.BaseResponse<string>>(`${API_PATHS.USER}/admin/users/${id}/reset_password`, {
      method: 'POST',
      data,
    }),
};

// 产品相关API
export const productApi = {
  ...createCrudApi<API.Product>(API_PATHS.PRODUCT),
  queryByCode: (code: string) =>
    apiRequest<API.BaseResponse<API.Product>>(
      `${API_PATHS.PRODUCT}/code/${encodeURIComponent(code)}`,
      { method: 'GET' },
    ),
  getColors: () =>
    apiRequest<API.BaseResponse<API.Color[]>>(`${API_PATHS.PRODUCT}/colors`, { method: 'GET' }),
  clearQueryHistory: () =>
    apiRequest<API.BaseResponse<API.ClearQueryHistoryResponse>>(
      `${API_PATHS.PRODUCT}/query/history`,
      { method: 'DELETE' },
    ),
};

// 货源相关API
export const sourceApi = createCrudApi<API.Source>(API_PATHS.SOURCE);

// 标签相关API
export const tagApi = {
  ...createCrudApi<API.Tag>(API_PATHS.TAG),
  getProducts: (id: number) =>
    apiRequest<API.BaseResponse<API.Product[]>>(`${API_PATHS.TAG}/${id}/products`, {
      method: 'GET',
    }),
  addProduct: (tagId: number, productId: number) =>
    apiRequest<API.BaseResponse<string>>(`${API_PATHS.TAG}/${tagId}/products/${productId}`, {
      method: 'POST',
    }),
  removeProduct: (tagId: number, productId: number) =>
    apiRequest<API.BaseResponse<string>>(`${API_PATHS.TAG}/${tagId}/products/${productId}`, {
      method: 'DELETE',
    }),
};

// 颜色相关API
export const colorApi = createCrudApi<API.Color>(API_PATHS.COLOR);

// OSS相关API
export const ossApi = {
  getStsToken: () =>
    apiRequest<API.BaseResponse<API.StsToken>>(`${API_PATHS.OSS}/sts/token`, { method: 'GET' }),
  getPresignedUrl: (data: { filename: string; contentType: string }) =>
    apiRequest<API.BaseResponse<{ url: string; fields: Record<string, string> }>>(
      `${API_PATHS.OSS}/presigned-url`,
      { method: 'POST', data },
    ),
};
