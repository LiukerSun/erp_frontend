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

/** 管理员获取用户列表 GET /api/user/admin/users */
export async function getUserList(params: API.GetUserListParams, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.UserListResponse>>('/api/user/admin/users', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  });
}

/** 管理员创建用户 POST /api/user/admin/users */
export async function createUser(
  body: API.AdminCreateUserRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.UserResponse>>('/api/user/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 管理员更新用户 PUT /api/user/admin/users/:id */
export async function updateUser(
  id: number,
  body: API.AdminUpdateUserRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.UserResponse>>(`/api/user/admin/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 管理员删除用户 DELETE /api/user/admin/users/:id */
export async function deleteUser(id: number, options?: { [key: string]: any }) {
  return request<API.BaseResponse<string>>(`/api/user/admin/users/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 管理员重置用户密码 POST /api/user/admin/users/:id/reset_password */
export async function resetUserPassword(
  id: number,
  body: API.AdminResetPasswordRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<string>>(`/api/user/admin/users/${id}/reset_password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
