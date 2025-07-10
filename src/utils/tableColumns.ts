import type { ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag } from 'antd';
import React from 'react';

// 通用状态列配置
export const createStatusColumn = (
  dataIndex: string,
  title: string = '状态',
  width: number = 80,
): ProColumns<any> => ({
  title,
  dataIndex,
  width,
  render: (_, record) => {
    const status = record[dataIndex];
    const color = status === 1 || status === true ? 'green' : 'red';
    const text = status === 1 || status === true ? '启用' : '禁用';
    return React.createElement(Tag, { color }, text);
  },
});

// 通用时间列配置
export const createTimeColumn = (
  dataIndex: string,
  title: string = '创建时间',
  width: number = 140,
): ProColumns<any> => ({
  title,
  dataIndex,
  width,
  render: (_, record) => {
    const date = record[dataIndex];
    return date ? new Date(date).toLocaleString('zh-CN') : '-';
  },
});

// 通用操作列配置
export const createActionColumn = (
  onEdit?: (record: any) => void,
  onDelete?: (record: any) => void,
  extraActions?: (record: any) => React.ReactNode[],
  width: number = 120,
): ProColumns<any> => ({
  title: '操作',
  valueType: 'option',
  width,
  fixed: 'right',
  render: (_, record) => {
    const actions: React.ReactNode[] = [];

    if (onEdit) {
      actions.push(
        React.createElement(
          Button,
          {
            key: 'edit',
            type: 'link',
            size: 'small',
            onClick: () => onEdit(record),
          },
          '编辑',
        ),
      );
    }

    if (extraActions) {
      actions.push(...extraActions(record));
    }

    if (onDelete) {
      actions.push(
        React.createElement(
          Popconfirm,
          {
            key: 'delete',
            title: '确定要删除这条记录吗？',
            description: '此操作不可恢复，请谨慎操作。',
            onConfirm: () => onDelete(record),
            okText: '确定',
            cancelText: '取消',
          },
          React.createElement(
            Button,
            {
              type: 'link',
              size: 'small',
              danger: true,
            },
            '删除',
          ),
        ),
      );
    }

    return actions;
  },
});

// 通用ID列配置
export const createIdColumn = (width: number = 80): ProColumns<any> => ({
  title: 'ID',
  dataIndex: 'id',
  width,
  fixed: 'left',
  search: false,
});

// 通用名称列配置
export const createNameColumn = (
  dataIndex: string = 'name',
  title: string = '名称',
  width: number = 140,
): ProColumns<any> => ({
  title,
  dataIndex,
  width,
  copyable: true,
  ellipsis: true,
  fixed: 'left',
});

// 通用备注列配置
export const createRemarkColumn = (width: number = 120): ProColumns<any> => ({
  title: '备注',
  dataIndex: 'remark',
  width,
  ellipsis: true,
  hideInTable: true,
});
