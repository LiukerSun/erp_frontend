// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 用户登录 POST /api/user/login */
export async function login(body: API.LoginRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.LoginResponse>>('/api/user/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 用户注册 POST /api/user/register */
export async function register(body: API.RegisterRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.UserResponse>>('/api/user/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取用户信息 GET /api/user/profile */
export async function getUserProfile(options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.UserResponse>>('/api/user/profile', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 更新用户信息 PUT /api/user/profile */
export async function updateUserProfile(
  body: API.UpdateProfileRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.UserResponse>>('/api/user/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 修改密码 POST /api/user/change_password */
export async function changePassword(
  body: API.ChangePasswordRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<string>>('/api/user/change_password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取用户列表 GET /api/user/list */
export async function getUserList(params: API.GetUserListParams, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.UserListResponse>>('/api/user/list', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  });
}

/** 创建用户 POST /api/user/register */
export async function createUser(body: API.CreateUserRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.UserResponse>>('/api/user/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新用户 PUT /api/user/update/:id */
export async function updateUser(
  id: number,
  body: API.UpdateUserRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.UserResponse>>(`/api/user/update/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除用户 DELETE /api/user/delete/:id */
export async function deleteUser(id: number, options?: { [key: string]: any }) {
  return request<API.BaseResponse<string>>(`/api/user/delete/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 切换用户状态 PUT /api/user/toggle_status/:id */
export async function toggleUserStatus(id: number, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.UserResponse>>(`/api/user/toggle_status/${id}`, {
    method: 'PUT',
    ...(options || {}),
  });
}
