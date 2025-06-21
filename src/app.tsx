import { AvatarDropdown, AvatarName, Footer } from '@/components';
import { getUserProfile as queryCurrentUser } from '@/services/erp/user';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { App } from 'antd';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';

// 抑制特定的 React 警告
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = function (...args) {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('findDOMNode is deprecated') || message.includes('Warning: findDOMNode'))
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = function (...args) {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('findDOMNode is deprecated') || message.includes('Warning: findDOMNode'))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/user/login';

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.UserInfo;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.UserInfo | undefined>;
}> {
  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser({
        skipErrorHandler: true,
      });
      if (msg.success && msg.data) {
        return msg.data;
      } else {
        console.error('fetchUserInfo failed:', msg.message);
        return undefined;
      }
    } catch (error) {
      console.error('fetchUserInfo error:', error);
      history.push(loginPath);
    }
    return undefined;
  };
  // 如果不是登录页面，执行
  const { location } = history;
  if (location.pathname !== loginPath) {
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  return {
    avatarProps: {
      render: () => {
        return (
          <AvatarDropdown menu={true}>
            <AvatarName />
          </AvatarDropdown>
        );
      },
    },
    waterMarkProps: {
      content: initialState?.currentUser?.email,
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    menuHeaderRender: undefined,
    // 配置菜单属性，禁用手风琴模式
    menu: {
      autoClose: false,
    },
    // 侧边栏收缩相关配置
    siderWidth: 208,
    // 明确设置collapsed的初始状态
    collapsed: false,
    // 确保收缩按钮显示
    collapsedButtonRender: (collapsed, defaultDom) => {
      // 使用默认的收缩按钮
      return defaultDom;
    },
    onCollapse: (collapsed: boolean) => {
      // 更新全局状态中的collapsed值
      setInitialState((preInitialState) => ({
        ...preInitialState,
        settings: {
          ...preInitialState?.settings,
          collapsed,
        },
      }));
    },
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <App>
          {children}
          {isDev && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings: any) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </App>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request = {
  ...errorConfig,
};
