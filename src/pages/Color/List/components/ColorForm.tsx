import { createColor, updateColor } from '@/services/erp/color';
import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { ColorPicker, Form, message } from 'antd';
import React, { useEffect, useState } from 'react';

interface ColorFormProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onSuccess: () => void;
  title: string;
  current?: API.Color;
}

const ColorForm: React.FC<ColorFormProps> = ({
  visible,
  onVisibleChange,
  onSuccess,
  title,
  current,
}) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // 当表单可见性或current变化时，重置表单值
  useEffect(() => {
    if (visible && current) {
      // 设置表单初始值
      form.setFieldsValue({
        name: current.name || '',
        code: current.code || '',
        hex_color: current.hex_color || undefined,
      });
    } else if (visible && !current) {
      // 新建时重置表单
      form.resetFields();
    }
  }, [visible, current, form]);

  // 表单提交
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const submitData: API.CreateColorRequest = {
        name: values.name,
        code: values.code,
        hex_color:
          typeof values.hex_color === 'string'
            ? values.hex_color
            : values.hex_color?.toHexString?.(),
      };

      let response;
      if (current) {
        response = await updateColor(current.id, submitData);
      } else {
        response = await createColor(submitData);
      }

      if (response.success) {
        message.success(current ? '更新成功' : '创建成功');
        onSuccess();
        return true;
      } else {
        message.error(response.message || (current ? '更新失败' : '创建失败'));
        return false;
      }
    } catch (error) {
      message.error(current ? '更新失败，请重试' : '创建失败，请重试');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalForm
      title={title}
      open={visible}
      onOpenChange={onVisibleChange}
      onFinish={handleSubmit}
      width={480}
      loading={loading}
      form={form}
      modalProps={{
        forceRender: true,
      }}
    >
      <ProFormText
        name="name"
        label="颜色名称"
        placeholder="请输入颜色名称，如：红色、蓝色等"
        rules={[{ required: true, message: '请输入颜色名称' }]}
      />

      <ProFormText
        name="code"
        label="颜色代码"
        placeholder="请输入颜色代码，如：RED、BLUE等（可选）"
        extra="英文字母和数字组成的颜色标识，用于程序识别"
      />

      <Form.Item
        name="hex_color"
        label="颜色值"
        extra="点击颜色块选择颜色，或直接输入十六进制颜色值"
        getValueFromEvent={(value) => {
          if (!value) return undefined;
          return typeof value === 'string' ? value : value.toHexString();
        }}
        getValueProps={(value) => {
          return { value: value };
        }}
      >
        <ColorPicker showText format="hex" allowClear />
      </Form.Item>
    </ModalForm>
  );
};

export default ColorForm;
