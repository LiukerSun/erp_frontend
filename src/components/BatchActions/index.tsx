import { CloseOutlined, ExclamationCircleOutlined, MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, Menu, message, Modal, Space, Typography } from 'antd';
import React, { useState } from 'react';

const { Text } = Typography;

export interface BatchAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  confirm?: boolean;
  confirmTitle?: string;
  confirmContent?: string;
  action: (selectedKeys: React.Key[], selectedRows: any[]) => Promise<void> | void;
}

interface BatchActionsProps {
  selectedRowKeys: React.Key[];
  selectedRows: any[];
  actions: BatchAction[];
  onClearSelection?: () => void;
  disabled?: boolean;
  showCount?: boolean;
  size?: 'small' | 'middle' | 'large';
}

const BatchActions: React.FC<BatchActionsProps> = ({
  selectedRowKeys,
  selectedRows,
  actions,
  onClearSelection,
  disabled = false,
  showCount = true,
  size = 'middle',
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  // 执行操作
  const executeAction = async (action: BatchAction) => {
    setLoading(action.key);
    try {
      await action.action(selectedRowKeys, selectedRows);
      message.success(`${action.label}操作成功`);
      onClearSelection?.();
    } catch (error) {
      console.error('Batch action error:', error);
      message.error(`${action.label}操作失败`);
    } finally {
      setLoading(null);
    }
  };

  // 处理批量操作
  const handleBatchAction = async (action: BatchAction) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的记录');
      return;
    }

    // 如果需要确认
    if (action.confirm) {
      Modal.confirm({
        title: action.confirmTitle || '确认操作',
        content:
          action.confirmContent ||
          `确定要对选中的 ${selectedRowKeys.length} 条记录执行"${action.label}"操作吗？`,
        icon: <ExclamationCircleOutlined />,
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          await executeAction(action);
        },
      });
    } else {
      await executeAction(action);
    }
  };

  // 渲染主要操作按钮
  const renderMainActions = () => {
    const mainActions = actions.slice(0, 2); // 只显示前2个主要操作
    const otherActions = actions.slice(2);

    return (
      <Space>
        {mainActions.map((action) => (
          <Button
            key={action.key}
            type={action.danger ? 'primary' : 'default'}
            danger={action.danger}
            icon={action.icon}
            loading={loading === action.key}
            disabled={disabled || selectedRowKeys.length === 0}
            onClick={() => handleBatchAction(action)}
            size={size}
          >
            {action.label}
          </Button>
        ))}

        {otherActions.length > 0 && (
          <Dropdown
            overlay={
              <Menu>
                {otherActions.map((action) => (
                  <Menu.Item
                    key={action.key}
                    icon={action.icon}
                    danger={action.danger}
                    onClick={() => handleBatchAction(action)}
                    disabled={loading === action.key}
                  >
                    {action.label}
                  </Menu.Item>
                ))}
              </Menu>
            }
            disabled={disabled || selectedRowKeys.length === 0}
          >
            <Button icon={<MoreOutlined />} size={size}>
              更多操作
            </Button>
          </Dropdown>
        )}
      </Space>
    );
  };

  // 渲染选择信息
  const renderSelectionInfo = () => {
    if (!showCount || selectedRowKeys.length === 0) {
      return null;
    }

    return (
      <Space>
        <Text type="secondary">
          已选择 <Text strong>{selectedRowKeys.length}</Text> 项
        </Text>
        <Button type="link" size="small" icon={<CloseOutlined />} onClick={onClearSelection}>
          清空选择
        </Button>
      </Space>
    );
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid #f0f0f0',
        marginBottom: 16,
      }}
    >
      {renderSelectionInfo()}
      {renderMainActions()}
    </div>
  );
};

export default BatchActions;
