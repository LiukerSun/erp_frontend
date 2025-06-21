import { deleteAttribute, getAttributes, getAttributeTypes } from '@/services/erp/attribute';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProCard, ProTable } from '@ant-design/pro-components';
import { Button, message, Modal, Space, Tag } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import AttributeForm from './components/AttributeForm';

const AttributeList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [attributeFormVisible, setAttributeFormVisible] = useState(false);
  const [currentAttribute, setCurrentAttribute] = useState<API.AttributeInfo | undefined>(
    undefined,
  );
  const [formTitle, setFormTitle] = useState('');
  const [attributeTypes, setAttributeTypes] = useState<string[]>([]);

  // 获取属性类型列表
  const fetchAttributeTypes = async () => {
    try {
      const response = await getAttributeTypes();
      if (response.success) {
        setAttributeTypes(response.data || []);
      }
    } catch (error) {
      console.error('获取属性类型失败:', error);
    }
  };

  useEffect(() => {
    fetchAttributeTypes();
  }, []);

  // 打开新增属性表单
  const handleAdd = () => {
    setCurrentAttribute(undefined);
    setFormTitle('新增属性');
    setAttributeFormVisible(true);
  };

  // 打开编辑属性表单
  const handleEdit = (record: API.AttributeInfo) => {
    setCurrentAttribute(record);
    setFormTitle('编辑属性');
    setAttributeFormVisible(true);
  };

  // 删除属性
  const handleDelete = async (record: API.AttributeInfo) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除属性"${record.display_name}"吗？`,
      onOk: async () => {
        try {
          const response = await deleteAttribute(record.id);
          if (response.success) {
            message.success('删除成功');
            actionRef.current?.reload();
          } else {
            message.error(response.message || '删除失败');
          }
        } catch (error) {
          message.error('删除失败，请重试');
        }
      },
    });
  };

  // 表单提交成功回调
  const handleFormSuccess = () => {
    setAttributeFormVisible(false);
    actionRef.current?.reload();
  };

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

  // 表格列定义
  const columns: ProColumns<API.AttributeInfo>[] = [
    {
      title: '属性名称',
      dataIndex: 'display_name',
      key: 'display_name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.name}</div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (_, record) => {
        const typeInfo = attributeTypeMap[record.type];
        return <Tag color={typeInfo?.color || 'default'}>{typeInfo?.text || record.type}</Tag>;
      },
      filters: attributeTypes.map((type) => ({
        text: attributeTypeMap[type]?.text || type,
        value: type,
      })),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 200,
    },
    {
      title: '配置',
      key: 'config',
      render: (_, record) => (
        <Space size={4} wrap>
          <Tag color={record.is_required ? 'red' : 'default'}>
            {record.is_required ? '必填' : '可选'}
          </Tag>
          {(record.type === 'select' || record.type === 'multi_select') && (
            <Tag color={record.is_multiple ? 'blue' : 'default'}>
              {record.is_multiple ? '多选' : '单选'}
            </Tag>
          )}
        </Space>
      ),
      filters: [
        { text: '必填', value: 'required' },
        { text: '可选', value: 'optional' },
      ],
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 80,
      render: (_, record) => (
        <Tag color={record.is_active ? 'green' : 'red'}>{record.is_active ? '启用' : '禁用'}</Tag>
      ),
      filters: [
        { text: '启用', value: true },
        { text: '禁用', value: false },
      ],
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
      sorter: true,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      valueType: 'dateTime',
      width: 160,
      sorter: true,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProCard>
        <ProTable<API.AttributeInfo>
          actionRef={actionRef}
          rowKey="id"
          headerTitle="属性列表"
          scroll={{ x: 'max-content' }}
          size="middle"
          toolBarRender={() => [
            <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增属性
            </Button>,
          ]}
          request={async (params, sort, filter) => {
            try {
              const response = await getAttributes({
                page: params.current,
                limit: params.pageSize,
                name: params.display_name,
                type: filter?.type?.[0] as string,
                is_active: filter?.is_active?.[0] as unknown as boolean,
              });

              if (response.success) {
                return {
                  data: response.data.attributes || [],
                  success: true,
                  total: response.data.pagination?.total || 0,
                };
              } else {
                message.error(response.message || '获取数据失败');
                return {
                  data: [],
                  success: false,
                  total: 0,
                };
              }
            } catch (error) {
              message.error('获取数据失败，请重试');
              return {
                data: [],
                success: false,
                total: 0,
              };
            }
          }}
          columns={columns}
          search={{
            labelWidth: 'auto',
            optionRender: (searchConfig, formProps, dom) => [
              ...dom.reverse(),
              <Button
                key="reset"
                onClick={() => {
                  formProps?.form?.resetFields();
                  formProps?.form?.submit();
                }}
              >
                重置
              </Button>,
            ],
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </ProCard>

      {/* 属性表单弹窗 */}
      <AttributeForm
        visible={attributeFormVisible}
        title={formTitle}
        initialValues={currentAttribute}
        attributeTypes={attributeTypes}
        onSuccess={handleFormSuccess}
        onCancel={() => setAttributeFormVisible(false)}
      />
    </PageContainer>
  );
};

export default AttributeList;
