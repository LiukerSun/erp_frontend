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

  // ========== 产品相关类型定义 ==========

  // 产品信息
  type ProductInfo = {
    id: number;
    name: string;
    category_id: number;
    created_at: string;
    updated_at: string;
  };

  // 产品响应（包含在BaseResponse中）
  type ProductResponse = ProductInfo;

  // 获取产品列表参数
  type GetProductListParams = {
    page?: number;
    limit?: number;
    name?: string;
    category_id?: number;
  };

  // 产品列表响应
  type ProductListResponse = {
    products: ProductInfo[];
    pagination: Pagination;
  };

  // 创建产品请求
  type CreateProductRequest = {
    name: string;
    category_id: number;
  };

  // 更新产品请求
  type UpdateProductRequest = {
    name?: string;
    category_id?: number;
  };

  // 搜索产品参数
  type SearchProductParams = {
    name?: string;
    category_id?: number;
    page?: number;
    limit?: number;
  };

  // ========== 分类相关类型定义 ==========

  // 分类信息
  type CategoryInfo = {
    id: number;
    name: string;
    description?: string;
    parent_id?: number;
    level: number;
    sort: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };

  // 树状分类信息
  type CategoryTreeInfo = CategoryInfo & {
    children?: CategoryTreeInfo[];
  };

  // 分类响应（包含在BaseResponse中）
  type CategoryResponse = CategoryInfo;

  // 获取分类列表参数
  type GetCategoryListParams = {
    page?: number;
    limit?: number;
    name?: string;
    parent_id?: number;
    is_active?: boolean;
  };

  // 分类列表响应
  type CategoryListResponse = {
    categories: CategoryInfo[];
    pagination: Pagination;
  };

  // 分类树列表响应
  type CategoryTreeListResponse = {
    categories: CategoryTreeInfo[];
  };

  // 创建分类请求
  type CreateCategoryRequest = {
    name: string;
    description?: string;
    parent_id?: number;
    sort?: number;
    is_active?: boolean;
  };

  // 更新分类请求
  type UpdateCategoryRequest = {
    name?: string;
    description?: string;
    parent_id?: number;
    sort?: number;
    is_active?: boolean;
  };

  // 移动分类请求
  type MoveCategoryRequest = {
    parent_id?: number;
  };
}
