# ERP 前端系统

这是一个基于 Ant Design Pro 构建的企业级管理系统前端项目。

## 项目特性

- 🚀 基于 Ant Design Pro 6.0.0
- 📱 响应式设计，支持移动端
- 🌍 国际化支持
- 🔐 用户登录认证
- 🎨 现代化 UI 设计

## 已清理内容

项目已移除以下内容以简化结构：

- ❌ Mock 数据和相关配置
- ❌ Admin 管理页面
- ❌ TableList 表格页面
- ❌ 多余的 API 接口
- ❌ 不必要的国际化内容

## 当前功能

- ✅ 用户登录页面
- ✅ 欢迎页面
- ✅ 404 错误页面
- ✅ 基础布局和导航

## 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 技术栈

- React 18
- TypeScript
- Ant Design Pro
- UmiJS 4
- Ant Design 5

## 项目结构

```
src/
├── pages/
│   ├── User/Login/     # 登录页面
│   ├── Welcome.tsx     # 欢迎页面
│   └── 404.tsx         # 404页面
├── components/         # 公共组件
├── services/          # API服务
├── locales/           # 国际化文件
└── app.tsx           # 应用配置
```

## 登录信息

系统已移除默认的测试账号，请根据实际后端接口配置登录信息。
