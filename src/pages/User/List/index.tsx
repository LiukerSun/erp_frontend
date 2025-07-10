import { useCommonList } from '@/hooks/useCommonList';
import { userApi } from '@/services/erp/base';
import {
  createIdColumn,
  createNameColumn,
  createStatusColumn,
  createTimeColumn,
} from '@/utils/tableColumns';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Button, Tag } from 'antd';
import React from 'react';
import UserForm from './components/UserForm';

const UserList: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const loginUser = initialState?.currentUser;

  const {
    actionRef,
    formVisible,
    currentData,
    formTitle,
    handleCreate,
    handleEdit,
    handleDelete,
    handleFormSuccess,
    handleFormCancel,
  } = useCommonList<API.UserInfo>({
    deleteFn: userApi.delete,
    beforeDelete: (record) => {
      // 检查是否删除自己的账户
      if (loginUser?.id === record.id) {
        return false;
      }
      return true;
    },
  });

  const columns: ProColumns<API.UserInfo>[] = [
    createIdColumn(),
    createNameColumn('username', '用户名', 120),
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
      copyable: true,
      search: false,
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 100,
      search: false,
      render: (_, record) => {
        const color = record.role === 'admin' ? 'red' : 'blue';
        const text = record.role === 'admin' ? '管理员' : '普通用户';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    createStatusColumn('is_active', '状态', 100),
    createTimeColumn('created_at'),
    {
      title: '操作',
      valueType: 'option',
      width: 240,
      render: (_, record) => {
        const isCurrentUser = loginUser?.id === record.id;

        return [
          <Button key="edit" type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>,
          <Button
            key="delete"
            type="link"
            size="small"
            danger
            disabled={isCurrentUser}
            title={isCurrentUser ? '不能删除自己的账户' : ''}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>,
        ];
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.UserInfo>
        headerTitle="用户列表"
        actionRef={actionRef}
        rowKey="id"
        search={false}
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={handleCreate}>
            新增用户
          </Button>,
        ]}
        request={async (params) => {
          try {
            const searchParams: API.GetUserListParams = {
              page: params.current || 1,
              limit: params.pageSize || 10,
            };

            const response = await userApi.getList(searchParams);

            if (response.success) {
              return {
                data: response.data?.items || [],
                success: true,
                total: response.data?.total || 0,
              };
            } else {
              return {
                data: [],
                success: false,
                total: 0,
              };
            }
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
          showQuickJumper: true,
          showSizeChanger: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
      />

      <UserForm
        visible={formVisible}
        title={formTitle}
        user={currentData}
        onVisibleChange={(visible) => {
          if (!visible) {
            handleFormCancel();
          }
        }}
        onSuccess={handleFormSuccess}
      />
    </PageContainer>
  );
};

export default UserList;
