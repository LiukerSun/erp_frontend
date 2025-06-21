import {
  deleteCategory,
  getCategoryTree,
  moveCategory as moveCategoryAPI,
} from '@/services/erp/category';
import {
  DeleteOutlined,
  DragOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import type { MenuProps, TreeDataNode } from 'antd';
import { Button, Col, Dropdown, Input, message, Modal, Row, Select, Space, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import CategoryAttributeManager from './components/CategoryAttributeManager';
import CategoryForm from './components/CategoryForm';

interface CategoryTreeNode extends TreeDataNode {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  level: number;
  sort: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: CategoryTreeNode[];
}

const CategoryList: React.FC = () => {
  const [categoryFormVisible, setCategoryFormVisible] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<API.CategoryInfo | undefined>(undefined);
  const [formTitle, setFormTitle] = useState('');
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [moveCategory, setMoveCategory] = useState<API.CategoryInfo | undefined>(undefined);
  const [categoryTree, setCategoryTree] = useState<API.CategoryTreeInfo[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | undefined>(undefined);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  // 新增属性管理相关状态
  const [attributeManagerVisible, setAttributeManagerVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<API.CategoryInfo | null>(null);

  // 获取所有节点的key
  const getAllKeys = (categories: API.CategoryTreeInfo[]): React.Key[] => {
    const keys: React.Key[] = [];
    const traverse = (nodes: API.CategoryTreeInfo[]) => {
      nodes.forEach((node) => {
        keys.push(node.id);
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    traverse(categories);
    return keys;
  };

  // 获取分类数据
  const fetchCategories = async () => {
    try {
      const response = await getCategoryTree();
      if (response.success) {
        setCategoryTree(response.data.categories || []);
        // 默认展开所有节点
        const allKeys = getAllKeys(response.data.categories || []);
        setExpandedKeys(allKeys);
      } else {
        message.error(response.message || '获取数据失败');
      }
    } catch (error) {
      message.error('获取数据失败，请重试');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 打开新增分类表单
  const handleAdd = (parentId?: number) => {
    setCurrentCategory(undefined);
    setFormTitle(parentId ? '新增子分类' : '新增分类');
    // 如果有父分类ID，预设父分类
    if (parentId) {
      setCurrentCategory({ parent_id: parentId } as API.CategoryInfo);
    }
    setCategoryFormVisible(true);
  };

  // 注意：由于属性继承机制，现在不支持编辑分类，只能删除重新创建

  // 删除分类
  const handleDelete = async (record: API.CategoryInfo) => {
    try {
      const response = await deleteCategory(record.id);
      if (response.success) {
        message.success('删除成功');
        await fetchCategories();
      } else {
        message.error(response.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败，请重试');
    }
  };

  // 打开移动分类对话框
  const handleMove = (record: API.CategoryInfo) => {
    setMoveCategory(record);
    setMoveModalVisible(true);
  };

  // 移动分类
  const handleMoveSubmit = async () => {
    if (!moveCategory) return;

    try {
      const response = await moveCategoryAPI(moveCategory.id, {
        parent_id: selectedParentId,
      });
      if (response.success) {
        message.success('移动成功');
        setMoveModalVisible(false);
        setMoveCategory(undefined);
        setSelectedParentId(undefined);
        await fetchCategories();
      } else {
        message.error(response.message || '移动失败');
      }
    } catch (error) {
      message.error('移动失败，请重试');
    }
  };

  // 打开属性管理
  const handleManageAttributes = (record: API.CategoryInfo) => {
    if (!record || !record.id) {
      message.error('无效的分类信息');
      return;
    }
    setSelectedCategory(record);
    setAttributeManagerVisible(true);
  };

  // 表单提交成功回调
  const handleFormSuccess = () => {
    setCategoryFormVisible(false);
    fetchCategories();
  };

  // 将分类数据转换为选择器数据（用于移动分类）
  const convertToSelectData = (categories: API.CategoryTreeInfo[]): any[] => {
    const result: any[] = [{ label: '设为根分类', value: undefined }];

    const traverse = (nodes: API.CategoryTreeInfo[], prefix = '') => {
      nodes.forEach((node) => {
        if (moveCategory && node.id !== moveCategory.id) {
          // 排除自己
          result.push({
            label: `${prefix}${node.name}`,
            value: node.id,
          });
          if (node.children && node.children.length > 0) {
            traverse(node.children, `${prefix}${node.name} / `);
          }
        }
      });
    };

    traverse(categories);
    return result;
  };

  // 渲染节点标题
  const renderNodeTitle = (node: API.CategoryInfo, isSearchResult = false) => {
    const getMenuItems = (node: API.CategoryInfo): MenuProps['items'] => [
      {
        key: 'addChild',
        icon: <PlusOutlined />,
        label: '添加子分类',
        onClick: () => handleAdd(node.id),
      },
      {
        key: 'manageAttributes',
        icon: <SettingOutlined />,
        label: '管理属性',
        onClick: () => handleManageAttributes(node),
      },
      {
        key: 'move',
        icon: <DragOutlined />,
        label: '移动',
        onClick: () => handleMove(node),
      },
      {
        type: 'divider',
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: () => {
          Modal.confirm({
            title: '确定要删除这个分类吗？',
            content:
              '由于属性继承机制，分类不支持编辑，如需修改请删除后重新创建。删除分类可能会影响相关产品和子分类，请谨慎操作。',
            onOk: () => handleDelete(node),
          });
        },
      },
    ];

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <Space>
          <span style={{ fontWeight: isSearchResult ? 'bold' : 'normal' }}>{node.name}</span>
          <Tag color={node.is_active ? 'success' : 'default'}>
            {node.is_active ? '启用' : '禁用'}
          </Tag>
          {node.description && (
            <span style={{ color: '#999', fontSize: '12px' }}>{node.description}</span>
          )}
          <span style={{ color: '#ccc', fontSize: '11px' }}>ID: {node.id}</span>
        </Space>
        <Dropdown menu={{ items: getMenuItems(node) }} trigger={['click']} placement="bottomRight">
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      </div>
    );
  };

  // 搜索时找到所有匹配的节点及其父节点路径
  const getMatchingNodesWithPath = (
    categories: API.CategoryTreeInfo[],
    searchText: string,
    statusFilter?: boolean,
  ): { nodes: CategoryTreeNode[]; expandKeys: React.Key[] } => {
    const matchingNodes: CategoryTreeNode[] = [];
    const expandKeys: React.Key[] = [];
    const pathMap = new Map<number, API.CategoryTreeInfo[]>(); // 存储每个节点的路径

    // 构建路径映射
    const buildPathMap = (nodes: API.CategoryTreeInfo[], path: API.CategoryTreeInfo[] = []) => {
      nodes.forEach((node) => {
        const currentPath = [...path, node];
        pathMap.set(node.id, currentPath);
        if (node.children && node.children.length > 0) {
          buildPathMap(node.children, currentPath);
        }
      });
    };

    buildPathMap(categories);

    // 查找匹配的节点
    const findMatches = (nodes: API.CategoryTreeInfo[]) => {
      nodes.forEach((node) => {
        const matchesSearch =
          !searchText || node.name.toLowerCase().includes(searchText.toLowerCase());
        const matchesStatus = statusFilter === undefined || node.is_active === statusFilter;

        if (matchesSearch && matchesStatus) {
          // 获取完整路径
          const path = pathMap.get(node.id) || [];

          // 将路径中的所有节点添加到结果中
          path.forEach((pathNode, index) => {
            const existingNode = matchingNodes.find((n) => n.id === pathNode.id);
            if (!existingNode) {
              const treeNode: CategoryTreeNode = {
                ...pathNode,
                key: pathNode.id,
                title: renderNodeTitle(pathNode, true),
                children: [],
              };
              matchingNodes.push(treeNode);
            }

            // 添加到展开的keys中
            if (index < path.length - 1) {
              expandKeys.push(pathNode.id);
            }
          });
        }

        if (node.children && node.children.length > 0) {
          findMatches(node.children);
        }
      });
    };

    findMatches(categories);

    // 重新构建树结构
    const buildTree = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
      const nodeMap = new Map<number, CategoryTreeNode>();
      const rootNodes: CategoryTreeNode[] = [];

      // 创建节点映射
      nodes.forEach((node) => {
        nodeMap.set(node.id, { ...node, children: [] });
      });

      // 构建父子关系
      nodes.forEach((node) => {
        const treeNode = nodeMap.get(node.id)!;
        if (node.parent_id && nodeMap.has(node.parent_id)) {
          const parent = nodeMap.get(node.parent_id)!;
          if (!parent.children) parent.children = [];
          parent.children.push(treeNode);
        } else {
          rootNodes.push(treeNode);
        }
      });

      return rootNodes;
    };

    return { nodes: buildTree(matchingNodes), expandKeys };
  };

  // 转换分类数据为Tree组件需要的格式
  const convertToTreeData = (categories: API.CategoryTreeInfo[]): CategoryTreeNode[] => {
    return categories.map((category) => ({
      ...category,
      key: category.id,
      title: renderNodeTitle(category),
      children: category.children ? convertToTreeData(category.children) : undefined,
    }));
  };

  // 计算要显示的树数据
  const treeData = useMemo(() => {
    if (searchValue || statusFilter !== undefined) {
      const { nodes, expandKeys } = getMatchingNodesWithPath(
        categoryTree,
        searchValue,
        statusFilter,
      );
      if (autoExpandParent) {
        setExpandedKeys(expandKeys);
        setAutoExpandParent(false);
      }
      return nodes;
    } else {
      return convertToTreeData(categoryTree);
    }
  }, [categoryTree, searchValue, statusFilter, autoExpandParent]);

  // 处理展开/收缩
  const onExpand = (expandedKeysValue: React.Key[]) => {
    setExpandedKeys(expandedKeysValue);
    setAutoExpandParent(false);
  };

  // 搜索变化时重置展开状态
  const onSearchChange = (value: string) => {
    setSearchValue(value);
    setAutoExpandParent(true);
  };

  return (
    <PageContainer>
      <ProCard>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Input
              placeholder="搜索分类名称"
              prefix={<SearchOutlined />}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="筛选状态"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
              options={[
                { label: '启用', value: true },
                { label: '禁用', value: false },
              ]}
            />
          </Col>
          <Col span={6}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd()}>
              新增分类
            </Button>
          </Col>
        </Row>

        <div
          style={{
            border: '1px solid #f0f0f0',
            borderRadius: '6px',
            padding: '16px',
            minHeight: '400px',
          }}
        >
          {treeData.length > 0 ? (
            <Tree
              treeData={treeData}
              expandedKeys={expandedKeys}
              autoExpandParent={autoExpandParent}
              onExpand={onExpand}
              showLine={{ showLeafIcon: false }}
              defaultExpandAll={!searchValue && statusFilter === undefined}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#999', padding: '50px 0' }}>
              {searchValue || statusFilter !== undefined ? '没有找到匹配的分类' : '暂无分类数据'}
            </div>
          )}
        </div>
      </ProCard>

      <CategoryForm
        visible={categoryFormVisible}
        onVisibleChange={setCategoryFormVisible}
        onSuccess={handleFormSuccess}
        category={currentCategory}
        title={formTitle}
      />

      <Modal
        title="移动分类"
        open={moveModalVisible}
        onCancel={() => {
          setMoveModalVisible(false);
          setMoveCategory(undefined);
          setSelectedParentId(undefined);
        }}
        onOk={handleMoveSubmit}
        width={500}
      >
        {moveCategory && (
          <div>
            <p>
              将分类 <strong>{moveCategory.name}</strong> 移动到：
            </p>
            <Select
              style={{ width: '100%' }}
              placeholder="选择新的父分类"
              options={convertToSelectData(categoryTree)}
              onChange={setSelectedParentId}
            />
          </div>
        )}
      </Modal>

      <CategoryAttributeManager
        visible={attributeManagerVisible}
        onCancel={() => setAttributeManagerVisible(false)}
        category={selectedCategory}
      />
    </PageContainer>
  );
};

export default CategoryList;
