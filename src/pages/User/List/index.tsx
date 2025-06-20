import { deleteUser, getUserList, resetUserPassword } from '@/services/erp/user';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ModalForm, PageContainer, ProFormText, ProTable } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Button, message, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import UserForm from './components/UserForm';

const UserList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [userFormVisible, setUserFormVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<API.UserInfo | undefined>(undefined);
  const [formTitle, setFormTitle] = useState('');
  const [resetPasswordVisible, setResetPasswordVisible] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<API.UserInfo | undefined>(undefined);

  // 获取当前登录用户信息
  const { initialState } = useModel('@@initialState');
  const loginUser = initialState?.currentUser;

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

  // 打开重置密码表单
  const handleResetPassword = (record: API.UserInfo) => {
    setResetPasswordUser(record);
    setResetPasswordVisible(true);
  };

  // 重置密码
  const handleResetPasswordSubmit = async (values: { new_password: string }) => {
    if (!resetPasswordUser) return false;

    try {
      const response = await resetUserPassword(resetPasswordUser.id, values);
      if (response.success) {
        message.success('密码重置成功');
        setResetPasswordVisible(false);
        return true;
      } else {
        message.error(response.message || '密码重置失败');
        return false;
      }
    } catch (error) {
      message.error('密码重置失败，请重试');
      return false;
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
      search: false,
    },
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
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 100,
      search: false,
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
      width: 240,
      render: (_, record) => {
        const isCurrentUser = loginUser?.id === record.id;

        return [
          <Button
            key="edit"
            type="link"
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>,
          <Button
            key="resetPassword"
            type="link"
            size="small"
            onClick={() => handleResetPassword(record)}
          >
            重置密码
          </Button>,
          <Popconfirm
            key="delete"
            title={isCurrentUser ? "不能删除自己的账户" : "确定要删除这个用户吗？"}
            description={isCurrentUser ? "您不能删除自己的账户" : "此操作不可恢复，请谨慎操作。"}
            onConfirm={isCurrentUser ? undefined : () => handleDelete(record)}
            okText="确定"
            cancelText="取消"
            disabled={isCurrentUser}
          >
            <Button
              type="link"
              size="small"
              danger
              disabled={isCurrentUser}
              title={isCurrentUser ? "不能删除自己的账户" : ""}
            >
              删除
            </Button>
          </Popconfirm>,
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
          <Button key="add" type="primary" onClick={handleAdd}>
            新增用户
          </Button>,
        ]}
        request={async (params) => {
          try {
            // 根据swagger.json定义，只发送page和limit参数
            const searchParams: API.GetUserListParams = {
              page: params.current || 1,
              limit: params.pageSize || 10,
            };

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
        isCurrentUser={loginUser?.id === currentUser?.id}
      />

      {/* 重置密码模态框 */}
      <ModalForm
        title={`重置用户密码 - ${resetPasswordUser?.username}`}
        open={resetPasswordVisible}
        onOpenChange={setResetPasswordVisible}
        onFinish={handleResetPasswordSubmit}
        modalProps={{
          destroyOnClose: true,
        }}
      >
        <ProFormText.Password
          name="new_password"
          label="新密码"
          placeholder="请输入新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码至少6个字符' },
          ]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default UserList;
