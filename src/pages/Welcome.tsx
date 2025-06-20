import { getUserProfile } from '@/services/erp/user';
import { isLoggedIn } from '@/utils/auth';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, message, Space } from 'antd';
import React, { useEffect, useState } from 'react';

const Welcome: React.FC = () => {
  const [userInfo, setUserInfo] = useState<API.UserInfo | null>(null);

  const fetchUserInfo = async () => {
    try {
      const response = await getUserProfile();
      if (response.success) {
        setUserInfo(response.data);
      } else {
        message.error(response.message || '获取用户信息失败');
      }
    } catch (error) {
      message.error('获取用户信息失败');
    }
  };

  useEffect(() => {
    // 检查是否已登录
    if (isLoggedIn()) {
      fetchUserInfo();
    }
  }, []);

  return (
    <PageContainer>
      <Card title="欢迎使用ERP系统">
        <p>这是一个基于Go语言构建的企业资源规划（ERP）系统。</p>

        {userInfo ? (
          <Card title="当前用户信息" style={{ marginTop: 16 }}>
            <p>
              <strong>用户名：</strong>
              {userInfo.username}
            </p>
            <p>
              <strong>邮箱：</strong>
              {userInfo.email}
            </p>
            <p>
              <strong>角色：</strong>
              {userInfo.role}
            </p>
            <p>
              <strong>状态：</strong>
              {userInfo.is_active ? '活跃' : '禁用'}
            </p>
            <p>
              <strong>创建时间：</strong>
              {new Date(userInfo.created_at).toLocaleString('zh-CN')}
            </p>

            <Space style={{ marginTop: 16 }}>
              <Button
                type="primary"
                onClick={() => (window.location.href = '/user-management/profile')}
              >
                编辑个人资料
              </Button>
              <Button onClick={() => (window.location.href = '/user-management/list')}>
                用户管理
              </Button>
            </Space>
          </Card>
        ) : (
          <Card title="用户信息" style={{ marginTop: 16 }}>
            <p>您尚未登录，请先登录系统。</p>
            <Space style={{ marginTop: 16 }}>
              <Button type="primary" onClick={() => (window.location.href = '/user/login')}>
                登录
              </Button>
              <Button onClick={() => (window.location.href = '/user/register')}>注册</Button>
            </Space>
          </Card>
        )}

        <Card title="API接口说明" style={{ marginTop: 16 }}>
          <p>本系统已集成以下用户管理API接口：</p>
          <ul>
            <li>
              <strong>用户登录：</strong>POST /api/user/login
            </li>
            <li>
              <strong>用户注册：</strong>POST /api/user/register
            </li>
            <li>
              <strong>获取用户信息：</strong>GET /api/user/profile
            </li>
            <li>
              <strong>更新用户信息：</strong>PUT /api/user/profile
            </li>
            <li>
              <strong>修改密码：</strong>POST /api/user/change_password
            </li>
            <li>
              <strong>获取用户列表：</strong>GET /api/user/list
            </li>
          </ul>
          <p>
            详细的API使用说明请参考：<code>src/services/erp/README.md</code>
          </p>
        </Card>
      </Card>
    </PageContainer>
  );
};

export default Welcome;
