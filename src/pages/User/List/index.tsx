import { deleteUser, getUserList, toggleUserStatus } from '@/services/erp/user';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import UserForm from './components/UserForm';

const UserList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [userFormVisible, setUserFormVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<API.UserInfo | undefined>(undefined);
  const [formTitle, setFormTitle] = useState('');

  // 打开新增用户表单
  const handleAdd = () => {
    setCurrentUser(undefined);
    setFormTitle('新增用户');
    setUserFormVisible(true);
  };

  // 打开编辑用户表单
  const handleEdit = (record: API.UserInfo) => {
    setCurrentUser(record);
    setFormTitle('编辑用户');
    setUserFormVisible(true);
  };

  // 删除用户
  const handleDelete = async (record: API.UserInfo) => {
    try {
      const response = await deleteUser(record.id);
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

  // 切换用户状态
  const handleToggleStatus = async (record: API.UserInfo) => {
    try {
      const response = await toggleUserStatus(record.id);
      if (response.success) {
        message.success('状态切换成功');
        actionRef.current?.reload();
      } else {
        message.error(response.message || '状态切换失败');
      }
    } catch (error) {
      message.error('状态切换失败，请重试');
    }
  };

  // 表单提交成功回调
  const handleFormSuccess = () => {
    setUserFormVisible(false);
    actionRef.current?.reload();
  };

  const columns: ProColumns<API.UserInfo>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      width: 120,
      copyable: true,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 200,
      copyable: true,
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 100,
      valueEnum: {
        admin: { text: '管理员', status: 'Error' },
        user: { text: '普通用户', status: 'Processing' },
      },
      fieldProps: {
        placeholder: '请选择角色',
      },
      render: (_, record) => {
        const color = record.role === 'admin' ? 'red' : 'blue';
        const text = record.role === 'admin' ? '管理员' : '普通用户';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 100,
      valueEnum: {
        true: { text: '活跃', status: 'Success' },
        false: { text: '禁用', status: 'Error' },
      },
      render: (_, record) => {
        const color = record.is_active ? 'green' : 'red';
        const text = record.is_active ? '活跃' : '禁用';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      search: false,
      render: (_: any, record: API.UserInfo) => {
        return new Date(record.created_at).toLocaleString('zh-CN');
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          size="small"
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>,
        <Button
          key="toggle"
          type="link"
          size="small"
          onClick={() => handleToggleStatus(record)}
        >
          {record.is_active ? '禁用' : '启用'}
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除这个用户吗？"
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
      <ProTable<API.UserInfo>
        headerTitle="用户列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
          collapsed: false,
          collapseRender: false,
        }}
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={handleAdd}>
            新增用户
          </Button>,
        ]}
        request={async (params) => {
          try {
            // 构建搜索参数
            const searchParams: API.GetUserListParams = {
              page: params.current || 1,
              limit: params.pageSize || 10,
            };

            // 添加搜索条件
            if (params.username) {
              searchParams.username = params.username;
            }
            if (params.email) {
              searchParams.email = params.email;
            }
            if (params.role) {
              searchParams.role = params.role;
            }
            if (params.is_active !== undefined) {
              searchParams.is_active = params.is_active === 'true';
            }

            const response = await getUserList(searchParams);

            if (response.success) {
              return {
                data: response.data.users,
                success: true,
                total: response.data.pagination.total,
              };
            } else {
              message.error(response.message || '获取用户列表失败');
              return {
                data: [],
                success: false,
                total: 0,
              };
            }
          } catch (error) {
            message.error('获取用户列表失败');
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
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
        }}
      />

      {/* 用户表单模态框 */}
      <UserForm
        visible={userFormVisible}
        onVisibleChange={setUserFormVisible}
        onSuccess={handleFormSuccess}
        user={currentUser}
        title={formTitle}
      />
    </PageContainer>
  );
};

export default UserList;
