import { getProductList } from '@/services/erp/product';
import {
  ArrowLeftOutlined,
  ClearOutlined,
  DownloadOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useLocation } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import JsBarcode from 'jsbarcode';
import React, { useEffect, useRef, useState } from 'react';

const { Text } = Typography;

interface BarcodeItem {
  sku: string;
  productName?: string;
  barcode?: string;
}

const BarcodeGenerator: React.FC = () => {
  const [form] = Form.useForm();
  const [products, setProducts] = useState<API.Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [barcodeItems, setBarcodeItems] = useState<BarcodeItem[]>([]);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const location = useLocation();
  const [fromProductList, setFromProductList] = useState(false);
  const { message } = App.useApp();

  // 获取商品列表
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProductList({
        page: 1,
        page_size: 1000,
      });
      if (response.success && response.data?.items) {
        setProducts(response.data.items);
      }
    } catch (error) {
      message.error('获取商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理从商品列表页面传递的数据
  const handleSelectedProducts = () => {
    try {
      const selectedProductsData = localStorage.getItem('selectedProductsForBarcode');
      if (selectedProductsData) {
        const selectedProducts = JSON.parse(selectedProductsData);

        // 自动生成选中商品的条形码
        const newBarcodeItems: BarcodeItem[] = selectedProducts.map((product: any) => ({
          sku: product.product_code || `${product.source?.code || ''}-${product.sku || ''}`,
          productName: product.name,
        }));

        setBarcodeItems(newBarcodeItems);
        setFromProductList(true);

        // 清除localStorage中的数据
        localStorage.removeItem('selectedProductsForBarcode');

        message.success(`已自动生成 ${newBarcodeItems.length} 个商品的条形码`);
      }
    } catch (error) {
      console.error('处理选中商品数据失败:', error);
    }
  };

  // 返回商品列表
  const handleBackToProductList = () => {
    history.push('/product-management/products');
  };

  // 跳转到扫码查询页面
  const handleGoToScanner = () => {
    history.push('/product-management/scanner');
  };

  useEffect(() => {
    fetchProducts();

    // 检查是否从商品列表跳转而来
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('from') === 'product-list') {
      handleSelectedProducts();
    }
  }, [location]);

  // 生成条形码
  const generateBarcode = (sku: string, canvasElement: HTMLCanvasElement) => {
    try {
      JsBarcode(canvasElement, sku, {
        format: 'CODE128',
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 14,
        margin: 10,
        background: '#ffffff',
        lineColor: '#000000',
      });
      return true;
    } catch (error) {
      console.error('生成条形码失败:', error);
      return false;
    }
  };

  // 添加条形码
  const handleAddBarcode = (values: any) => {
    const { inputType, manualSku, selectedProduct } = values;

    let sku: string;
    let productName: string | undefined;

    if (inputType === 'manual') {
      if (!manualSku || manualSku.trim() === '') {
        message.error('请输入SKU');
        return;
      }
      sku = manualSku.trim();
    } else {
      if (!selectedProduct) {
        message.error('请选择商品');
        return;
      }
      const product = products.find((p) => p.id === selectedProduct);
      if (!product) {
        message.error('未找到选中的商品');
        return;
      }
      sku = product.product_code || `${product.source?.code || ''}-${product.sku || ''}`;
      productName = product.name;
    }

    // 检查是否已存在
    if (barcodeItems.some((item) => item.sku === sku)) {
      message.warning('该SKU的条形码已存在');
      return;
    }

    const newItem: BarcodeItem = {
      sku,
      productName,
    };

    setBarcodeItems((prev) => [...prev, newItem]);
    form.resetFields(['manualSku', 'selectedProduct']);
    message.success('条形码添加成功');
  };

  // 更新条形码渲染
  useEffect(() => {
    barcodeItems.forEach((item, index) => {
      const canvas = canvasRefs.current[index];
      if (canvas) {
        generateBarcode(item.sku, canvas);
      }
    });
  }, [barcodeItems]);

  // 删除条形码
  const handleRemoveBarcode = (index: number) => {
    setBarcodeItems((prev) => prev.filter((_, i) => i !== index));
    canvasRefs.current = canvasRefs.current.filter((_, i) => i !== index);
  };

  // 清空所有条形码
  const handleClearAll = () => {
    setBarcodeItems([]);
    canvasRefs.current = [];
  };

  // 打印条形码
  const handlePrint = () => {
    if (barcodeItems.length === 0) {
      message.warning('没有可打印的条形码');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      message.error('无法打开打印窗口');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>条形码打印</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            padding: 0;
          }
          .barcode-item {
            margin-bottom: 30px;
            page-break-inside: avoid;
            text-align: center;
          }
          .product-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .sku-text {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }
          canvas {
            display: block;
            margin: 0 auto;
          }
          @media print {
            .barcode-item {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        ${barcodeItems
          .map((item, index) => {
            const canvas = canvasRefs.current[index];
            const dataUrl = canvas ? canvas.toDataURL() : '';
            return `
            <div class="barcode-item">
              ${item.productName ? `<div class="product-name">${item.productName}</div>` : ''}
              <img src="${dataUrl}" alt="条形码" />
              <div class="sku-text">SKU: ${item.sku}</div>
            </div>
          `;
          })
          .join('')}
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  // 下载条形码
  const handleDownload = (item: BarcodeItem, index: number) => {
    const canvas = canvasRefs.current[index];
    if (!canvas) {
      message.error('条形码生成失败');
      return;
    }

    const link = document.createElement('a');
    link.download = `barcode_${item.sku}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <PageContainer
      title="条形码生成器"
      subTitle="生成商品条形码，支持打印和下载"
      extra={[
        <Button key="scanner" type="primary" onClick={handleGoToScanner}>
          扫码查询
        </Button>,
      ]}
    >
      <Row gutter={[24, 24]}>
        {/* 提示信息 */}
        {fromProductList && (
          <Col span={24}>
            <Alert
              message="从商品列表跳转"
              description={
                <Space>
                  <span>已自动为选中的 {barcodeItems.length} 个商品生成条形码</span>
                  <Button
                    type="link"
                    size="small"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBackToProductList}
                  >
                    返回商品列表
                  </Button>
                </Space>
              }
              type="success"
              showIcon
              closable
              onClose={() => setFromProductList(false)}
            />
          </Col>
        )}

        {/* 输入区域 */}
        <Col span={24}>
          <Card title="条形码生成器" size="small">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleAddBarcode}
              initialValues={{ inputType: 'manual' }}
            >
              <Form.Item name="inputType" label="输入方式">
                <Select>
                  <Select.Option value="manual">手动输入SKU</Select.Option>
                  <Select.Option value="select">选择商品</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item dependencies={['inputType']}>
                {({ getFieldValue }) => {
                  const inputType = getFieldValue('inputType');

                  if (inputType === 'manual') {
                    return (
                      <Form.Item
                        name="manualSku"
                        label="唯一SKU"
                        rules={[{ required: true, message: '请输入SKU' }]}
                      >
                        <Input
                          placeholder="请输入商品的唯一SKU"
                          size="large"
                          onPressEnter={() => form.submit()}
                        />
                      </Form.Item>
                    );
                  } else {
                    return (
                      <Form.Item
                        name="selectedProduct"
                        label="选择商品"
                        rules={[{ required: true, message: '请选择商品' }]}
                      >
                        <Select
                          showSearch
                          placeholder="请选择商品"
                          size="large"
                          loading={loading}
                          optionFilterProp="children"
                          filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          options={products.map((product) => ({
                            value: product.id,
                            label: `${product.name} (${
                              product.product_code ||
                              `${product.source?.code || ''}-${product.sku || ''}`
                            })`,
                          }))}
                        />
                      </Form.Item>
                    );
                  }
                }}
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" size="large">
                    生成条形码
                  </Button>
                  {barcodeItems.length > 0 && (
                    <>
                      <Button icon={<PrinterOutlined />} onClick={handlePrint} size="large">
                        打印全部
                      </Button>
                      <Button icon={<ClearOutlined />} onClick={handleClearAll} danger size="large">
                        清空全部
                      </Button>
                    </>
                  )}
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 条形码显示区域 */}
        <Col span={24}>
          <Card title={`已生成条形码 (${barcodeItems.length})`} size="small">
            {barcodeItems.length === 0 ? (
              <Empty description="暂无生成的条形码" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Row gutter={[16, 16]}>
                {barcodeItems.map((item, index) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={`${item.sku}-${index}`}>
                    <Card
                      size="small"
                      title={
                        <div style={{ textAlign: 'center' }}>
                          {item.productName && (
                            <div
                              style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}
                            >
                              {item.productName}
                            </div>
                          )}
                          <Text code style={{ fontSize: '11px' }}>
                            {item.sku}
                          </Text>
                        </div>
                      }
                      extra={
                        <Space size="small">
                          <Button
                            type="link"
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownload(item, index)}
                            title="下载"
                          />
                          <Button
                            type="link"
                            size="small"
                            danger
                            onClick={() => handleRemoveBarcode(index)}
                            title="删除"
                          >
                            ×
                          </Button>
                        </Space>
                      }
                    >
                      <div style={{ textAlign: 'center' }}>
                        <canvas
                          ref={(el) => (canvasRefs.current[index] = el)}
                          style={{ maxWidth: '100%' }}
                        />
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default BarcodeGenerator;
