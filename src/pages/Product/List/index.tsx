import PricePositionPreview from '@/components/PricePositionPreview';
import {
  batchUpdateSource,
  deleteProduct,
  getAllColors,
  getProductList,
} from '@/services/erp/product';
import { getActiveSourceList } from '@/services/erp/source';
import { ConfigManager, ImageComposeConfig } from '@/utils/config-manager';
import { exportProductListToExcel, generateExportMenuItems } from '@/utils/excel-export';
import { ImageExporter, ProductComposeItem, ProductImageExportItem } from '@/utils/image-export';
import { ImageComposeConfigOptions, ImageProcessOptions } from '@/utils/image-processor';
import { ImageProcessor as OSSImageProcessor } from '@/utils/oss-upload';
import {
  DownloadOutlined,
  DownOutlined,
  PictureOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  Button,
  Dropdown,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Tag,
  Upload,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import ProductForm from './components/ProductForm';
import ProductTagManager from './components/ProductTagManager';

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
  // 图片处理配置
  const [imageProcessConfigVisible, setImageProcessConfigVisible] = useState(false);
  const [imageProcessOptions, setImageProcessOptions] = useState<ImageProcessOptions>({});
  const [processConfigForm] = Form.useForm();
  // 图片合成配置
  const [imageComposeConfigVisible, setImageComposeConfigVisible] = useState(false);
  const [composeConfigForm] = Form.useForm();
  const [frameImageUrl, setFrameImageUrl] = useState<string>('');
  // 配置管理
  const [configList, setConfigList] = useState<string[]>([]);
  const [currentConfigName, setCurrentConfigName] = useState<string>('');
  const [configManagementVisible, setConfigManagementVisible] = useState(false);
  // 批量修改供应商
  const [batchUpdateSourceVisible, setBatchUpdateSourceVisible] = useState(false);
  const [batchUpdateSourceForm] = Form.useForm();

  // 标签管理
  const [tagManagerVisible, setTagManagerVisible] = useState(false);
  const [currentProductForTag, setCurrentProductForTag] = useState<API.Product | undefined>(
    undefined,
  );

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

  // 加载配置到表单
  const loadConfigToForm = (config: ImageComposeConfig) => {
    composeConfigForm.setFieldsValue({
      canvasSize: config.canvasSize || 800,
      quality: config.quality || 90,
      format: config.format || 'jpeg',
      useFrame: config.useFrame || false,
      frameSize: config.frameSize || 800,
      pricePosition: config.pricePosition,
      priceX: config.priceX,
      priceY: config.priceY,
      priceFontSize: config.priceFontSize || 24,
      priceColor: config.priceColor || '#ff4d4f',
      priceFontFamily: config.priceFontFamily || 'Arial',
    });

    if (config.frameImageUrl) {
      setFrameImageUrl(config.frameImageUrl);
    }
  };
  // 加载配置列表
  useEffect(() => {
    const loadConfigList = () => {
      const configs = ConfigManager.getConfigNames();
      setConfigList(configs);

      // 加载默认配置
      const defaultConfig = ConfigManager.getDefaultConfig();
      if (defaultConfig) {
        setCurrentConfigName(defaultConfig.name);
        loadConfigToForm(defaultConfig);
      }
    };

    loadConfigList();
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

  // 打开图片处理配置
  const handleOpenImageProcessConfig = () => {
    setImageProcessConfigVisible(true);
    // 重置表单
    processConfigForm.resetFields();
  };

  // 确认图片处理配置
  const handleConfirmImageProcessConfig = async () => {
    try {
      const values = await processConfigForm.validateFields();

      // 构建处理选项
      const options: ImageProcessOptions = {};

      if (values.resize) {
        options.resize = {
          width: values.resizeWidth,
          height: values.resizeHeight,
          maintainAspectRatio: values.maintainAspectRatio,
        };
      }

      if (values.quality !== undefined) {
        options.quality = values.quality / 100; // 转换为0-1范围
      }

      if (values.format) {
        options.format = values.format;
      }

      if (values.brightness !== undefined) {
        options.brightness = values.brightness;
      }

      if (values.contrast !== undefined) {
        options.contrast = values.contrast;
      }

      if (values.saturation !== undefined) {
        options.saturation = values.saturation;
      }

      if (values.blur !== undefined) {
        options.blur = values.blur;
      }

      if (values.sharpen) {
        options.sharpen = true;
      }

      if (values.watermark && values.watermarkText) {
        options.watermark = {
          text: values.watermarkText,
          position: values.watermarkPosition || 'bottom-right',
          fontSize: values.watermarkFontSize,
          color: values.watermarkColor,
          opacity: values.watermarkOpacity / 100, // 转换为0-1范围
        };
      }

      setImageProcessOptions(options);
      setImageProcessConfigVisible(false);
      message.success('图片处理配置已保存');
    } catch (error) {
      console.error('配置验证失败:', error);
    }
  };

  // 打开图片合成配置
  const handleOpenImageComposeConfig = () => {
    setImageComposeConfigVisible(true);
    // 重置表单
    composeConfigForm.resetFields();
    setFrameImageUrl('');
  };

  // 确认图片合成配置
  const handleConfirmImageComposeConfig = async () => {
    try {
      const values = await composeConfigForm.validateFields();

      // 验证图框图片
      if (values.useFrame && !frameImageUrl) {
        message.error('请上传图框图片');
        return;
      }

      setImageComposeConfigVisible(false);
      message.success('图片合成配置已保存');
    } catch (error) {
      console.error('配置验证失败:', error);
    }
  };

  // 保存当前配置
  const handleSaveConfig = async () => {
    try {
      const values = await composeConfigForm.validateFields();

      const config: ImageComposeConfig = {
        name: values.configName || `配置_${new Date().toISOString().slice(0, 19)}`,
        description: values.configDescription,
        canvasSize: values.canvasSize || 800,
        quality: values.quality || 90,
        format: values.format || 'jpeg',
        useFrame: values.useFrame || false,
        frameSize: values.frameSize || 800,
        frameImageUrl: frameImageUrl,
        pricePosition: values.pricePosition,
        priceX: values.priceX,
        priceY: values.priceY,
        priceFontSize: values.priceFontSize || 24,
        priceColor: values.priceColor || '#ff4d4f',
        priceFontFamily: values.priceFontFamily || 'Arial',
        priceBackgroundColor: 'transparent',
        pricePadding: 0,
        priceBorderRadius: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      ConfigManager.saveConfig(config);
      setConfigList(ConfigManager.getConfigNames());
      message.success('配置保存成功');
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败');
    }
  };

  // 加载配置
  const handleLoadConfig = (configName: string) => {
    const config = ConfigManager.loadConfig(configName);
    if (config) {
      setCurrentConfigName(configName);
      loadConfigToForm(config);
      message.success(`已加载配置: ${configName}`);
    } else {
      message.error('加载配置失败');
    }
  };

  // 删除配置
  const handleDeleteConfig = (configName: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除配置 "${configName}" 吗？`,
      onOk: () => {
        if (ConfigManager.deleteConfig(configName)) {
          setConfigList(ConfigManager.getConfigNames());
          if (currentConfigName === configName) {
            setCurrentConfigName('');
            composeConfigForm.resetFields();
          }
          message.success('配置删除成功');
        } else {
          message.error('删除配置失败');
        }
      },
    });
  };

  // 设置默认配置
  const handleSetDefaultConfig = (configName: string) => {
    if (ConfigManager.setDefaultConfig(configName)) {
      setCurrentConfigName(configName);
      message.success(`已设置默认配置: ${configName}`);
    } else {
      message.error('设置默认配置失败');
    }
  };

  // 处理图框图片上传
  const handleFrameImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFrameImageUrl(result);
    };
    reader.readAsDataURL(file);
    return false; // 阻止自动上传
  };

  // 打开批量修改供应商弹窗
  const handleOpenBatchUpdateSource = () => {
    if (selectedRows.length === 0) {
      message.warning('请先选择要修改供应商的产品');
      return;
    }
    setBatchUpdateSourceVisible(true);
    batchUpdateSourceForm.resetFields();
  };

  // 执行批量修改供应商
  const handleBatchUpdateSource = async () => {
    try {
      const values = await batchUpdateSourceForm.validateFields();

      // 获取选中供应商的信息
      const selectedSource = sources.find((source) => source.id === values.source_id);
      const productIds = selectedRows.map((product) => product.id);

      // 二次确认
      Modal.confirm({
        title: '确认批量修改供应商',
        content: (
          <div>
            <p>
              确定要将选中的 <strong>{selectedRows.length}</strong> 个产品的供应商修改为：
            </p>
            <p style={{ fontWeight: 'bold', color: '#1890ff' }}>
              {selectedSource?.name} ({selectedSource?.code})
            </p>
            <p style={{ color: '#666', fontSize: '14px' }}>此操作不可撤销，请谨慎操作。</p>
          </div>
        ),
        onOk: async () => {
          try {
            const response = await batchUpdateSource({
              product_ids: productIds,
              source_id: values.source_id,
            });

            if (response.success) {
              const { updated_count, failed_products } = response.data;

              if (failed_products && failed_products.length > 0) {
                // 部分成功的情况
                Modal.info({
                  title: '批量修改完成',
                  content: (
                    <div>
                      <p>成功修改 {updated_count} 个产品的供应商</p>
                      <p>失败 {failed_products.length} 个产品：</p>
                      <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 8 }}>
                        {failed_products.map((item, index) => (
                          <div key={index} style={{ fontSize: '12px', color: '#666' }}>
                            产品ID {item.product_id}: {item.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                });
              } else {
                message.success(`成功修改 ${updated_count} 个产品的供应商`);
              }

              setBatchUpdateSourceVisible(false);
              batchUpdateSourceForm.resetFields();
              setSelectedRowKeys([]);
              setSelectedRows([]);
              actionRef.current?.reload();
            } else {
              message.error(response.message || '批量修改供应商失败');
            }
          } catch (error) {
            console.error('批量修改供应商失败:', error);
            message.error('批量修改供应商失败，请重试');
          }
        },
        okText: '确认修改',
        cancelText: '取消',
        okType: 'primary',
      });
    } catch (error) {
      console.error('表单验证失败:', error);
    }
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
    const preview = ImageExporter.getExportPreview(exportData, imageProcessOptions);

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
            <li>预估大小：{preview.estimatedSize}</li>
            {preview.processingInfo && <li>处理选项：{preview.processingInfo}</li>}
          </ul>
          <p>确定要开始导出吗？</p>
        </div>
      ),
      onOk: async () => {
        try {
          await ImageExporter.exportProductImages(exportData, {
            fileName: `产品图片_${new Date().toISOString().slice(0, 10)}`,
            processOptions: imageProcessOptions,
          });
        } catch (error) {
          console.error('导出图片失败:', error);
        }
      },
      okText: '开始导出',
      cancelText: '取消',
    });
  };

  // 导出合成图片
  const handleExportComposedImages = async () => {
    if (selectedRows.length === 0) {
      message.warning('请先选择要导出合成图片的产品');
      return;
    }

    // 过滤出有主图的产品
    const productsWithMainImage = selectedRows.filter(
      (product) =>
        product.images && product.images.length > 0 && product.images.some((img) => img.is_main),
    );

    if (productsWithMainImage.length === 0) {
      message.warning('选中的产品没有主图');
      return;
    }

    // 获取合成配置
    const composeValues = composeConfigForm.getFieldsValue();

    // 转换为合成格式
    const composeData: ProductComposeItem[] = productsWithMainImage.map((product) => {
      const mainImage = product.images?.find((img) => img.is_main) || product.images?.[0];
      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        price: product.price,
        mainImageUrl: mainImage?.url || '',
      };
    });

    // 构建合成选项
    const composeOptions: ImageComposeConfigOptions = {
      canvasSize: composeValues.canvasSize || 800,
      quality: (composeValues.quality || 90) / 100,
      format: composeValues.format || 'jpeg',
      pricePosition: composeValues.pricePosition,
      priceX: composeValues.priceX,
      priceY: composeValues.priceY,
      priceFontSize: composeValues.priceFontSize || 24,
      priceColor: composeValues.priceColor || '#ff4d4f',
      priceFontFamily: composeValues.priceFontFamily || 'Arial',
      priceBackgroundColor: 'transparent',
      pricePadding: 0,
      priceBorderRadius: 0,
    };

    // 如果有图框，添加到选项
    if (composeValues.useFrame && frameImageUrl) {
      composeOptions.frameImage = {
        url: frameImageUrl,
        size: composeValues.frameSize || composeValues.canvasSize || 800,
      };
    }

    // 显示预览信息
    const preview = ImageExporter.getComposePreview(composeData, composeOptions);

    // 确认导出
    Modal.confirm({
      title: '确认导出合成图片',
      content: (
        <div>
          <p>将合成以下内容：</p>
          <ul>
            <li>产品数量：{preview.totalProducts}</li>
            <li>
              画布尺寸：{preview.canvasSize}x{preview.canvasSize}px
            </li>
            <li>预估大小：{preview.estimatedSize}</li>
            <li>合成选项：{preview.composeInfo}</li>
          </ul>
          <p>确定要开始合成导出吗？</p>
        </div>
      ),
      onOk: async () => {
        try {
          await ImageExporter.exportComposedImages(composeData, {
            fileName: `合成图片_${new Date().toISOString().slice(0, 10)}`,
            composeOptions,
          });
        } catch (error) {
          console.error('导出合成图片失败:', error);
        }
      },
      okText: '开始合成导出',
      cancelText: '取消',
    });
  };

  // 表单提交成功回调
  const handleFormSuccess = () => {
    setProductFormVisible(false);
    actionRef.current?.reload();
  };

  // 打开标签管理
  const handleOpenTagManager = (record: API.Product) => {
    setCurrentProductForTag(record);
    setTagManagerVisible(true);
  };

  // 标签管理成功回调
  const handleTagManagerSuccess = () => {
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
          const thumbnailUrl = OSSImageProcessor.generateThumbnailUrl(image.url, 60, 60, 80, 'jpg');

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
              const thumbnailUrl = OSSImageProcessor.generateThumbnailUrl(
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
      title: '标签',
      dataIndex: 'tags',
      width: 150,
      search: false,
      render: (_, record) => (
        <Space wrap>
          {record.tags?.map((tag) => (
            <Tag
              key={tag.id}
              color={tag.color}
              style={{
                backgroundColor: tag.color,
                color: '#fff',
                border: `1px solid ${tag.color}`,
                padding: '4px 8px',
                fontSize: '12px',
              }}
            >
              {tag.name}
            </Tag>
          ))}
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
      title: '启用状态',
      dataIndex: 'is_enabled',
      width: 100,
      valueType: 'select',
      fieldProps: {
        placeholder: '请选择状态',
        options: [
          { label: '已启用', value: 'true' },
          { label: '已禁用', value: 'false' },
        ],
      },
      render: (_, record) => {
        const color = record.is_enabled ? 'green' : 'red';
        const text = record.is_enabled ? '已启用' : '已禁用';
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
        <Button key="tags" type="link" size="small" onClick={() => handleOpenTagManager(record)}>
          标签
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

  useEffect(() => {
    if (imageComposeConfigVisible && currentConfigName) {
      const config = ConfigManager.loadConfig(currentConfigName);
      if (config) {
        loadConfigToForm(config);
      }
    }
  }, [imageComposeConfigVisible, currentConfigName]);

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
            tags: { show: true },
            source_id: { show: true },
            is_enabled: { show: true },
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
            key="batchUpdateSource"
            icon={<SettingOutlined />}
            onClick={handleOpenBatchUpdateSource}
            disabled={selectedRows.length === 0}
          >
            批量修改供应商 ({selectedRows.length})
          </Button>,
          <Button
            key="exportImages"
            icon={<PictureOutlined />}
            onClick={handleExportImages}
            disabled={selectedRows.length === 0}
          >
            导出图片 ({selectedRows.length})
          </Button>,
          <Button
            key="exportComposedImages"
            icon={<PlusOutlined />}
            onClick={handleExportComposedImages}
            disabled={selectedRows.length === 0}
          >
            导出合成图片 ({selectedRows.length})
          </Button>,
          <Button
            key="imageProcessConfig"
            icon={<SettingOutlined />}
            onClick={handleOpenImageProcessConfig}
            disabled={selectedRows.length === 0}
          >
            图片处理配置
          </Button>,
          <Button
            key="imageComposeConfig"
            icon={<SettingOutlined />}
            onClick={handleOpenImageComposeConfig}
            disabled={selectedRows.length === 0}
          >
            图片合成配置
          </Button>,
          <Dropdown key="export" menu={{ items: exportMenuItems }} placement="bottomLeft">
            <Button icon={<DownloadOutlined />}>
              导出Excel <DownOutlined />
            </Button>
          </Dropdown>,
          <Button key="add" type="primary" onClick={handleAdd}>
            新增产品
          </Button>,
          <Button
            key="batchUpdateSource"
            icon={<SettingOutlined />}
            onClick={handleOpenBatchUpdateSource}
          >
            批量修改供应商
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
              is_enabled:
                params.is_enabled !== undefined ? params.is_enabled === 'true' : undefined,
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

      <ProductTagManager
        visible={tagManagerVisible}
        product={currentProductForTag}
        onCancel={() => setTagManagerVisible(false)}
        onSuccess={handleTagManagerSuccess}
      />

      {/* 图片处理配置弹窗 */}
      <Modal
        title="图片处理配置"
        open={imageProcessConfigVisible}
        onOk={handleConfirmImageProcessConfig}
        onCancel={() => setImageProcessConfigVisible(false)}
        width={600}
        okText="确认配置"
        cancelText="取消"
        forceRender={true}
      >
        <Form
          form={processConfigForm}
          layout="vertical"
          initialValues={{
            maintainAspectRatio: true,
            quality: 80,
            format: 'jpeg',
            watermarkPosition: 'bottom-right',
            watermarkFontSize: 16,
            watermarkColor: '#ffffff',
            watermarkOpacity: 30,
          }}
        >
          <Form.Item label="调整尺寸" name="resize" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.resize !== currentValues.resize}
          >
            {({ getFieldValue }) =>
              getFieldValue('resize') ? (
                <div style={{ marginLeft: 24 }}>
                  <Form.Item label="宽度 (px)" name="resizeWidth">
                    <InputNumber
                      min={1}
                      max={5000}
                      placeholder="留空保持比例"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item label="高度 (px)" name="resizeHeight">
                    <InputNumber
                      min={1}
                      max={5000}
                      placeholder="留空保持比例"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item name="maintainAspectRatio" valuePropName="checked">
                    <Switch checkedChildren="保持宽高比" unCheckedChildren="不保持宽高比" />
                  </Form.Item>
                </div>
              ) : null
            }
          </Form.Item>

          <Form.Item label="图片质量 (%)" name="quality">
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="输出格式" name="format">
            <Select>
              <Select.Option value="jpeg">JPEG</Select.Option>
              <Select.Option value="png">PNG</Select.Option>
              <Select.Option value="webp">WebP</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="亮度调整" name="brightness">
            <InputNumber min={-100} max={100} placeholder="-100 到 100" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="对比度调整" name="contrast">
            <InputNumber min={-100} max={100} placeholder="-100 到 100" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="饱和度调整" name="saturation">
            <InputNumber min={-100} max={100} placeholder="-100 到 100" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="模糊效果" name="blur">
            <InputNumber min={0} max={10} placeholder="0 到 10" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="锐化处理" name="sharpen" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="添加水印" name="watermark" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.watermark !== currentValues.watermark
            }
          >
            {({ getFieldValue }) =>
              getFieldValue('watermark') ? (
                <div style={{ marginLeft: 24 }}>
                  <Form.Item
                    label="水印文字"
                    name="watermarkText"
                    rules={[{ required: true, message: '请输入水印文字' }]}
                  >
                    <Input placeholder="请输入水印文字" />
                  </Form.Item>
                  <Form.Item label="水印位置" name="watermarkPosition">
                    <Select>
                      <Select.Option value="top-left">左上角</Select.Option>
                      <Select.Option value="top-right">右上角</Select.Option>
                      <Select.Option value="bottom-left">左下角</Select.Option>
                      <Select.Option value="bottom-right">右下角</Select.Option>
                      <Select.Option value="center">居中</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="字体大小 (px)" name="watermarkFontSize">
                    <InputNumber min={8} max={72} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="字体颜色" name="watermarkColor">
                    <Input type="color" style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="透明度 (%)" name="watermarkOpacity">
                    <InputNumber min={1} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </div>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>

      {/* 图片合成配置弹窗 */}
      <Modal
        title="图片合成配置"
        open={imageComposeConfigVisible}
        onOk={handleConfirmImageComposeConfig}
        onCancel={() => setImageComposeConfigVisible(false)}
        width={600}
        okText="确认配置"
        cancelText="取消"
        forceRender={true}
      >
        <Form
          form={composeConfigForm}
          layout="vertical"
          initialValues={{
            canvasSize: 800,
            quality: 90,
            format: 'jpeg',
            useFrame: false,
            frameSize: 800,
            pricePosition: 'top-right',
            priceX: undefined,
            priceY: undefined,
            priceFontSize: 24,
            priceColor: '#ff4d4f',
            priceFontFamily: 'Arial',
            priceBackgroundColor: 'transparent',
            pricePadding: 0,
            priceBorderRadius: 0,
          }}
        >
          <div style={{ display: 'flex', gap: 16 }}>
            {/* 左排：文字位置和样式配置 */}
            <div style={{ flex: 1 }}>
              {/* 文字位置配置 */}
              <Form.Item label="文字位置" name="pricePosition">
                <Select placeholder="选择预设位置或使用自定义坐标">
                  <Select.Option value="top-left">左上角</Select.Option>
                  <Select.Option value="top-right">右上角</Select.Option>
                  <Select.Option value="bottom-left">左下角</Select.Option>
                  <Select.Option value="bottom-right">右下角</Select.Option>
                  <Select.Option value="center">居中</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="自定义X坐标 (px)" name="priceX">
                <InputNumber
                  min={0}
                  max={800}
                  placeholder="留空使用预设位置"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item label="自定义Y坐标 (px)" name="priceY">
                <InputNumber
                  min={0}
                  max={800}
                  placeholder="留空使用预设位置"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              {/* 文字样式配置 */}
              <Form.Item label="文字字体" name="priceFontFamily">
                <Select>
                  <Select.Option value="Arial">Arial</Select.Option>
                  <Select.Option value="Helvetica">Helvetica</Select.Option>
                  <Select.Option value="Times New Roman">Times New Roman</Select.Option>
                  <Select.Option value="Georgia">Georgia</Select.Option>
                  <Select.Option value="Verdana">Verdana</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="文字大小 (px)" name="priceFontSize">
                <InputNumber min={8} max={72} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label="文字颜色" name="priceColor">
                <Input type="color" style={{ width: '100%' }} />
              </Form.Item>

              {/* 图框配置 */}
              <Form.Item label="使用图框" name="useFrame" valuePropName="checked">
                <Switch />
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.useFrame !== currentValues.useFrame
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue('useFrame') ? (
                    <div style={{ marginLeft: 24 }}>
                      <div style={{ marginBottom: 8, fontWeight: 500 }}>
                        上传图框图片 <span style={{ color: '#ff4d4f' }}>*</span>
                      </div>
                      <Upload
                        accept="image/*"
                        beforeUpload={handleFrameImageUpload}
                        showUploadList={false}
                      >
                        <Button icon={<PlusOutlined />}>选择图框图片</Button>
                      </Upload>
                      {frameImageUrl && (
                        <div style={{ marginTop: 8 }}>
                          <Image
                            src={frameImageUrl}
                            alt="图框预览"
                            width={100}
                            height={100}
                            style={{ objectFit: 'cover', borderRadius: 4 }}
                          />
                        </div>
                      )}
                    </div>
                  ) : null
                }
              </Form.Item>
            </div>

            {/* 右排：位置预览和配置管理 */}
            <div style={{ flex: 1 }}>
              {/* 位置预览 */}
              <div style={{ marginBottom: 8, fontWeight: 500 }}>位置预览</div>
              <div
                style={{
                  width: 200,
                  height: 200,
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  position: 'relative',
                  backgroundColor: '#f5f5f5',
                  margin: '0 auto',
                }}
              >
                <Form.Item noStyle shouldUpdate>
                  {() => (
                    <PricePositionPreview
                      position={composeConfigForm.getFieldValue('pricePosition')}
                      x={composeConfigForm.getFieldValue('priceX')}
                      y={composeConfigForm.getFieldValue('priceY')}
                      fontSize={composeConfigForm.getFieldValue('priceFontSize') || 24}
                      color={composeConfigForm.getFieldValue('priceColor') || '#ff4d4f'}
                      fontFamily={composeConfigForm.getFieldValue('priceFontFamily') || 'Arial'}
                    />
                  )}
                </Form.Item>
              </div>

              {/* 配置管理 */}
              <Form.Item label="配置名称" name="configName">
                <Input placeholder="输入配置名称以保存当前设置" />
              </Form.Item>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <Button onClick={handleSaveConfig} type="primary">
                  保存配置
                </Button>
                <Button onClick={() => setConfigManagementVisible(true)}>管理配置</Button>
              </div>

              {configList.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>快速加载配置</div>
                  <Select
                    placeholder="选择要加载的配置"
                    onChange={handleLoadConfig}
                    style={{ width: '100%' }}
                    value={currentConfigName}
                  >
                    {configList.map((name) => (
                      <Select.Option key={name} value={name}>
                        {name} {currentConfigName === name ? '(当前)' : ''}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          </div>
        </Form>
      </Modal>

      {/* 配置管理弹窗 */}
      <Modal
        title="配置管理"
        open={configManagementVisible}
        onCancel={() => setConfigManagementVisible(false)}
        footer={null}
        width={800}
        forceRender={true}
      >
        <div>
          <h3>已保存的配置</h3>
          {configList.length === 0 ? (
            <p>暂无保存的配置</p>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {configList.map((name) => {
                const config = ConfigManager.loadConfig(name);
                return (
                  <div
                    key={name}
                    style={{
                      border: '1px solid #d9d9d9',
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: 12,
                      backgroundColor: currentConfigName === name ? '#f0f8ff' : '#fff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <h4 style={{ margin: 0 }}>{name}</h4>
                      <Space>
                        <Button size="small" onClick={() => handleLoadConfig(name)}>
                          加载
                        </Button>
                        <Button size="small" onClick={() => handleSetDefaultConfig(name)}>
                          设为默认
                        </Button>
                        <Button size="small" danger onClick={() => handleDeleteConfig(name)}>
                          删除
                        </Button>
                      </Space>
                    </div>
                    {config?.description && (
                      <p style={{ margin: '8px 0', color: '#666' }}>{config.description}</p>
                    )}
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      创建时间:{' '}
                      {config?.createdAt ? new Date(config.createdAt).toLocaleString() : '未知'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* 批量修改供应商弹窗 */}
      <Modal
        title="批量修改供应商"
        open={batchUpdateSourceVisible}
        onOk={handleBatchUpdateSource}
        onCancel={() => setBatchUpdateSourceVisible(false)}
        width={700}
        okText="确认修改"
        cancelText="取消"
        forceRender={true}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
            将要修改的产品 ({selectedRows.length} 个)：
          </div>
          <div
            style={{
              maxHeight: 200,
              overflowY: 'auto',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              padding: 8,
              backgroundColor: '#fafafa',
            }}
          >
            {selectedRows.map((product, index) => (
              <div
                key={product.id}
                style={{
                  padding: '4px 0',
                  borderBottom: index < selectedRows.length - 1 ? '1px solid #f0f0f0' : 'none',
                  fontSize: '14px',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <span style={{ fontWeight: 500 }}>{product.name}</span>
                    <span style={{ color: '#666', marginLeft: 8 }}>SKU: {product.sku}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    当前供应商: {product.source?.name || '无'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Form
          form={batchUpdateSourceForm}
          layout="vertical"
          initialValues={{
            source_id: undefined,
          }}
        >
          <Form.Item
            label="选择新供应商"
            name="source_id"
            rules={[{ required: true, message: '请选择新供应商' }]}
          >
            <Select
              placeholder="请选择新供应商"
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {sources.map((source) => (
                <Select.Option key={source.id} value={source.id}>
                  {source.name} ({source.code})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <div
            style={{
              padding: '12px',
              backgroundColor: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 4,
              fontSize: '14px',
              color: '#52c41a',
            }}
          >
            <strong>提示：</strong>此操作将把选中的所有产品的供应商修改为新选择的供应商。
          </div>
        </Form>
      </Modal>

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
                  src={OSSImageProcessor.generateThumbnailUrl(url, 60, 60, 80, 'jpg')}
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
