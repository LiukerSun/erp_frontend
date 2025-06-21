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

/** 获取产品详情（包含属性） GET /api/product/:id/with-attributes */
export async function getProductWithAttributes(id: number, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.ProductWithAttributesResponse>>(
    `/api/product/${id}/with-attributes`,
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/** 创建产品（包含属性） POST /api/product/with-attributes */
export async function createProductWithAttributes(
  body: API.CreateProductWithAttributesRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.ProductWithAttributesResponse>>(
    '/api/product/with-attributes',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: body,
      ...(options || {}),
    },
  );
}

/** 更新产品（包含属性） PUT /api/product/:id/with-attributes */
export async function updateProductWithAttributes(
  id: number,
  body: API.UpdateProductWithAttributesRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.ProductWithAttributesResponse>>(
    `/api/product/${id}/with-attributes`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      data: body,
      ...(options || {}),
    },
  );
}

/** 获取分类属性模板 GET /api/product/categories/:category_id/template */
export async function getCategoryAttributeTemplate(
  categoryId: number,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.CategoryAttributeTemplateResponse>>(
    `/api/product/categories/${categoryId}/template`,
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/** 验证产品属性 POST /api/product/attributes/validate */
export async function validateProductAttributes(
  body: API.ValidateProductAttributesRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.ValidationResult>>('/api/product/attributes/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
