/**
 * @see https://umijs.org/docs/max/access#access
 * */
export default function access(_initialState: { currentUser?: API.UserInfo } | undefined) {
  const currentUser = _initialState?.currentUser;
  const canAccess = currentUser !== undefined;

  return {
    // 基础访问权限（已登录用户）
    canAccess,
    // admin权限检查
    admin: currentUser?.role === 'admin',
  };
}
