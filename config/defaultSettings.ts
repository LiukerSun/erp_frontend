import { ProLayoutProps } from '@ant-design/pro-components';

/**
 * @name
 */
const Settings: ProLayoutProps & {
  pwa?: boolean;
  logo?: string;
} = {
  navTheme: 'light',
  colorPrimary: '#1677FF',
  layout: 'side',
  contentWidth: 'Fluid',
  fixedHeader: false,
  fixSiderbar: true,
  pwa: true,
  logo: '/logo.jpg',
  collapsed: false,
  breakpoint: 'lg',
  token: {},
  siderMenuType: 'sub',
  splitMenus: false,
};

export default Settings;
