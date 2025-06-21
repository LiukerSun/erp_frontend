import {
  bindAttributeToCategory,
  getAttributeInheritancePath,
  getAttributes,
  getCategoryAttributesWithInheritance,
  unbindAttributeFromCategory,
  updateCategoryAttribute,
} from '@/services/erp/attribute';
import {
  ApartmentOutlined,
  BranchesOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Checkbox,
  Collapse,
  Form,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface CategoryAttributeManagerProps {
  visible: boolean;
  category: API.CategoryInfo | null;
  onCancel: () => void;
}

interface EditingAttribute {
  id: number;
  is_required: boolean;
  sort: number;
}

interface InheritancePathInfo {
  [attributeId: number]: API.AttributeInheritancePathResponse;
}

const CategoryAttributeManager: React.FC<CategoryAttributeManagerProps> = ({
  visible,
  category,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categoryAttributes, setCategoryAttributes] = useState<
    API.CategoryAttributeWithInheritanceInfo[]
  >([]);
  const [allAttributes, setAllAttributes] = useState<API.AttributeInfo[]>([]);
  const [editingAttribute, setEditingAttribute] = useState<EditingAttribute | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [inheritancePathInfo, setInheritancePathInfo] = useState<InheritancePathInfo>({});

  // 属性类型映射
  const attributeTypeMap: Record<string, { text: string; color: string }> = {
    text: { text: '文本', color: 'blue' },
    number: { text: '数字', color: 'green' },
    select: { text: '单选列表', color: 'orange' },
    multi_select: { text: '多选列表', color: 'purple' },
    boolean: { text: '布尔值', color: 'cyan' },
    date: { text: '日期', color: 'magenta' },
    datetime: { text: '日期时间', color: 'volcano' },
    url: { text: 'URL链接', color: 'lime' },
    email: { text: '邮箱地址', color: 'geekblue' },
    color: { text: '颜色选择', color: 'gold' },
    currency: { text: '货币金额', color: 'red' },
  };

  // 获取继承路径信息
  const fetchInheritancePaths = async (attributes: API.CategoryAttributeWithInheritanceInfo[]) => {
    if (!category) return;

    const inheritedAttributes = attributes.filter((attr) => attr.is_inherited);
    const pathPromises = inheritedAttributes.map(async (attr) => {
      try {
        const response = await getAttributeInheritancePath(category.id, attr.attribute_id);
        if (response.success) {
          return { attributeId: attr.attribute_id, path: response.data };
        }
      } catch (error) {
        console.error(
          `Failed to fetch inheritance path for attribute ${attr.attribute_id}:`,
          error,
        );
      }
      return null;
    });

    const paths = await Promise.all(pathPromises);
    const pathInfo: InheritancePathInfo = {};
    paths.forEach((path) => {
      if (path) {
        pathInfo[path.attributeId] = path.path;
      }
    });

    setInheritancePathInfo(pathInfo);
  };

  // 获取分类属性列表（包含继承）
  const fetchCategoryAttributes = async () => {
    if (!category) return;

    setLoading(true);
    try {
      const response = await getCategoryAttributesWithInheritance(category.id);
      if (response.success) {
        const attributes = response.data.attributes || [];
        setCategoryAttributes(attributes);

        // 获取继承属性的详细路径信息
        await fetchInheritancePaths(attributes);
      } else {
        message.error(response.message || '获取分类属性失败');
      }
    } catch (error) {
      message.error('获取分类属性失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取所有属性列表
  const fetchAllAttributes = async () => {
    try {
      const response = await getAttributes({ limit: 1000, is_active: true });
      if (response.success) {
        setAllAttributes(response.data.attributes || []);
      } else {
        message.error(response.message || '获取属性列表失败');
      }
    } catch (error) {
      message.error('获取属性列表失败，请重试');
    }
  };

  useEffect(() => {
    if (visible && category) {
      fetchCategoryAttributes();
      fetchAllAttributes();
    }
  }, [visible, category]);

  // 显示继承路径详情
  const showInheritancePath = (attributeId: number) => {
    const pathInfo = inheritancePathInfo[attributeId];
    if (!pathInfo) return;

    const attr = categoryAttributes.find((a) => a.attribute_id === attributeId);
    if (!attr) return;

    Modal.info({
      title: `属性继承路径 - ${attr.attribute.display_name}`,
      width: 600,
      content: (
        <div>
          <Alert
            message="继承规则说明"
            description="属性按继承层级显示，子分类的设置优先于父分类。相同属性在继承链中去重显示。"
            type="info"
            style={{ marginBottom: 16 }}
          />
          <div>
            {pathInfo.path.map((pathItem, index) => (
              <div key={index} style={{ marginBottom: 8, paddingLeft: index * 20 }}>
                <Space>
                  <ApartmentOutlined />
                  <Text strong>分类 ID: {pathItem.category_id}</Text>
                  <Tag color={pathItem.is_required ? 'red' : 'default'}>
                    {pathItem.is_required ? '必填' : '可选'}
                  </Tag>
                  <Text type="secondary">排序: {pathItem.sort}</Text>
                  {index === pathInfo.path.length - 1 && <Tag color="green">当前生效</Tag>}
                </Space>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  };

  // 渲染继承来源信息
  const renderInheritanceInfo = (record: API.CategoryAttributeWithInheritanceInfo) => {
    if (!record.is_inherited) return null;

    const pathInfo = inheritancePathInfo[record.attribute_id];
    const levelText = pathInfo?.path?.length > 1 ? `${pathInfo.path.length}级继承` : '继承';

    return (
      <Space>
        <Tooltip title={`继承自分类 ID: ${record.inherited_from}`}>
          <Tag icon={<LinkOutlined />} color="blue">
            {levelText}
          </Tag>
        </Tooltip>
        {pathInfo && (
          <Tooltip title="查看继承路径">
            <Button
              type="link"
              size="small"
              icon={<BranchesOutlined />}
              onClick={() => showInheritancePath(record.attribute_id)}
            >
              路径
            </Button>
          </Tooltip>
        )}
      </Space>
    );
  };

  // 添加属性绑定
  const handleAddAttribute = async (values: {
    attribute_ids: number[];
    is_required: boolean;
    sort: number;
  }) => {
    if (!category) return;

    setLoading(true);
    try {
      // 批量绑定属性
      const promises = values.attribute_ids.map((attributeId) =>
        bindAttributeToCategory({
          category_id: category.id,
          attribute_id: attributeId,
          is_required: values.is_required,
          sort: values.sort,
        }),
      );

      await Promise.all(promises);
      message.success('属性绑定成功');
      setAddModalVisible(false);
      form.resetFields();
      await fetchCategoryAttributes();
    } catch (error) {
      message.error('属性绑定失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 解绑属性
  const handleUnbindAttribute = async (attributeId: number) => {
    if (!category) return;

    Modal.confirm({
      title: '确认解绑',
      content: '确定要解绑这个属性吗？注意：子分类仍会继承此属性。',
      onOk: async () => {
        try {
          const response = await unbindAttributeFromCategory({
            category_id: category.id,
            attribute_id: attributeId,
          });
          if (response.success) {
            message.success('属性解绑成功');
            await fetchCategoryAttributes();
          } else {
            message.error(response.message || '属性解绑失败');
          }
        } catch (error) {
          message.error('属性解绑失败，请重试');
        }
      },
    });
  };

  // 开始编辑属性
  const handleStartEdit = (record: API.CategoryAttributeWithInheritanceInfo) => {
    setEditingAttribute({
      id: record.id,
      is_required: record.is_required,
      sort: record.sort,
    });
  };

  // 保存编辑
  const handleSaveEdit = async (record: API.CategoryAttributeWithInheritanceInfo) => {
    if (!category || !editingAttribute) return;

    try {
      const response = await updateCategoryAttribute(category.id, record.attribute_id, {
        is_required: editingAttribute.is_required,
        sort: editingAttribute.sort,
      });
      if (response.success) {
        message.success('更新成功');
        setEditingAttribute(null);
        await fetchCategoryAttributes();
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error) {
      message.error('更新失败，请重试');
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingAttribute(null);
  };

  // 获取可绑定的属性选项
  const getAvailableAttributes = () => {
    const boundAttributeIds = categoryAttributes.map((item) => item.attribute_id);
    return allAttributes.filter((attr) => !boundAttributeIds.includes(attr.id));
  };

  // 获取直接绑定的属性（非继承的）
  const getDirectAttributes = () => {
    return categoryAttributes.filter((attr) => !attr.is_inherited);
  };

  // 获取继承的属性，按照继承层级分组
  const getInheritedAttributesByLevel = () => {
    const inheritedAttributes = categoryAttributes.filter((attr) => attr.is_inherited);
    const grouped: { [level: number]: API.CategoryAttributeWithInheritanceInfo[] } = {};

    inheritedAttributes.forEach((attr) => {
      const level = attr.inherited_from || 0;
      if (!grouped[level]) {
        grouped[level] = [];
      }
      grouped[level].push(attr);
    });

    // 按照层级排序（父级在前）
    const sortedLevels = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));
    return sortedLevels.map((level) => ({
      level: Number(level),
      attributes: grouped[Number(level)].sort((a, b) => a.sort - b.sort),
    }));
  };

  // 排序函数：直接属性在前，然后按sort排序
  const sortAttributes = (attributes: API.CategoryAttributeWithInheritanceInfo[]) => {
    return [...attributes].sort((a, b) => {
      // 直接绑定的属性优先
      if (!a.is_inherited && b.is_inherited) return -1;
      if (a.is_inherited && !b.is_inherited) return 1;

      // 相同类型按sort排序
      return a.sort - b.sort;
    });
  };

  // 表格列定义
  const columns: ColumnsType<API.CategoryAttributeWithInheritanceInfo> = [
    {
      title: '属性名称',
      dataIndex: ['attribute', 'display_name'],
      key: 'display_name',
      render: (text, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 'bold' }}>{text}</span>
            {renderInheritanceInfo(record)}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.attribute.name}</div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: ['attribute', 'type'],
      key: 'type',
      render: (type) => {
        const typeInfo = attributeTypeMap[type];
        return <Tag color={typeInfo?.color || 'default'}>{typeInfo?.text || type}</Tag>;
      },
    },
    {
      title: '是否必填',
      dataIndex: 'is_required',
      key: 'is_required',
      render: (is_required, record) => {
        if (editingAttribute && editingAttribute.id === record.id && !record.is_inherited) {
          return (
            <Checkbox
              checked={editingAttribute.is_required}
              onChange={(e) =>
                setEditingAttribute({
                  ...editingAttribute,
                  is_required: e.target.checked,
                })
              }
            />
          );
        }
        return (
          <Space>
            <Tag color={is_required ? 'red' : 'default'}>{is_required ? '必填' : '可选'}</Tag>
            {record.is_inherited && (
              <Tooltip title="继承的属性配置，优先级高于父分类">
                <Tag color="blue">优先</Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      render: (sort, record) => {
        if (editingAttribute && editingAttribute.id === record.id && !record.is_inherited) {
          return (
            <InputNumber
              value={editingAttribute.sort}
              min={0}
              size="small"
              style={{ width: 80 }}
              onChange={(value) =>
                setEditingAttribute({
                  ...editingAttribute,
                  sort: value || 0,
                })
              }
            />
          );
        }
        return sort;
      },
    },
    {
      title: '来源',
      key: 'source',
      render: (_, record) => {
        if (record.is_inherited) {
          return (
            <Tooltip title={`继承自分类 ID: ${record.inherited_from}`}>
              <Tag color="blue">分类 {record.inherited_from}</Tag>
            </Tooltip>
          );
        }
        return <Tag color="green">当前分类</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        // 继承的属性不允许编辑和删除
        if (record.is_inherited) {
          return (
            <Tooltip title="继承的属性不能修改，如需更改请在父分类中操作">
              <Text type="secondary">不可编辑</Text>
            </Tooltip>
          );
        }

        return (
          <Space size="small">
            {editingAttribute && editingAttribute.id === record.id ? (
              <>
                <Button
                  type="link"
                  size="small"
                  icon={<SaveOutlined />}
                  onClick={() => handleSaveEdit(record)}
                >
                  保存
                </Button>
                <Button
                  type="link"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={handleCancelEdit}
                >
                  取消
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleStartEdit(record)}
                >
                  编辑
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleUnbindAttribute(record.attribute_id)}
                >
                  解绑
                </Button>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  const directAttributes = getDirectAttributes();
  const inheritedAttributesByLevel = getInheritedAttributesByLevel();
  const allCategoryAttributes = sortAttributes(categoryAttributes);

  return (
    <>
      <Modal
        title={`管理分类属性 - ${category?.name}`}
        open={visible}
        onCancel={onCancel}
        width={1000}
        footer={null}
      >
        <div style={{ marginBottom: '16px' }}>
          <Alert
            message="🔧 继承规则"
            description={
              <div>
                <p>
                  <strong>层级继承:</strong> 子分类自动继承所有父分类（包括祖父分类）的属性
                </p>
                <p>
                  <strong>优先级:</strong> 子分类的属性设置优先于父分类
                </p>
                <p>
                  <strong>去重:</strong> 相同属性在继承链中只出现一次
                </p>
                <p>
                  <strong>排序:</strong> 按照分类层级和属性排序显示
                </p>
              </div>
            }
            type="info"
            icon={<InfoCircleOutlined />}
            showIcon
            closable
          />
        </div>

        <Collapse defaultActiveKey={['direct']} style={{ marginBottom: 16 }}>
          <Panel header={`直接绑定属性 (${directAttributes.length})`} key="direct">
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddModalVisible(true)}
                disabled={getAvailableAttributes().length === 0}
              >
                添加属性
              </Button>
            </div>
            <Table
              dataSource={directAttributes}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
            />
            {directAttributes.length === 0 && (
              <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>
                暂无直接绑定属性
              </div>
            )}
          </Panel>

          {inheritedAttributesByLevel.length > 0 && (
            <Panel
              header={`继承属性 (${categoryAttributes.filter((a) => a.is_inherited).length})`}
              key="inherited"
            >
              {inheritedAttributesByLevel.map(({ level, attributes }) => (
                <div key={level} style={{ marginBottom: 16 }}>
                  <Title level={5}>
                    <ApartmentOutlined /> 继承自分类 ID: {level} ({attributes.length} 个属性)
                  </Title>
                  <Table
                    dataSource={attributes}
                    columns={columns}
                    rowKey={(record) => `inherited_${level}_${record.id}`}
                    pagination={false}
                    size="small"
                    style={{ marginBottom: 16 }}
                  />
                </div>
              ))}
            </Panel>
          )}

          <Panel header={`所有属性统计 (${allCategoryAttributes.length})`} key="all">
            <Table
              dataSource={allCategoryAttributes}
              columns={columns}
              rowKey={(record) => `all_${record.id}`}
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              size="small"
            />
          </Panel>
        </Collapse>
      </Modal>

      {/* 添加属性弹窗 */}
      <Modal
        title="添加属性"
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleAddAttribute}>
          <Form.Item
            name="attribute_ids"
            label="选择属性"
            rules={[{ required: true, message: '请选择要绑定的属性' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择属性"
              showSearch
              filterOption={(input, option) =>
                String(option?.label || '')
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {getAvailableAttributes().map((attr) => (
                <Select.Option key={attr.id} value={attr.id} label={attr.display_name}>
                  {attr.display_name} ({attr.name})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="is_required" label="是否必填" valuePropName="checked">
            <Checkbox>设为必填属性</Checkbox>
          </Form.Item>
          <Form.Item
            name="sort"
            label="排序值"
            initialValue={0}
            rules={[{ required: true, message: '请输入排序值' }]}
          >
            <InputNumber min={0} placeholder="请输入排序值" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CategoryAttributeManager;
