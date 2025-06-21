import { getStsToken } from '@/services/erp/product';
import OSS from 'ali-oss';
import { message } from 'antd';

// 阿里云OSS上传工具类
export class OSSUploader {
  private client: OSS | null = null;
  private tokenExpiration: number = 0;

  // 生成文件名
  private generateFileName(file: File): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    return `product_images/${timestamp}_${random}.${extension}`;
  }

  // 验证文件
  private validateFile(file: File): void {
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('只支持JPG、PNG、GIF、WebP格式的图片');
    }
  }

  // 获取STS Token并初始化OSS客户端
  private async initializeOSSClient(): Promise<OSS> {
    // 检查当前token是否还有效（提前5分钟刷新）
    const now = Date.now();
    if (this.client && now < this.tokenExpiration - 5 * 60 * 1000) {
      return this.client;
    }

    try {
      // 获取STS Token
      const response = await getStsToken();

      if (!response.success) {
        throw new Error(response.message || '获取上传凭证失败');
      }

      const token = response.data;

      // 创建OSS客户端，添加自动刷新token功能
      this.client = new OSS({
        accessKeyId: token.accessKeyId,
        accessKeySecret: token.accessKeySecret,
        stsToken: token.securityToken,
        region: token.region,
        bucket: token.bucket,
        endpoint: token.endpoint,
        secure: true, // 使用HTTPS
        // 添加自动刷新token功能
        refreshSTSToken: async () => {
          const refreshResponse = await getStsToken();
          if (refreshResponse.success) {
            const newToken = refreshResponse.data;
            this.tokenExpiration = new Date(newToken.expiration).getTime();
            return {
              accessKeyId: newToken.accessKeyId,
              accessKeySecret: newToken.accessKeySecret,
              stsToken: newToken.securityToken,
            };
          } else {
            throw new Error('刷新STS Token失败');
          }
        },
        refreshSTSTokenInterval: 300000, // 5分钟检查一次
      });

      // 设置token过期时间
      this.tokenExpiration = new Date(token.expiration).getTime();

      return this.client;
    } catch (error) {
      console.error('初始化OSS客户端失败:', error);
      throw new Error('获取上传凭证失败，请重试');
    }
  }

  // 上传文件到OSS
  async uploadFile(file: File): Promise<string> {
    try {
      // 验证文件
      this.validateFile(file);

      // 生成文件名
      const filename = this.generateFileName(file);

      // 初始化OSS客户端
      const client = await this.initializeOSSClient();

      // 上传文件到OSS
      const result = await client.put(filename, file);

      // 返回文件访问URL
      return result.url;
    } catch (error) {
      console.error('OSS上传失败:', error);
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('图片上传失败，请重试');
      }
      throw error;
    }
  }

  // 批量上传文件
  async uploadFiles(files: File[]): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }

  // 删除文件
  async deleteFile(filename: string): Promise<void> {
    try {
      const client = await this.initializeOSSClient();
      await client.delete(filename);
    } catch (error) {
      console.error('删除文件失败:', error);
      throw error;
    }
  }
}

// 创建全局上传器实例
export const ossUploader = new OSSUploader();

// 图片处理工具函数
export class ImageProcessor {
  /**
   * 生成阿里云OSS缩略图URL
   * @param originalUrl 原始图片URL
   * @param width 缩略图宽度
   * @param height 缩略图高度
   * @param quality 图片质量 (1-100)
   * @param format 输出格式 (jpg, png, webp等)
   * @returns 缩略图URL
   */
  static generateThumbnailUrl(
    originalUrl: string,
    width: number = 100,
    height: number = 100,
    quality: number = 80,
    format: string = 'jpg',
  ): string {
    // 检查是否是阿里云OSS的URL
    if (!originalUrl || !originalUrl.includes('aliyuncs.com')) {
      return originalUrl;
    }

    // 阿里云OSS图片处理参数
    const params = [
      `x-oss-process=image/resize,m_fill,h_${height},w_${width}`,
      `quality,q_${quality}`,
      `format,${format}`,
    ].join('/');

    // 添加处理参数到URL
    const separator = originalUrl.includes('?') ? '&' : '?';
    return `${originalUrl}${separator}${params}`;
  }

  /**
   * 生成多种尺寸的缩略图URL
   * @param originalUrl 原始图片URL
   * @param sizes 尺寸配置数组
   * @returns 缩略图URL数组
   */
  static generateMultipleThumbnails(
    originalUrl: string,
    sizes: Array<{ width: number; height: number; quality?: number; format?: string }>,
  ): string[] {
    return sizes.map((size) =>
      this.generateThumbnailUrl(
        originalUrl,
        size.width,
        size.height,
        size.quality || 80,
        size.format || 'jpg',
      ),
    );
  }

  /**
   * 检查URL是否是阿里云OSS的URL
   * @param url 图片URL
   * @returns 是否是OSS URL
   */
  static isOSSUrl(url: string): boolean {
    return Boolean(url && url.includes('aliyuncs.com'));
  }
}
