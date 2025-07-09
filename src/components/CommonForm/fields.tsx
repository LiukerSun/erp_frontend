import {
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';

// 通用文本输入字段
export const CommonTextInput = ({ name, label, placeholder, rules, disabled, ...props }: any) => (
  <ProFormText
    name={name}
    label={label}
    placeholder={placeholder}
    rules={rules}
    disabled={disabled}
    {...props}
  />
);

// 通用密码输入字段
export const CommonPasswordInput = ({
  name,
  label,
  placeholder,
  rules,
  disabled,
  ...props
}: any) => (
  <ProFormText.Password
    name={name}
    label={label}
    placeholder={placeholder}
    rules={rules}
    disabled={disabled}
    {...props}
  />
);

// 通用邮箱输入字段
export const CommonEmailInput = ({ name, label, placeholder, rules, disabled, ...props }: any) => (
  <ProFormText
    name={name}
    label={label}
    placeholder={placeholder}
    rules={[
      { required: true, message: '请输入邮箱地址' },
      { type: 'email', message: '请输入有效的邮箱地址' },
      ...(rules || []),
    ]}
    disabled={disabled}
    {...props}
  />
);

// 通用选择字段
export const CommonSelect = ({
  name,
  label,
  placeholder,
  options,
  rules,
  disabled,
  ...props
}: any) => (
  <ProFormSelect
    name={name}
    label={label}
    placeholder={placeholder}
    options={options}
    rules={rules}
    disabled={disabled}
    {...props}
  />
);

// 通用文本域字段
export const CommonTextArea = ({
  name,
  label,
  placeholder,
  rules,
  rows = 3,
  disabled,
  ...props
}: any) => (
  <ProFormTextArea
    name={name}
    label={label}
    placeholder={placeholder}
    rules={rules}
    disabled={disabled}
    fieldProps={{ rows }}
    {...props}
  />
);

// 通用开关字段
export const CommonSwitch = ({ name, label, disabled, ...props }: any) => (
  <ProFormSwitch name={name} label={label} disabled={disabled} {...props} />
);

// 预定义的选项
export const COMMON_OPTIONS = {
  // 用户角色选项
  USER_ROLES: [
    { label: '普通用户', value: 'user' },
    { label: '管理员', value: 'admin' },
  ],

  // 用户状态选项
  USER_STATUS: [
    { label: '活跃', value: true },
    { label: '禁用', value: false },
  ],

  // 货源状态选项
  SOURCE_STATUS: [
    { label: '启用', value: 1 },
    { label: '禁用', value: 0 },
  ],

  // 标签状态选项
  TAG_STATUS: [
    { label: '启用', value: true },
    { label: '禁用', value: false },
  ],
};

// 预定义的验证规则
export const COMMON_RULES = {
  // 用户名验证
  USERNAME: [
    { required: true, message: '请输入用户名' },
    { min: 3, message: '用户名至少3个字符' },
    { max: 50, message: '用户名最多50个字符' },
  ],

  // 密码验证
  PASSWORD: [
    { required: true, message: '请输入密码' },
    { min: 6, message: '密码至少6个字符' },
  ],

  // 邮箱验证
  EMAIL: [
    { required: true, message: '请输入邮箱地址' },
    { type: 'email', message: '请输入有效的邮箱地址' },
  ],

  // 名称验证
  NAME: [
    { required: true, message: '请输入名称' },
    { max: 100, message: '名称不能超过100个字符' },
  ],

  // 编码验证
  CODE: [
    { required: true, message: '请输入编码' },
    { max: 50, message: '编码不能超过50个字符' },
  ],

  // 备注验证
  REMARK: [{ max: 500, message: '备注不能超过500个字符' }],
};
