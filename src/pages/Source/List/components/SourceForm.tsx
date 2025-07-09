import CommonForm from '@/components/CommonForm';
import {
  COMMON_OPTIONS,
  COMMON_RULES,
  CommonSelect,
  CommonTextArea,
  CommonTextInput,
} from '@/components/CommonForm/fields';
import { sourceApi } from '@/services/erp/base';
import React from 'react';

interface SourceFormProps {
  visible: boolean;
  title: string;
  source?: API.Source;
  onCancel: () => void;
  onSuccess: () => void;
}

const SourceForm: React.FC<SourceFormProps> = ({ visible, title, source, onCancel, onSuccess }) => {
  const handleSubmit = async (values: any) => {
    if (source) {
      // 编辑模式
      return sourceApi.update(source.id, values);
    } else {
      // 新增模式
      return sourceApi.create(values);
    }
  };

  const getInitialValues = () => {
    if (source) {
      return {
        name: source.name,
        code: source.code,
        status: source.status,
        remark: source.remark,
      };
    }
    return { status: 1 }; // 默认启用
  };

  return (
    <CommonForm
      visible={visible}
      title={title}
      onCancel={onCancel}
      onSuccess={onSuccess}
      submitFn={handleSubmit}
      successMessage={source ? '更新成功' : '创建成功'}
      errorMessage={source ? '更新失败' : '创建失败'}
      initialValues={getInitialValues()}
    >
      <CommonTextInput
        name="name"
        label="货源名称"
        placeholder="请输入货源名称"
        rules={COMMON_RULES.NAME}
      />

      <CommonTextInput
        name="code"
        label="货源编码"
        placeholder="请输入货源编码"
        rules={COMMON_RULES.CODE}
      />

      <CommonSelect
        name="status"
        label="状态"
        placeholder="请选择状态"
        options={COMMON_OPTIONS.SOURCE_STATUS}
        rules={[{ required: true, message: '请选择状态' }]}
      />

      <CommonTextArea
        name="remark"
        label="备注"
        placeholder="请输入备注"
        rules={COMMON_RULES.REMARK}
      />
    </CommonForm>
  );
};

export default SourceForm;
