import { useCommonList } from '@/hooks/useCommonList';
import { colorApi } from '@/services/erp/base';
import { createIdColumn, createNameColumn, createTimeColumn } from '@/utils/tableColumns';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button } from 'antd';
import React from 'react';
import ColorForm from './components/ColorForm';

const ColorList: React.FC = () => {
  const {
    actionRef,
    formVisible,
    currentData,
    formTitle,
    handleCreate,
    handleFormSuccess,
    handleFormCancel,
  } = useCommonList<API.Color>({
    deleteFn: colorApi.delete,
  });

  const columns: ProColumns<API.Color>[] = [
    createIdColumn(),
    createNameColumn('name', '颜色名称', 140),
    {
      title: '颜色值',
      dataIndex: 'hex_color',
      width: 120,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: record.hex_color,
              borderRadius: '4px',
              marginRight: '8px',
              border: '1px solid #d9d9d9',
            }}
          />
          {record.hex_color}
        </div>
      ),
    },
    createTimeColumn('createdAt'),
  ];

  return (
    <PageContainer>
      <ProTable<API.Color>
        headerTitle="颜色列表"
        actionRef={actionRef}
        rowKey="id"
        search={false}
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={handleCreate}>
            新增颜色
          </Button>,
        ]}
        request={async (params) => {
          try {
            const searchParams: API.GetColorListParams = {
              page: params.current || 1,
              page_size: params.pageSize || 10,
            };

            const response = await colorApi.getList(searchParams);

            if (response.success) {
              // API直接返回颜色数组，不是分页结构
              const colors = response.data || [];
              return {
                data: colors,
                success: true,
                total: colors.length,
              };
            } else {
              return {
                data: [],
                success: false,
                total: 0,
              };
            }
          } catch (error) {
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        columns={columns}
        pagination={{
          showQuickJumper: true,
          showSizeChanger: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        }}
      />

      <ColorForm
        visible={formVisible}
        title={formTitle}
        current={currentData}
        onVisibleChange={(visible) => {
          if (!visible) {
            handleFormCancel();
          }
        }}
        onSuccess={handleFormSuccess}
      />
    </PageContainer>
  );
};

export default ColorList;
