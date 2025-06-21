import { createAttribute, updateAttribute } from '@/services/erp/attribute';
import { PlusOutlined } from '@ant-design/icons';
import {
  ProForm,
  ProFormDigit,
  ProFormList,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Card, Form, message, Modal } from 'antd';
import React, { useEffect, useState } from 'react';

interface AttributeFormProps {
  visible: boolean;
  title: string;
  initialValues?: API.AttributeInfo;
  attributeTypes: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

const AttributeForm: React.FC<AttributeFormProps> = ({
  visible,
  title,
  initialValues,
  attributeTypes,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<API.AttributeType>('text');

  // 需要选项配置的类型
  const needOptionsTypes = ['select', 'multi_select'];

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        const formData = {
          ...initialValues,
          // 确保选项数据格式正确
          options:
            initialValues.options && initialValues.options.length > 0
              ? initialValues.options
              : [{ label: '', value: '' }],
        };
        form.setFieldsValue(formData);
        setSelectedType(initialValues.type);
      } else {
        form.resetFields();
        // 为新建的选择类型设置默认选项
        form.setFieldsValue({
          options: [{ label: '', value: '' }],
          is_active: true,
          sort: 0,
        });
        setSelectedType('text');
      }
    }
  }, [visible, initialValues, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // 处理选项数据
      let processedOptions = values.options;
      if (needOptionsTypes.includes(values.type) && values.options) {
        // 过滤掉空的选项
        processedOptions = values.options.filter(
          (option: any) =>
            option.label && option.label.trim() && option.value && option.value.trim(),
        );

        // 检查是否有重复的选项值
        const valueSet = new Set();
        for (const option of processedOptions) {
          if (valueSet.has(option.value)) {
            message.error(`选项值 "${option.value}" 重复，请修改`);
            setLoading(false);
            return;
          }
          valueSet.add(option.value);
        }

        // 选择类型必须至少有一个选项
        if (processedOptions.length === 0) {
          message.error('选择类型的属性至少需要配置一个选项');
          setLoading(false);
          return;
        }
      }

      const requestData: API.CreateAttributeRequest | API.UpdateAttributeRequest = {
        name: values.name,
        display_name: values.display_name,
        description: values.description,
        type: values.type,
        is_required: values.is_required || false,
        is_active: values.is_active !== false,
        default_value: values.default_value,
        unit: values.unit,
        sort: values.sort || 0,
        options: processedOptions,
        validation: values.validation,
      };

      let response;
      if (initialValues?.id) {
        response = await updateAttribute(initialValues.id, requestData);
      } else {
        response = await createAttribute(requestData as API.CreateAttributeRequest);
      }

      if (response.success) {
        message.success(initialValues ? '更新成功' : '创建成功');
        onSuccess();
      } else {
        message.error(response.message || '操作失败');
      }
    } catch (error) {
      message.error('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 属性类型选项
  const attributeTypeOptions = attributeTypes.map((type) => {
    const typeMap: Record<string, string> = {
      text: '文本',
      number: '数字',
      select: '单选列表',
      multi_select: '多选列表',
      boolean: '布尔值',
      date: '日期',
      datetime: '日期时间',
      url: 'URL链接',
      email: '邮箱地址',
      color: '颜色选择',
      currency: '货币金额',
    };
    return {
      label: typeMap[type] || type,
      value: type,
    };
  });

  return (
    <Modal title={title} open={visible} onCancel={onCancel} footer={null} width={800}>
      <ProForm
        form={form}
        onFinish={handleSubmit}
        loading={loading}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        submitter={{
          resetButtonProps: {
            onClick: onCancel,
          },
        }}
      >
        {/* 基本信息 */}
        <ProFormText
          name="name"
          label="属性标识"
          placeholder="请输入属性标识（英文）"
          rules={[
            { required: true, message: '请输入属性标识' },
            {
              pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
              message: '只能包含字母、数字和下划线，且不能以数字开头',
            },
          ]}
        />

        <ProFormText
          name="display_name"
          label="显示名称"
          placeholder="请输入显示名称"
          rules={[{ required: true, message: '请输入显示名称' }]}
        />

        <ProFormSelect
          name="type"
          label="属性类型"
          options={attributeTypeOptions}
          rules={[{ required: true, message: '请选择属性类型' }]}
          fieldProps={{
            onChange: (value: API.AttributeType) => setSelectedType(value),
          }}
        />

        <ProFormTextArea
          name="description"
          label="描述"
          placeholder="请输入属性描述"
          fieldProps={{ rows: 3 }}
        />

        {/* 配置项 */}
        <ProFormSwitch
          name="is_required"
          label="是否必填"
          checkedChildren="必填"
          unCheckedChildren="可选"
        />

        <ProFormSwitch
          name="is_active"
          label="是否启用"
          checkedChildren="启用"
          unCheckedChildren="禁用"
          initialValue={true}
        />

        {/* 其他设置 */}
        <ProFormText name="default_value" label="默认值" placeholder="请输入默认值" />

        <ProFormText name="unit" label="单位" placeholder="请输入单位（如：元、kg等）" />

        <ProFormDigit
          name="sort"
          label="排序"
          placeholder="请输入排序值"
          min={0}
          initialValue={0}
        />

        {needOptionsTypes.includes(selectedType) && (
          <Card
            title="选项配置"
            size="small"
            style={{
              marginTop: 16,
              backgroundColor: '#fafafa',
              border: '1px dashed #d9d9d9',
            }}
          >
            <ProFormList
              name="options"
              label=""
              min={1}
              max={20}
              style={{ width: '100%' }}
              wrapperCol={{ span: 24 }}
              creatorButtonProps={{
                position: 'bottom',
                creatorButtonText: '添加选项',
                type: 'dashed',
                icon: <PlusOutlined />,
                style: { width: '100%', marginBottom: 16 },
              }}
              copyIconProps={false}
              deleteIconProps={{
                tooltipText: '删除选项',
              }}
              itemRender={({ listDom, action }, { index }) => (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    marginBottom: 8,
                    padding: '8px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    width: '100%',
                    boxSizing: 'border-box',
                    minHeight: '48px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      minWidth: '60px',
                      color: '#666',
                      fontSize: '12px',
                      marginRight: '12px',
                    }}
                  >
                    选项 {index + 1}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {listDom}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '12px',
                      width: '32px',
                      flexShrink: 0,
                    }}
                  >
                    {action}
                  </div>
                </div>
              )}
            >
              <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ProFormText
                    name="label"
                    placeholder="显示文本（如：红色）"
                    rules={[
                      { required: true, message: '请输入显示文本' },
                      { max: 50, message: '显示文本不能超过50个字符' },
                    ]}
                    style={{
                      marginBottom: 0,
                      width: '100%',
                    }}
                    wrapperCol={{ span: 24 }}
                    labelCol={{ span: 0 }}
                    formItemProps={{
                      style: {
                        marginBottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        height: '32px',
                      },
                    }}
                    fieldProps={{
                      style: {
                        width: '100%',
                        height: '32px',
                      },
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ProFormText
                    name="value"
                    placeholder="选项值（如：red）"
                    rules={[
                      { required: true, message: '请输入选项值' },
                      { max: 100, message: '选项值不能超过100个字符' },
                      {
                        pattern: /^[a-zA-Z0-9_-]+$/,
                        message: '选项值只能包含字母、数字、下划线和连字符',
                      },
                    ]}
                    style={{
                      marginBottom: 0,
                      width: '100%',
                    }}
                    wrapperCol={{ span: 24 }}
                    labelCol={{ span: 0 }}
                    formItemProps={{
                      style: {
                        marginBottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        height: '32px',
                      },
                    }}
                    fieldProps={{
                      style: {
                        width: '100%',
                        height: '32px',
                      },
                    }}
                  />
                </div>
              </div>
            </ProFormList>
          </Card>
        )}
      </ProForm>
    </Modal>
  );
};

export default AttributeForm;
