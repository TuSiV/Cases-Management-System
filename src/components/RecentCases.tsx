'use client';

import { Card, Table, Tag, Empty, Spin } from 'antd';
import { useRouter } from 'next/navigation';
import { formatDate, getCaseStatusColor, getCaseTypeColor } from '@/utils';

interface CaseData {
  id: string;
  caseNumber: string;
  name: string;
  affiliation: string;
  filingDate: string;
  caseType: string;
  status: string;
}

interface RecentCasesProps {
  data: CaseData[];
  loading?: boolean;
}

const RecentCases: React.FC<RecentCasesProps> = ({ data, loading = false }) => {
  const router = useRouter();

  const columns = [
    {
      title: '案件号',
      dataIndex: 'caseNumber',
      key: 'caseNumber',
      width: 180,
    },
    {
      title: '案件名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '隶属',
      dataIndex: 'affiliation',
      key: 'affiliation',
      width: 100,
    },
    {
      title: '立案日期',
      dataIndex: 'filingDate',
      key: 'filingDate',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: '案件类型',
      dataIndex: 'caseType',
      key: 'caseType',
      width: 100,
      render: (type: string) => (
        <Tag color={getCaseTypeColor(type)}>{type}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getCaseStatusColor(status)}>{status}</Tag>
      ),
    },
  ];

  const handleRowClick = (record: CaseData) => {
    router.push(`/dashboard/cases/${record.id}`);
  };

  return (
    <Card title="最近案件" style={{ height: '100%' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
        </div>
      ) : data && data.length > 0 ? (
        <Table
          columns={columns}
          dataSource={data.map((item) => ({ ...item, key: item.id }))}
          pagination={false}
          size="small"
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
          })}
        />
      ) : (
        <Empty description="暂无数据" />
      )}
    </Card>
  );
};

export default RecentCases;