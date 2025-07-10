import { Spin } from 'antd';
import React, { ComponentType, Suspense } from 'react';

interface LazyLoadProps {
  component: ComponentType<any>;
  fallback?: React.ReactNode;
  [key: string]: any;
}

// 通用懒加载组件
export const LazyLoad: React.FC<LazyLoadProps> = ({
  component: Component,
  fallback = <Spin size="large" />,
  ...props
}) => {
  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};

// 页面级别的懒加载
export const lazyLoadPage = (importFn: () => Promise<{ default: ComponentType<any> }>) => {
  const LazyComponent = React.lazy(importFn);

  return (props: any) => <LazyLoad component={LazyComponent} {...props} />;
};

// 组件级别的懒加载
export const lazyLoadComponent = (importFn: () => Promise<{ default: ComponentType<any> }>) => {
  const LazyComponent = React.lazy(importFn);

  return (props: any) => <LazyLoad component={LazyComponent} {...props} />;
};
