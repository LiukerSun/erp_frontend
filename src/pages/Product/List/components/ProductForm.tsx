import { createProduct, updateProduct } from '@/services/erp/product';
import { ModalForm, ProFormDigit, ProFormText } from '@ant-design/pro-components';
import { message } from 'antd';
import React from 'react';

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

      <ProFormDigit
        name="category_id"
        label="分类ID"
        placeholder="请输入分类ID"
        rules={[{ required: true, message: '请输入分类ID' }]}
        min={1}
        precision={0}
        fieldProps={{
          style: { width: '100%' },
        }}
      />
    </ModalForm>
  );
};

export default ProductForm;
