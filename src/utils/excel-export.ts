import { getProductList } from '@/services/erp/product';
import { message, Modal } from 'antd';
import * as XLSX from 'xlsx';

export interface ExportExcelOptions {
  exportType?: 'normal' | 'expandByColor';
  exportScope?: 'filtered' | 'all';
  searchParams?: API.GetProductListParams;
  onSuccess?: (fileName: string) => void;
  onError?: (error: string) => void;
}

/**
 * 分页获取所有产品数据
 */
const getAllProducts = async (
  searchParams: API.GetProductListParams,
  onProgress?: (current: number, total: number) => void,
): Promise<API.Product[]> => {
  const allProducts: API.Product[] = [];
  let page = 1;
  const pageSize = 100; // 后端限制的最大每页数量
  let total = 0;
  let hasMore = true;

  while (hasMore) {
    const params = {
      ...searchParams,
      page,
      page_size: pageSize,
    };

    const response = await getProductList(params);

    if (!response.success || !response.data?.items) {
      throw new Error('获取数据失败');
    }

    const { items, total: totalCount } = response.data;

    if (page === 1) {
      total = totalCount;
    }

    allProducts.push(...items);

    // 更新进度
    onProgress?.(allProducts.length, total);

    // 检查是否还有更多数据
    hasMore = allProducts.length < total && items.length === pageSize;
    page++;
  }

  return allProducts;
};

/**
 * 处理数据并导出Excel
 */
const processAndExportData = async (
  products: API.Product[],
  exportType: 'normal' | 'expandByColor',
  exportScope: 'filtered' | 'all',
  progressKey: string,
  onSuccess?: (fileName: string) => void,
) => {
  message.loading({
    content: `正在处理 ${products.length} 条数据...`,
    key: progressKey,
    duration: 0,
  });

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

  message.loading({
    content: '正在生成Excel文件...',
    key: progressKey,
    duration: 0,
  });

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

  message.success({
    content: `成功导出 ${exportData.length} 条数据到文件：${fileName}`,
    key: progressKey,
    duration: 3,
  });

  onSuccess?.(fileName);
  return fileName;
};

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
      };
    } else {
      // 导出全量数据
      finalSearchParams = {};
    }

    // 显示进度消息
    const progressKey = 'excelExportProgress';
    message.loading({
      content: '正在获取数据总数...',
      key: progressKey,
      duration: 0,
    });

    // 先获取第一页数据来确定总数
    const firstPageResponse = await getProductList({
      ...finalSearchParams,
      page: 1,
      page_size: 100,
    });

    if (!firstPageResponse.success || !firstPageResponse.data) {
      const errorMsg = '获取数据失败，无法导出';
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }

    const total = firstPageResponse.data.total;

    if (total === 0) {
      message.warning({
        content: '没有数据可导出',
        key: progressKey,
        duration: 3,
      });
      return;
    }

    // 如果只有一页数据，直接使用第一页
    if (total <= 100) {
      message.loading({
        content: `正在处理 ${total} 条数据...`,
        key: progressKey,
        duration: 0,
      });

      const products = firstPageResponse.data.items;
      await processAndExportData(products, exportType, exportScope, progressKey, onSuccess);
      return;
    }

    // 确认是否导出大量数据
    const shouldContinue = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: '确认导出大量数据',
        content: `检测到共有 ${total} 条数据需要导出。这将需要分页获取所有数据，可能需要一些时间。确定要继续导出吗？`,
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
        okText: '继续导出',
        cancelText: '取消',
      });
    });

    if (!shouldContinue) {
      message.destroy(progressKey);
      return;
    }

    // 分页获取所有数据
    const allProducts = await getAllProducts(finalSearchParams, (current, total) => {
      message.loading({
        content: `正在获取数据... ${current}/${total} (${Math.round((current / total) * 100)}%)`,
        key: progressKey,
        duration: 0,
      });
    });

    // 处理并导出数据
    await processAndExportData(allProducts, exportType, exportScope, progressKey, onSuccess);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '导出Excel失败，请重试';
    onError?.(errorMsg);
    message.error({
      content: errorMsg,
      key: 'excelExportProgress',
      duration: 5,
    });
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
