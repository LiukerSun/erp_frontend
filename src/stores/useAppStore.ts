import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// 应用全局状态接口
interface AppState {
  // 用户相关
  currentUser: API.UserInfo | null;
  isLoggedIn: boolean;

  // UI状态
  collapsed: boolean;
  theme: 'light' | 'dark';
  loading: boolean;

  // 数据缓存
  sources: API.Source[];
  colors: API.Color[];
  tags: API.Tag[];

  // 操作
  setCurrentUser: (user: API.UserInfo | null) => void;
  setLoggedIn: (status: boolean) => void;
  setCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (loading: boolean) => void;

  // 数据缓存操作
  setSources: (sources: API.Source[]) => void;
  setColors: (colors: API.Color[]) => void;
  setTags: (tags: API.Tag[]) => void;

  // 清除状态
  clearState: () => void;
}

// 创建store
export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // 初始状态
      currentUser: null,
      isLoggedIn: false,
      collapsed: false,
      theme: 'light',
      loading: false,
      sources: [],
      colors: [],
      tags: [],

      // 用户相关操作
      setCurrentUser: (user: API.UserInfo | null) => set({ currentUser: user }),
      setLoggedIn: (status: boolean) => set({ isLoggedIn: status }),

      // UI状态操作
      setCollapsed: (collapsed: boolean) => set({ collapsed }),
      setTheme: (theme: 'light' | 'dark') => set({ theme }),
      setLoading: (loading: boolean) => set({ loading }),

      // 数据缓存操作
      setSources: (sources: API.Source[]) => set({ sources }),
      setColors: (colors: API.Color[]) => set({ colors }),
      setTags: (tags: API.Tag[]) => set({ tags }),

      // 清除状态
      clearState: () =>
        set({
          currentUser: null,
          isLoggedIn: false,
          sources: [],
          colors: [],
          tags: [],
        }),
    }),
    {
      name: 'app-store',
    },
  ),
);

// 选择器hooks
export const useCurrentUser = () => useAppStore((state) => state.currentUser);
export const useIsLoggedIn = () => useAppStore((state) => state.isLoggedIn);
export const useCollapsed = () => useAppStore((state) => state.collapsed);
export const useTheme = () => useAppStore((state) => state.theme);
export const useLoading = () => useAppStore((state) => state.loading);
export const useSources = () => useAppStore((state) => state.sources);
export const useColors = () => useAppStore((state) => state.colors);
export const useTags = () => useAppStore((state) => state.tags);
