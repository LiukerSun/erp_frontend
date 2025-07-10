// @ts-ignore
/* eslint-disable */
export * from './base';

// 为了向后兼容，保留原有的导出
export * from './color';
export * from './product';
export * from './source';
export * from './tags';
export * from './user';

// 统一导出所有API
export { colorApi, ossApi, productApi, sourceApi, tagApi, userApi } from './base';
