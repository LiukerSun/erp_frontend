import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Card, message, Modal } from 'antd';
import React, { useRef, useState } from 'react';

interface CommonListProps<T = any> {
  title: string;
  columns: ProColumns<T>[];
  fetchData: (params: any) => Promise<{
    data: T[];
    total: number;
    success: boolean;
  }>;
  createFn?: (data: any) => Promise<any>;
  updateFn?: (id: number, data: any) => Promise<any>;
  deleteFn?: (id: number) => Promise<any>;
  FormComponent?: React.ComponentType<{
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    data?: T;
  }>;
  extraActions?: React.ReactNode;
  rowKey?: string;
  searchConfig?: {
    labelWidth?: number;
    defaultCollapsed?: boolean;
  };
  toolBarRender?: (action: ActionType | undefined) => React.ReactNode[];
  beforeDelete?: (record: T) => boolean | Promise<boolean>;
  afterDelete?: (record: T) => void;
  beforeCreate?: () => boolean | Promise<boolean>;
  beforeUpdate?: (record: T) => boolean | Promise<boolean>;
}

const CommonList = <T extends Record<string, any>>({
  title,
  columns,
  fetchData,
  createFn,
  updateFn,
  deleteFn,
  FormComponent,
  extraActions,
  rowKey = 'id',
  searchConfig,
  toolBarRender,
  beforeDelete,
  afterDelete,
  beforeCreate,
  beforeUpdate,
}: CommonListProps<T>) => {
  const [formVisible, setFormVisible] = useState(false);
  const [currentData, setCurrentData] = useState<T | undefined>();
  const actionRef = useRef<ActionType>();

  // 处理创建
  const handleCreate = async () => {
    if (beforeCreate) {
      const canProceed = await beforeCreate();
      if (!canProceed) return;
    }
    setCurrentData(undefined);
    setFormVisible(true);
  };

  // 处理编辑
  const handleEdit = async (record: T) => {
    if (beforeUpdate) {
      const canProceed = await beforeUpdate(record);
      if (!canProceed) return;
    }
    setCurrentData(record);
    setFormVisible(true);
  };

  // 处理删除
  const handleDelete = async (record: T) => {
    if (!deleteFn) return;

    if (beforeDelete) {
      const canProceed = await beforeDelete(record);
      if (!canProceed) return;
    }

    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      onOk: async () => {
        try {
          await deleteFn(record[rowKey]);
          message.success('删除成功');
          actionRef.current?.reload();
          afterDelete?.(record);
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  // 处理表单成功
  const handleFormSuccess = () => {
    setFormVisible(false);
    setCurrentData(undefined);
    actionRef.current?.reload();
  };

  // 构建操作列
  const getActionColumns = (): ProColumns<T>[] => {
    const actions: ProColumns<T>[] = [];

    if (updateFn || deleteFn) {
      actions.push({
        title: '操作',
        valueType: 'option',
        key: 'option',
        render: (_, record) =>
          [
            updateFn && (
              <Button
                key="edit"
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            ),
            deleteFn && (
              <Button
                key="delete"
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record)}
              >
                删除
              </Button>
            ),
          ].filter(Boolean),
      });
    }

    return actions;
  };

  // 构建工具栏
  const getToolBarRender = (action: ActionType | undefined) => {
    const defaultToolBar = [
      createFn && (
        <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建
        </Button>
      ),
      extraActions,
    ].filter(Boolean);

    return toolBarRender ? toolBarRender(action) : defaultToolBar;
  };

  return (
    <Card title={title}>
      <ProTable<T>
        actionRef={actionRef}
        rowKey={rowKey}
        search={searchConfig}
        toolBarRender={getToolBarRender}
        request={async (params) => {
          const response = await fetchData(params);
          return {
            data: response.data,
            success: response.success,
            total: response.total,
          };
        }}
        columns={[...columns, ...getActionColumns()]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
      />

      {FormComponent && (
        <FormComponent
          visible={formVisible}
          onCancel={() => setFormVisible(false)}
          onSuccess={handleFormSuccess}
          data={currentData}
        />
      )}
    </Card>
  );
};

export default CommonList;
