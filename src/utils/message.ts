import { message } from 'antd';

// 导出一个兼容的静态方法（用于全局事件监听器和 App 上下文外的组件）
export const staticMessage = message;

// 已弃用：请在组件中直接使用 App.useApp() 替代
export const useMessage = () => {
  console.warn('useMessage is deprecated, please use App.useApp() in component instead');
  return message;
};

// 导出一个智能的 message 函数，自动选择合适的方法
export const smartMessage = {
  success: (content: string) => {
    message.success(content);
  },
  error: (content: string) => {
    message.error(content);
  },
  warning: (content: string) => {
    message.warning(content);
  },
  info: (content: string) => {
    message.info(content);
  },
};
