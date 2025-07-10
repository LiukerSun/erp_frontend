import { handleFormSubmit } from '@/utils/api';
import { ModalForm } from '@ant-design/pro-components';
import { Form } from 'antd';
import React, { useEffect } from 'react';

interface CommonModalFormProps {
  visible: boolean;
  title: string;
  onCancel: () => void;
  onSuccess: () => void;
  initialValues?: any;
  children: React.ReactNode;
  submitFn: (values: any) => Promise<any>;
  successMessage: string;
  errorMessage: string;
  width?: number;
  layout?: 'horizontal' | 'vertical' | 'inline';
  labelCol?: { span: number };
  wrapperCol?: { span: number };
  disabled?: boolean;
  okText?: string;
  cancelText?: string;
}

const CommonModalForm: React.FC<CommonModalFormProps> = ({
  visible,
  title,
  onCancel,
  onSuccess,
  initialValues,
  children,
  submitFn,
  successMessage,
  errorMessage,
  width = 600,
  layout = 'horizontal',
  labelCol = { span: 6 },
  wrapperCol = { span: 18 },
  disabled = false,
  okText = '确定',
  cancelText = '取消',
}) => {
  const [form] = Form.useForm();

  // 监听 visible 变化，更新表单值
  useEffect(() => {
    if (visible && form) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
      }
    }
  }, [visible, initialValues, form]);

  // 表单提交处理
  const handleFinish = async (values: any) => {
    const success = await handleFormSubmit(() => submitFn(values), successMessage, errorMessage);

    if (success) {
      onSuccess();
      return true;
    }
    return false;
  };

  return (
    <ModalForm
      title={title}
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      onFinish={handleFinish}
      modalProps={{
        maskClosable: false,
        forceRender: true,
      }}
      width={width}
      layout={layout}
      labelCol={labelCol}
      wrapperCol={wrapperCol}
      form={form}
      disabled={disabled}
      submitter={{
        searchConfig: {
          submitText: okText,
          resetText: cancelText,
        },
      }}
    >
      {children}
    </ModalForm>
  );
};

export default CommonModalForm;
