import { getCategoryTree } from '@/services/erp/category';
import { createProduct, updateProduct } from '@/services/erp/product';
import { ModalForm, ProFormText, ProFormTreeSelect } from '@ant-design/pro-components';
import { message } from 'antd';
import React, { useEffect, useState } from 'react';

interface ProductFormProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onSuccess: () => void;
  product?: API.ProductInfo;
  title: string;
}

const ProductForm: React.FC<ProductFormProps> = ({
  visible,
  onVisibleChange,
  onSuccess,
  product,
  title,
}) => {
  const [categoryTreeData, setCategoryTreeData] = useState<any[]>([]);

  // 将分类数据转换为TreeSelect需要的格式
  const convertToTreeSelectData = (categories: API.CategoryTreeInfo[]): any[] => {
    return categories.map((cat) => ({
      title: cat.name,
      value: cat.id,
      key: cat.id,
      disabled: !cat.is_active, // 禁用未启用的分类
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
      if (product?.id) {
        // 编辑产品
        const response = await updateProduct(product.id, values);
        if (response.success) {
          message.success('产品更新成功');
          onSuccess();
          return true;
        } else {
          message.error(response.message || '产品更新失败');
          return false;
        }
      } else {
        // 新增产品
        const response = await createProduct(values);
        if (response.success) {
          message.success('产品创建成功');
          onSuccess();
          return true;
        } else {
          message.error(response.message || '产品创建失败');
          return false;
        }
      }
    } catch (error) {
      message.error('操作失败，请重试');
      return false;
    }
  };

  return (
    <ModalForm
      title={title}
      open={visible}
      onOpenChange={onVisibleChange}
      onFinish={handleSubmit}
      modalProps={{
        destroyOnClose: true,
      }}
      initialValues={product || {}}
    >
      <ProFormText
        name="name"
        label="产品名称"
        placeholder="请输入产品名称"
        rules={[
          { required: true, message: '请输入产品名称' },
          { min: 1, message: '产品名称至少1个字符' },
          { max: 100, message: '产品名称最多100个字符' },
        ]}
      />

      <ProFormTreeSelect
        name="category_id"
        label="产品分类"
        placeholder="请选择产品分类"
        rules={[{ required: true, message: '请选择产品分类' }]}
        fieldProps={{
          treeData: categoryTreeData,
          allowClear: false,
          showSearch: true,
          treeDefaultExpandAll: true,
          filterTreeNode: (input: string, treeNode: any) =>
            treeNode.title?.toLowerCase().indexOf(input.toLowerCase()) >= 0,
        }}
        tooltip="选择产品所属的分类"
      />
    </ModalForm>
  );
};

export default ProductForm;
