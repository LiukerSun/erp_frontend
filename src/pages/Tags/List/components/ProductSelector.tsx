import {
  addProductToTag,
  getProductList,
  getTagProducts,
  removeProductFromTag,
} from '@/services/erp';
import { Button, Card, Col, Input, message, Modal, Row, Table, Tag, Transfer } from 'antd';
import React, { useEffect, useState } from 'react';

interface ProductItem {
  id: number;
  name: string;
  sku: string;
  product_code?: string;
  price: number;
  is_enabled: boolean;
}

interface TagItem {
  id: number;
  name: string;
  color: string;
  products?: ProductItem[];
}

interface ProductSelectorProps {
  visible: boolean;
  tag: TagItem | null;
  onCancel: () => void;
  onOk: () => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ visible, tag, onCancel, onOk }) => {
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [tagProducts, setTagProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false); // 跟踪是否有数据变化
  const [searchValue, setSearchValue] = useState(''); // 搜索值

  // 获取所有产品
  const fetchAllProducts = async () => {
    try {
      const response = await getProductList({ page_size: 1000 });
      if (response.success) {
        setAllProducts(response.data.items || []);
      }
    } catch (error) {
      message.error('获取产品列表失败');
    }
  };

  // 获取标签下的产品
  const fetchTagProducts = async () => {
    if (!tag) return;

    setLoading(true);
    try {
      const response = await getTagProducts(tag.id);
      if (response.success) {
        setTagProducts(response.data);
      }
    } catch (error) {
      message.error('获取标签产品失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && tag) {
      fetchAllProducts();
      fetchTagProducts();
      setHasChanges(false); // 重置变化状态
    }
  }, [visible, tag]);

  // 添加产品到标签
  const handleAddProducts = async () => {
    if (!tag || selectedKeys.length === 0) return;

    try {
      for (const productId of selectedKeys) {
        await addProductToTag(tag.id, parseInt(productId));
      }
      message.success('产品添加成功');
      setSelectedKeys([]);
      fetchTagProducts();
      setHasChanges(true); // 标记有变化
    } catch (error) {
      message.error('添加产品失败');
    }
  };

  // 从标签移除产品
  const handleRemoveProduct = async (productId: number) => {
    if (!tag) return;

    try {
      await removeProductFromTag(tag.id, productId);
      message.success('产品移除成功');
      fetchTagProducts();
      setHasChanges(true); // 标记有变化
    } catch (error) {
      message.error('移除产品失败');
    }
  };

  // 处理关闭事件
  const handleClose = () => {
    if (hasChanges) {
      // 如果有变化，调用onOk来刷新父组件
      onOk();
    } else {
      // 如果没有变化，直接关闭
      onCancel();
    }
  };

  // 过滤掉已经在标签中的产品
  const availableProducts = allProducts.filter(
    (product) => !tagProducts.find((tp) => tp.id === product.id),
  );

  // 根据搜索值过滤标签下的产品
  const filteredTagProducts = tagProducts.filter((product) => {
    if (!searchValue) return true;
    const searchLower = searchValue.toLowerCase();
    const sku = product.sku?.toLowerCase() || '';
    return sku.includes(searchLower);
  });

  const handleTransferChange = (targetKeys: React.Key[]) => {
    setSelectedKeys(targetKeys.map((key) => key.toString()));
  };

  const columns = [
    {
      title: '产品名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>{enabled ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: ProductItem) => (
        <Button type="link" danger onClick={() => handleRemoveProduct(record.id)}>
          移除
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={`管理标签"${tag?.name}"的产品`}
      open={visible}
      onCancel={handleClose}
      onOk={handleClose}
      width={1600}
      footer={null}
      destroyOnClose
    >
      <Row gutter={16}>
        <Col span={12}>
          <Card title="可添加的产品" size="small">
            <Transfer
              dataSource={availableProducts.map((product) => ({
                key: product.id.toString(),
                title: product.sku,
                description: product.name,
              }))}
              titles={['可选产品', '待添加']}
              targetKeys={selectedKeys}
              onChange={handleTransferChange}
              render={(item) => item.title}
              listStyle={{
                width: 320,
                height: 400,
              }}
              showSearch
              filterOption={(inputValue, item) => {
                const sku = item.title?.toLowerCase() || '';
                const name = item.description?.toLowerCase() || '';
                const searchValue = inputValue.toLowerCase();
                return sku.includes(searchValue) || name.includes(searchValue);
              }}
            />
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button
                type="primary"
                onClick={handleAddProducts}
                disabled={selectedKeys.length === 0}
              >
                添加选中产品
              </Button>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="标签下的产品"
            size="small"
            extra={
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', color: '#666' }}>产品数量</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                  {filteredTagProducts.length}
                </div>
              </div>
            }
          >
            <div style={{ marginBottom: 16 }}>
              <Input.Search
                placeholder="搜索SKU"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                style={{ width: '100%' }}
                allowClear
              />
            </div>
            <Table
              columns={columns}
              dataSource={filteredTagProducts}
              rowKey="id"
              loading={loading}
              size="small"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
              }}
              scroll={{ y: 350 }}
            />
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

export default ProductSelector;
