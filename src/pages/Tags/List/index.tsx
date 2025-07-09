import { createTag, deleteTag, getTagList, updateTag } from '@/services/erp';
import { DeleteOutlined, EditOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, message, Popconfirm, Space, Switch, Table, Tag, Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';
import ProductSelector from './components/ProductSelector';
import TagForm from './components/TagForm';

interface TagItem {
  id: number;
  name: string;
  description?: string;
  color: string;
  is_enabled: boolean;
  products?: any[];
  createdAt: string;
  updatedAt: string;
}

const TagsList: React.FC = () => {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [productSelectorVisible, setProductSelectorVisible] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null);

  // 获取标签列表
  const fetchTags = async () => {
    setLoading(true);
    try {
      const response = await getTagList();
      if (response.success) {
        setTags(response.data);
      }
    } catch (error) {
      message.error('获取标签列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // 创建或更新标签
  const handleSaveTag = async (values: any) => {
    try {
      if (editingTag) {
        await updateTag(editingTag.id, values);
        message.success('标签更新成功');
      } else {
        await createTag(values);
        message.success('标签创建成功');
      }
      setModalVisible(false);
      setEditingTag(null);
      fetchTags();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 删除标签
  const handleDeleteTag = async (id: number) => {
    try {
      await deleteTag(id);
      message.success('标签删除成功');
      fetchTags();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 切换标签状态
  const handleToggleStatus = async (tag: TagItem) => {
    try {
      await updateTag(tag.id, {
        ...tag,
        is_enabled: !tag.is_enabled,
      });
      message.success('状态更新成功');
      fetchTags();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  // 查看标签下的产品
  const handleViewProducts = async (tag: TagItem) => {
    setSelectedTag(tag);
    setProductSelectorVisible(true);
  };

  const columns = [
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TagItem) => (
        <Tag color={record.color} style={{ fontSize: '14px', padding: '4px 8px' }}>
          {text}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      render: (color: string) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: color,
              borderRadius: '4px',
              marginRight: '8px',
            }}
          />
          {color}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (enabled: boolean, record: TagItem) => (
        <Switch
          checked={enabled}
          onChange={() => handleToggleStatus(record)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '产品数量',
      key: 'product_count',
      render: (record: TagItem) => <span>{record.products?.length || 0} 个产品</span>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: TagItem) => (
        <Space>
          <Tooltip title="编辑标签">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingTag(record);
                setModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="管理产品">
            <Button
              type="link"
              icon={<LinkOutlined />}
              onClick={() => handleViewProducts(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个标签吗？"
            onConfirm={() => handleDeleteTag(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除标签">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <Card
        title="标签管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingTag(null);
              setModalVisible(true);
            }}
          >
            新建标签
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={tags}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 标签表单模态框 */}
      <TagForm
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingTag(null);
        }}
        onOk={handleSaveTag}
        initialValues={editingTag}
      />

      {/* 产品选择器模态框 */}
      <ProductSelector
        visible={productSelectorVisible}
        tag={selectedTag}
        onCancel={() => {
          setProductSelectorVisible(false);
          setSelectedTag(null);
        }}
        onOk={() => {
          setProductSelectorVisible(false);
          setSelectedTag(null);
          fetchTags();
        }}
      />
    </PageContainer>
  );
};

export default TagsList;
