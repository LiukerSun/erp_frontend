// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取颜色列表 GET /api/product/colors */
export async function getColorList(options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.ColorListResponse>>('/api/product/colors', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建颜色 POST /api/product/colors */
export async function createColor(body: API.CreateColorRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.Color>>('/api/product/colors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取颜色详情 GET /api/product/colors/:id */
export async function getColor(id: number, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.Color>>(`/api/product/colors/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 更新颜色 PUT /api/product/colors/:id */
export async function updateColor(
  id: number,
  body: API.UpdateColorRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.Color>>(`/api/product/colors/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除颜色 DELETE /api/product/colors/:id */
export async function deleteColor(id: number, options?: { [key: string]: any }) {
  return request<API.BaseResponse<string>>(`/api/product/colors/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}
