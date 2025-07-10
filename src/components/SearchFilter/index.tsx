import { DownOutlined, ReloadOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Space } from 'antd';
import React, { useEffect, useState } from 'react';

const { RangePicker } = DatePicker;
const { Option } = Select;

export interface FilterField {
  name: string;
  label: string;
  type: 'input' | 'select' | 'date' | 'dateRange' | 'number';
  placeholder?: string;
  options?: { label: string; value: any }[];
  allowClear?: boolean;
  span?: number;
}

interface SearchFilterProps {
  fields: FilterField[];
  onSearch: (values: any) => void;
  onReset?: () => void;
  defaultCollapsed?: boolean;
  showCollapse?: boolean;
  loading?: boolean;
  layout?: 'horizontal' | 'vertical' | 'inline';
  labelCol?: { span: number };
  wrapperCol?: { span: number };
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  fields,
  onSearch,
  onReset,
  defaultCollapsed = false,
  showCollapse = true,
  loading = false,
  layout = 'horizontal',
  labelCol = { span: 6 },
  wrapperCol = { span: 18 },
}) => {
  const [form] = Form.useForm();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [expandedFields, setExpandedFields] = useState<FilterField[]>([]);

  // 计算显示的字段
  useEffect(() => {
    if (collapsed && showCollapse) {
      // 折叠时只显示前3个字段
      setExpandedFields(fields.slice(0, 3));
    } else {
      setExpandedFields(fields);
    }
  }, [fields, collapsed, showCollapse]);

  // 处理搜索
  const handleSearch = () => {
    form.validateFields().then((values) => {
      // 处理日期范围
      const processedValues = { ...values };
      fields.forEach((field) => {
        if (field.type === 'dateRange' && values[field.name]) {
          const [start, end] = values[field.name];
          processedValues[`${field.name}_start`] = start?.format('YYYY-MM-DD');
          processedValues[`${field.name}_end`] = end?.format('YYYY-MM-DD');
          delete processedValues[field.name];
        }
      });
      onSearch(processedValues);
    });
  };

  // 处理重置
  const handleReset = () => {
    form.resetFields();
    onReset?.();
  };

  // 渲染字段
  const renderField = (field: FilterField) => {
    const { name, label, type, placeholder, options, allowClear = true, span = 8 } = field;

    switch (type) {
      case 'input':
        return (
          <Col span={span} key={name}>
            <Form.Item name={name} label={label}>
              <Input placeholder={placeholder || `请输入${label}`} allowClear={allowClear} />
            </Form.Item>
          </Col>
        );

      case 'select':
        return (
          <Col span={span} key={name}>
            <Form.Item name={name} label={label}>
              <Select placeholder={placeholder || `请选择${label}`} allowClear={allowClear}>
                {options?.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        );

      case 'date':
        return (
          <Col span={span} key={name}>
            <Form.Item name={name} label={label}>
              <DatePicker
                placeholder={placeholder || `请选择${label}`}
                allowClear={allowClear}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        );

      case 'dateRange':
        return (
          <Col span={span} key={name}>
            <Form.Item name={name} label={label}>
              <RangePicker
                placeholder={[placeholder || '开始日期', placeholder || '结束日期']}
                allowClear={allowClear}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        );

      case 'number':
        return (
          <Col span={span} key={name}>
            <Form.Item name={name} label={label}>
              <Input
                type="number"
                placeholder={placeholder || `请输入${label}`}
                allowClear={allowClear}
              />
            </Form.Item>
          </Col>
        );

      default:
        return null;
    }
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Form
        form={form}
        layout={layout}
        labelCol={labelCol}
        wrapperCol={wrapperCol}
        onFinish={handleSearch}
      >
        <Row gutter={16}>{expandedFields.map(renderField)}</Row>

        <Row>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={loading}
              >
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset} disabled={loading}>
                重置
              </Button>
              {showCollapse && fields.length > 3 && (
                <Button
                  type="link"
                  icon={collapsed ? <DownOutlined /> : <UpOutlined />}
                  onClick={() => setCollapsed(!collapsed)}
                >
                  {collapsed ? '展开' : '收起'}
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default SearchFilter;
