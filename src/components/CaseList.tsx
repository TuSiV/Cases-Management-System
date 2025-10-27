'use client';

import React from 'react';
import { Table, Tag, Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate, getCaseStatusColor, getCaseTypeColor } from '@/utils';
import { Affiliation, CaseStatus, CaseType } from '@/types';

interface CaseData {
  id: string;
  caseNumber: string;
  caseName: string;
  affiliation: Affiliation;
  status: CaseStatus;
  caseType: CaseType;
  filingDate: string;
  claimAmount: number;
  caseBalance: number;
  // 已定义所有必要字段，避免使用索引签名以提高类型安全性
}

interface CaseListProps {
  cases: CaseData[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  onPageChange: (page: number, pageSize: number) => void;
  onDelete: (id: string) => void;
  hasEditPermission: (caseData: CaseData) => boolean;
}

const CaseList: React.FC<CaseListProps> = ({ 
  cases, 
  loading, 
  pagination, 
  onPageChange, 
  onDelete,
  hasEditPermission
}) => {
  const columns = [
    {
      title: '案件号',
      dataIndex: 'caseNumber',
      key: 'caseNumber',
      render: (text: string, record: CaseData) => (
        <Link href={`/dashboard/cases/${record.id}`}>
          {text}
        </Link>
      ),
    },
    {
      title: '案件名称',
      dataIndex: 'caseName',
      key: 'caseName',
      ellipsis: true,
    },
    {
      title: '隶属',
      dataIndex: 'affiliation',
      key: 'affiliation',
    },
    {
      title: '案件标的额',
      dataIndex: 'claimAmount',
      key: 'claimAmount',
      render: (value: number) => `¥${value.toLocaleString()}`
    },
    {
      title: '案件标的余额',
      dataIndex: 'caseBalance',
      key: 'caseBalance',
      render: (value: number) => `¥${value.toLocaleString()}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => (
        <Tag color={getCaseStatusColor(text)}>{text}</Tag>
      ),
    },
    {
      title: '案件类型',
      dataIndex: 'caseType',
      key: 'caseType',
      render: (text: string) => (
        <Tag color={getCaseTypeColor(text)}>{text}</Tag>
      ),
    },
    {
      title: '立案日期',
      dataIndex: 'filingDate',
      key: 'filingDate',
      render: (text: string) => formatDate(text),
    },
    {
      title: '操作',
      key: 'action',
      render: (text: string, record: CaseData) => (
        <Space size="middle">
          <Link href={`/dashboard/cases/${record.id}`}>
            <Button type="text" icon={<EyeOutlined />} title="查看" />
          </Link>
          
          {hasEditPermission(record) && (
            <>
              <Link href={`/dashboard/cases/edit/${record.id}`}>
                <Button type="text" icon={<EditOutlined />} title="编辑" />
              </Link>
              
              <Popconfirm
                title="确定要删除此案件吗？"
                onConfirm={() => onDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="text" danger icon={<DeleteOutlined />} title="删除" />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={cases.map(item => ({ ...item, key: item.id }))}
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
      scroll={{ x: 1200 }}
    />
  );
};

export default CaseList;