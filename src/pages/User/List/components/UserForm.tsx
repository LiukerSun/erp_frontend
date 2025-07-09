import CommonForm from '@/components/CommonForm';
import {
  COMMON_OPTIONS,
  COMMON_RULES,
  CommonEmailInput,
  CommonPasswordInput,
  CommonSelect,
  CommonTextInput,
} from '@/components/CommonForm/fields';
import { userApi } from '@/services/erp/base';
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
    if (user?.id) {
      // 编辑用户
      return userApi.update(user.id, values);
    } else {
      // 新增用户
      return userApi.create(values);
    }
  };

  const getInitialValues = () => {
    if (user) {
      return user;
    }
    return { role: 'user', is_active: true };
  };

  return (
    <CommonForm
      visible={visible}
      title={title}
      onCancel={() => onVisibleChange(false)}
      onSuccess={onSuccess}
      submitFn={handleSubmit}
      successMessage={user ? '用户更新成功' : '用户创建成功'}
      errorMessage={user ? '用户更新失败' : '用户创建失败'}
      initialValues={getInitialValues()}
    >
      <CommonTextInput
        name="username"
        label="用户名"
        placeholder="请输入用户名"
        rules={COMMON_RULES.USERNAME}
        disabled={!!user?.id} // 编辑时用户名不可修改
      />

      {!user?.id && (
        <CommonPasswordInput
          name="password"
          label="密码"
          placeholder="请输入密码"
          rules={COMMON_RULES.PASSWORD}
        />
      )}

      <CommonEmailInput name="email" label="邮箱" placeholder="请输入邮箱地址" />

      <CommonSelect
        name="role"
        label="角色"
        placeholder="请选择角色"
        options={COMMON_OPTIONS.USER_ROLES}
        rules={[{ required: true, message: '请选择角色' }]}
        disabled={isCurrentUser}
        tooltip={isCurrentUser ? '不能修改自己的角色' : undefined}
      />

      <CommonSelect
        name="is_active"
        label="状态"
        placeholder="请选择状态"
        options={COMMON_OPTIONS.USER_STATUS}
        rules={[{ required: true, message: '请选择状态' }]}
        disabled={isCurrentUser}
        tooltip={isCurrentUser ? '不能禁用自己的账户' : undefined}
      />
    </CommonForm>
  );
};

export default UserForm;
