'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, Select, Table, Typography, Space, Spin, Empty, message, Button, Descriptions, Input } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;

interface SnapshotItem {
  id: string;
  caseId: string;
  year: number;
  snapshotAt: string | Date;
  caseNumber: string;
  caseName: string;
  affiliation: string;
  status: string;
  data: any;
}

export default function CaseSnapshotsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [affiliationFilter, setAffiliationFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const affiliationOptions = useMemo(
    () => Array.from(new Set(snapshots.map((s) => s.affiliation))).map((v) => ({ value: v, label: v })),
    [snapshots]
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(snapshots.map((s) => s.status))).map((v) => ({ value: v, label: v })),
    [snapshots]
  );

  const filteredSnapshots = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return snapshots.filter((s) => {
      if (affiliationFilter && s.affiliation !== affiliationFilter) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      if (q) {
        const d = s.data || {};
        const hay = [s.caseNumber, s.caseName, d.plaintiffName, d.defendantName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [snapshots, searchText, affiliationFilter, statusFilter]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchSnapshots = async (year: number) => {
    try {
      setLoading(true);
      const res = await axios.get('/api/cases/snapshots', { params: { year } });
      setSnapshots(res.data.snapshots || []);
    } catch (error: any) {
      console.error('加载案件快照失败:', error);
      message.error(error?.response?.data?.error || '加载案件快照失败');
    } finally {
      setLoading(false);
    }
  };

  const generateSnapshots = async (force = false) => {
    try {
      setGenerating(true);
      const res = await axios.post('/api/cases/snapshots/generate', null, { params: { year: selectedYear, force } });
      message.success(res.data?.message || `已生成 ${selectedYear} 年快照`);
      // 生成后刷新列表
      fetchSnapshots(selectedYear);
    } catch (error: any) {
      console.error('生成案件快照失败:', error);
      message.error(error?.response?.data?.error || '生成案件快照失败');
    } finally {
      setGenerating(false);
    }
  };

  const exportSnapshots = () => {
    try {
      if (!filteredSnapshots || filteredSnapshots.length === 0) {
        message.warning('当前没有可导出的快照数据');
        return;
      }

      const rows = filteredSnapshots.map((s) => {
        const d = s.data || {};
        return {
          '快照年份': s.year,
          '快照时间': s.snapshotAt ? dayjs(s.snapshotAt).format('YYYY-MM-DD HH:mm:ss') : '',
          '案件号': s.caseNumber || '',
          '案件名称': s.caseName || '',
          '隶属': s.affiliation || '',
          '状态': s.status || '',
          '原告': d.plaintiffName ?? '',
          '被告': d.defendantName ?? '',
          '对方性质': d.opponentType ?? '',
          '案件类型': d.caseType ?? '',
          '立案日期': d.filingDate ? dayjs(d.filingDate).format('YYYY-MM-DD') : '',
          '审结日期': d.trialConclusionDate ? dayjs(d.trialConclusionDate).format('YYYY-MM-DD') : '',
          '执结日期': d.executionConclusionDate ? dayjs(d.executionConclusionDate).format('YYYY-MM-DD') : '',
          '诉讼地位': d.litigationStatus ?? '',
          '案由': d.causeOfAction ?? '',
          '纠纷解决方式': d.disputeResolutionMethod ?? '',
          '审理机构': d.trialInstitution ?? '',
          '所处阶段': d.currentStage ?? '',
          '所属领域': d.caseDomain ?? '',
          '标的额': d.claimAmount ?? '',
          '本金金额': d.principalAmount ?? '',
          '案件余额': d.caseBalance ?? '',
          '年度结案指标': d.annualClosureTarget ?? '',
          '年度避免/挽回损失': d.annualLossPreventionTarget ?? '',
          '年度已实现金额': d.annualRealizedAmount ?? '',
          '累计已实现金额': d.totalRealizedAmount ?? '',
          '计提坏账情况': d.badDebtProvision ?? '',
          '风险敞口': d.riskExposure ?? '',
          '项目组成员': d.projectTeamMembers ?? '',
          '诉讼费用': d.litigationCosts ?? '',
          '律所情况': d.lawFirmSituation ?? '',
          '代理费用': d.agencyFees ?? '',
          '其他费用情况': d.otherExpensesSituation ?? '',
          '其他费用': d.otherExpenses ?? '',
          '抵押担保情况': d.collateralSituation ?? '',
          '基本案情': d.basicCaseFacts ?? '',
          '处置措施描述': d.disposalMeasuresDescription ?? '',
          '月度进展情况': d.monthlyProgressSituation ?? '',
          '创建时间': d.createdAt ? dayjs(d.createdAt).format('YYYY-MM-DD HH:mm:ss') : '',
          '更新时间': d.updatedAt ? dayjs(d.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '',
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${selectedYear}`);
      const filename = `案件快照_${selectedYear}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      XLSX.writeFile(wb, filename);
      message.success(`已导出：${filename}`);
    } catch (error) {
      console.error('导出快照失败:', error);
      message.error('导出失败，请稍后重试');
    }
  };

  useEffect(() => {
    fetchSnapshots(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const columns = [
    { title: '快照时间', dataIndex: 'snapshotAt', key: 'snapshotAt', render: (v: any) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '案件号', dataIndex: 'caseNumber', key: 'caseNumber' },
    { title: '案件名称', dataIndex: 'caseName', key: 'caseName' },
    { title: '隶属', dataIndex: 'affiliation', key: 'affiliation' },
    { title: '状态', dataIndex: 'status', key: 'status' },
  ];

  const expandedRowRender = (record: SnapshotItem) => {
    const d = record.data || {};
    return (
      <Descriptions size="small" column={2} bordered>
        <Descriptions.Item label="案件号">{record.caseNumber}</Descriptions.Item>
        <Descriptions.Item label="案件名称">{record.caseName}</Descriptions.Item>
        <Descriptions.Item label="隶属">{record.affiliation}</Descriptions.Item>
        <Descriptions.Item label="状态">{record.status}</Descriptions.Item>
        <Descriptions.Item label="原告">{d.plaintiffName || '-'}</Descriptions.Item>
        <Descriptions.Item label="被告">{d.defendantName || '-'}</Descriptions.Item>
        <Descriptions.Item label="对方性质">{d.opponentType || '-'}</Descriptions.Item>
        <Descriptions.Item label="案件类型">{d.caseType || '-'}</Descriptions.Item>
        <Descriptions.Item label="立案日期">{d.filingDate ? dayjs(d.filingDate).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
        <Descriptions.Item label="审结日期">{d.trialConclusionDate ? dayjs(d.trialConclusionDate).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
        <Descriptions.Item label="执结日期">{d.executionConclusionDate ? dayjs(d.executionConclusionDate).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
        <Descriptions.Item label="诉讼地位">{d.litigationStatus || '-'}</Descriptions.Item>
        <Descriptions.Item label="案由">{d.causeOfAction || '-'}</Descriptions.Item>
        <Descriptions.Item label="纠纷解决方式">{d.disputeResolutionMethod || '-'}</Descriptions.Item>
        <Descriptions.Item label="审理机构">{d.trialInstitution || '-'}</Descriptions.Item>
        <Descriptions.Item label="所处阶段">{d.currentStage || '-'}</Descriptions.Item>
        <Descriptions.Item label="所属领域">{d.caseDomain || '-'}</Descriptions.Item>
        <Descriptions.Item label="标的额">{d.claimAmount ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="本金金额">{d.principalAmount ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="案件余额">{d.caseBalance ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="年度结案指标">{d.annualClosureTarget || '-'}</Descriptions.Item>
        <Descriptions.Item label="年度避免/挽回损失">{d.annualLossPreventionTarget ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="年度已实现金额">{d.annualRealizedAmount ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="累计已实现金额">{d.totalRealizedAmount ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="计提坏账情况">{d.badDebtProvision || '-'}</Descriptions.Item>
        <Descriptions.Item label="风险敞口">{d.riskExposure ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="项目组成员" span={2}>{d.projectTeamMembers || '-'}</Descriptions.Item>
        <Descriptions.Item label="诉讼费用">{d.litigationCosts ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="律所情况">{d.lawFirmSituation || '-'}</Descriptions.Item>
        <Descriptions.Item label="代理费用">{d.agencyFees ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="其他费用情况">{d.otherExpensesSituation || '-'}</Descriptions.Item>
        <Descriptions.Item label="其他费用">{d.otherExpenses ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="抵押担保情况" span={2}>{d.collateralSituation || '-'}</Descriptions.Item>
        <Descriptions.Item label="基本案情" span={2}>{d.basicCaseFacts || '-'}</Descriptions.Item>
        <Descriptions.Item label="处置措施描述" span={2}>{d.disposalMeasuresDescription || '-'}</Descriptions.Item>
        <Descriptions.Item label="月度进展情况" span={2}>{d.monthlyProgressSituation || '-'}</Descriptions.Item>
        <Descriptions.Item label="快照时间">{record.snapshotAt ? dayjs(record.snapshotAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
        <Descriptions.Item label="快照年份">{record.year}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{d.createdAt ? dayjs(d.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
        <Descriptions.Item label="更新时间">{d.updatedAt ? dayjs(d.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
      </Descriptions>
    );
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>案件快照</Title>
        <Space>
          <Button onClick={() => router.push('/dashboard/cases')}>返回案件管理</Button>
        </Space>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }} align="center">
          <Text>选择年份：</Text>
          <Select
            value={selectedYear}
            onChange={(y) => setSelectedYear(y)}
            style={{ width: 120 }}
            options={years.map((y) => ({ value: y, label: `${y}年` }))}
          />
          <Input.Search
            placeholder="搜索案件号/案件名称/原告/被告"
            allowClear
            style={{ width: 260 }}
            onSearch={(val) => setSearchText(val)}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            allowClear
            placeholder="筛选隶属"
            style={{ width: 140 }}
            options={affiliationOptions}
            value={affiliationFilter}
            onChange={(v) => setAffiliationFilter(v)}
          />
          <Select
            allowClear
            placeholder="筛选状态"
            style={{ width: 140 }}
            options={statusOptions}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
          />
          <Button onClick={exportSnapshots} disabled={loading || filteredSnapshots.length === 0}>导出Excel</Button>
          {session?.user?.role === UserRole.ADMIN && (
            <Space>
              <Button type="primary" onClick={() => generateSnapshots(false)} loading={generating}>生成快照</Button>
              <Button onClick={() => generateSnapshots(true)} loading={generating}>强制生成</Button>
            </Space>
          )}
        </Space>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : snapshots.length === 0 ? (
          <Empty description="该年份暂无案件快照" />
        ) : (
          <Table
            columns={columns as any}
            dataSource={filteredSnapshots.map((s) => ({ ...s, key: s.id }))}
            pagination={{ pageSize: 10 }}
            expandable={{ expandedRowRender, expandRowByClick: true }}
          />
        )}
      </Card>
    </DashboardLayout>
  );
}