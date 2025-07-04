import { changePassword, getUserProfile, updateUserProfile } from '@/services/erp/user';
import { PageContainer, ProForm, ProFormText } from '@ant-design/pro-components';
import { Button, Card, Form, Input, message, Modal, Space } from 'antd';
import React, { useEffect, useState } from 'react';

const UserProfile: React.FC = () => {
  const [userInfo, setUserInfo] = useState<API.UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await getUserProfile();
      if (response.success) {
        setUserInfo(response.data);
      } else {
        message.error(response.message || '获取用户信息失败');
      }
    } catch (error) {
      message.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleUpdateProfile = async (values: any) => {
    try {
      // 只提取API.UpdateProfileRequest中定义的字段
      const updateData: API.UpdateProfileRequest = {
        email: values.email,
      };

      const response = await updateUserProfile(updateData);
      if (response.success) {
        message.success('更新成功');
        fetchUserProfile();
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleChangePassword = async (values: API.ChangePasswordRequest) => {
    try {
      const response = await changePassword(values);
      if (response.success) {
        message.success('密码修改成功');
        setPasswordModalVisible(false);
        passwordForm.resetFields();
      } else {
        message.error(response.message || '密码修改失败');
      }
    } catch (error) {
      message.error('密码修改失败');
    }
  };

  return (
    <PageContainer
      breadcrumb={{
        items: [
          {
            title: '首页',
            href: '/welcome',
          },
        ],
      }}
    >
      <Card title="个人资料" loading={loading}>
        {userInfo && (
          <ProForm
            initialValues={userInfo}
            onFinish={handleUpdateProfile}
            submitter={{
              render: (props, doms) => {
                return (
                  <Space>
                    {doms}
                    <Button type="primary" onClick={() => setPasswordModalVisible(true)}>
                      修改密码
                    </Button>
                  </Space>
                );
              },
            }}
          >
            <ProFormText name="username" label="用户名" readonly disabled />
            <ProFormText
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            />
            <ProFormText name="role" label="角色" readonly disabled />
            <ProFormText
              name="is_active"
              label="状态"
              readonly
              disabled
              fieldProps={{
                value: userInfo.is_active ? '活跃' : '禁用',
              }}
            />
            <ProFormText
              name="created_at"
              label="创建时间"
              readonly
              disabled
              fieldProps={{
                value: new Date(userInfo.created_at).toLocaleString('zh-CN'),
              }}
            />
          </ProForm>
        )}
      </Card>

      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
        forceRender={true}
      >
        <Form form={passwordForm} onFinish={handleChangePassword} layout="vertical">
          <Form.Item
            name="old_password"
            label="原密码"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少6个字符' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="确认新密码"
            dependencies={['new_password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请确认新密码" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认修改
              </Button>
              <Button
                onClick={() => {
                  setPasswordModalVisible(false);
                  passwordForm.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default UserProfile;
