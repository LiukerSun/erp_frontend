import { getProductList } from '@/services/erp/product';
import * as XLSX from 'xlsx';

export interface ExportExcelOptions {
  exportType?: 'normal' | 'expandByColor';
  exportScope?: 'filtered' | 'all';
  searchParams?: API.GetProductListParams;
  onSuccess?: (fileName: string) => void;
  onError?: (error: string) => void;
}

/**
 * 导出产品列表到Excel
 */
export const exportProductListToExcel = async (options: ExportExcelOptions = {}) => {
  const {
    exportType = 'normal',
    exportScope = 'filtered',
    searchParams = {},
    onSuccess,
    onError,
  } = options;

  try {
    let finalSearchParams: API.GetProductListParams;

    if (exportScope === 'filtered') {
      // 导出筛选后的数据
      finalSearchParams = {
        ...searchParams,
        page: 1,
        page_size: 10000, // 获取大量数据
      };
    } else {
      // 导出全量数据
      finalSearchParams = {
        page: 1,
        page_size: 10000, // 获取大量数据
      };
    }

    const response = await getProductList(finalSearchParams);

    if (!response.success || !response.data?.items) {
      const errorMsg = '获取数据失败，无法导出';
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }

    const products = response.data.items;
    let exportData: any[] = [];

    if (exportType === 'expandByColor') {
      // 按颜色扩展行导出
      let rowIndex = 1;
      products.forEach((product) => {
        if (product.colors && product.colors.length > 0) {
          // 如果有颜色，每个颜色占一行
          product.colors.forEach((color) => {
            exportData.push({
              序号: rowIndex++,
              ID: product.id,
              商品名称: product.name,
              货号: product.sku,
              唯一SKU: product.product_code || `${product.source?.code || ''}-${product.sku || ''}`,
              售价: `¥${product.price.toFixed(2)}`,
              进货价: `¥${product.cost_price.toFixed(2)}`,
              优惠价:
                product.is_discounted && product.discount_price
                  ? `¥${product.discount_price.toFixed(2)}`
                  : '-',
              优惠状态: product.is_discounted ? '优惠' : '正常',
              货源: product.source
                ? `${product.source.name} (${product.source.code})`
                : product.source_id || '-',
              颜色名称: color.name,
              颜色值: color.hex_color || '-',
              发货时间: product.shipping_time || '-',
            });
          });
        } else {
          // 如果没有颜色，直接添加一行
          exportData.push({
            序号: rowIndex++,
            ID: product.id,
            商品名称: product.name,
            货号: product.sku,
            唯一SKU: product.product_code || `${product.source?.code || ''}-${product.sku || ''}`,
            售价: `¥${product.price.toFixed(2)}`,
            进货价: `¥${product.cost_price.toFixed(2)}`,
            优惠价:
              product.is_discounted && product.discount_price
                ? `¥${product.discount_price.toFixed(2)}`
                : '-',
            优惠状态: product.is_discounted ? '优惠' : '正常',
            货源: product.source
              ? `${product.source.name} (${product.source.code})`
              : product.source_id || '-',
            颜色名称: '-',
            颜色值: '-',
            发货时间: product.shipping_time || '-',
          });
        }
      });
    } else {
      // 原样导出
      exportData = products.map((product, index) => ({
        序号: index + 1,
        ID: product.id,
        商品名称: product.name,
        货号: product.sku,
        唯一SKU: product.product_code || `${product.source?.code || ''}-${product.sku || ''}`,
        售价: `¥${product.price.toFixed(2)}`,
        进货价: `¥${product.cost_price.toFixed(2)}`,
        优惠价:
          product.is_discounted && product.discount_price
            ? `¥${product.discount_price.toFixed(2)}`
            : '-',
        优惠状态: product.is_discounted ? '优惠' : '正常',
        货源: product.source
          ? `${product.source.name} (${product.source.code})`
          : product.source_id || '-',
        颜色:
          product.colors && product.colors.length > 0
            ? product.colors.map((color) => color.name).join(', ')
            : '-',
        发货时间: product.shipping_time || '-',
      }));
    }

    // 创建工作簿
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '商品列表');

    // 设置列宽
    let colWidths;
    if (exportType === 'expandByColor') {
      colWidths = [
        { wch: 8 }, // 序号
        { wch: 8 }, // ID
        { wch: 20 }, // 商品名称
        { wch: 15 }, // 货号
        { wch: 20 }, // 唯一SKU
        { wch: 12 }, // 售价
        { wch: 12 }, // 进货价
        { wch: 12 }, // 优惠价
        { wch: 10 }, // 优惠状态
        { wch: 25 }, // 货源
        { wch: 15 }, // 颜色名称
        { wch: 15 }, // 颜色值
        { wch: 15 }, // 发货时间
      ];
    } else {
      colWidths = [
        { wch: 8 }, // 序号
        { wch: 8 }, // ID
        { wch: 20 }, // 商品名称
        { wch: 15 }, // 货号
        { wch: 20 }, // 唯一SKU
        { wch: 12 }, // 售价
        { wch: 12 }, // 进货价
        { wch: 12 }, // 优惠价
        { wch: 10 }, // 优惠状态
        { wch: 25 }, // 货源
        { wch: 30 }, // 颜色
        { wch: 15 }, // 发货时间
      ];
    }
    worksheet['!cols'] = colWidths;

    // 生成文件名（包含当前日期时间）
    const now = new Date();
    const timestamp =
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    const exportTypeText = exportType === 'expandByColor' ? '按颜色扩展' : '原样';
    const exportScopeText = exportScope === 'filtered' ? '筛选结果' : '全量数据';
    const fileName = `商品列表_${exportTypeText}_${exportScopeText}_${timestamp}.xlsx`;

    // 导出文件
    XLSX.writeFile(workbook, fileName);

    onSuccess?.(fileName);
    return fileName;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '导出Excel失败，请重试';
    onError?.(errorMsg);
    throw error;
  }
};

/**
 * 生成导出菜单项
 */
export const generateExportMenuItems = (
  currentSearchParams: API.GetProductListParams,
  onExport: (exportType: 'normal' | 'expandByColor', exportScope: 'filtered' | 'all') => void,
) => [
  {
    key: 'normal-filtered',
    label: '原样导出（筛选结果）',
    onClick: () => onExport('normal', 'filtered'),
  },
  {
    key: 'expandByColor-filtered',
    label: '按颜色扩展行（筛选结果）',
    onClick: () => onExport('expandByColor', 'filtered'),
  },
  {
    type: 'divider' as const,
  },
  {
    key: 'normal-all',
    label: '原样导出（全量数据）',
    onClick: () => onExport('normal', 'all'),
  },
  {
    key: 'expandByColor-all',
    label: '按颜色扩展行（全量数据）',
    onClick: () => onExport('expandByColor', 'all'),
  },
];
