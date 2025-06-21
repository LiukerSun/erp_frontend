// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取货源列表 GET /api/source */
export async function getSourceList(
  params: API.GetSourceListParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.SourceListResponse>>('/api/source', {
    method: 'GET',
    params: { ...params },
    ...(options || {}),
  });
}

/** 获取启用状态的货源列表 GET /api/source/active */
export async function getActiveSourceList(options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.Source[]>>('/api/source/active', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建货源 POST /api/source */
export async function createSource(
  body: API.CreateSourceRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.Source>>('/api/source', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取货源详情 GET /api/source/:id */
export async function getSource(id: number, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.Source>>(`/api/source/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 更新货源 PUT /api/source/:id */
export async function updateSource(
  id: number,
  body: API.UpdateSourceRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.Source>>(`/api/source/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除货源 DELETE /api/source/:id */
export async function deleteSource(id: number, options?: { [key: string]: any }) {
  return request<API.BaseResponse<string>>(`/api/source/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}
