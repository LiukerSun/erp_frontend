// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取产品列表 GET /api/product */
export async function getProductList(
  params: API.GetProductListParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.ProductListResponse>>('/api/product', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  });
}

/** 创建产品 POST /api/product */
export async function createProduct(
  body: API.CreateProductRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.ProductResponse>>('/api/product', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取产品详情 GET /api/product/:id */
export async function getProduct(id: number, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.ProductResponse>>(`/api/product/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 更新产品 PUT /api/product/:id */
export async function updateProduct(
  id: number,
  body: API.UpdateProductRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.ProductResponse>>(`/api/product/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除产品 DELETE /api/product/:id */
export async function deleteProduct(id: number, options?: { [key: string]: any }) {
  return request<API.BaseResponse<string>>(`/api/product/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 根据分类获取产品 GET /api/product/category/:category_id */
export async function getProductsByCategory(categoryId: number, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.ProductResponse[]>>(`/api/product/category/${categoryId}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 搜索产品 GET /api/product/search */
export async function searchProducts(
  params: API.SearchProductParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.ProductListResponse>>('/api/product/search', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  });
}
