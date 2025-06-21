import { getCategoryTree } from '@/services/erp/category';
import {
  createProductWithAttributes,
  getCategoryAttributeTemplate,
  getProductWithAttributes,
  updateProductWithAttributes,
} from '@/services/erp/product';
import {
  ModalForm,
  ProFormDatePicker,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormGroup,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProFormTreeSelect,
} from '@ant-design/pro-components';
import { Alert, message, Spin } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [attributeTemplate, setAttributeTemplate] = useState<API.CategoryAttributeTemplateItem[]>(
    [],
  );
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [productWithAttributes, setProductWithAttributes] =
    useState<API.ProductWithAttributesResponse | null>(null);

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

  // 获取分类属性模板
  const fetchAttributeTemplate = async (categoryId: number) => {
    if (!categoryId || categoryId === undefined) {
      console.error('无效的分类ID：', categoryId);
      return;
    }

    setLoadingTemplate(true);
    try {
      const response = await getCategoryAttributeTemplate(categoryId);
      if (response.success) {
        // 使用Map进行去重，以attribute_id为key
        const uniqueAttributes = new Map();
        response.data.attributes.forEach((attr) => {
          // 如果属性已存在，只有当新属性不是继承的时候才更新
          if (!uniqueAttributes.has(attr.attribute_id) || !attr.is_inherited) {
            uniqueAttributes.set(attr.attribute_id, attr);
          }
        });
        setAttributeTemplate(Array.from(uniqueAttributes.values()));
      } else {
        message.error('获取分类属性模板失败');
        setAttributeTemplate([]);
      }
    } catch (error) {
      console.error('获取分类属性模板失败:', error);
      message.error('获取分类属性模板失败');
      setAttributeTemplate([]);
    } finally {
      setLoadingTemplate(false);
    }
  };

  // 获取产品详情（包含属性）
  const fetchProductWithAttributes = async (productId: number) => {
    if (!productId || productId === undefined) {
      console.error('无效的产品ID：', productId);
      return;
    }

    try {
      const response = await getProductWithAttributes(productId);
      if (response.success) {
        setProductWithAttributes(response.data);
      }
    } catch (error) {
      console.error('获取产品详情失败:', error);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchCategoryTree();
      if (product?.id) {
        fetchProductWithAttributes(product.id);
        // 设置编辑时的分类ID
        setSelectedCategoryId(product.category_id);
      } else {
        // 如果是新建模式，清空产品属性数据
        setProductWithAttributes(null);
        setSelectedCategoryId(undefined);
      }
    } else {
      // 关闭时重置状态
      setProductWithAttributes(null);
      setAttributeTemplate([]);
      setSelectedCategoryId(undefined);
    }
  }, [visible, product?.id, product?.category_id]);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchAttributeTemplate(selectedCategoryId);
    } else {
      setAttributeTemplate([]);
    }
  }, [selectedCategoryId]);

  // 处理分类变化
  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
  };

  // 根据属性类型渲染表单字段
  const renderAttributeField = (attr: API.CategoryAttributeTemplateItem) => {
    const fieldName = `attr_${attr.attribute_id}`;
    const commonProps = {
      name: fieldName,
      label: (
        <span>
          {attr.display_name}
          {attr.is_required && <span style={{ color: '#ff4d4f', marginLeft: '4px' }}>*</span>}
          {attr.unit && <span style={{ color: '#999', fontSize: '12px' }}> ({attr.unit})</span>}
        </span>
      ),
      placeholder: `请输入${attr.display_name}`,
      rules: attr.is_required ? [{ required: true, message: `请输入${attr.display_name}` }] : [],
    };

    switch (attr.type) {
      case 'text':
        return <ProFormText key={attr.attribute_id} {...commonProps} />;

      case 'number':
        return (
          <ProFormDigit
            key={attr.attribute_id}
            {...commonProps}
            fieldProps={{
              precision: 2,
              style: { width: '100%' },
            }}
          />
        );

      case 'select':
        return (
          <ProFormSelect
            key={attr.attribute_id}
            {...commonProps}
            options={
              attr.options?.map((opt: any) => ({
                label: opt.label,
                value: opt.value,
              })) || []
            }
          />
        );

      case 'multi_select':
        return (
          <ProFormSelect
            key={attr.attribute_id}
            {...commonProps}
            mode="multiple"
            options={
              attr.options?.map((opt: any) => ({
                label: opt.label,
                value: opt.value,
              })) || []
            }
          />
        );

      case 'boolean':
        return (
          <ProFormSwitch
            key={attr.attribute_id}
            {...commonProps}
            fieldProps={{
              checkedChildren: '是',
              unCheckedChildren: '否',
            }}
          />
        );

      case 'date':
        return (
          <ProFormDatePicker
            key={attr.attribute_id}
            {...commonProps}
            fieldProps={{
              style: { width: '100%' },
              format: 'YYYY-MM-DD',
            }}
          />
        );

      case 'datetime':
        return (
          <ProFormDateTimePicker
            key={attr.attribute_id}
            {...commonProps}
            fieldProps={{
              style: { width: '100%' },
              format: 'YYYY-MM-DD HH:mm:ss',
            }}
          />
        );

      case 'url':
        return (
          <ProFormText
            key={attr.attribute_id}
            {...commonProps}
            rules={[...commonProps.rules, { type: 'url', message: '请输入有效的URL地址' }]}
          />
        );

      case 'email':
        return (
          <ProFormText
            key={attr.attribute_id}
            {...commonProps}
            rules={[...commonProps.rules, { type: 'email', message: '请输入有效的邮箱地址' }]}
          />
        );

      case 'color':
        return (
          <ProFormText
            key={attr.attribute_id}
            {...commonProps}
            rules={[
              ...commonProps.rules,
              {
                pattern: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                message: '请输入有效的颜色值（如：#FF0000）',
              },
            ]}
          />
        );

      case 'currency':
        return (
          <ProFormDigit
            key={attr.attribute_id}
            {...commonProps}
            fieldProps={{
              precision: 2,
              style: { width: '100%' },
              addonBefore: '¥',
            }}
          />
        );

      default:
        return <ProFormTextArea key={attr.attribute_id} {...commonProps} />;
    }
  };

  // 获取初始值
  const getInitialValues = useMemo(() => {
    const initialValues: any = {
      name: product?.name || '',
      category_id: product?.category_id,
    };

    // 如果是编辑模式且有产品属性数据，设置属性初始值
    if (productWithAttributes && productWithAttributes.attributes) {
      productWithAttributes.attributes.forEach((attr) => {
        const fieldName = `attr_${attr.attribute_id}`;
        let value = attr.value;

        // 处理日期时间类型的值转换
        if (value && (attr.attribute_type === 'date' || attr.attribute_type === 'datetime')) {
          value = new Date(value);
        }

        initialValues[fieldName] = value;
      });
    } else if (attributeTemplate.length > 0) {
      // 如果没有产品属性数据但有属性模板，设置默认值
      attributeTemplate.forEach((attr) => {
        const fieldName = `attr_${attr.attribute_id}`;
        if (
          attr.default_value !== undefined &&
          attr.default_value !== null &&
          attr.default_value !== ''
        ) {
          let defaultValue: any = attr.default_value;

          // 处理日期时间类型的默认值转换
          if (attr.type === 'date' || attr.type === 'datetime') {
            defaultValue = new Date(attr.default_value);
          }

          initialValues[fieldName] = defaultValue;
        }
      });
    }

    return initialValues;
  }, [product, productWithAttributes, attributeTemplate]);

  const handleSubmit = async (values: any) => {
    try {
      // 提取属性值 - 包括所有属性，即使值为空
      const attributes: API.ProductAttributeValueInput[] = [];
      attributeTemplate.forEach((attr) => {
        const fieldName = `attr_${attr.attribute_id}`;
        const fieldValue = values[fieldName];

        // 处理不同类型的值
        let processedValue = fieldValue;
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
          // 对于布尔类型，空值设为false
          if (attr.type === 'boolean') {
            processedValue = false;
          } else {
            processedValue = null;
          }
        } else {
          // 处理日期时间类型的值格式化
          if (attr.type === 'date' && fieldValue instanceof Date) {
            processedValue = fieldValue.toISOString().split('T')[0]; // YYYY-MM-DD
          } else if (attr.type === 'datetime' && fieldValue instanceof Date) {
            processedValue = fieldValue.toISOString(); // ISO datetime string
          }
        }

        attributes.push({
          attribute_id: attr.attribute_id,
          value: processedValue,
        });
      });

      const productData = {
        name: values.name,
        category_id: values.category_id,
        attributes,
      };

      if (product?.id) {
        // 编辑产品
        const response = await updateProductWithAttributes(product.id, productData);
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
        const response = await createProductWithAttributes(productData);
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
        width: 800,
      }}
      initialValues={getInitialValues}
      key={`${product?.id || 'new'}-${productWithAttributes?.id || 'empty'}`}
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
          onChange: handleCategoryChange,
        }}
        tooltip="选择产品所属的分类，系统会自动加载该分类的属性模板"
      />

      {selectedCategoryId && (
        <ProFormGroup title="产品属性">
          {loadingTemplate ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin tip="正在加载属性模板..." />
            </div>
          ) : attributeTemplate.length > 0 ? (
            <>
              {attributeTemplate
                .sort((a, b) => a.sort - b.sort)
                .map((attr) => renderAttributeField(attr))}
            </>
          ) : (
            <Alert
              message="该分类暂无属性"
              description="当前选择的分类还没有绑定任何属性，您可以在分类管理中为此分类添加属性。"
              type="warning"
              showIcon
            />
          )}
        </ProFormGroup>
      )}
    </ModalForm>
  );
};

export default ProductForm;
