/**
 * 图片处理选项
 */
export interface ImageProcessOptions {
  resize?: {
    width?: number;
    height?: number;
    maintainAspectRatio?: boolean;
  };
  quality?: number; // 0-1之间的值
  format?: 'jpeg' | 'png' | 'webp';
  brightness?: number; // -100 到 100
  contrast?: number; // -100 到 100
  saturation?: number; // -100 到 100
  blur?: number; // 0 到 10
  sharpen?: boolean;
  watermark?: {
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    fontSize?: number;
    color?: string;
    opacity?: number;
  };
}

/**
 * 图片合成选项
 */
export interface ImageComposeOptions {
  canvasSize: number; // 正方形画布尺寸
  productImage: {
    url: string;
    position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    size?: number; // 商品图片在画布中的尺寸
  };
  frameImage?: {
    url: string; // 图框图片URL
    position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    size?: number; // 图框图片在画布中的尺寸
  };
  priceText?: {
    text: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    x?: number; // 自定义X坐标
    y?: number; // 自定义Y坐标
    fontSize?: number;
    color?: string;
    fontFamily?: string;
  };
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * 图片合成配置选项（用于批量合成）
 */
export interface ImageComposeConfigOptions {
  canvasSize: number;
  frameImage?: {
    url: string;
    size?: number;
  };
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  // 价格文字配置
  pricePosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  priceX?: number; // 自定义X坐标
  priceY?: number; // 自定义Y坐标
  priceFontSize?: number;
  priceColor?: string;
  priceFontFamily?: string;
  priceBackgroundColor?: string;
  pricePadding?: number;
  priceBorderRadius?: number;
}

/**
 * 图片处理工具类
 * 使用Canvas API进行图片处理
 */
export class ImageProcessor {
  /**
   * 处理图片
   * @param imageUrl 图片URL
   * @param options 处理选项
   * @returns Promise<Blob> 处理后的图片Blob
   */
  static async processImage(imageUrl: string, options: ImageProcessOptions = {}): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous'; // 处理跨域问题

      img.onload = () => {
        try {
          // 设置画布尺寸
          let { width, height } = img;

          if (options.resize) {
            const {
              width: newWidth,
              height: newHeight,
              maintainAspectRatio = true,
            } = options.resize;

            if (newWidth && newHeight) {
              width = newWidth;
              height = newHeight;
            } else if (newWidth) {
              if (maintainAspectRatio) {
                height = (img.height * newWidth) / img.width;
              } else {
                width = newWidth;
              }
            } else if (newHeight) {
              if (maintainAspectRatio) {
                width = (img.width * newHeight) / img.height;
              } else {
                height = newHeight;
              }
            }
          }

          canvas.width = width;
          canvas.height = height;

          // 应用滤镜效果
          if (options.brightness || options.contrast || options.saturation) {
            const filters = [];

            if (options.brightness) {
              filters.push(`brightness(${100 + options.brightness}%)`);
            }
            if (options.contrast) {
              filters.push(`contrast(${100 + options.contrast}%)`);
            }
            if (options.saturation) {
              filters.push(`saturate(${100 + options.saturation}%)`);
            }
            if (options.blur) {
              filters.push(`blur(${options.blur}px)`);
            }

            ctx.filter = filters.join(' ');
          }

          // 绘制图片
          ctx.drawImage(img, 0, 0, width, height);

          // 应用锐化效果
          if (options.sharpen) {
            this.applySharpen(ctx, width, height);
          }

          // 添加水印
          if (options.watermark) {
            this.addWatermark(ctx, width, height, options.watermark);
          }

          // 转换为Blob
          const quality = options.quality || 0.8;
          const format = options.format || 'jpeg';

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('图片处理失败'));
              }
            },
            `image/${format}`,
            quality,
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error(`加载图片失败: ${imageUrl}`));
      };

      img.src = imageUrl;
    });
  }

  /**
   * 合成图片（商品主图 + 图框 + 价格文字）
   * @param options 合成选项
   * @returns Promise<Blob> 合成后的图片Blob
   */
  static async composeImage(options: ImageComposeOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'));
        return;
      }

      const {
        canvasSize,
        productImage,
        frameImage,
        priceText,
        quality = 0.9,
        format = 'jpeg',
      } = options;

      // 确保画布是正方形
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      // 加载商品图片
      const productImg = new Image();
      productImg.crossOrigin = 'anonymous';

      productImg.onload = () => {
        try {
          // 第一层：商品主图覆盖整个正方形画布
          ctx.drawImage(productImg, 0, 0, canvasSize, canvasSize);

          // 第二层：如果有图框，叠加图框
          if (frameImage) {
            const frameImg = new Image();
            frameImg.crossOrigin = 'anonymous';

            frameImg.onload = () => {
              try {
                // 图框居中显示，尺寸与画布相同
                const frameSize = frameImage.size || canvasSize;
                const frameX = (canvasSize - frameSize) / 2;
                const frameY = (canvasSize - frameSize) / 2;

                // 绘制图框
                ctx.drawImage(frameImg, frameX, frameY, frameSize, frameSize);

                // 第三层：绘制价格文字（最上层）
                if (priceText) {
                  console.log('绘制价格文字:', priceText);
                  this.drawPriceText(ctx, canvasSize, priceText);
                } else {
                  console.log('没有价格文字配置');
                }

                // 转换为Blob
                canvas.toBlob(
                  (blob) => {
                    if (blob) {
                      resolve(blob);
                    } else {
                      reject(new Error('图片合成失败'));
                    }
                  },
                  `image/${format}`,
                  quality,
                );
              } catch (error) {
                reject(error);
              }
            };

            frameImg.onerror = () => {
              reject(new Error(`加载图框图片失败: ${frameImage.url}`));
            };

            frameImg.src = frameImage.url;
          } else {
            // 没有图框，直接绘制价格文字（最上层）
            if (priceText) {
              console.log('绘制价格文字:', priceText);
              this.drawPriceText(ctx, canvasSize, priceText);
            } else {
              console.log('没有价格文字配置');
            }

            // 转换为Blob
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('图片合成失败'));
                }
              },
              `image/${format}`,
              quality,
            );
          }
        } catch (error) {
          reject(error);
        }
      };

      productImg.onerror = () => {
        reject(new Error(`加载商品图片失败: ${productImage.url}`));
      };

      productImg.src = productImage.url;
    });
  }

  /**
   * 绘制价格文字
   */
  private static drawPriceText(
    ctx: CanvasRenderingContext2D,
    canvasSize: number,
    priceText: NonNullable<ImageComposeOptions['priceText']>,
  ): void {
    const {
      text,
      position,
      x: customX,
      y: customY,
      fontSize = 24,
      color = '#ff4d4f',
      fontFamily = 'Arial',
    } = priceText;

    ctx.save();

    // 设置字体（无粗体，纯文字）
    ctx.font = `${fontSize}px ${fontFamily}`;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;

    // 计算文字位置
    let x = 0;
    let y = 0;
    const margin = 20;

    // 如果提供了自定义坐标，优先使用
    if (customX !== undefined && customY !== undefined) {
      x = customX;
      y = customY;
    } else if (position) {
      // 否则使用预设位置
      switch (position) {
        case 'top-left':
          x = margin;
          y = margin + textHeight;
          break;
        case 'top-right':
          x = canvasSize - margin - textWidth;
          y = margin + textHeight;
          break;
        case 'bottom-left':
          x = margin;
          y = canvasSize - margin;
          break;
        case 'bottom-right':
          x = canvasSize - margin - textWidth;
          y = canvasSize - margin;
          break;
        case 'center':
          x = (canvasSize - textWidth) / 2;
          y = canvasSize / 2 + textHeight / 2;
          break;
      }
    } else {
      // 默认位置
      x = canvasSize - margin - textWidth;
      y = margin + textHeight;
    }

    // 绘制文字（与预览效果一致）
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    console.log(
      `绘制文字: "${text}" 在位置 (${x}, ${y}), 颜色: ${color}, 字体: ${fontSize}px ${fontFamily}`,
    );

    ctx.restore();
  }

  /**
   * 应用锐化效果
   */
  private static applySharpen(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

    const tempData = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += tempData[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          const idx = (y * width + x) * 4 + c;
          data[idx] = Math.max(0, Math.min(255, sum));
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * 添加水印
   */
  private static addWatermark(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    watermark: NonNullable<ImageProcessOptions['watermark']>,
  ): void {
    const { text, position, fontSize = 16, color = '#ffffff', opacity = 0.3 } = watermark;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;

    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;

    let x = 10;
    let y = fontSize + 10;

    // 根据位置计算坐标
    switch (position) {
      case 'top-right':
        x = width - textWidth - 10;
        y = fontSize + 10;
        break;
      case 'bottom-left':
        x = 10;
        y = height - 10;
        break;
      case 'bottom-right':
        x = width - textWidth - 10;
        y = height - 10;
        break;
      case 'center':
        x = (width - textWidth) / 2;
        y = height / 2;
        break;
    }

    // 绘制文字阴影
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  /**
   * 批量处理图片
   * @param imageUrls 图片URL数组
   * @param options 处理选项
   * @returns Promise<Blob[]> 处理后的图片Blob数组
   */
  static async processImages(
    imageUrls: string[],
    options: ImageProcessOptions = {},
  ): Promise<Blob[]> {
    const promises = imageUrls.map((url) => this.processImage(url, options));
    return Promise.all(promises);
  }

  /**
   * 批量合成图片
   * @param products 产品信息数组
   * @param options 合成选项
   * @returns Promise<Blob[]> 合成后的图片Blob数组
   */
  static async composeImages(
    products: Array<{
      productImageUrl: string;
      price: number;
      name?: string;
    }>,
    options: Omit<ImageComposeOptions, 'productImage' | 'priceText'>,
  ): Promise<Blob[]> {
    const promises = products.map((product) => {
      const composeOptions: ImageComposeOptions = {
        ...options,
        productImage: {
          url: product.productImageUrl,
        },
        priceText: {
          text: `${product.price.toFixed(2)}`,
          position: 'top-right',
          fontSize: 24,
          color: '#ff4d4f',
          fontFamily: 'Arial',
        },
      };
      return this.composeImage(composeOptions);
    });
    return Promise.all(promises);
  }

  /**
   * 获取图片信息
   * @param imageUrl 图片URL
   * @returns Promise<{width: number, height: number, size: number}>
   */
  static async getImageInfo(imageUrl: string): Promise<{
    width: number;
    height: number;
    size: number;
    format: string;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = async () => {
        try {
          // 获取图片大小
          const response = await fetch(imageUrl);
          const blob = await response.blob();

          resolve({
            width: img.width,
            height: img.height,
            size: blob.size,
            format: blob.type || 'unknown',
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error(`获取图片信息失败: ${imageUrl}`));
      };

      img.src = imageUrl;
    });
  }

  /**
   * 创建缩略图
   * @param imageUrl 图片URL
   * @param maxWidth 最大宽度
   * @param maxHeight 最大高度
   * @param quality 质量
   * @returns Promise<Blob> 缩略图Blob
   */
  static async createThumbnail(
    imageUrl: string,
    maxWidth: number = 200,
    maxHeight: number = 200,
    quality: number = 0.8,
  ): Promise<Blob> {
    return this.processImage(imageUrl, {
      resize: {
        width: maxWidth,
        height: maxHeight,
        maintainAspectRatio: true,
      },
      quality,
      format: 'jpeg',
    });
  }
}
