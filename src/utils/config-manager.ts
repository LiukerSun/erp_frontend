/**
 * 配置管理工具类
 * 用于保存和加载图片合成配置
 */

export interface ImageComposeConfig {
  canvasSize: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
  useFrame: boolean;
  frameSize?: number;
  frameImageUrl?: string;
  // 价格文字配置
  pricePosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  priceX?: number;
  priceY?: number;
  priceFontSize: number;
  priceColor: string;
  priceFontFamily: string;
  priceBackgroundColor: string;
  pricePadding: number;
  priceBorderRadius: number;
  // 元数据
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export class ConfigManager {
  private static readonly STORAGE_KEY = 'image_compose_configs';
  private static readonly DEFAULT_CONFIG_KEY = 'default_image_compose_config';

  /**
   * 保存配置
   */
  static saveConfig(config: ImageComposeConfig): void {
    try {
      const configs = this.getAllConfigs();
      configs[config.name] = config;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  }

  /**
   * 加载配置
   */
  static loadConfig(name: string): ImageComposeConfig | null {
    try {
      const configs = this.getAllConfigs();
      return configs[name] || null;
    } catch (error) {
      console.error('加载配置失败:', error);
      return null;
    }
  }

  /**
   * 获取所有配置
   */
  static getAllConfigs(): Record<string, ImageComposeConfig> {
    try {
      const configsStr = localStorage.getItem(this.STORAGE_KEY);
      return configsStr ? JSON.parse(configsStr) : {};
    } catch (error) {
      console.error('获取配置失败:', error);
      return {};
    }
  }

  /**
   * 删除配置
   */
  static deleteConfig(name: string): boolean {
    try {
      const configs = this.getAllConfigs();
      if (configs[name]) {
        delete configs[name];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configs));
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除配置失败:', error);
      return false;
    }
  }

  /**
   * 获取配置名称列表
   */
  static getConfigNames(): string[] {
    const configs = this.getAllConfigs();
    return Object.keys(configs);
  }

  /**
   * 设置默认配置
   */
  static setDefaultConfig(name: string): boolean {
    try {
      const configs = this.getAllConfigs();
      if (configs[name]) {
        localStorage.setItem(this.DEFAULT_CONFIG_KEY, name);
        return true;
      }
      return false;
    } catch (error) {
      console.error('设置默认配置失败:', error);
      return false;
    }
  }

  /**
   * 获取默认配置
   */
  static getDefaultConfig(): ImageComposeConfig | null {
    try {
      const defaultName = localStorage.getItem(this.DEFAULT_CONFIG_KEY);
      if (defaultName) {
        return this.loadConfig(defaultName);
      }
      return null;
    } catch (error) {
      console.error('获取默认配置失败:', error);
      return null;
    }
  }

  /**
   * 创建默认配置
   */
  static createDefaultConfig(): ImageComposeConfig {
    return {
      name: '默认配置',
      description: '系统默认的图片合成配置',
      canvasSize: 800,
      quality: 90,
      format: 'jpeg',
      useFrame: false,
      frameSize: 800,
      pricePosition: 'top-right',
      priceFontSize: 24,
      priceColor: '#ff4d4f',
      priceFontFamily: 'Arial',
      priceBackgroundColor: 'transparent',
      pricePadding: 0,
      priceBorderRadius: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 验证配置
   */
  static validateConfig(config: Partial<ImageComposeConfig>): boolean {
    return !!(
      config.name &&
      config.canvasSize &&
      config.canvasSize >= 100 &&
      config.canvasSize <= 2000 &&
      config.quality &&
      config.quality >= 1 &&
      config.quality <= 100 &&
      config.format &&
      ['jpeg', 'png', 'webp'].includes(config.format)
    );
  }

  /**
   * 导出配置
   */
  static exportConfig(name: string): string | null {
    try {
      const config = this.loadConfig(name);
      if (config) {
        return JSON.stringify(config, null, 2);
      }
      return null;
    } catch (error) {
      console.error('导出配置失败:', error);
      return null;
    }
  }

  /**
   * 导入配置
   */
  static importConfig(configJson: string): boolean {
    try {
      const config: ImageComposeConfig = JSON.parse(configJson);
      if (this.validateConfig(config)) {
        config.updatedAt = new Date().toISOString();
        this.saveConfig(config);
        return true;
      }
      return false;
    } catch (error) {
      console.error('导入配置失败:', error);
      return false;
    }
  }
}
