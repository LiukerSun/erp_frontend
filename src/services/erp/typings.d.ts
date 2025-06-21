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

  // 商品标签信息
  type ProductTag = {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    products?: Product[];
  };

  // 商品颜色信息
  type ProductColor = {
    id: number;
    name: string;
    code?: string;
    hex_color?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    products?: Product[];
  };

  // 商品图片信息
  type ProductImage = {
    url: string;
    title?: string;
    alt?: string;
    is_main?: boolean;
    sort?: number;
  };

  // 商品信息
  type Product = {
    id: number;
    name: string;
    sku: string;
    product_code?: string; // 商品编码（店铺编号-货号）
    price: number;
    cost_price: number;
    discount_price?: number;
    is_discounted: boolean;
    source_id?: number;
    source?: Source;
    shipping_time?: string;
    images?: ProductImage[]; // 商品图片列表
    tags?: ProductTag[]; // 标签（如果API支持的话）
    colors: ProductColor[];
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
  };

  // 获取商品列表参数
  type GetProductListParams = {
    page?: number;
    page_size?: number;
    name?: string; // 商品名称搜索（模糊匹配）
    sku?: string; // SKU精确搜索
    product_code?: string; // 商品编码搜索（模糊匹配）
    source_id?: number; // 货源ID筛选
    min_price?: number; // 最低价格
    max_price?: number; // 最高价格
    is_discounted?: boolean; // 是否优惠筛选
    colors?: string[]; // 颜色筛选（可多选）
    shipping_time?: string; // 发货时间筛选（模糊匹配）
    order_by?: 'price' | 'created_at' | 'updated_at' | 'name'; // 排序字段
    order_dir?: 'asc' | 'desc'; // 排序方向
  };

  // 商品列表响应
  type ProductListResponse = {
    items: Product[];
    total: number;
  };

  // 创建商品请求
  type CreateProductRequest = {
    name: string;
    sku: string;
    price: number;
    cost_price: number;
    discount_price?: number;
    is_discounted?: boolean;
    source_id?: number;
    shipping_time?: string;
    images?: ProductImage[]; // 商品图片列表
    colors?: string[];
  };

  // 更新商品请求
  type UpdateProductRequest = CreateProductRequest;

  // 货源信息
  type Source = {
    id: number;
    name: string;
    code: string;
    status: number; // 1-启用，0-禁用
    remark?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
  };

  // 获取货源列表参数
  type GetSourceListParams = {
    page?: number;
    page_size?: number;
  };

  // 货源列表响应
  type SourceListResponse = {
    items: Source[];
    page: number;
    size: number;
    total: number;
  };

  // 创建货源请求
  type CreateSourceRequest = {
    name: string;
    code: string;
    status?: number;
    remark?: string;
  };

  // 更新货源请求
  type UpdateSourceRequest = CreateSourceRequest;

  // 颜色信息
  type Color = {
    id: number;
    name: string;
    code?: string;
    hex_color?: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    products?: Product[];
  };

  // 获取颜色列表参数
  type GetColorListParams = {
    page?: number;
    page_size?: number;
  };

  // 颜色列表响应
  type ColorListResponse = Color[];

  // 创建颜色请求
  type CreateColorRequest = {
    name: string;
    code?: string;
    hex_color?: string;
  };

  // 更新颜色请求
  type UpdateColorRequest = CreateColorRequest;

  // 阿里云STS Token
  type StsToken = {
    accessKeyId: string;
    accessKeySecret: string;
    securityToken: string;
    expiration: string;
    region: string;
    bucket: string;
    endpoint: string;
  };

  // 查询历史记录
  type QueryHistoryItem = {
    id: number;
    product_id: number;
    product_code: string;
    query_time: string;
    created_at: string;
  };

  // 查询历史列表响应
  type QueryHistoryResponse = QueryHistoryItem[];

  // 清空查询历史响应
  type ClearQueryHistoryResponse = string;
}
