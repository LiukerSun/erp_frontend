import { request } from '@umijs/max';

/**
 * 获取属性列表
 */
export async function getAttributes(params?: {
  name?: string;
  type?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}): Promise<API.Response<API.AttributeListResponse>> {
  return request('/api/attributes', {
    method: 'GET',
    params,
  });
}

/**
 * 创建属性
 */
export async function createAttribute(
  data: API.CreateAttributeRequest,
): Promise<API.Response<API.AttributeInfo>> {
  return request('/api/attributes', {
    method: 'POST',
    data,
  });
}

/**
 * 获取属性详情
 */
export async function getAttribute(id: number): Promise<API.Response<API.AttributeInfo>> {
  return request(`/api/attributes/${id}`, {
    method: 'GET',
  });
}

/**
 * 更新属性
 */
export async function updateAttribute(
  id: number,
  data: API.UpdateAttributeRequest,
): Promise<API.Response<API.AttributeInfo>> {
  return request(`/api/attributes/${id}`, {
    method: 'PUT',
    data,
  });
}

/**
 * 删除属性
 */
export async function deleteAttribute(id: number): Promise<API.Response<any>> {
  return request(`/api/attributes/${id}`, {
    method: 'DELETE',
  });
}

/**
 * 获取属性类型列表
 */
export async function getAttributeTypes(): Promise<API.Response<string[]>> {
  return request('/api/attributes/types', {
    method: 'GET',
  });
}
