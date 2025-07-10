import {
  addProductToTag,
  getEnabledTags,
  getProductTags,
  removeProductFromTag,
} from '@/services/erp/tags';
import { Button, message, Modal, Select, Spin, Tag } from 'antd';
import React, { useEffect, useState } from 'react';

interface ProductTagManagerProps {
  visible: boolean;
  product: API.Product | undefined;
  onCancel: () => void;
  onSuccess: () => void;
}

const ProductTagManager: React.FC<ProductTagManagerProps> = ({
  visible,
  product,
  onCancel,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [allTags, setAllTags] = useState<API.Tag[]>([]);
  const [productTags, setProductTags] = useState<API.Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  // 获取所有启用的标签
  const fetchAllTags = async () => {
    try {
      const response = await getEnabledTags();
      if (response.success) {
        setAllTags(response.data || []);
      }
    } catch (error) {
      console.error('获取标签列表失败:', error);
      message.error('获取标签列表失败');
    }
  };

  // 获取产品的标签
  const fetchProductTags = async () => {
    if (!product) return;

    try {
      setLoading(true);
      const response = await getProductTags(product.id);
      if (response.success) {
        setProductTags(response.data || []);
        setSelectedTags((response.data || []).map((tag) => tag.id));
      }
    } catch (error) {
      console.error('获取产品标签失败:', error);
      message.error('获取产品标签失败');
    } finally {
      setLoading(false);
    }
  };

  // 添加标签到产品
  const handleAddTags = async () => {
    if (!product) return;

    const tagsToAdd = selectedTags.filter((tagId) => !productTags.some((pt) => pt.id === tagId));

    if (tagsToAdd.length === 0) {
      message.info('没有需要添加的标签');
      return;
    }

    try {
      setLoading(true);
      const promises = tagsToAdd.map((tagId) => addProductToTag(tagId, product.id));

      await Promise.all(promises);
      message.success('标签添加成功');
      await fetchProductTags(); // 重新获取产品标签
      onSuccess();
    } catch (error) {
      console.error('添加标签失败:', error);
      message.error('添加标签失败');
    } finally {
      setLoading(false);
    }
  };

  // 从产品移除标签
  const handleRemoveTag = async (tagId: number) => {
    if (!product) return;

    try {
      setLoading(true);
      await removeProductFromTag(tagId, product.id);
      message.success('标签移除成功');
      await fetchProductTags(); // 重新获取产品标签
      onSuccess();
    } catch (error) {
      console.error('移除标签失败:', error);
      message.error('移除标签失败');
    } finally {
      setLoading(false);
    }
  };

  // 当弹窗打开时加载数据
  useEffect(() => {
    if (visible && product) {
      fetchAllTags();
      fetchProductTags();
    }
  }, [visible, product]);

  // 当选中标签变化时更新
  useEffect(() => {
    if (productTags.length > 0) {
      setSelectedTags(productTags.map((tag) => tag.id));
    }
  }, [productTags]);

  return (
    <Modal
      title={`管理标签 - ${product?.name || ''}`}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="add" type="primary" onClick={handleAddTags} loading={loading}>
          添加选中标签
        </Button>,
      ]}
      width={600}
    >
      <Spin spinning={loading}>
        <div style={{ marginBottom: 16 }}>
          <h4>当前标签</h4>
          <div style={{ marginBottom: 8 }}>
            {productTags.length === 0 ? (
              <span style={{ color: '#999' }}>暂无标签</span>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {productTags.map((tag) => (
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
                    closable
                    onClose={() => handleRemoveTag(tag.id)}
                  >
                    {tag.name}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <h4>选择要添加的标签</h4>
          <Select
            mode="multiple"
            placeholder="请选择要添加的标签"
            style={{ width: '100%' }}
            value={selectedTags}
            onChange={setSelectedTags}
            options={allTags.map((tag) => ({
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '2px',
                      backgroundColor: tag.color || '#cccccc',
                      border: '1px solid #d9d9d9',
                      flexShrink: 0,
                    }}
                  />
                  <span>{tag.name}</span>
                  {productTags.some((pt) => pt.id === tag.id) && (
                    <span style={{ color: '#999', fontSize: '12px' }}>(已添加)</span>
                  )}
                </div>
              ),
              value: tag.id,
              disabled: productTags.some((pt) => pt.id === tag.id),
            }))}
          />
        </div>
      </Spin>
    </Modal>
  );
};

export default ProductTagManager;
