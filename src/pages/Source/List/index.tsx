import { deleteSource, getSourceList } from '@/services/erp/source';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import SourceForm from './components/SourceForm';

const SourceList: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>();
  const [sourceFormVisible, setSourceFormVisible] = useState(false);
  const [currentSource, setCurrentSource] = useState<API.Source | undefined>(undefined);
  const [formTitle, setFormTitle] = useState('');

  // 打开新增货源表单
  const handleAdd = () => {
    setCurrentSource(undefined);
    setFormTitle('新增货源');
    setSourceFormVisible(true);
  };

  // 打开编辑货源表单
  const handleEdit = (record: API.Source) => {
    setCurrentSource(record);
    setFormTitle('编辑货源');
    setSourceFormVisible(true);
  };

  // 删除货源
  const handleDelete = async (record: API.Source) => {
    try {
      const response = await deleteSource(record.id);
      if (response.success) {
        message.success('删除成功');
        actionRef.current?.reload();
      } else {
        message.error(response.error || response.message || '删除失败');
      }
    } catch (error: any) {
      console.error('Delete error:', error);

      let errorMessage = '删除失败，请重试';
      if (error?.response?.data) {
        const errorData = error.response.data;
        errorMessage = errorData.error || errorData.message || errorMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      message.error(errorMessage);
    }
  };

  // 表单提交成功回调
  const handleFormSuccess = () => {
    setSourceFormVisible(false);
    actionRef.current?.reload();
  };

  const columns: ProColumns<API.Source>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      fixed: 'left',
    },
    {
      title: '货源名称',
      dataIndex: 'name',
      width: 140,
      copyable: true,
      ellipsis: true,
      fixed: 'left',
    },
    {
      title: '货源编码',
      dataIndex: 'code',
      width: 120,
      copyable: true,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (_, record) => {
        const color = record.status === 1 ? 'green' : 'red';
        const text = record.status === 1 ? '启用' : '禁用';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 120,
      ellipsis: true,
      hideInTable: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 140,
      render: (_, record) => {
        return new Date(record.createdAt).toLocaleString('zh-CN');
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
          title="确定要删除这个货源吗？"
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
      <ProTable<API.Source>
        headerTitle="货源列表"
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 1200 }}
        size="small"
        search={false}
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={handleAdd}>
            新增货源
          </Button>,
        ]}
        request={async (params) => {
          try {
            const searchParams: API.GetSourceListParams = {
              page: params.current || 1,
              page_size: params.pageSize || 10,
            };

            const response = await getSourceList(searchParams);

            if (response.success) {
              return {
                data: response.data?.items || [],
                success: true,
                total: response.data?.total || 0,
              };
            } else {
              message.error(response.error || response.message || '获取货源列表失败');
              return {
                data: [],
                success: false,
                total: 0,
              };
            }
          } catch (error: any) {
            console.error('Get source list error:', error);

            let errorMessage = '获取货源列表失败，请重试';
            if (error?.response?.data) {
              const errorData = error.response.data;
              errorMessage = errorData.error || errorData.message || errorMessage;
            } else if (error?.message) {
              errorMessage = error.message;
            }

            message.error(errorMessage);
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        columns={columns}
        pagination={{
          showQuickJumper: true,
          showSizeChanger: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
      />

      <SourceForm
        visible={sourceFormVisible}
        title={formTitle}
        source={currentSource}
        onCancel={() => setSourceFormVisible(false)}
        onSuccess={handleFormSuccess}
      />
    </PageContainer>
  );
};

export default SourceList;
