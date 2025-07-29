// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取商品列表 GET /api/product */
export async function getProductList(
  params: API.GetProductListParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.ProductListResponse>>('/api/product', {
    method: 'GET',
    params: { ...params },
    paramsSerializer: (params) => {
      const searchParams = new URLSearchParams();

      Object.keys(params).forEach((key) => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            // 对于数组参数，直接添加多个同名参数
            value.forEach((item) => {
              if (item !== undefined && item !== null && item !== '') {
                searchParams.append(key, item.toString());
              }
            });
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });

      return searchParams.toString();
    },
    ...(options || {}),
  });
}

/** 扫码查询商品 GET /api/product/code/:code */
export async function queryProduct(code: string, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.Product>>(`/api/product/code/${encodeURIComponent(code)}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建商品 POST /api/product */
export async function createProduct(
  body: API.CreateProductRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.Product>>('/api/product', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取商品详情 GET /api/product/:id */
export async function getProduct(id: number, options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.Product>>(`/api/product/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 更新商品 PUT /api/product/:id */
export async function updateProduct(
  id: number,
  body: API.UpdateProductRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.Product>>(`/api/product/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除商品 DELETE /api/product/:id */
export async function deleteProduct(id: number, options?: { [key: string]: any }) {
  return request<API.BaseResponse<string>>(`/api/product/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 获取所有颜色 GET /api/product/colors */
export async function getAllColors(options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.Color[]>>('/api/product/colors', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 批量更新商品供应商 PUT /api/product/batch/source */
export async function batchUpdateSource(
  body: API.BatchUpdateSourceRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<API.BatchUpdateSourceResponse>>('/api/product/batch/source', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 清空查询历史 DELETE /api/product/query/history */
export async function clearQueryHistory(options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.ClearQueryHistoryResponse>>('/api/product/query/history', {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 获取阿里云STS Token GET /api/oss/sts/token */
export async function getStsToken(options?: { [key: string]: any }) {
  return request<API.BaseResponse<API.StsToken>>('/api/oss/sts/token', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取预签名上传URL POST /api/oss/presigned-url */
export async function getPresignedUrl(
  body: { filename: string; contentType: string },
  options?: { [key: string]: any },
) {
  return request<API.BaseResponse<{ url: string; fields: Record<string, string> }>>(
    '/api/oss/presigned-url',
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
