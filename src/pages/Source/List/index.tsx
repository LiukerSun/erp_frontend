import { useCommonList } from '@/hooks/useCommonList';
import { sourceApi } from '@/services/erp/base';
import {
  createIdColumn,
  createNameColumn,
  createRemarkColumn,
  createStatusColumn,
  createTimeColumn,
} from '@/utils/tableColumns';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button } from 'antd';
import React from 'react';
import SourceForm from './components/SourceForm';

const SourceList: React.FC = () => {
  const {
    actionRef,
    formVisible,
    currentData,
    formTitle,
    handleCreate,
    handleFormSuccess,
    handleFormCancel,
  } = useCommonList<API.Source>({
    deleteFn: sourceApi.delete,
  });

  const columns: ProColumns<API.Source>[] = [
    createIdColumn(60),
    createNameColumn('name', '货源名称', 140),
    {
      title: '货源编码',
      dataIndex: 'code',
      width: 120,
      copyable: true,
      ellipsis: true,
    },
    createStatusColumn('status'),
    createRemarkColumn(),
    createTimeColumn('createdAt'),
  ];

  return (
    <PageContainer>
      <ProTable<API.Source>
        headerTitle="货源列表"
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 1200 }}
        size="small"
        search={false}
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={handleCreate}>
            新增货源
          </Button>,
        ]}
        request={async (params) => {
          try {
            const searchParams: API.GetSourceListParams = {
              page: params.current || 1,
              page_size: params.pageSize || 10,
            };

            const response = await sourceApi.getList(searchParams);

            if (response.success) {
              return {
                data: response.data?.items || [],
                success: true,
                total: response.data?.total || 0,
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

      <SourceForm
        visible={formVisible}
        title={formTitle}
        source={currentData}
        onCancel={handleFormCancel}
        onSuccess={handleFormSuccess}
      />
    </PageContainer>
  );
};

export default SourceList;
