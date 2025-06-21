import { createUser, updateUser } from '@/services/erp/user';
import { ModalForm, ProFormSelect, ProFormText } from '@ant-design/pro-components';
import { message } from 'antd';
import React from 'react';

interface UserFormProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onSuccess: () => void;
  user?: API.UserInfo;
  title: string;
  isCurrentUser?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  visible,
  onVisibleChange,
  onSuccess,
  user,
  title,
  isCurrentUser = false,
}) => {
  const handleSubmit = async (values: any) => {
    try {
      if (user?.id) {
        // 编辑用户
        const response = await updateUser(user.id, values);
        if (response.success) {
          message.success('用户更新成功');
          onSuccess();
          return true;
        } else {
          message.error(response.message || '用户更新失败');
          return false;
        }
      } else {
        // 新增用户
        const response = await createUser(values);
        if (response.success) {
          message.success('用户创建成功');
          onSuccess();
          return true;
        } else {
          message.error(response.message || '用户创建失败');
          return false;
        }
      }
    } catch (error) {
      message.error('操作失败，请重试');
      return false;
    }
  };

  return (
    <ModalForm
      title={title}
      open={visible}
      onOpenChange={onVisibleChange}
      onFinish={handleSubmit}
      initialValues={user || { role: 'user', is_active: true }}
    >
      <ProFormText
        name="username"
        label="用户名"
        placeholder="请输入用户名"
        rules={[
          { required: true, message: '请输入用户名' },
          { min: 3, message: '用户名至少3个字符' },
          { max: 50, message: '用户名最多50个字符' },
        ]}
        disabled={!!user?.id} // 编辑时用户名不可修改
      />

      {!user?.id && (
        <ProFormText.Password
          name="password"
          label="密码"
          placeholder="请输入密码"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6个字符' },
          ]}
        />
      )}

      <ProFormText
        name="email"
        label="邮箱"
        placeholder="请输入邮箱地址"
        rules={[
          { required: true, message: '请输入邮箱地址' },
          { type: 'email', message: '请输入有效的邮箱地址' },
        ]}
      />

      <ProFormSelect
        name="role"
        label="角色"
        placeholder="请选择角色"
        options={[
          { label: '普通用户', value: 'user' },
          { label: '管理员', value: 'admin' },
        ]}
        rules={[{ required: true, message: '请选择角色' }]}
        disabled={isCurrentUser}
        tooltip={isCurrentUser ? '不能修改自己的角色' : undefined}
      />

      <ProFormSelect
        name="is_active"
        label="状态"
        placeholder="请选择状态"
        options={[
          { label: '活跃', value: true },
          { label: '禁用', value: false },
        ]}
        rules={[{ required: true, message: '请选择状态' }]}
        disabled={isCurrentUser}
        tooltip={isCurrentUser ? '不能禁用自己的账户' : undefined}
      />
    </ModalForm>
  );
};

export default UserForm;
