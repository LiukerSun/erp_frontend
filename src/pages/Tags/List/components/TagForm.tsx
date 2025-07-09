import { ColorPicker, Form, Input, message, Modal, Switch } from 'antd';
import React, { useEffect } from 'react';

interface TagFormProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (values: any) => void;
  initialValues?: any;
}

const TagForm: React.FC<TagFormProps> = ({ visible, onCancel, onOk, initialValues }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
        form.setFieldsValue({
          is_enabled: true,
          color: '#1890ff',
        });
      }
    }
  }, [visible, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // 处理颜色字段，将ColorPicker对象转换为十六进制字符串
      if (values.color && typeof values.color === 'object' && values.color.toHexString) {
        values.color = values.color.toHexString();
      }

      onOk(values);
    } catch (error) {
      message.error('请检查表单信息');
    }
  };

  return (
    <Modal
      title={initialValues ? '编辑标签' : '新建标签'}
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          is_enabled: true,
          color: '#1890ff',
        }}
      >
        <Form.Item
          name="name"
          label="标签名称"
          rules={[
            { required: true, message: '请输入标签名称' },
            { max: 50, message: '标签名称不能超过50个字符' },
          ]}
        >
          <Input placeholder="请输入标签名称" />
        </Form.Item>

        <Form.Item
          name="description"
          label="标签描述"
          rules={[{ max: 200, message: '标签描述不能超过200个字符' }]}
        >
          <Input.TextArea placeholder="请输入标签描述" rows={3} showCount maxLength={200} />
        </Form.Item>

        <Form.Item
          name="color"
          label="标签颜色"
          rules={[{ required: true, message: '请选择标签颜色' }]}
        >
          <ColorPicker
            presets={[
              {
                label: '推荐颜色',
                colors: [
                  '#f50',
                  '#2f54eb',
                  '#fa8c16',
                  '#52c41a',
                  '#eb2f96',
                  '#fa541c',
                  '#13c2c2',
                  '#722ed1',
                  '#faad14',
                  '#a0d911',
                ],
              },
            ]}
          />
        </Form.Item>

        <Form.Item name="is_enabled" label="启用状态" valuePropName="checked">
          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TagForm;
