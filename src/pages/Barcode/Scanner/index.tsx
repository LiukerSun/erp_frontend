import { queryProduct } from '@/services/erp/product';
import { ImageProcessor } from '@/utils/oss-upload';
import { ClearOutlined, ScanOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Image,
  Input,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const { Text } = Typography;

const BarcodeScanner: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const [scannedSku, setScannedSku] = useState<string>('');
  const [currentProduct, setCurrentProduct] = useState<API.Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState<
    Array<{ sku: string; product: API.Product | null; timestamp: Date }>
  >([]);
  const [shouldMaintainFocus, setShouldMaintainFocus] = useState(true);
  const inputRef = useRef<any>(null);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [imagePreviewIndex, setImagePreviewIndex] = useState(0);

  // 搜索商品
  const searchProduct = async (sku: string) => {
    if (!sku.trim()) return;

    setLoading(true);
    try {
      // 使用SKU查询接口
      let product: API.Product | null = null;

      try {
        const response = await queryProduct(sku.trim());

        if (response.success && response.data) {
          product = response.data;
        }
      } catch (error) {
        console.log('SKU查询失败:', error);
      }

      if (product) {
        setCurrentProduct(product);
        messageApi.success(`找到商品: ${product.name}`);
      } else {
        setCurrentProduct(null);
        messageApi.warning(`未找到SKU为 "${sku}" 的商品`);
      }

      // 添加到扫描历史
      setScanHistory((prev) => [
        {
          sku,
          product: product || null,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ]); // 保留最近10条记录
    } catch (error) {
      console.error('搜索商品失败:', error);
      messageApi.error('搜索商品失败，请重试');
      setCurrentProduct(null);
    } finally {
      setLoading(false);
      // 搜索完成后重新聚焦到输入框
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // 处理扫描输入
  const handleScanInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScannedSku(e.target.value);
  };

  // 处理扫描完成（回车键）
  const handleScanComplete = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (scannedSku.trim()) {
        searchProduct(scannedSku.trim());
        setScannedSku(''); // 清空输入框
      }
    }
  };

  // 手动搜索
  const handleManualSearch = () => {
    if (scannedSku.trim()) {
      searchProduct(scannedSku.trim());
      setScannedSku(''); // 清空输入框
    }
  };

  // 清空当前显示
  const handleClear = () => {
    setScannedSku('');
    setCurrentProduct(null);
    // 清空后重新聚焦到输入框
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // 清空历史记录
  const handleClearHistory = () => {
    setScanHistory([]);
    messageApi.success('查询历史已清空');
    // 清空历史后重新聚焦到输入框
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // 点击历史记录
  const handleHistoryClick = (record: {
    sku: string;
    product: API.Product | null;
    timestamp: Date;
  }) => {
    if (record.product) {
      setCurrentProduct(record.product);
      messageApi.success(`显示商品: ${record.product.name}`);
    } else {
      setCurrentProduct(null);
      messageApi.warning(`未找到SKU为 "${record.sku}" 的商品`);
    }
    // 点击历史记录后重新聚焦到输入框
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // 打开图片预览
  const handleImagePreview = (images: API.ProductImage[], startIndex: number = 0) => {
    const urls = images.map((img) => img.url);
    setImagePreviewUrls(urls);
    setImagePreviewIndex(startIndex);
    setImagePreviewVisible(true);
  };

  // 关闭图片预览
  const handleImagePreviewClose = () => {
    setImagePreviewVisible(false);
  };

  // 页面加载时聚焦到输入框
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 监听页面焦点事件，确保输入框始终保持聚焦
  useEffect(() => {
    const handleFocus = () => {
      if (shouldMaintainFocus) {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
      }
    };

    // 定期检查焦点状态
    const focusInterval = setInterval(() => {
      if (shouldMaintainFocus && inputRef.current && document.activeElement !== inputRef.current) {
        // 如果当前焦点不在输入框上，且不是用户正在输入其他输入框，则重新聚焦
        const activeElement = document.activeElement as HTMLElement;
        if (
          !activeElement ||
          !activeElement.tagName ||
          (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA')
        ) {
          inputRef.current.focus();
        }
      }
    }, 1000);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('click', handleFocus);
    document.addEventListener('keydown', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('click', handleFocus);
      document.removeEventListener('keydown', handleFocus);
      clearInterval(focusInterval);
    };
  }, [shouldMaintainFocus]);

  // 添加键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter: 手动搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (scannedSku.trim()) {
          handleManualSearch();
        }
      }

      // Ctrl/Cmd + K: 清空当前显示
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleClear();
      }

      // Ctrl/Cmd + L: 清空历史记录
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        handleClearHistory();
      }

      // 确保输入框始终有焦点（除非用户正在输入）
      if (e.target !== inputRef.current && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // 如果按下的不是功能键，且当前焦点不在输入框上，则聚焦到输入框
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [scannedSku]);

  return (
    <PageContainer title="SKU查询" subTitle="使用扫码枪扫描商品条码或手动输入SKU，快速查询商品信息">
      <Row gutter={16}>
        {/* 左侧：扫码输入和商品信息 */}
        <Col xs={24} lg={14}>
          {/* 扫码输入区域 */}
          <Card title="SKU输入" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="使用说明"
                description={
                  <div>
                    <div>
                      将扫码枪对准商品条码进行扫描，或手动输入SKU后按回车键搜索。系统将直接通过SKU查询商品信息。
                    </div>
                    <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                      <strong>快捷键：</strong>
                      <br />• Enter: 搜索商品
                      <br />• Ctrl/Cmd + Enter: 手动搜索
                      <br />• Ctrl/Cmd + K: 清空当前显示
                      <br />• Ctrl/Cmd + L: 清空历史记录
                    </div>
                    <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                      <strong>自动聚焦：</strong>
                      <br />• 输入框会自动保持焦点，方便连续扫描
                      <br />• 点击🔒/🔓按钮可切换自动聚焦功能
                      <br />• 当需要操作其他元素时，可暂时禁用自动聚焦
                    </div>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Space.Compact style={{ width: '100%' }}>
                <Input
                  ref={inputRef}
                  placeholder="请扫描商品条码或输入SKU..."
                  value={scannedSku}
                  onChange={handleScanInput}
                  onKeyPress={handleScanComplete}
                  prefix={<ScanOutlined />}
                  size="large"
                  style={{ flex: 1 }}
                  disabled={loading}
                  autoFocus
                  onBlur={() => {
                    // 当输入框失去焦点时，延迟后重新聚焦
                    if (shouldMaintainFocus) {
                      setTimeout(() => {
                        if (inputRef.current && document.activeElement !== inputRef.current) {
                          inputRef.current.focus();
                        }
                      }, 50);
                    }
                  }}
                />
                <Button type="primary" onClick={handleManualSearch} size="large" loading={loading}>
                  搜索
                </Button>
                <Button
                  onClick={handleClear}
                  size="large"
                  icon={<ClearOutlined />}
                  disabled={loading}
                >
                  清空
                </Button>
                <Button
                  type={shouldMaintainFocus ? 'primary' : 'default'}
                  size="large"
                  onClick={() => setShouldMaintainFocus(!shouldMaintainFocus)}
                  title={shouldMaintainFocus ? '点击禁用自动聚焦' : '点击启用自动聚焦'}
                >
                  {shouldMaintainFocus ? '🔒' : '🔓'}
                </Button>
              </Space.Compact>

              {loading && (
                <Alert
                  message="正在查询..."
                  description="正在通过SKU查询商品信息，请稍候..."
                  type="info"
                  showIcon
                  style={{ marginTop: 8 }}
                />
              )}
            </Space>
          </Card>
          <Card
            title="查询历史"
            extra={
              scanHistory.length > 0 && (
                <Space>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      // 导出扫描历史
                      const csvContent = [
                        ['SKU', '商品名称', '查询结果', '查询时间'],
                        ...scanHistory.map((record) => [
                          record.sku,
                          record.product?.name || '',
                          record.product ? '成功' : '失败',
                          record.timestamp.toLocaleString(),
                        ]),
                      ]
                        .map((row) => row.join(','))
                        .join('\n');

                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = `查询历史_${new Date().toLocaleDateString()}.csv`;
                      link.click();
                      messageApi.success('查询历史已导出');
                    }}
                  >
                    导出
                  </Button>
                  <Button type="link" onClick={handleClearHistory} icon={<ClearOutlined />}>
                    清空历史
                  </Button>
                </Space>
              )
            }
            style={{ height: 'fit-content' }}
          >
            {scanHistory.length > 0 ? (
              <>
                {/* 查询统计 */}
                <div
                  style={{
                    marginBottom: 16,
                    padding: '8px 12px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 6,
                  }}
                >
                  <Space
                    split={<div style={{ width: 1, height: 16, backgroundColor: '#d9d9d9' }} />}
                  >
                    <Text type="secondary">
                      总查询: <Text strong>{scanHistory.length}</Text>
                    </Text>
                    <Text type="secondary">
                      成功率:{' '}
                      <Text strong type="success">
                        {Math.round(
                          (scanHistory.filter((record) => record.product).length /
                            scanHistory.length) *
                            100,
                        )}
                        %
                      </Text>
                    </Text>
                    <Text type="secondary">
                      成功:{' '}
                      <Text strong type="success">
                        {scanHistory.filter((record) => record.product).length}
                      </Text>
                    </Text>
                    <Text type="secondary">
                      失败:{' '}
                      <Text strong type="danger">
                        {scanHistory.filter((record) => !record.product).length}
                      </Text>
                    </Text>
                  </Space>
                </div>

                <div style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
                  {scanHistory.map((record, index) => (
                    <Card
                      key={index}
                      size="small"
                      style={{
                        marginBottom: 8,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        borderLeft: record.product ? '3px solid #52c41a' : '3px solid #ff4d4f',
                      }}
                      hoverable
                      onClick={() => handleHistoryClick(record)}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            width: '100%',
                          }}
                        >
                          <Text strong>SKU: {record.sku}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {record.timestamp.toLocaleString()}
                          </Text>
                        </div>
                        {record.product ? (
                          <Text type="success">✓ 找到商品: {record.product.name}</Text>
                        ) : (
                          <Text type="danger">✗ 未找到商品</Text>
                        )}
                        <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                          点击查看详情
                        </Text>
                      </Space>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <Empty description="暂无查询记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        {/* 右侧：商品信息 */}
        <Col xs={24} lg={10}>
          {/* 当前商品信息 */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>正在搜索商品...</div>
            </div>
          ) : currentProduct ? (
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="商品名称" span={1}>
                <Text strong style={{ fontSize: '16px' }}>
                  {currentProduct.name}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="SKU">
                <Text code style={{ fontSize: '14px' }}>
                  {currentProduct.sku}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="商品编码">
                {currentProduct.product_code ? (
                  <Text
                    code
                    copyable={{
                      text: currentProduct.product_code,
                      tooltips: ['点击复制', '复制成功'],
                    }}
                    style={{ fontSize: '14px' }}
                  >
                    {currentProduct.product_code}
                  </Text>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="售价">
                <Text strong style={{ fontSize: '16px', color: '#ff4d4f' }}>
                  ¥{currentProduct.price}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="成本价">
                <Text style={{ fontSize: '14px' }}>¥{currentProduct.cost_price}</Text>
              </Descriptions.Item>
              {/* 是否折扣价 如果是则显示折扣价，否则展示 "否" */}
              {currentProduct.discount_price ? (
                <Descriptions.Item label="折扣价">
                  <Text type="danger" strong style={{ fontSize: '16px' }}>
                    ¥{currentProduct.discount_price}
                  </Text>
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
                    (节省 ¥{(currentProduct.price - currentProduct.discount_price).toFixed(2)})
                  </Text>
                </Descriptions.Item>
              ) : (
                <Descriptions.Item label="是否折扣价">否</Descriptions.Item>
              )}
              <Descriptions.Item label="货源">
                {currentProduct.source ? (
                  <Space direction="vertical" size="small">
                    <Tag color="blue">{currentProduct.source.name}</Tag>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      编码: {currentProduct.source.code}
                    </Text>
                  </Space>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="颜色">
                {currentProduct.colors && currentProduct.colors.length > 0 ? (
                  <Space wrap>
                    {currentProduct.colors.map((color) => {
                      // 判断是否为浅色背景，需要深色文字
                      const isLightColor = (hexColor: string) => {
                        if (!hexColor) return false;
                        // 移除#号并转换为RGB
                        const hex = hexColor.replace('#', '');
                        const r = parseInt(hex.substring(0, 2), 16);
                        const g = parseInt(hex.substring(2, 4), 16);
                        const b = parseInt(hex.substring(4, 6), 16);
                        // 计算亮度 (0-255)
                        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                        return brightness > 128; // 亮度大于128认为是浅色
                      };

                      const hexColor = color.hex_color;
                      const isLight = hexColor ? isLightColor(hexColor) : false;

                      return (
                        <Tag
                          key={color.id}
                          color={hexColor || 'default'}
                          style={{
                            backgroundColor: hexColor || undefined,
                            color: hexColor ? (isLight ? '#000' : '#fff') : undefined,
                            border: hexColor ? `1px solid ${hexColor}` : undefined,
                            padding: '4px 8px',
                            fontSize: '12px',
                          }}
                        >
                          {color.name}
                        </Tag>
                      );
                    })}
                  </Space>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              {/* 发货时间 */}
              <Descriptions.Item label="发货时间">
                <Tag color="blue">{currentProduct.shipping_time || '未设置'}</Tag>
              </Descriptions.Item>
              {/* 商品状态 */}
              <Descriptions.Item label="商品状态">
                <Space>
                  <Tag color={currentProduct.is_discounted ? 'red' : 'green'}>
                    {currentProduct.is_discounted ? '优惠中' : '正常'}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    创建时间: {new Date(currentProduct.createdAt).toLocaleDateString()}
                  </Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="商品图片">
                {currentProduct.images && currentProduct.images.length > 0 ? (
                  <Space>
                    {(currentProduct.images.slice(0, 3) || []).map((image, index) => {
                      const thumbnailUrl = ImageProcessor.generateThumbnailUrl(
                        image.url,
                        180,
                        180,
                        80,
                        'jpg',
                      );
                      return (
                        <Image
                          key={image.url}
                          src={thumbnailUrl}
                          alt={image.title || '商品图片'}
                          width={180}
                          height={180}
                          style={{ objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                          preview={false}
                          onClick={() => handleImagePreview(currentProduct.images!, index)}
                        />
                      );
                    })}
                    {currentProduct.images.length > 3 && (
                      <div
                        style={{
                          width: 180,
                          height: 180,
                          background: '#f5f5f5',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleImagePreview(currentProduct.images!, 3)}
                      >
                        +{currentProduct.images.length - 3}
                      </div>
                    )}
                  </Space>
                ) : (
                  <div
                    style={{
                      width: 180,
                      height: 180,
                      background: '#f5f5f5',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                      fontSize: '16px',
                    }}
                  >
                    无图片
                  </div>
                )}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Empty description="暂无商品信息" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Col>
      </Row>
      <Modal
        open={imagePreviewVisible}
        onCancel={handleImagePreviewClose}
        footer={null}
        width={800}
        title={`产品图片预览 (${imagePreviewIndex + 1}/${imagePreviewUrls.length})`}
        forceRender={true}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '500px',
            position: 'relative',
          }}
        >
          {imagePreviewUrls.length > 1 && (
            <>
              <Button
                type="text"
                icon={<span style={{ fontSize: '24px' }}>‹</span>}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  border: 'none',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() =>
                  setImagePreviewIndex(
                    (imagePreviewIndex - 1 + imagePreviewUrls.length) % imagePreviewUrls.length,
                  )
                }
                disabled={imagePreviewUrls.length <= 1}
              />
              <Button
                type="text"
                icon={<span style={{ fontSize: '24px' }}>›</span>}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 10,
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  border: 'none',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() =>
                  setImagePreviewIndex((imagePreviewIndex + 1) % imagePreviewUrls.length)
                }
                disabled={imagePreviewUrls.length <= 1}
              />
            </>
          )}
          <img
            src={imagePreviewUrls[imagePreviewIndex]}
            alt="产品图片"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
        {imagePreviewUrls.length > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              padding: '16px',
              borderTop: '1px solid #f0f0f0',
            }}
          >
            {imagePreviewUrls.map((url, index) => (
              <div
                key={url}
                style={{
                  width: 180,
                  height: 180,
                  border: index === imagePreviewIndex ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  borderRadius: 4,
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
                onClick={() => setImagePreviewIndex(index)}
              >
                <img
                  src={ImageProcessor.generateThumbnailUrl(url, 180, 180, 80, 'jpg')}
                  alt={`缩略图${index + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default BarcodeScanner;
