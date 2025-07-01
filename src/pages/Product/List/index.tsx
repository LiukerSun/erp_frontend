import { deleteProduct, getAllColors, getProductList } from '@/services/erp/product';
import { getActiveSourceList } from '@/services/erp/source';
import { exportProductListToExcel, generateExportMenuItems } from '@/utils/excel-export';
import { ImageExporter, ProductImageExportItem } from '@/utils/image-export';
import { ImageProcessor } from '@/utils/oss-upload';
import {
  BarcodeOutlined,
  DownloadOutlined,
  DownOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, Dropdown, Image, message, Modal, Popconfirm, Space, Tag } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import ProductForm from './components/ProductForm';

const ProductList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [productFormVisible, setProductFormVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<API.Product | undefined>(undefined);
  const [formTitle, setFormTitle] = useState('');
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [imagePreviewIndex, setImagePreviewIndex] = useState(0);
  // 保存当前的筛选参数，用于导出
  const [currentSearchParams, setCurrentSearchParams] = useState<API.GetProductListParams>({});
  // 选中的产品
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<API.Product[]>([]);
  // 筛选数据
  const [sources, setSources] = useState<API.Source[]>([]);
  const [colors, setColors] = useState<API.Color[]>([]);

  // 获取筛选数据
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        // 获取货源列表
        const sourceResponse = await getActiveSourceList();
        if (sourceResponse.success) {
          setSources(sourceResponse.data || []);
        }

        // 获取颜色列表
        const colorResponse = await getAllColors();
        if (colorResponse.success) {
          setColors(colorResponse.data || []);
        }
      } catch (error) {
        console.error('获取筛选数据失败:', error);
      }
    };

    fetchFilterData();
  }, []);

  // 关闭图片预览
  const handleImagePreviewClose = () => {
    setImagePreviewVisible(false);
    setImagePreviewUrls([]);
    setImagePreviewIndex(0);
  };

  // 键盘导航支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!imagePreviewVisible || imagePreviewUrls.length <= 1) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          setImagePreviewIndex(
            (imagePreviewIndex - 1 + imagePreviewUrls.length) % imagePreviewUrls.length,
          );
          break;
        case 'ArrowRight':
          event.preventDefault();
          setImagePreviewIndex((imagePreviewIndex + 1) % imagePreviewUrls.length);
          break;
        case 'Escape':
          event.preventDefault();
          handleImagePreviewClose();
          break;
      }
    };

    if (imagePreviewVisible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [imagePreviewVisible, imagePreviewUrls.length, imagePreviewIndex]);

  // 打开新增产品表单
  const handleAdd = () => {
    setCurrentProduct(undefined);
    setFormTitle('新增产品');
    setProductFormVisible(true);
  };

  // 打开编辑产品表单
  const handleEdit = (record: API.Product) => {
    setCurrentProduct(record);
    setFormTitle('编辑产品');
    setProductFormVisible(true);
  };

  // 删除产品
  const handleDelete = async (record: API.Product) => {
    try {
      const response = await deleteProduct(record.id);
      if (response.success) {
        message.success('删除成功');
        actionRef.current?.reload();
      } else {
        message.error(response.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败，请重试');
    }
  };

  // 生成条形码
  const handleGenerateBarcode = () => {
    if (selectedRows.length === 0) {
      message.warning('请先选择要生成条形码的产品');
      return;
    }

    // 将选中的产品数据存储到localStorage
    localStorage.setItem('selectedProductsForBarcode', JSON.stringify(selectedRows));

    // 跳转到条形码生成器页面
    history.push('/product-management/barcode?from=product-list');
  };

  // 导出产品图片
  const handleExportImages = async () => {
    if (selectedRows.length === 0) {
      message.warning('请先选择要导出图片的产品');
      return;
    }

    // 过滤出有图片的产品
    const productsWithImages = selectedRows.filter(
      (product) => product.images && product.images.length > 0,
    );

    if (productsWithImages.length === 0) {
      message.warning('选中的产品没有图片');
      return;
    }

    // 转换为导出格式
    const exportData: ProductImageExportItem[] = productsWithImages.map((product) => ({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      images: (product.images || []).map((img) => ({
        url: img.url,
        isMain: img.is_main || false,
        sort: img.sort || 0,
        alt: img.alt,
        title: img.title,
      })),
    }));

    // 显示预览信息
    const preview = ImageExporter.getExportPreview(exportData);

    // 确认导出
    Modal.confirm({
      title: '确认导出图片',
      content: (
        <div>
          <p>将导出以下内容：</p>
          <ul>
            <li>产品数量：{preview.totalProducts}</li>
            <li>有图片的产品：{preview.productsWithImages}</li>
            <li>图片总数：{preview.totalImages}</li>
          </ul>
          <p>确定要开始导出吗？</p>
        </div>
      ),
      onOk: async () => {
        try {
          await ImageExporter.exportProductImages(exportData, {
            fileName: `产品图片_${new Date().toISOString().slice(0, 10)}`,
          });
        } catch (error) {
          console.error('导出图片失败:', error);
        }
      },
      okText: '开始导出',
      cancelText: '取消',
    });
  };

  // 表单提交成功回调
  const handleFormSuccess = () => {
    setProductFormVisible(false);
    actionRef.current?.reload();
  };

  // 打开图片预览
  const handleImagePreview = (images: API.ProductImage[], startIndex: number = 0) => {
    const urls = images.map((img) => img.url);
    setImagePreviewUrls(urls);
    setImagePreviewIndex(startIndex);
    setImagePreviewVisible(true);
  };

  // 导出Excel功能
  const handleExportExcel = async (
    exportType: 'normal' | 'expandByColor' = 'normal',
    exportScope: 'filtered' | 'all' = 'filtered',
  ) => {
    try {
      await exportProductListToExcel({
        exportType,
        exportScope,
        searchParams: exportScope === 'filtered' ? currentSearchParams : {},
        onSuccess: (fileName) => {
          message.success(`导出成功！文件名：${fileName}`);
        },
        onError: (errorMsg) => {
          message.error(errorMsg);
        },
      });
    } catch (error) {
      console.error('导出Excel失败:', error);
      message.error('导出Excel失败，请重试');
    }
  };

  // 导出菜单项
  const exportMenuItems = generateExportMenuItems(currentSearchParams, handleExportExcel);

  const columns: ProColumns<API.Product>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
      fixed: 'left',
    },
    {
      title: '商品图片',
      dataIndex: 'images',
      width: 200,
      search: false,
      fixed: 'left',
      render: (_, record) => {
        const images = record.images || [];

        if (images.length === 0) {
          return (
            <div
              style={{
                width: 60,
                height: 60,
                background: '#f5f5f5',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: '12px',
              }}
            >
              无图片
            </div>
          );
        }

        // 如果只有一张图片，显示单张缩略图
        if (images.length === 1) {
          const image = images[0];
          const thumbnailUrl = ImageProcessor.generateThumbnailUrl(image.url, 60, 60, 80, 'jpg');

          return (
            <div style={{ cursor: 'pointer' }} onClick={() => handleImagePreview(images, 0)}>
              <Image
                src={thumbnailUrl}
                alt={image.title || '商品图片'}
                width={60}
                height={60}
                style={{ objectFit: 'cover', borderRadius: 4 }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                preview={false}
              />
            </div>
          );
        }

        // 如果有多张图片，显示前3张缩略图
        const displayImages = images.slice(0, 3);
        const remainingCount = images.length - 3;

        return (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {displayImages.map((image, index) => {
              const thumbnailUrl = ImageProcessor.generateThumbnailUrl(
                image.url,
                50,
                50,
                80,
                'jpg',
              );

              return (
                <div
                  key={image.url}
                  style={{ position: 'relative', cursor: 'pointer' }}
                  onClick={() => handleImagePreview(images, index)}
                >
                  <Image
                    src={thumbnailUrl}
                    alt={image.title || `商品图片${index + 1}`}
                    width={50}
                    height={50}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                    preview={false}
                  />
                  {index === 2 && remainingCount > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 4,
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      +{remainingCount}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      width: 200,
      ellipsis: true,
      copyable: true,
      fixed: 'left',
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      width: 150,
      copyable: true,
    },
    {
      title: '商品编码',
      dataIndex: 'product_code',
      width: 150,
      copyable: true,
      search: false,
      fixed: 'left',
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 100,
      search: false,
      render: (_, record) => {
        const price = record.price;
        const discountPrice = record.discount_price;

        if (record.is_discounted && discountPrice) {
          return (
            <Space direction="vertical" size={0}>
              <span style={{ textDecoration: 'line-through', color: '#999' }}>
                ¥{price.toFixed(2)}
              </span>
              <span style={{ color: '#f50', fontWeight: 'bold' }}>¥{discountPrice.toFixed(2)}</span>
            </Space>
          );
        }
        return <span>¥{price.toFixed(2)}</span>;
      },
    },
    {
      title: '成本价',
      dataIndex: 'cost_price',
      width: 100,
      search: false,
      render: (_, record) => `¥${record.cost_price.toFixed(2)}`,
    },
    {
      title: '颜色',
      dataIndex: 'colors',
      width: 120,
      valueType: 'select',
      fieldProps: {
        mode: 'multiple',
        placeholder: '请选择颜色',
        options: colors.map((color) => ({
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  backgroundColor: color.hex_color || '#cccccc',
                  border: '1px solid #d9d9d9',
                  flexShrink: 0,
                }}
              />
              <span>{color.name}</span>
            </div>
          ),
          value: color.name,
        })),
      },
      render: (_, record) => (
        <Space wrap>
          {record.colors?.map((color) => {
            // 判断是否为浅色背景，需要深色文字
            const isLightColor = (hexColor: string) => {
              if (!hexColor) return false;
              const hex = hexColor.replace('#', '');
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              const brightness = (r * 299 + g * 587 + b * 114) / 1000;
              return brightness > 200; // 亮度阈值
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
      ),
    },
    {
      title: '货源',
      dataIndex: 'source_id',
      width: 120,
      valueType: 'select',
      fieldProps: {
        placeholder: '请选择货源',
        options: sources.map((source) => ({
          label: `${source.name} (${source.code})`,
          value: source.id,
        })),
      },
      render: (_, record) => record.source?.name || '-',
    },
    {
      title: '发货时间',
      dataIndex: 'shipping_time',
      width: 120,
    },
    {
      title: '优惠状态',
      dataIndex: 'is_discounted',
      width: 100,
      valueType: 'select',
      fieldProps: {
        placeholder: '请选择状态',
        options: [
          { label: '正常', value: 'false' },
          { label: '优惠中', value: 'true' },
        ],
      },
      render: (_, record) => {
        const color = record.is_discounted ? 'orange' : 'green';
        const text = record.is_discounted ? '优惠中' : '正常';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      search: false,
      render: (_: any, record: API.Product) => {
        return new Date(record.createdAt).toLocaleString('zh-CN');
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record) => [
        <Button key="edit" type="link" size="small" onClick={() => handleEdit(record)}>
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除这个产品吗？"
          description="此操作不可恢复，请谨慎操作。"
          onConfirm={() => handleDelete(record)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" size="small" danger>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.Product>
        headerTitle="产品列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
          defaultCollapsed: false,
        }}
        columnsState={{
          defaultValue: {
            // 默认显示的列
            id: { show: true, fixed: 'left' },
            name: { show: true, fixed: 'left' },
            sku: { show: true },
            price: { show: true },
            colors: { show: true },
            source_id: { show: true },
            option: { show: true, fixed: 'right' },
            // 默认隐藏的列
            product_code: { show: false },
            cost_price: { show: false },
            shipping_time: { show: false },
            is_discounted: { show: false },
            createdAt: { show: false },
          },
        }}
        toolBarRender={() => [
          <Button
            key="barcode"
            type="primary"
            icon={<BarcodeOutlined />}
            onClick={handleGenerateBarcode}
            disabled={selectedRows.length === 0}
          >
            生成条形码 ({selectedRows.length})
          </Button>,
          <Button
            key="exportImages"
            icon={<PictureOutlined />}
            onClick={handleExportImages}
            disabled={selectedRows.length === 0}
          >
            导出图片 ({selectedRows.length})
          </Button>,
          <Dropdown key="export" menu={{ items: exportMenuItems }} placement="bottomLeft">
            <Button icon={<DownloadOutlined />}>
              导出Excel <DownOutlined />
            </Button>
          </Dropdown>,
          <Button key="add" type="primary" onClick={handleAdd}>
            新增产品
          </Button>,
        ]}
        scroll={{ x: 1600 }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys, rows) => {
            setSelectedRowKeys(keys);
            setSelectedRows(rows);
          },
        }}
        tableAlertRender={false}
        request={async (params) => {
          try {
            const searchParams: API.GetProductListParams = {
              page: params.current || 1,
              page_size: params.pageSize || 10,
              name: params.name,
              sku: params.sku,
              product_code: params.product_code,
              source_id: params.source_id ? Number(params.source_id) : undefined,
              min_price: params.price_range?.[0] ? Number(params.price_range[0]) : undefined,
              max_price: params.price_range?.[1] ? Number(params.price_range[1]) : undefined,
              is_discounted:
                params.is_discounted !== undefined ? params.is_discounted === 'true' : undefined,
              colors: params.colors
                ? Array.isArray(params.colors)
                  ? params.colors
                  : [params.colors]
                : undefined,
              shipping_time: params.shipping_time,
            };

            // 保存当前搜索参数，用于导出功能
            const currentParams = { ...searchParams };
            delete currentParams.page;
            delete currentParams.page_size;
            setCurrentSearchParams(currentParams);

            const response = await getProductList(searchParams);

            if (response.success) {
              return {
                data: response.data.items,
                success: true,
                total: response.data.total,
              };
            } else {
              message.error(response.message || '获取产品列表失败');
              return {
                data: [],
                success: false,
                total: 0,
              };
            }
          } catch (error) {
            message.error('获取产品列表失败，请重试');
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        columns={columns}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <ProductForm
        visible={productFormVisible}
        title={formTitle}
        product={currentProduct}
        onSuccess={handleFormSuccess}
        onVisibleChange={setProductFormVisible}
      />

      <Modal
        open={imagePreviewVisible}
        onCancel={handleImagePreviewClose}
        footer={null}
        width={800}
        title={`产品图片预览 (${imagePreviewIndex + 1}/${imagePreviewUrls.length})`}
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
                  width: 60,
                  height: 60,
                  border: index === imagePreviewIndex ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  borderRadius: 4,
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
                onClick={() => setImagePreviewIndex(index)}
              >
                <img
                  src={ImageProcessor.generateThumbnailUrl(url, 60, 60, 80, 'jpg')}
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

export default ProductList;
