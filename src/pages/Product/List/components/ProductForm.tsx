import { createProduct, getAllColors, getProduct, updateProduct } from '@/services/erp/product';
import { getActiveSourceList } from '@/services/erp/source';
import { getEnabledTags } from '@/services/erp/tags';
import { ossUploader } from '@/utils/oss-upload';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { Button, Col, message, Popconfirm, Row, Tag, Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import React, { useEffect, useState } from 'react';

interface ProductFormProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onSuccess: () => void;
  product?: API.Product;
  title: string;
}

const ProductForm: React.FC<ProductFormProps> = ({
  visible,
  onVisibleChange,
  onSuccess,
  product,
  title,
}) => {
  const [colors, setColors] = useState<API.Color[]>([]);
  const [sources, setSources] = useState<API.Source[]>([]);
  const [tags, setTags] = useState<API.Tag[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // 获取所有颜色
  const fetchColors = async () => {
    try {
      const response = await getAllColors();
      if (response.success) {
        setColors(response.data || []);
      }
    } catch (error) {
      console.error('获取颜色失败:', error);
    }
  };

  // 获取激活的货源
  const fetchActiveSources = async () => {
    try {
      const response = await getActiveSourceList();
      if (response.success) {
        setSources(response.data || []);
      }
    } catch (error) {
      console.error('获取货源失败:', error);
    }
  };

  // 获取启用的标签
  const fetchEnabledTags = async () => {
    try {
      const response = await getEnabledTags();
      if (response.success) {
        setTags(response.data || []);
      }
    } catch (error) {
      console.error('获取标签失败:', error);
    }
  };

  // 初始化图片列表
  const initializeImages = (images?: API.ProductImage[]) => {
    if (!images || images.length === 0) {
      setFileList([]);
      return;
    }

    const uploadFiles: UploadFile[] = images.map((image, index) => ({
      uid: `existing-${index}`,
      name: image.title || `image-${index}`,
      status: 'done',
      url: image.url,
      thumbUrl: image.url,
      isMain: image.is_main,
    }));

    setFileList(uploadFiles);
  };

  useEffect(() => {
    if (visible) {
      fetchColors();
      fetchActiveSources();
      fetchEnabledTags();

      // 阻止Upload组件的默认下载行为
      const preventDownload = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.closest('.ant-upload-list-picture-card-container')) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };

      document.addEventListener('click', preventDownload, true);
      document.addEventListener('mousedown', preventDownload, true);

      return () => {
        document.removeEventListener('click', preventDownload, true);
        document.removeEventListener('mousedown', preventDownload, true);
      };
    }
  }, [visible]);

  // 监听 product 变化，当切换到新增模式时重置 fileList
  useEffect(() => {
    if (!product) {
      // 当 product 为 undefined 时（新增模式），重置 fileList
      setFileList([]);
    }
  }, [product]);

  // 监听 visible 变化，当表单关闭时重置 fileList
  useEffect(() => {
    if (!visible) {
      // 当表单关闭时，重置 fileList 状态
      setFileList([]);
    }
  }, [visible]);

  // 处理图片上传
  const handleUploadChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    // 确保文件URL正确设置，并检查重复文件
    const updatedFileList: UploadFile[] = [];
    const seenNames = new Set<string>();

    for (const file of newFileList) {
      // 检查重复文件名
      if (seenNames.has(file.name)) {
        continue;
      }
      seenNames.add(file.name);

      // 确保文件URL正确设置
      if (file.status === 'done' && file.response?.url) {
        updatedFileList.push({
          ...file,
          url: file.response.url,
          thumbUrl: file.response.url,
        });
      } else {
        updatedFileList.push(file);
      }
    }

    setFileList(updatedFileList);
  };

  // 自定义上传处理
  const customUpload = async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options;

    try {
      // 显示上传进度
      onProgress({ percent: 50 });

      // 使用OSS上传工具上传文件
      const imageUrl = await ossUploader.uploadFile(file);

      // 上传成功 - 修复参数格式
      onProgress({ percent: 100 });
      const response = { url: imageUrl };
      onSuccess(response, file);
    } catch (error) {
      message.error('图片上传失败，请重试');
      onError(error);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // 处理图片数据
      const images: API.ProductImage[] = fileList.map((file, index) => ({
        url: file.url || '',
        title: file.name,
        alt: file.name,
        is_main: index === 0,
        sort: index + 1,
      }));
      // 自动生成产品编码：货源编码-SKU
      let productCode = '';
      if (values.source_id && values.sku) {
        const selectedSource = sources.find((source) => source.id === values.source_id);
        if (selectedSource && selectedSource.code) {
          productCode = `${selectedSource.code}-${values.sku}`;
        } else {
          // 如果找不到货源或货源没有编码，只使用SKU
          productCode = values.sku;
        }
      } else if (values.sku) {
        // 如果没有选择货源，只使用SKU
        productCode = values.sku;
      }

      // 处理价格字段，确保转换为数字类型
      const formData = {
        ...values,
        product_code: productCode, // 自动生成的产品编码
        price: values.price ? parseFloat(values.price) : undefined,
        cost_price: values.cost_price ? parseFloat(values.cost_price) : undefined,
        discount_price: values.discount_price ? parseFloat(values.discount_price) : undefined,
        colors: Array.isArray(values.colors)
          ? values.colors
              .map((colorValue: any) => {
                // 直接使用颜色值，因为现在统一使用颜色名称
                return colorValue;
              })
              .filter((name: string) => name && name.trim() !== '')
          : [], // 提交颜色名称数组
        tags: Array.isArray(values.tags) ? values.tags : [], // 提交标签ID数组
        images: images,
      };

      if (product?.id) {
        // 编辑产品
        const response = await updateProduct(product.id, formData);
        if (response.success) {
          message.success('产品更新成功');
          onSuccess();
          return true;
        } else {
          message.error(response.message || '产品更新失败');
          return false;
        }
      } else {
        // 新增产品
        const response = await createProduct(formData);
        if (response.success) {
          message.success('产品创建成功');
          onSuccess();
          return true;
        } else {
          message.error(response.message || '产品创建失败');
          return false;
        }
      }
    } catch (error) {
      console.error('表单提交失败:', error);
      message.error('操作失败，请重试');
      return false;
    }
  };

  // 构建颜色选项（带颜色块显示）
  const colorOptions = colors.map((color) => ({
    label: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '4px',
            backgroundColor: color.hex_color || '#cccccc',
            border: '1px solid #d9d9d9',
            flexShrink: 0,
          }}
        />
        <span>{color.name}</span>
      </div>
    ),
    value: color.name,
  }));

  // 构建货源选项
  const sourceOptions = sources.map((source) => ({
    label: `${source.name} (${source.code})`,
    value: source.id,
  }));

  // 构建标签选项（带颜色显示）
  const tagOptions = tags.map((tag) => ({
    label: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Tag color={tag.color} style={{ margin: 0 }}>
          {tag.name}
        </Tag>
      </div>
    ),
    value: tag.id,
  }));

  const getDefaultValues = () => ({
    name: '',
    sku: '',
    price: undefined,
    cost_price: undefined,
    discount_price: undefined,
    is_discounted: false,
    is_enabled: true,
    source_id: undefined,
    shipping_time: '',
    colors: [],
    tags: [],
  });

  return (
    <ModalForm
      title={title}
      open={visible}
      onOpenChange={onVisibleChange}
      onFinish={handleSubmit}
      key={product?.id || 'new'}
      modalProps={{
        maskClosable: false,
        forceRender: true,
      }}
      request={async () => {
        // 如果是编辑模式且有产品ID，则获取最新详情
        if (product?.id) {
          try {
            const response = await getProduct(product.id);
            if (response.success) {
              // 初始化图片列表
              initializeImages(response.data.images);

              return {
                ...response.data,
                colors:
                  response.data.colors?.map((color: any) => {
                    // 统一返回颜色名称，而不是ID
                    if (typeof color === 'object' && color.name) {
                      return color.name;
                    } else if (typeof color === 'string') {
                      return color;
                    }
                    return color;
                  }) || [],
                tags: response.data.tags?.map((tag: any) => tag.id) || [],
              };
            } else {
              message.error(response.message || '获取产品详情失败');
              return getDefaultValues();
            }
          } catch (error) {
            message.error('获取产品详情失败，请重试');
            return getDefaultValues();
          }
        }
        // 新增模式返回默认值
        initializeImages([]);
        return getDefaultValues();
      }}
      width={800}
    >
      <Row gutter={24}>
        {/* 左列 */}
        <Col span={12}>
          <ProFormText
            name="name"
            label="商品名称"
            placeholder="请输入商品名称"
            rules={[
              { required: true, message: '请输入商品名称' },
              { max: 200, message: '商品名称最多200个字符' },
            ]}
          />

          <ProFormText
            name="sku"
            label="货号"
            placeholder="请输入货号"
            rules={[
              { required: true, message: '请输入货号' },
              { max: 100, message: '货号最多100个字符' },
            ]}
            tooltip="产品编码将自动生成为：货源编码-货号"
          />

          <ProFormDigit
            name="price"
            label="售价"
            placeholder="请输入售价"
            rules={[{ required: true, message: '请输入售价' }]}
            fieldProps={{
              precision: 2,
              min: 0,
              addonAfter: '元',
            }}
          />

          <ProFormDigit
            name="cost_price"
            label="进货价"
            placeholder="请输入进货价"
            rules={[{ required: true, message: '请输入进货价' }]}
            fieldProps={{
              precision: 2,
              min: 0,
              addonAfter: '元',
            }}
          />

          <ProFormDigit
            name="discount_price"
            label="优惠价格"
            placeholder="请输入优惠价格（可选）"
            dependency={['is_discounted']}
            rules={[
              ({ getFieldValue }: { getFieldValue: (name: string) => any }) => ({
                validator(_: any, value: number) {
                  const isDiscounted = getFieldValue('is_discounted');
                  if (isDiscounted && (!value || value <= 0)) {
                    return Promise.reject(new Error('开启优惠时必须设置优惠价格'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
            fieldProps={{
              precision: 2,
              min: 0,
              addonAfter: '元',
            }}
          />

          <ProFormSwitch name="is_discounted" label="是否优惠" tooltip="开启后需要设置优惠价格" />

          <ProFormSwitch
            name="is_enabled"
            label="是否启用"
            tooltip="控制商品是否在系统中可见和可操作"
          />
        </Col>

        {/* 右列 */}
        <Col span={12}>
          <ProFormSelect
            name="source_id"
            label="货源"
            placeholder="请选择货源"
            options={sourceOptions}
            rules={[{ required: true, message: '请选择货源' }]}
          />

          <ProFormText
            name="shipping_time"
            label="发货时间"
            placeholder="请输入发货时间（可选）"
            rules={[{ max: 100, message: '发货时间最多100个字符' }]}
          />

          <ProFormSelect
            name="colors"
            label="商品颜色"
            placeholder="请选择商品颜色，也可以自定义输入"
            mode="tags"
            options={colorOptions}
            allowClear
            fieldProps={{
              tokenSeparators: [','],
            }}
          />

          <ProFormSelect
            name="tags"
            label="商品标签"
            placeholder="请选择商品标签"
            mode="multiple"
            options={tagOptions}
            allowClear
            fieldProps={{
              maxTagCount: 3,
              maxTagTextLength: 10,
            }}
          />

          {/* 图片上传区域 */}
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              商品图片
              <span
                style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginLeft: 8 }}
              >
                （最多8张，第一张为主图）
              </span>
            </div>
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleUploadChange}
              customRequest={customUpload}
              onPreview={() => {
                // 阻止默认的下载行为
                return false;
              }}
              showUploadList={{
                showPreviewIcon: false, // 隐藏默认的预览图标
                showRemoveIcon: false, // 隐藏默认的删除图标
                showDownloadIcon: false, // 隐藏默认的下载图标
              }}
              beforeUpload={(file) => {
                // 验证文件类型
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('只能上传图片文件！');
                  return false;
                }

                // 检查是否已存在相同名称的图片
                const existingFile = fileList.find((f) => f.name === file.name);
                if (existingFile) {
                  message.error(`图片 "${file.name}" 已存在，请选择其他图片！`);
                  return Upload.LIST_IGNORE; // 使用Upload.LIST_IGNORE来完全忽略文件
                }

                return true;
              }}
              accept="image/*"
              multiple
              itemRender={(originNode, file, fileList) => {
                const index = fileList.findIndex((f) => f.uid === file.uid);

                // 创建一个包装的originNode，阻止所有默认行为
                const wrappedOriginNode = React.cloneElement(originNode as React.ReactElement, {
                  onClick: (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    return false;
                  },
                  onMouseDown: (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    return false;
                  },
                  style: {
                    ...(originNode as React.ReactElement).props.style,
                    pointerEvents: 'none', // 禁用所有鼠标事件
                  },
                });

                return (
                  <div
                    style={{ position: 'relative' }}
                    onClick={(e) => {
                      // 阻止默认的点击行为（下载）
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                    }}
                  >
                    {wrappedOriginNode}
                    {/* 删除按钮 */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        zIndex: 1,
                      }}
                    >
                      <Popconfirm
                        title="确定要删除这张图片吗？"
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          const newFileList = fileList.filter((_, i) => i !== index);
                          setFileList(newFileList);
                        }}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid #d9d9d9',
                            borderRadius: '4px',
                            padding: '2px 4px',
                            minWidth: 'auto',
                            height: '24px',
                          }}
                          title="删除"
                        />
                      </Popconfirm>
                    </div>
                  </div>
                );
              }}
            >
              {fileList.length >= 8 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
          </div>
        </Col>
      </Row>
    </ModalForm>
  );
};

export default ProductForm;
