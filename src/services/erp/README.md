# ERP 用户管理 API 服务

本目录包含了与 ERP 后端系统用户管理模块对接的 API 服务。

## 文件结构

```
src/services/erp/
├── user.ts          # 用户管理API服务
├── typings.d.ts     # TypeScript类型定义
├── index.ts         # 导出文件
└── README.md        # 使用说明
```

## API 接口

### 用户认证

#### 1. 用户登录

```typescript
import { login } from '@/services/erp/user';

const response = await login({
  username: 'admin',
  password: '123456',
});
```

#### 2. 用户注册

```typescript
import { register } from '@/services/erp/user';

const response = await register({
  username: 'newuser',
  password: '123456',
  email: 'user@example.com',
});
```

### 用户信息管理

#### 3. 获取用户信息

```typescript
import { getUserProfile } from '@/services/erp/user';

const response = await getUserProfile();
```

#### 4. 更新用户信息

```typescript
import { updateUserProfile } from '@/services/erp/user';

const response = await updateUserProfile({
  email: 'newemail@example.com',
});
```

#### 5. 修改密码

```typescript
import { changePassword } from '@/services/erp/user';

const response = await changePassword({
  old_password: 'oldpass',
  new_password: 'newpass',
});
```

### 用户管理（管理员功能）

#### 6. 获取用户列表

```typescript
import { getUserList } from '@/services/erp/user';

const response = await getUserList({
  page: 1,
  limit: 10,
});
```

## 响应格式

所有 API 都返回统一的响应格式：

```typescript
type BaseResponse<T> = {
  success: boolean; // 请求是否成功
  message: string; // 响应消息
  data: T; // 响应数据
  error?: string; // 错误信息（可选）
};
```

## 类型定义

### 用户信息

```typescript
type UserInfo = {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
};
```

### 登录响应

```typescript
type LoginResponse = {
  token: string;
  user: UserInfo;
};
```

## 使用示例

### 在 React 组件中使用

```typescript
import React, { useEffect, useState } from 'react';
import { getUserProfile } from '@/services/erp/user';
import { message } from 'antd';

const UserProfileComponent: React.FC = () => {
  const [userInfo, setUserInfo] = useState<API.UserInfo | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await getUserProfile();
        if (response.success) {
          setUserInfo(response.data);
        } else {
          message.error(response.message);
        }
      } catch (error) {
        message.error('获取用户信息失败');
      }
    };

    fetchUserInfo();
  }, []);

  return (
    <div>
      {userInfo && (
        <div>
          <p>用户名: {userInfo.username}</p>
          <p>邮箱: {userInfo.email}</p>
          <p>角色: {userInfo.role}</p>
        </div>
      )}
    </div>
  );
};
```

## 认证

需要认证的接口会自动从 localStorage 中获取 token：

```typescript
// 登录成功后保存token
localStorage.setItem('token', response.data.token);

// API请求会自动在header中添加Authorization
// Authorization: Bearer <token>
```

## 错误处理

建议在使用 API 时进行适当的错误处理：

```typescript
try {
  const response = await someApiCall();
  if (response.success) {
    // 处理成功响应
  } else {
    // 处理业务错误
    message.error(response.message);
  }
} catch (error) {
  // 处理网络错误或其他异常
  message.error('请求失败');
}
```

## 注意事项

1. 所有 API 都使用 `/api` 作为基础路径
2. 需要认证的接口会自动添加 JWT token 到请求头
3. 密码长度至少 6 个字符
4. 用户名长度在 3-50 个字符之间
5. 邮箱格式需要验证
