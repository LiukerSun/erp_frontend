/**
 * 这个文件作为组件的目录
 * 目的是统一管理对外输出的组件，方便分类
 */
/**
 * 布局组件
 */
import Footer from './Footer';
import { SelectLang } from './RightContent';
import { AvatarDropdown, AvatarName } from './RightContent/AvatarDropdown';

// 通用组件
export { default as BatchActions } from './BatchActions';
export { default as CommonForm } from './CommonForm';
export { default as CommonList } from './CommonList';
export { default as CommonModalForm } from './CommonModalForm';
export { default as ImageUpload } from './ImageUpload';
export { default as SearchFilter } from './SearchFilter';

export { AvatarDropdown, AvatarName, Footer, SelectLang };
