import React, { useEffect, useState } from 'react';

interface PricePositionPreviewProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  x?: number;
  y?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
}

const PricePositionPreview: React.FC<PricePositionPreviewProps> = ({
  position,
  x,
  y,
  fontSize = 24,
  color = '#ff4d4f',
  fontFamily = 'Arial',
}) => {
  const [previewX, setPreviewX] = useState(0);
  const [previewY, setPreviewY] = useState(0);

  // 计算预览位置
  useEffect(() => {
    const containerSize = 200; // 预览容器尺寸（正方形）
    const actualCanvasSize = 800; // 实际画布尺寸
    const scale = containerSize / actualCanvasSize; // 缩放比例
    const margin = 20;
    const text = '99.99';

    // 创建临时canvas来计算文字尺寸
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = `${fontSize}px ${fontFamily}`;
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;

      // 如果提供了自定义坐标，使用自定义坐标（需要缩放）
      if (x !== undefined && y !== undefined) {
        setPreviewX(x * scale);
        setPreviewY(y * scale);
      } else if (position) {
        // 否则使用预设位置
        switch (position) {
          case 'top-left':
            setPreviewX(margin);
            setPreviewY(margin + textHeight);
            break;
          case 'top-right':
            setPreviewX(containerSize - margin - textWidth);
            setPreviewY(margin + textHeight);
            break;
          case 'bottom-left':
            setPreviewX(margin);
            setPreviewY(containerSize - margin);
            break;
          case 'bottom-right':
            setPreviewX(containerSize - margin - textWidth);
            setPreviewY(containerSize - margin);
            break;
          case 'center':
            setPreviewX((containerSize - textWidth) / 2);
            setPreviewY(containerSize / 2 + textHeight / 2);
            break;
        }
      } else {
        // 默认位置
        setPreviewX(containerSize - margin - textWidth);
        setPreviewY(margin + textHeight);
      }
    }
  }, [position, x, y, fontSize, fontFamily]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background:
          'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
      }}
    >
      {/* 模拟商品图片区域 */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          right: '10%',
          bottom: '10%',
          backgroundColor: '#e6f7ff',
          border: '2px dashed #1890ff',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1890ff',
          fontSize: '12px',
        }}
      >
        商品图片区域
      </div>

      {/* 价格文字预览 */}
      <div
        style={{
          position: 'absolute',
          left: `${(previewX / 200) * 100}%`,
          top: `${(previewY / 200) * 100}%`,
          transform: 'translate(-50%, -50%)',
          fontSize: `${fontSize * 0.25}px`, // 缩放文字大小：200/800 = 0.25
          fontFamily: fontFamily,
          color: color,
          whiteSpace: 'nowrap',
          zIndex: 10,
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)', // 添加文字阴影以便在预览中看清
        }}
      >
        99.99
      </div>

      {/* 坐标指示器 */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          fontSize: '10px',
          color: '#666',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '2px 6px',
          borderRadius: '2px',
        }}
      >
        X: {Math.round(x || previewX * 4)} Y: {Math.round(y || previewY * 4)} (800x800)
      </div>
    </div>
  );
};

export default PricePositionPreview;
