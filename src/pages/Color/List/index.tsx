import { createColor, deleteColor, getColorList } from '@/services/erp/color';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Card, Empty, Form, Input, message, Popconfirm, Space } from 'antd';
import React, { useRef, useState } from 'react';
import ColorForm from './components/ColorForm';

const ColorList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [colorFormVisible, setColorFormVisible] = useState(false);
  const [currentColor, setCurrentColor] = useState<API.Color | undefined>(undefined);
  const [formTitle, setFormTitle] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [colorList, setColorList] = useState<API.Color[]>([]);
  const [quickCreateForm] = Form.useForm();
  const [quickCreating, setQuickCreating] = useState(false);

  // 打开新增颜色表单
  const handleAdd = () => {
    setCurrentColor(undefined);
    setFormTitle('新增颜色');
    setColorFormVisible(true);
  };

  // 打开编辑颜色表单
  const handleEdit = (record: API.Color) => {
    setCurrentColor(record);
    setFormTitle('编辑颜色');
    setColorFormVisible(true);
  };

  // 删除颜色
  const handleDelete = async (record: API.Color) => {
    try {
      const response = await deleteColor(record.id);
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

  // 表单提交成功回调
  const handleFormSuccess = () => {
    setColorFormVisible(false);
    actionRef.current?.reload();
  };

  // 快速创建颜色
  const handleQuickCreate = async () => {
    try {
      const values = await quickCreateForm.validateFields();
      setQuickCreating(true);

      const response = await createColor({
        name: values.name,
        code: values.code,
      });

      if (response.success) {
        message.success('快速创建成功');
        quickCreateForm.resetFields();
        actionRef.current?.reload();
      } else {
        message.error(response.message || '创建失败');
      }
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误，不显示错误消息
        return;
      }
      message.error('创建失败，请重试');
    } finally {
      setQuickCreating(false);
    }
  };

  // 检查是否显示快速创建组件
  const shouldShowQuickCreate = () => {
    if (!searchValue.trim()) return false;
    return !colorList.some(
      (color) =>
        color.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        (color.code && color.code.toLowerCase().includes(searchValue.toLowerCase())),
    );
  };

  // 快速创建组件
  const renderQuickCreate = () => {
    if (!shouldShowQuickCreate()) return null;

    return (
      <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f8f9fa' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={`未找到与 "${searchValue}" 相关的颜色`}
            style={{ margin: 0, flex: 1 }}
          />
        </div>
        <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: 12 }}>
          <div style={{ marginBottom: 8, fontWeight: 500, color: '#1890ff' }}>
            <PlusOutlined /> 快速创建新颜色
          </div>
          <Form
            form={quickCreateForm}
            layout="inline"
            onFinish={handleQuickCreate}
            initialValues={{ name: searchValue }}
          >
            <Form.Item
              name="name"
              rules={[{ required: true, message: '请输入颜色名称' }]}
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="颜色名称" style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="code" style={{ marginBottom: 0 }}>
              <Input placeholder="颜色代码（可选）" style={{ width: 140 }} />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={quickCreating} size="small">
                快速创建
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Card>
    );
  };

  const columns: ProColumns<API.Color>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
      fixed: 'left',
    },
    {
      title: '颜色名称',
      dataIndex: 'name',
      width: 140,
      copyable: true,
      ellipsis: true,
      fixed: 'left',
    },
    {
      title: '颜色代码',
      dataIndex: 'code',
      width: 120,
      search: false,
      render: (_, record) => record.code || '-',
    },
    {
      title: '颜色值',
      dataIndex: 'hex_color',
      width: 120,
      search: false,
      render: (_, record) => {
        if (!record.hex_color) return '-';
        return (
          <Space>
            <div
              style={{
                width: 16,
                height: 16,
                backgroundColor: record.hex_color,
                border: '1px solid #ccc',
                borderRadius: 2,
              }}
            />
            <span>{record.hex_color}</span>
          </Space>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      search: false,
      render: (_, record) => {
        return new Date(record.createdAt).toLocaleString('zh-CN');
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      search: false,
      render: (_, record) => {
        return new Date(record.updatedAt).toLocaleString('zh-CN');
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      fixed: 'right',
      render: (_, record) => [
        <Button key="edit" type="link" size="small" onClick={() => handleEdit(record)}>
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除这个颜色吗？"
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
    <PageContainer
      header={{
        title: '颜色管理',
        subTitle: '管理商品的颜色信息',
      }}
    >
      <ProTable<API.Color>
        headerTitle="颜色列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        onSubmit={(params: any) => {
          setSearchValue(params.name || '');
        }}
        onReset={() => {
          setSearchValue('');
          quickCreateForm.resetFields();
        }}
        toolBarRender={() => [
          <Button type="primary" key="primary" onClick={handleAdd}>
            新增颜色
          </Button>,
        ]}
        tableRender={(_, dom) => (
          <div>
            {renderQuickCreate()}
            {dom}
          </div>
        )}
        request={async (params) => {
          try {
            const response = await getColorList();
            if (response.success) {
              const data = response.data || [];
              setColorList(data);

              // 如果有搜索条件，进行前端过滤
              let filteredData = data;
              if (params.name) {
                filteredData = data.filter(
                  (item) =>
                    item.name.toLowerCase().includes(params.name.toLowerCase()) ||
                    (item.code && item.code.toLowerCase().includes(params.name.toLowerCase())),
                );
              }

              return {
                data: filteredData,
                success: true,
                total: filteredData.length,
              };
            }
            return {
              data: [],
              success: false,
              total: 0,
            };
          } catch (error) {
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
        scroll={{ x: 800 }}
      />

      <ColorForm
        visible={colorFormVisible}
        onVisibleChange={setColorFormVisible}
        onSuccess={handleFormSuccess}
        title={formTitle}
        current={currentColor}
      />
    </PageContainer>
  );
};

export default ColorList;
