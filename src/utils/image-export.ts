import { message } from 'antd';
import JSZip from 'jszip';
import {
  ImageComposeConfigOptions,
  ImageComposeOptions,
  ImageProcessOptions,
  ImageProcessor,
} from './image-processor';

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

export interface ProductComposeItem {
  productId: number;
  productName: string;
  sku: string;
  price: number;
  mainImageUrl: string;
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
   * 处理图片并转换为Blob
   * @param url 图片URL
   * @param processOptions 图片处理选项
   * @returns Promise<Blob>
   */
  private static async processImageAsBlob(
    url: string,
    processOptions?: ImageProcessOptions,
  ): Promise<Blob> {
    try {
      if (processOptions) {
        // 使用图片处理器处理图片
        return await ImageProcessor.processImage(url, processOptions);
      } else {
        // 直接下载原始图片
        return await this.downloadImageAsBlob(url);
      }
    } catch (error) {
      console.error('处理图片失败:', error);
      // 如果处理失败，尝试直接下载原始图片
      return await this.downloadImageAsBlob(url);
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
      processOptions?: ImageProcessOptions; // 图片处理选项
    } = {},
  ): Promise<void> {
    const {
      includeProductInfo = true,
      fileName = `产品图片_${new Date().toISOString().slice(0, 10)}`,
      processOptions,
    } = options;

    if (products.length === 0) {
      message.warning('没有选择任何产品');
      return;
    }

    const zip = new JSZip();
    let totalImages = 0;
    let downloadedImages = 0;
    let processedImages = 0;

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
    const processText = processOptions ? '处理并下载' : '下载';
    message.loading({
      content: `正在准备${processText} ${totalImages} 张图片...`,
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
            const currentProcess = processOptions ? '处理' : '下载';
            message.loading({
              content: `正在${currentProcess}图片 ${downloadedImages + 1}/${totalImages}...`,
              key: progressKey,
              duration: 0,
            });

            // 处理或下载图片
            const imageBlob = await this.processImageAsBlob(image.url, processOptions);

            // 生成文件名
            const imageExtension =
              processOptions?.format || image.url.split('.').pop()?.split('?')[0] || 'jpg';
            const imageFileName = `${String(i + 1).padStart(2, '0')}_${
              image.isMain ? '主图' : '图片'
            }_${image.sort}.${imageExtension}`;

            // 添加图片到ZIP
            productFolder.file(imageFileName, imageBlob, {
              comment: `产品: ${product.productName} | ${image.alt || image.title || '无描述'}`,
            });

            downloadedImages++;
            if (processOptions) {
              processedImages++;
            }
          } catch (error) {
            console.error(`处理图片失败: ${image.url}`, error);
            // 继续处理其他图片，不中断整个流程
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
      const successText = processOptions
        ? `成功处理并导出 ${processedImages} 张图片到ZIP文件`
        : `成功导出 ${downloadedImages} 张图片到ZIP文件`;

      message.success({
        content: successText,
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
   * 批量导出合成图片（商品主图+图框+价格）
   * @param products 产品列表
   * @param options 导出选项
   */
  static async exportComposedImages(
    products: ProductComposeItem[],
    options: {
      includeProductInfo?: boolean; // 是否包含产品信息文件
      fileName?: string; // 自定义文件名
      composeOptions: ImageComposeConfigOptions; // 合成选项
    },
  ): Promise<void> {
    const {
      includeProductInfo = true,
      fileName = `合成图片_${new Date().toISOString().slice(0, 10)}`,
      composeOptions,
    } = options;

    if (products.length === 0) {
      message.warning('没有选择任何产品');
      return;
    }

    const zip = new JSZip();
    let totalImages = products.length;
    let processedImages = 0;

    // 显示进度消息
    const progressKey = 'composeExportProgress';
    message.loading({
      content: `正在准备合成 ${totalImages} 张图片...`,
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
          price: product.price,
          mainImageUrl: product.mainImageUrl,
        }));

        zip.file('产品信息.json', JSON.stringify(productInfo, null, 2), {
          comment: '合成图片导出信息',
        });
      }

      // 合成并添加图片到ZIP
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        try {
          // 更新进度
          message.loading({
            content: `正在合成图片 ${i + 1}/${totalImages}...`,
            key: progressKey,
            duration: 0,
          });

          // 合成图片
          const finalComposeOptions: ImageComposeOptions = {
            ...composeOptions,
            productImage: {
              url: product.mainImageUrl,
            },
            priceText: {
              text: `${product.price.toFixed(2)}`,
              position: composeOptions.pricePosition,
              x: composeOptions.priceX,
              y: composeOptions.priceY,
              fontSize: composeOptions.priceFontSize || 24,
              color: composeOptions.priceColor || '#ff4d4f',
              fontFamily: composeOptions.priceFontFamily || 'Arial',
            },
          };

          const composedImageBlob = await ImageProcessor.composeImage(finalComposeOptions);

          // 生成文件名
          const imageExtension = composeOptions.format || 'jpg';
          const imageFileName = `${String(i + 1).padStart(2, '0')}_${this.sanitizeFileName(
            product.productName,
          )}_${product.sku}.${imageExtension}`;

          // 添加图片到ZIP
          zip.file(imageFileName, composedImageBlob, {
            comment: `产品: ${product.productName} | 价格: ${product.price.toFixed(2)}`,
          });

          processedImages++;
        } catch (error) {
          console.error(`合成图片失败: ${product.productName}`, error);
          // 继续处理其他图片，不中断整个流程
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
        content: `成功合成并导出 ${processedImages} 张图片到ZIP文件`,
        key: progressKey,
        duration: 3,
      });
    } catch (error) {
      console.error('导出合成图片失败:', error);
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
      processOptions?: ImageProcessOptions;
    } = {},
  ): Promise<void> {
    await this.exportProductImages([product], options);
  }

  /**
   * 预览图片信息（用于确认导出内容）
   * @param products 产品列表
   * @param processOptions 图片处理选项
   * @returns 预览信息
   */
  static getExportPreview(
    products: ProductImageExportItem[],
    processOptions?: ImageProcessOptions,
  ): {
    totalProducts: number;
    totalImages: number;
    productsWithImages: number;
    estimatedSize: string;
    processingInfo?: string;
  } {
    const totalProducts = products.length;
    const totalImages = products.reduce((sum, product) => sum + product.images.length, 0);
    const productsWithImages = products.filter((product) => product.images.length > 0).length;

    // 估算文件大小
    let estimatedSizeMB = totalImages * 2; // 假设每张图片平均2MB

    // 如果启用了图片处理，根据处理选项调整估算大小
    if (processOptions) {
      if (processOptions.resize) {
        // 调整大小会减少文件大小
        estimatedSizeMB *= 0.5;
      }
      if (processOptions.quality && processOptions.quality < 0.8) {
        // 降低质量会减少文件大小
        estimatedSizeMB *= processOptions.quality;
      }
    }

    estimatedSizeMB = Math.round((estimatedSizeMB / 1024) * 100) / 100;
    const estimatedSize =
      estimatedSizeMB > 1024
        ? `${(estimatedSizeMB / 1024).toFixed(2)} GB`
        : `${estimatedSizeMB} MB`;

    const result: {
      totalProducts: number;
      totalImages: number;
      productsWithImages: number;
      estimatedSize: string;
      processingInfo?: string;
    } = {
      totalProducts,
      totalImages,
      productsWithImages,
      estimatedSize,
    };

    // 添加处理信息
    if (processOptions) {
      const processingDetails = [];

      if (processOptions.resize) {
        const { width, height } = processOptions.resize;
        if (width && height) {
          processingDetails.push(`调整尺寸至 ${width}x${height}`);
        } else if (width) {
          processingDetails.push(`调整宽度至 ${width}px`);
        } else if (height) {
          processingDetails.push(`调整高度至 ${height}px`);
        }
      }

      if (processOptions.quality) {
        processingDetails.push(`质量: ${Math.round(processOptions.quality * 100)}%`);
      }

      if (processOptions.format) {
        processingDetails.push(`格式: ${processOptions.format.toUpperCase()}`);
      }

      if (processOptions.brightness) {
        processingDetails.push(
          `亮度: ${processOptions.brightness > 0 ? '+' : ''}${processOptions.brightness}`,
        );
      }

      if (processOptions.contrast) {
        processingDetails.push(
          `对比度: ${processOptions.contrast > 0 ? '+' : ''}${processOptions.contrast}`,
        );
      }

      if (processOptions.saturation) {
        processingDetails.push(
          `饱和度: ${processOptions.saturation > 0 ? '+' : ''}${processOptions.saturation}`,
        );
      }

      if (processOptions.sharpen) {
        processingDetails.push('锐化处理');
      }

      if (processOptions.watermark) {
        processingDetails.push(`添加水印: ${processOptions.watermark.text}`);
      }

      if (processingDetails.length > 0) {
        result.processingInfo = processingDetails.join(', ');
      }
    }

    return result;
  }

  /**
   * 预览合成图片信息
   * @param products 产品列表
   * @param composeOptions 合成选项
   * @returns 预览信息
   */
  static getComposePreview(
    products: ProductComposeItem[],
    composeOptions: ImageComposeConfigOptions,
  ): {
    totalProducts: number;
    canvasSize: number;
    estimatedSize: string;
    composeInfo: string;
  } {
    const totalProducts = products.length;
    const canvasSize = composeOptions.canvasSize;

    // 估算文件大小（假设每张合成图片平均1MB）
    const estimatedSizeMB = Math.round(((totalProducts * 1) / 1024) * 100) / 100;
    const estimatedSize =
      estimatedSizeMB > 1024
        ? `${(estimatedSizeMB / 1024).toFixed(2)} GB`
        : `${estimatedSizeMB} MB`;

    // 构建合成信息
    const composeDetails = [`画布尺寸: ${canvasSize}x${canvasSize}px`];

    if (composeOptions.frameImage) {
      composeDetails.push('包含图框');
    }

    if (composeOptions.quality) {
      composeDetails.push(`质量: ${Math.round(composeOptions.quality * 100)}%`);
    }

    if (composeOptions.format) {
      composeDetails.push(`格式: ${composeOptions.format.toUpperCase()}`);
    }

    return {
      totalProducts,
      canvasSize,
      estimatedSize,
      composeInfo: composeDetails.join(', '),
    };
  }
}
