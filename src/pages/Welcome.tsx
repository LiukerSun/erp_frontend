import { getUserProfile } from '@/services/erp/user';
import { isLoggedIn } from '@/utils/auth';
import { PageContainer } from '@ant-design/pro-components';
import { Card, message } from 'antd';
import React, { useEffect, useState } from 'react';

const Welcome: React.FC = () => {
  const [_, setUserInfo] = useState<API.UserInfo | null>(null);

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
      </Card>
    </PageContainer>
  );
};

export default Welcome;
