import type { ActionType } from '@ant-design/pro-components';
import { message } from 'antd';
import { useRef, useState } from 'react';

interface UseCommonListOptions<T> {
  deleteFn?: (id: number) => Promise<any>;
  rowKey?: string;
  beforeDelete?: (record: T) => boolean | Promise<boolean>;
  afterDelete?: (record: T) => void;
  beforeCreate?: () => boolean | Promise<boolean>;
  beforeUpdate?: (record: T) => boolean | Promise<boolean>;
}

export const useCommonList = <T extends Record<string, any>>({
  deleteFn,
  rowKey = 'id',
  beforeDelete,
  afterDelete,
  beforeCreate,
  beforeUpdate,
}: UseCommonListOptions<T>) => {
  const actionRef = useRef<ActionType>();
  const [formVisible, setFormVisible] = useState(false);
  const [currentData, setCurrentData] = useState<T | undefined>();
  const [formTitle, setFormTitle] = useState('');

  // 处理创建
  const handleCreate = async () => {
    if (beforeCreate) {
      const canProceed = await beforeCreate();
      if (!canProceed) return;
    }
    setCurrentData(undefined);
    setFormTitle('新增');
    setFormVisible(true);
  };

  // 处理编辑
  const handleEdit = async (record: T) => {
    if (beforeUpdate) {
      const canProceed = await beforeUpdate(record);
      if (!canProceed) return;
    }
    setCurrentData(record);
    setFormTitle('编辑');
    setFormVisible(true);
  };

  // 处理删除
  const handleDelete = async (record: T) => {
    if (!deleteFn) return;

    if (beforeDelete) {
      const canProceed = await beforeDelete(record);
      if (!canProceed) return;
    }

    try {
      await deleteFn(record[rowKey]);
      message.success('删除成功');
      actionRef.current?.reload();
      afterDelete?.(record);
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 处理表单成功
  const handleFormSuccess = () => {
    setFormVisible(false);
    setCurrentData(undefined);
    actionRef.current?.reload();
  };

  // 处理表单取消
  const handleFormCancel = () => {
    setFormVisible(false);
    setCurrentData(undefined);
  };

  return {
    actionRef,
    formVisible,
    currentData,
    formTitle,
    handleCreate,
    handleEdit,
    handleDelete,
    handleFormSuccess,
    handleFormCancel,
  };
};
