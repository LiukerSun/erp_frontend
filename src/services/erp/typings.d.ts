declare namespace API {
  // 基础响应类型
  type BaseResponse<T = any> = {
    success: boolean;
    message: string;
    data: T;
    error?: string;
  };

  // 用户登录请求
  type LoginRequest = {
    username: string;
    password: string;
  };

  // 用户登录响应
  type LoginResponse = {
    token: string;
    user: UserInfo;
  };

  // 登录结果（用于兼容现有代码）
  type LoginResult = {
    status?: string;
    type?: string;
  };

  // 用户注册请求
  type RegisterRequest = {
    username: string;
    password: string;
    email: string;
  };

  // 用户信息
  type UserInfo = {
    id: number;
    username: string;
    name?: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
  };

  // 用户响应（包含在BaseResponse中）
  type UserResponse = UserInfo;

  // 更新用户信息请求
  type UpdateProfileRequest = {
    email?: string;
  };

  // 修改密码请求
  type ChangePasswordRequest = {
    old_password: string;
    new_password: string;
  };

  // 获取用户列表参数（基于swagger.json定义）
  type GetUserListParams = {
    page?: number;
    limit?: number;
  };

  // 分页信息
  type Pagination = {
    page: number;
    limit: number;
    total: number;
  };

  // 用户列表响应
  type UserListResponse = {
    users: UserInfo[];
    pagination: Pagination;
  };

  // 管理员创建用户请求
  type AdminCreateUserRequest = {
    username: string;
    password: string;
    email: string;
    role: 'user' | 'admin';
  };

  // 管理员更新用户请求
  type AdminUpdateUserRequest = {
    email?: string;
    role?: 'user' | 'admin';
    is_active?: boolean;
  };

  // 管理员重置密码请求
  type AdminResetPasswordRequest = {
    new_password: string;
  };
}
