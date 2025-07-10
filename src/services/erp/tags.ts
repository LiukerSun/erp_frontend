// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取所有标签列表 GET /api/tags */
export async function getTagList(options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.Tag[]>>('/api/tags', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取启用的标签列表 GET /api/tags/enabled */
export async function getEnabledTags(options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.Tag[]>>('/api/tags/enabled', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取标签详情 GET /api/tags/:id */
export async function getTag(id: number, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.Tag>>(`/api/tags/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建标签 POST /api/tags */
export async function createTag(body: API.CreateTagRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.Tag>>('/api/tags', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新标签 PUT /api/tags/:id */
export async function updateTag(
  id: number,
  body: API.UpdateTagRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.Tag>>(`/api/tags/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除标签 DELETE /api/tags/:id */
export async function deleteTag(id: number, options?: { [key: string]: any }) {
  return request<API.BaseResponse<string>>(`/api/tags/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 获取标签下的产品 GET /api/tags/:id/products */
export async function getTagProducts(id: number, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.Product[]>>(`/api/tags/${id}/products`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 为标签添加产品 POST /api/tags/:id/products */
export async function addProductToTag(
  tagId: number,
  productId: number,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<string>>(`/api/tags/${tagId}/products`, {
    method: 'POST',
    params: { product_id: productId },
    ...(options || {}),
  });
}

/** 从标签移除产品 DELETE /api/tags/:id/products */
export async function removeProductFromTag(
  tagId: number,
  productId: number,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<string>>(`/api/tags/${tagId}/products`, {
    method: 'DELETE',
    params: { product_id: productId },
    ...(options || {}),
  });
}

/** 获取产品的标签 GET /api/tags/product */
export async function getProductTags(productId: number, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.Tag[]>>(`/api/tags/product`, {
    method: 'GET',
    params: { product_id: productId },
    ...(options || {}),
  });
}
