import { getCategoryTree } from '@/services/erp/category';
import { getProductWithAttributes } from '@/services/erp/product';
import {
  BgColorsOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  GlobalOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { Alert, Badge, Descriptions, Drawer, Spin, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

const { Text, Title } = Typography;

interface ProductDetailProps {
  visible: boolean;
  onClose: () => void;
  productId: number | null;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ visible, onClose, productId }) => {
  const [product, setProduct] = useState<API.ProductWithAttributesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoryPath, setCategoryPath] = useState<string>('');

  // 获取分类路径
  const fetchCategoryPath = async (categoryId: number) => {
    try {
      const response = await getCategoryTree();
      if (response.success) {
        const findCategoryPath = (
          categories: API.CategoryTreeInfo[],
          targetId: number,
          path: string[] = [],
        ): string[] | null => {
          for (const category of categories) {
            if (category.id === targetId) {
              return [...path, category.name];
            }
            if (category.children && category.children.length > 0) {
              const result = findCategoryPath(category.children, targetId, [
                ...path,
                category.name,
              ]);
              if (result) return result;
            }
          }
          return null;
        };

        const pathArray = findCategoryPath(response.data.categories || [], categoryId);
        setCategoryPath(pathArray ? pathArray.join(' / ') : `分类ID: ${categoryId}`);
      }
    } catch (error) {
      console.error('获取分类路径失败:', error);
      setCategoryPath(`分类ID: ${categoryId}`);
    }
  };

  // 获取产品详情
  const fetchProductDetail = async (id: number) => {
    setLoading(true);
    try {
      const response = await getProductWithAttributes(id);
      if (response.success) {
        setProduct(response.data);
        await fetchCategoryPath(response.data.category_id);
      } else {
        setProduct(null);
      }
    } catch (error) {
      console.error('获取产品详情失败:', error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && productId) {
      fetchProductDetail(productId);
    }
  }, [visible, productId]);

  // 渲染属性值
  const renderAttributeValue = (attr: API.ProductAttributeResponse) => {
    if (attr.value === null || attr.value === undefined) {
      return <Text type="secondary">未设置</Text>;
    }

    const getIcon = () => {
      switch (attr.attribute_type) {
        case 'boolean':
          return attr.value ? (
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
          ) : (
            <CloseCircleOutlined style={{ color: '#f5222d' }} />
          );
        case 'url':
          return <GlobalOutlined style={{ color: '#1890ff' }} />;
        case 'email':
          return <MailOutlined style={{ color: '#1890ff' }} />;
        case 'date':
          return <CalendarOutlined style={{ color: '#722ed1' }} />;
        case 'datetime':
          return <ClockCircleOutlined style={{ color: '#722ed1' }} />;
        case 'color':
          return <BgColorsOutlined style={{ color: '#fa8c16' }} />;
        case 'currency':
          return <DollarOutlined style={{ color: '#52c41a' }} />;
        default:
          return null;
      }
    };

    const renderValue = () => {
      switch (attr.attribute_type) {
        case 'boolean':
          return attr.value ? '是' : '否';

        case 'select':
        case 'multi_select':
          if (Array.isArray(attr.value)) {
            return attr.value.map((val: string, index: number) => (
              <Tag key={index} color="blue">
                {val}
              </Tag>
            ));
          }
          return <Tag color="blue">{attr.value}</Tag>;

        case 'url':
          return (
            <a href={attr.value} target="_blank" rel="noopener noreferrer">
              {attr.value}
            </a>
          );

        case 'email':
          return <a href={`mailto:${attr.value}`}>{attr.value}</a>;

        case 'date':
          return new Date(attr.value).toLocaleDateString('zh-CN');

        case 'datetime':
          return new Date(attr.value).toLocaleString('zh-CN');

        case 'color':
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: attr.value,
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                }}
              />
              <Text code>{attr.value}</Text>
            </div>
          );

        case 'currency':
          return `¥${Number(attr.value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;

        case 'number':
          return Number(attr.value).toLocaleString('zh-CN');

        default:
          return attr.value;
      }
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {getIcon()}
        {renderValue()}
      </div>
    );
  };

  // 将属性按继承分组
  const groupedAttributes =
    product?.attributes?.reduce((groups, attr) => {
      const key = attr.is_inherited ? 'inherited' : 'direct';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(attr);
      return groups;
    }, {} as { inherited?: API.ProductAttributeResponse[]; direct?: API.ProductAttributeResponse[] }) ||
    {};

  return (
    <Drawer
      title="产品详情"
      placement="right"
      width={800}
      open={visible}
      onClose={onClose}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" tip="加载中..." />
        </div>
      ) : product ? (
        <div>
          <Title level={3}>{product.name}</Title>

          <Descriptions title="基本信息" bordered column={2}>
            <Descriptions.Item label="产品ID">{product.id}</Descriptions.Item>
            <Descriptions.Item label="产品名称">{product.name}</Descriptions.Item>
            <Descriptions.Item label="所属分类" span={2}>
              <Tag color="blue">{categoryPath}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(product.created_at).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {new Date(product.updated_at).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>

          {product.attributes && product.attributes.length > 0 ? (
            <div style={{ marginTop: '24px' }}>
              <Title level={4}>产品属性</Title>

              {groupedAttributes.direct && groupedAttributes.direct.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>直接属性</Text>
                  <Descriptions bordered column={1} style={{ marginTop: '8px' }}>
                    {groupedAttributes.direct.map((attr) => (
                      <Descriptions.Item
                        key={attr.attribute_id}
                        label={
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{attr.display_name}</span>
                            {attr.is_required && <Badge color="red" text="必填" />}
                          </div>
                        }
                      >
                        {renderAttributeValue(attr)}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </div>
              )}

              {groupedAttributes.inherited && groupedAttributes.inherited.length > 0 && (
                <div>
                  <Text strong>继承属性</Text>
                  <Descriptions bordered column={1} style={{ marginTop: '8px' }}>
                    {groupedAttributes.inherited.map((attr) => (
                      <Descriptions.Item
                        key={attr.attribute_id}
                        label={
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{attr.display_name}</span>
                            <Badge color="blue" text="继承" />
                            {attr.is_required && <Badge color="red" text="必填" />}
                          </div>
                        }
                      >
                        {renderAttributeValue(attr)}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </div>
              )}
            </div>
          ) : (
            <Alert
              message="暂无属性信息"
              description="该产品所属分类未绑定任何属性，或属性值未设置。"
              type="info"
              showIcon
              style={{ marginTop: '24px' }}
            />
          )}
        </div>
      ) : (
        <Alert message="加载失败" description="无法加载产品详情，请重试。" type="error" showIcon />
      )}
    </Drawer>
  );
};

export default ProductDetail;
