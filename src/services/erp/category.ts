import { request } from '@umijs/max';

// 获取分类列表
export async function getCategoryList(params: API.GetCategoryListParams) {
  return request<API.BaseResponse<API.CategoryListResponse>>('/api/category', {
    method: 'GET',
    params,
  });
}

// 获取分类树
export async function getCategoryTree() {
  return request<API.BaseResponse<API.CategoryTreeListResponse>>('/api/category/tree', {
    method: 'GET',
  });
}

// 获取根分类
export async function getRootCategories() {
  return request<API.BaseResponse<API.CategoryTreeListResponse>>('/api/category/root', {
    method: 'GET',
  });
}

// 获取分类详情
export async function getCategoryDetail(id: number, withPath?: boolean) {
  return request<API.BaseResponse<API.CategoryResponse>>(`/api/category/${id}`, {
    method: 'GET',
    params: withPath ? { with_path: true } : undefined,
  });
}

// 获取子分类
export async function getCategoryChildren(id: number) {
  return request<API.BaseResponse<API.CategoryTreeListResponse>>(`/api/category/${id}/children`, {
    method: 'GET',
  });
}

// 创建分类
export async function createCategory(data: API.CreateCategoryRequest) {
  return request<API.BaseResponse<API.CategoryResponse>>('/api/category', {
    method: 'POST',
    data,
  });
}

// 更新分类
export async function updateCategory(id: number, data: API.UpdateCategoryRequest) {
  return request<API.BaseResponse<API.CategoryResponse>>(`/api/category/${id}`, {
    method: 'PUT',
    data,
  });
}

// 删除分类
export async function deleteCategory(id: number) {
  return request<API.BaseResponse<string>>(`/api/category/${id}`, {
    method: 'DELETE',
  });
}

// 移动分类
export async function moveCategory(id: number, data: API.MoveCategoryRequest) {
  return request<API.BaseResponse<API.CategoryResponse>>(`/api/category/${id}/move`, {
    method: 'POST',
    data,
  });
}
