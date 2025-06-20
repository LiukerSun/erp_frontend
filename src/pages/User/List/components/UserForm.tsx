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
}

const UserForm: React.FC<UserFormProps> = ({
  visible,
  onVisibleChange,
  onSuccess,
  user,
  title,
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
        // 新增用户 - 自动设置角色为普通用户，状态为活跃
        const createData = { ...values, role: 'user', is_active: true };
        const response = await createUser(createData);
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
      modalProps={{
        destroyOnClose: true,
      }}
      initialValues={user ? { 
        ...user, 
        role: user.role === 'admin' ? '管理员' : '普通用户' 
      } : {}}
    >
      <ProFormText
        name="username"
        label="用户名"
        placeholder="请输入用户名"
        rules={[
          { required: true, message: '请输入用户名' },
          { min: 3, message: '用户名至少3个字符' },
          { max: 20, message: '用户名最多20个字符' },
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

{/* 新增用户时角色自动设为普通用户，编辑时显示当前角色但不可修改 */}
      {user?.id && (
        <ProFormText
          name="role"
          label="角色"
          disabled
          tooltip="角色不可修改"
          transform={(value) => ({ role: value === 'admin' ? '管理员' : '普通用户' })}
        />
      )}

{/* 用户默认都是活跃状态，不需要选择 */}
    </ModalForm>
  );
};

export default UserForm; 