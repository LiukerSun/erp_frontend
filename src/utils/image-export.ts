import { message } from 'antd';
import JSZip from 'jszip';

export interface ProductImageExportItem {
  productId: number;
  productName: string;
  sku: string;
  images: Array<{
    url: string;
    isMain: boolean;
    sort: number;
    alt?: string;
    title?: string;
  }>;
}

/**
 * 图片导出工具类
 */
export class ImageExporter {
  /**
   * 从URL下载图片并转换为Blob
   * @param url 图片URL
   * @returns Promise<Blob>
   */
  private static async downloadImageAsBlob(url: string): Promise<Blob> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`);
      }
      return await response.blob();
    } catch (error) {
      console.error('下载图片失败:', error);
      throw new Error(`下载图片失败: ${url}`);
    }
  }

  /**
   * 生成安全的文件名
   * @param name 原始文件名
   * @returns 安全的文件名
   */
  private static sanitizeFileName(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '_') // 替换非法字符
      .replace(/\s+/g, '_') // 替换空格为下划线
      .substring(0, 100); // 限制长度
  }

  /**
   * 批量导出产品图片为ZIP文件
   * @param products 产品列表
   * @param options 导出选项
   */
  static async exportProductImages(
    products: ProductImageExportItem[],
    options: {
      includeProductInfo?: boolean; // 是否包含产品信息文件
      fileName?: string; // 自定义文件名
    } = {},
  ): Promise<void> {
    const {
      includeProductInfo = true,
      fileName = `产品图片_${new Date().toISOString().slice(0, 10)}`,
    } = options;

    if (products.length === 0) {
      message.warning('没有选择任何产品');
      return;
    }

    const zip = new JSZip();
    let totalImages = 0;
    let downloadedImages = 0;

    // 计算总图片数量
    products.forEach((product) => {
      totalImages += product.images.length;
    });

    if (totalImages === 0) {
      message.warning('选中的产品没有图片');
      return;
    }

    // 显示进度消息
    const progressKey = 'imageExportProgress';
    message.loading({
      content: `正在准备下载 ${totalImages} 张图片...`,
      key: progressKey,
      duration: 0,
    });

    try {
      // 创建产品信息文件
      if (includeProductInfo) {
        const productInfo = products.map((product) => ({
          id: product.productId,
          name: product.productName,
          sku: product.sku,
          imageCount: product.images.length,
          images: product.images.map((img, index) => ({
            index: index + 1,
            url: img.url,
            isMain: img.isMain,
            sort: img.sort,
            alt: img.alt || '',
            title: img.title || '',
          })),
        }));

        zip.file('产品信息.json', JSON.stringify(productInfo, null, 2), {
          comment: '产品图片导出信息',
        });
      }

      // 下载并添加图片到ZIP
      for (const product of products) {
        if (product.images.length === 0) continue;

        // 创建产品文件夹
        const productFolderName = this.sanitizeFileName(
          `${product.productId}_${product.productName}_${product.sku}`,
        );
        const productFolder = zip.folder(productFolderName);

        if (!productFolder) continue;

        // 下载该产品的所有图片
        for (let i = 0; i < product.images.length; i++) {
          const image = product.images[i];
          try {
            // 更新进度
            message.loading({
              content: `正在下载图片 ${downloadedImages + 1}/${totalImages}...`,
              key: progressKey,
              duration: 0,
            });

            // 下载图片
            const imageBlob = await this.downloadImageAsBlob(image.url);

            // 生成文件名
            const imageExtension = image.url.split('.').pop()?.split('?')[0] || 'jpg';
            const imageFileName = `${String(i + 1).padStart(2, '0')}_${
              image.isMain ? '主图' : '图片'
            }_${image.sort}.${imageExtension}`;

            // 添加图片到ZIP
            productFolder.file(imageFileName, imageBlob, {
              comment: `产品: ${product.productName} | ${image.alt || image.title || '无描述'}`,
            });

            downloadedImages++;
          } catch (error) {
            console.error(`下载图片失败: ${image.url}`, error);
            // 继续下载其他图片，不中断整个流程
          }
        }
      }

      // 生成ZIP文件
      message.loading({
        content: '正在生成ZIP文件...',
        key: progressKey,
        duration: 0,
      });

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      // 下载ZIP文件
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${this.sanitizeFileName(fileName)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      // 显示成功消息
      message.success({
        content: `成功导出 ${downloadedImages} 张图片到ZIP文件`,
        key: progressKey,
        duration: 3,
      });
    } catch (error) {
      console.error('导出图片失败:', error);
      message.error({
        content: `导出失败: ${error instanceof Error ? error.message : '未知错误'}`,
        key: progressKey,
        duration: 5,
      });
    }
  }

  /**
   * 导出单个产品的图片
   * @param product 产品信息
   * @param options 导出选项
   */
  static async exportSingleProductImages(
    product: ProductImageExportItem,
    options: {
      fileName?: string;
    } = {},
  ): Promise<void> {
    await this.exportProductImages([product], options);
  }

  /**
   * 预览图片信息（用于确认导出内容）
   * @param products 产品列表
   * @returns 预览信息
   */
  static getExportPreview(products: ProductImageExportItem[]): {
    totalProducts: number;
    totalImages: number;
    productsWithImages: number;
    estimatedSize: string;
  } {
    const totalProducts = products.length;
    const totalImages = products.reduce((sum, product) => sum + product.images.length, 0);
    const productsWithImages = products.filter((product) => product.images.length > 0).length;

    // 估算文件大小（假设每张图片平均2MB）
    const estimatedSizeMB = Math.round(((totalImages * 2) / 1024) * 100) / 100;
    const estimatedSize =
      estimatedSizeMB > 1024
        ? `${(estimatedSizeMB / 1024).toFixed(2)} GB`
        : `${estimatedSizeMB} MB`;

    return {
      totalProducts,
      totalImages,
      productsWithImages,
      estimatedSize,
    };
  }
}
