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

// 分类属性绑定相关接口

/**
 * 获取分类的属性列表
 */
export async function getCategoryAttributes(
  categoryId: number,
): Promise<API.Response<API.CategoryAttributesResponse>> {
  return request(`/api/categories/${categoryId}/attributes`, {
    method: 'GET',
  });
}

/**
 * 获取分类的属性列表（包括继承的属性）
 */
export async function getCategoryAttributesWithInheritance(
  categoryId: number,
): Promise<API.Response<API.CategoryAttributesWithInheritanceResponse>> {
  return request(`/api/categories/${categoryId}/attributes/inheritance`, {
    method: 'GET',
  });
}

/**
 * 获取属性的继承路径
 */
export async function getAttributeInheritancePath(
  categoryId: number,
  attributeId: number,
): Promise<API.Response<API.AttributeInheritancePathResponse>> {
  return request(`/api/categories/${categoryId}/attributes/${attributeId}/inheritance`, {
    method: 'GET',
  });
}

/**
 * 绑定属性到分类
 */
export async function bindAttributeToCategory(data: {
  category_id: number;
  attribute_id: number;
  is_required?: boolean;
  sort?: number;
}): Promise<API.Response<API.CategoryAttributeInfo>> {
  return request('/api/categories/attributes/bind', {
    method: 'POST',
    data,
  });
}

/**
 * 批量绑定属性到分类
 */
export async function batchBindAttributesToCategory(data: {
  category_id: number;
  attributes: Array<{
    attribute_id: number;
    is_required?: boolean;
    sort?: number;
  }>;
}): Promise<API.Response<any>> {
  return request('/api/categories/attributes/batch-bind', {
    method: 'POST',
    data,
  });
}

/**
 * 从分类解绑属性
 */
export async function unbindAttributeFromCategory(data: {
  category_id: number;
  attribute_id: number;
}): Promise<API.Response<any>> {
  return request('/api/categories/attributes/unbind', {
    method: 'POST',
    data,
  });
}

/**
 * 更新分类属性关联
 */
export async function updateCategoryAttribute(
  categoryId: number,
  attributeId: number,
  data: {
    is_required?: boolean;
    sort?: number;
  },
): Promise<API.Response<API.CategoryAttributeInfo>> {
  return request(`/api/categories/${categoryId}/attributes/${attributeId}`, {
    method: 'PUT',
    data,
  });
}
