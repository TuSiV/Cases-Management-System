'use client';

import React from 'react';
import { Table, Tag, Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { UserRole, Affiliation } from '@/types';

interface UserData {
  id: string;
  username: string;
  name: string;
  affiliation: Affiliation;
  role: UserRole;
}

interface UserListProps {
  users: UserData[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  onPageChange: (page: number, pageSize: number) => void;
  onDelete: (id: string) => void;
  currentUserId: string;
}

const UserList: React.FC<UserListProps> = ({ 
  users, 
  loading, 
  pagination, 
  onPageChange, 
  onDelete,
  currentUserId
}) => {
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '隶属',
      dataIndex: 'affiliation',
      key: 'affiliation',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (text: UserRole) => (
        <Tag color={text === UserRole.ADMIN ? 'red' : text === UserRole.VIEWER ? 'green' : 'blue'}>
          {text === UserRole.ADMIN ? '管理员' : text === UserRole.VIEWER ? '查看员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (text: string, record: UserData) => (
        <Space size="middle">
          <Link href={`/dashboard/users/edit/${record.id}`}>
            <Button type="text" icon={<EditOutlined />} title="编辑" />
          </Link>
          
          <Link href={`/dashboard/users/${record.id}/reset-password`}>
            <Button type="text" icon={<KeyOutlined />} title="重置密码" />
          </Link>
          
          {record.id !== currentUserId && (
            <Popconfirm
              title="确定要删除此用户吗？"
              onConfirm={() => onDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger icon={<DeleteOutlined />} title="删除" />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={users.map(item => ({ ...item, key: item.id }))}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `共 ${total} 条记录`,
        onChange: onPageChange,
      }}
      loading={loading}
      scroll={{ x: 800 }}
    />
  );
};

export default UserList;