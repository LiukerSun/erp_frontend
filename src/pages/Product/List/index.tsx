import { deleteProduct, getProductList } from '@/services/erp/product';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import ProductForm from './components/ProductForm';

const ProductList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [productFormVisible, setProductFormVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<API.ProductInfo | undefined>(undefined);
  const [formTitle, setFormTitle] = useState('');

  // 打开新增产品表单
  const handleAdd = () => {
    setCurrentProduct(undefined);
    setFormTitle('新增产品');
    setProductFormVisible(true);
  };

  // 打开编辑产品表单
  const handleEdit = (record: API.ProductInfo) => {
    setCurrentProduct(record);
    setFormTitle('编辑产品');
    setProductFormVisible(true);
  };

  // 删除产品
  const handleDelete = async (record: API.ProductInfo) => {
    try {
      const response = await deleteProduct(record.id);
      if (response.success) {
        message.success('删除成功');
        actionRef.current?.reload();
      } else {
        message.error(response.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败，请重试');
    }
  };

  // 表单提交成功回调
  const handleFormSuccess = () => {
    setProductFormVisible(false);
    actionRef.current?.reload();
  };

  const columns: ProColumns<API.ProductInfo>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '产品名称',
      dataIndex: 'name',
      width: 200,
      copyable: true,
      ellipsis: true,
    },
    {
      title: '分类ID',
      dataIndex: 'category_id',
      width: 100,
      render: (_, record) => {
        return <Tag color="blue">{record.category_id}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      search: false,
      render: (_: any, record: API.ProductInfo) => {
        return new Date(record.created_at).toLocaleString('zh-CN');
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 180,
      search: false,
      render: (_: any, record: API.ProductInfo) => {
        return new Date(record.updated_at).toLocaleString('zh-CN');
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      render: (_, record) => [
        <Button key="edit" type="link" size="small" onClick={() => handleEdit(record)}>
          编辑
        </Button>,
        <Popconfirm
          key="delete"
          title="确定要删除这个产品吗？"
          description="此操作不可恢复，请谨慎操作。"
          onConfirm={() => handleDelete(record)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" size="small" danger>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ProductInfo>
        headerTitle="产品列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button key="add" type="primary" onClick={handleAdd}>
            新增产品
          </Button>,
        ]}
        request={async (params) => {
          try {
            const searchParams: API.GetProductListParams = {
              page: params.current || 1,
              limit: params.pageSize || 10,
              name: params.name,
              category_id: params.category_id ? Number(params.category_id) : undefined,
            };

            const response = await getProductList(searchParams);

            if (!response.success) {
              message.error(response.message || '获取数据失败');
              return {
                data: [],
                success: false,
                total: 0,
              };
            }

            const { products, pagination } = response.data;

            return {
              data: products || [],
              success: true,
              total: pagination?.total || 0,
            };
          } catch (error) {
            message.error('获取数据失败，请重试');
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        columns={columns}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <ProductForm
        visible={productFormVisible}
        onVisibleChange={setProductFormVisible}
        onSuccess={handleFormSuccess}
        product={currentProduct}
        title={formTitle}
      />
    </PageContainer>
  );
};

export default ProductList;
