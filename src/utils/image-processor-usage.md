# 图片处理工具使用说明

## 概述

图片处理工具使用 Canvas API 实现，支持在浏览器端对图片进行各种处理，包括尺寸调整、滤镜效果、水印添加等。

## 主要功能

### 1. 尺寸调整

- 支持指定宽度和高度
- 支持保持宽高比
- 支持只调整宽度或高度

### 2. 图片质量调整

- 支持 JPEG、PNG、WebP 格式
- 可调节压缩质量（0-1）

### 3. 滤镜效果

- 亮度调整（-100 到 100）
- 对比度调整（-100 到 100）
- 饱和度调整（-100 到 100）
- 模糊效果（0 到 10）
- 锐化处理

### 4. 水印功能

- 支持文字水印
- 5 个位置选项：左上角、右上角、左下角、右下角、居中
- 可调节字体大小、颜色、透明度

## 使用示例

### 基础使用

```typescript
import { ImageProcessor, ImageProcessOptions } from '@/utils/image-processor';

// 创建缩略图
const thumbnail = await ImageProcessor.createThumbnail(
  'https://example.com/image.jpg',
  200, // 最大宽度
  200, // 最大高度
  0.8, // 质量
);

// 处理图片
const options: ImageProcessOptions = {
  resize: {
    width: 800,
    height: 600,
    maintainAspectRatio: true,
  },
  quality: 0.9,
  format: 'jpeg',
  brightness: 10,
  contrast: 5,
  sharpen: true,
  watermark: {
    text: '产品图片',
    position: 'bottom-right',
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.3,
  },
};

const processedImage = await ImageProcessor.processImage('https://example.com/image.jpg', options);
```

### 在图片导出中使用

```typescript
import { ImageExporter } from '@/utils/image-export';

// 配置图片处理选项
const processOptions: ImageProcessOptions = {
  resize: { width: 1200, maintainAspectRatio: true },
  quality: 0.85,
  format: 'jpeg',
  watermark: {
    text: 'ERP系统导出',
    position: 'bottom-right',
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.2,
  },
};

// 导出产品图片
await ImageExporter.exportProductImages(products, {
  fileName: '产品图片_2024-01-01',
  processOptions,
});
```

## 注意事项

1. **跨域问题**：图片需要支持跨域访问，或者来自同域
2. **性能考虑**：处理大量图片时建议分批处理
3. **浏览器兼容性**：需要支持 Canvas API 的现代浏览器
4. **内存使用**：大图片处理会占用较多内存

## 错误处理

```typescript
try {
  const processedImage = await ImageProcessor.processImage(imageUrl, options);
  // 处理成功
} catch (error) {
  console.error('图片处理失败:', error);
  // 可以尝试直接下载原始图片
  const originalImage = await ImageProcessor.downloadImageAsBlob(imageUrl);
}
```

## 性能优化建议

1. **合理设置尺寸**：避免处理过大的图片
2. **批量处理**：使用`processImages`方法批量处理
3. **缓存结果**：对于重复处理的图片可以缓存结果
4. **异步处理**：避免阻塞主线程
