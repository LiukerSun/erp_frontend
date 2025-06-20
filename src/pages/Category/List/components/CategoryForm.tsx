import { createCategory, getCategoryTree, updateCategory } from '@/services/erp/category';
import {
  ModalForm,
  ProFormDigit,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProFormTreeSelect,
} from '@ant-design/pro-components';
import { message } from 'antd';
import React, { useEffect, useState } from 'react';

interface CategoryFormProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onSuccess: () => void;
  category?: API.CategoryInfo;
  title: string;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  visible,
  onVisibleChange,
  onSuccess,
  category,
  title,
}) => {
  const [categoryTreeData, setCategoryTreeData] = useState<any[]>([]);

  // 将分类数据转换为TreeSelect需要的格式
  const convertToTreeSelectData = (categories: API.CategoryTreeInfo[]): any[] => {
    return categories.map((cat) => ({
      title: cat.name,
      value: cat.id,
      key: cat.id,
      children: cat.children ? convertToTreeSelectData(cat.children) : undefined,
    }));
  };

  // 获取分类树数据
  const fetchCategoryTree = async () => {
    try {
      const response = await getCategoryTree();
      if (response.success) {
        const treeData = convertToTreeSelectData(response.data.categories || []);
        setCategoryTreeData(treeData);
      }
    } catch (error) {
      console.error('获取分类树失败:', error);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchCategoryTree();
    }
  }, [visible]);

  const handleSubmit = async (values: any) => {
    try {
      const categoryData: API.CreateCategoryRequest | API.UpdateCategoryRequest = {
        name: values.name,
        description: values.description,
        parent_id: values.parent_id,
        sort: values.sort || 0,
        is_active: values.is_active !== false,
      };

      let response;
      if (category) {
        // 编辑模式
        response = await updateCategory(category.id, categoryData);
      } else {
        // 新增模式
        response = await createCategory(categoryData as API.CreateCategoryRequest);
      }

      if (response.success) {
        message.success(category ? '更新成功' : '创建成功');
        onSuccess();
        return true;
      } else {
        message.error(response.message || '操作失败');
        return false;
      }
    } catch (error) {
      message.error('操作失败，请重试');
      return false;
    }
  };

  return (
    <ModalForm
      title={title}
      width={600}
      open={visible}
      onOpenChange={onVisibleChange}
      onFinish={handleSubmit}
      modalProps={{
        destroyOnClose: true,
      }}
      initialValues={
        category
          ? {
              name: category.name,
              description: category.description,
              parent_id: category.parent_id,
              sort: category.sort,
              is_active: category.is_active,
            }
          : {
              is_active: true,
              sort: 0,
            }
      }
    >
      <ProFormText
        name="name"
        label="分类名称"
        placeholder="请输入分类名称"
        rules={[
          { required: true, message: '请输入分类名称' },
          { max: 100, message: '分类名称不能超过100个字符' },
        ]}
      />

      <ProFormTextArea
        name="description"
        label="分类描述"
        placeholder="请输入分类描述（可选）"
        fieldProps={{
          maxLength: 500,
          showCount: true,
          autoSize: { minRows: 3, maxRows: 6 },
        }}
      />

      <ProFormTreeSelect
        name="parent_id"
        label="父分类"
        placeholder="请选择父分类（可选，不选择则为根分类）"
        fieldProps={{
          treeData: categoryTreeData,
          allowClear: true,
          showSearch: true,
          treeDefaultExpandAll: true,
          filterTreeNode: (input: string, treeNode: any) =>
            treeNode.title?.toLowerCase().indexOf(input.toLowerCase()) >= 0,
        }}
        tooltip="选择父分类可以创建多级分类结构"
      />

      <ProFormDigit
        name="sort"
        label="排序"
        placeholder="请输入排序值"
        min={0}
        tooltip="数值越小排序越靠前"
        fieldProps={{
          precision: 0,
        }}
      />

      <ProFormSwitch name="is_active" label="是否启用" tooltip="禁用的分类将不能被选择" />
    </ModalForm>
  );
};

export default CategoryForm;
