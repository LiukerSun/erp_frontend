import { createSource, updateSource } from '@/services/erp/source';
import { ModalForm, ProFormSelect, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { App, Form } from 'antd';
import React, { useEffect } from 'react';

interface SourceFormProps {
  visible: boolean;
  title: string;
  source?: API.Source;
  onCancel: () => void;
  onSuccess: () => void;
}

const SourceForm: React.FC<SourceFormProps> = ({ visible, title, source, onCancel, onSuccess }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();

  // 监听 source 变化，更新表单值
  useEffect(() => {
    if (visible && form) {
      if (source) {
        // 编辑模式，设置表单值
        form.setFieldsValue({
          name: source.name,
          code: source.code,
          status: source.status,
          remark: source.remark,
        });
      } else {
        // 新增模式，重置表单
        form.resetFields();
        form.setFieldsValue({
          status: 1, // 默认启用
        });
      }
    }
  }, [visible, source, form]);

  // 表单提交
  const handleFinish = async (values: API.CreateSourceRequest) => {
    try {
      let response;
      if (source) {
        // 编辑模式
        response = await updateSource(source.id, values);
      } else {
        // 新增模式
        response = await createSource(values);
      }

      if (response.success) {
        message.success(source ? '更新成功' : '创建成功');
        onSuccess();
        return true;
      } else {
        message.error(response.error || response.message || (source ? '更新失败' : '创建失败'));
        return false;
      }
    } catch (error: any) {
      console.error('Form submission error:', error);

      // 处理不同类型的错误
      let errorMessage = source ? '更新失败，请重试' : '创建失败，请重试';

      if (error?.response?.data) {
        // 服务器返回的错误信息
        const errorData = error.response.data;
        errorMessage = errorData.error || errorData.message || errorMessage;
      } else if (error?.message) {
        // 网络错误或其他错误
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      message.error(errorMessage);
      return false;
    }
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
      width={600}
      layout="horizontal"
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      form={form}
    >
      <ProFormText
        name="name"
        label="货源名称"
        placeholder="请输入货源名称"
        rules={[
          { required: true, message: '请输入货源名称' },
          { max: 100, message: '货源名称不能超过100个字符' },
        ]}
      />

      <ProFormText
        name="code"
        label="货源编码"
        placeholder="请输入货源编码"
        rules={[
          { required: true, message: '请输入货源编码' },
          { max: 50, message: '货源编码不能超过50个字符' },
        ]}
      />

      <ProFormSelect
        name="status"
        label="状态"
        placeholder="请选择状态"
        options={[
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ]}
        rules={[{ required: true, message: '请选择状态' }]}
      />

      <ProFormTextArea
        name="remark"
        label="备注"
        placeholder="请输入备注"
        fieldProps={{
          rows: 3,
        }}
        rules={[{ max: 500, message: '备注不能超过500个字符' }]}
      />
    </ModalForm>
  );
};

export default SourceForm;
