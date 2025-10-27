'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, Typography, Table, Button, Modal, Form, InputNumber, Select, message, Spin, Row, Col, Switch, Input, Badge, Tooltip, Divider, Descriptions } from 'antd';
import { PlusOutlined, EditOutlined, ReloadOutlined, BarChartOutlined, CheckOutlined, InfoCircleOutlined, ProfileOutlined, DatabaseOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';
import { UserRole, Affiliation } from '@/types';
import DashboardChart from '@/components/DashboardChart';
import StatCard from '@/components/StatCard';

const { Title, Text } = Typography;
const { Option } = Select;

interface AnnualTarget {
  id: string;
  year: number;
  totalCaseClosureTarget: number;
  totalAmountReductionTarget: number;
  totalLossPreventionTarget: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    name: string;
  };
  updatedBy: {
    name: string;
  };
  affiliationTargets: AffiliationTarget[];
}

interface AffiliationTarget {
  id: string;
  affiliation: string;
  caseClosureTarget: number;
  amountReductionTarget: number;
  lossPreventionTarget: number;
}

interface TargetExecution {
  affiliation: string;
  caseClosureActual: number;
  amountReductionActual: number;
  lossPreventionActual: number;
  caseClosureTarget: number;
  amountReductionTarget: number;
  lossPreventionTarget: number;
}

interface CaseDetail {
  id: string;
  caseNumber: string;
  caseName: string;
  affiliation: string;
  caseAmount: number;
  caseBalance: number;
  status: string;
  isIncludedInTarget: boolean;
  caseClosureTarget: string;
  caseClosureActual?: number;
  amountReductionTarget: number;
  amountReductionActual?: number;
  lossPreventionTarget: number;
  lossPreventionActual?: number;
  executionConclusionDate?: string | null;
  annualRealizedAmount?: number;
}

interface CaseWithTarget extends Case {
  isIncludedInTarget: boolean;
  caseClosureTarget: string;
  lossPreventionTarget: number;
  amountReductionTarget?: number;
  targetId: string | null;
  caseBalance: number;
  annualClosureTarget?: string;
}

interface Case {
  id: string;
  caseNumber: string;
  caseName: string;
  affiliation: string;
  caseAmount: number;
  caseBalance: number;
  status: string;
  // 其他案件相关字段
}

const TargetsPage = () => {
  const [loading, setLoading] = useState(true);
  const [allTargets, setAllTargets] = useState<AnnualTarget[]>([]); // 存储所有年份的指标数据
  const [filteredTargets, setFilteredTargets] = useState<AnnualTarget[]>([]); // 存储当前选中年份的指标数据
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [targetExecution, setTargetExecution] = useState<TargetExecution[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<AnnualTarget | null>(null);
  const [form] = Form.useForm();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role?.toLowerCase() === UserRole.ADMIN;
  const userAffiliation = session?.user?.affiliation;
  const isUserRole = session?.user?.role?.toLowerCase() === UserRole.USER;
  // 新增：整体指标汇总（管理员、查看员可见；普通用户不显示）
  const overallTotals = useMemo(() => {
    const list = isUserRole && userAffiliation
      ? targetExecution.filter((x) => x.affiliation === userAffiliation)
      : targetExecution;
    const sum = (k: keyof TargetExecution) => list.reduce((s, x) => s + (Number(x[k]) || 0), 0);
    const caseClosureTarget = sum('caseClosureTarget');
    const caseClosureActual = sum('caseClosureActual');
    const amountReductionTarget = sum('amountReductionTarget');
    const amountReductionActual = sum('amountReductionActual');
    const lossPreventionTarget = sum('lossPreventionTarget');
    const lossPreventionActual = sum('lossPreventionActual');
    return {
      caseClosureTarget,
      caseClosureActual,
      caseClosureRate: caseClosureTarget > 0 ? (caseClosureActual / caseClosureTarget) * 100 : 0,
      amountReductionTarget,
      amountReductionActual,
      lossPreventionTarget,
      lossPreventionActual,
      amountReductionRate: amountReductionTarget > 0 ? (amountReductionActual / amountReductionTarget) * 100 : 0,
      lossPreventionRate: lossPreventionTarget > 0 ? (lossPreventionActual / lossPreventionTarget) * 100 : 0,
    };
  }, [isUserRole, userAffiliation, targetExecution]);

  // 美化：数值显示为万元并带默认值
  const fmtWan = (n?: number) => (Number(n || 0) / 10000).toFixed(2);
  // 美化：小卡片组件（统一样式）
  const MetricBox = ({ label, value, unit = '' }: { label: string; value: any; unit?: string }) => (
    <Card size="small" bordered bodyStyle={{ padding: 6 }} style={{ minHeight: 64 }}>
      <div style={{ fontSize: 10, color: '#666' }}>{label}</div>
      <div style={{ marginTop: 2, fontWeight: 600, fontSize: 14 }}>
        {value}{unit}
      </div>
    </Card>
  );
  const MetricGroupCard = ({ items, column = 3 }: { items: { label: string; value: any; unit?: string }[]; column?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number; xxl?: number } }) => (
    <Card size="small" bordered bodyStyle={{ padding: 8 }} style={{ marginTop: 4 }}>
      <Descriptions size="small" column={column} bordered={false}
        labelStyle={{ color: '#666', fontSize: 13, textAlign: 'center' }}
        contentStyle={{ fontSize: 14, fontWeight: 600, textAlign: 'center' }}
      >
        {items.map((it, idx) => (
          <Descriptions.Item key={`${it.label}-${idx}`} label={it.label}>
            {it.value}{it.unit || ''}
          </Descriptions.Item>
        ))}
      </Descriptions>
    </Card>
  );
  // 案件选择相关状态
  const [casesModalVisible, setCasesModalVisible] = useState(false);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesWithTargetInfo, setCasesWithTargetInfo] = useState<CaseWithTarget[]>([]);
  const [annualTargetId, setAnnualTargetId] = useState<string>('');
  const [affiliationFilter, setAffiliationFilter] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  
  // 案件明细模态框相关状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userCaseDetailLoading, setUserCaseDetailLoading] = useState(false);
  const [selectedAffiliation, setSelectedAffiliation] = useState<string>('');
  const [caseDetails, setCaseDetails] = useState<CaseDetail[]>([]);
  const [userCaseDetails, setUserCaseDetails] = useState<CaseDetail[]>([]);
  const [detailMetric, setDetailMetric] = useState<'closure' | 'reduction' | 'prevention' | null>(null);
  // 指标描述模块数据（管理员、查看员可见）
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [descriptionData, setDescriptionData] = useState<any>(null);

  // 组件初始化时获取所有年份指标
  useEffect(() => {
    fetchAllTargets();
  }, []);

  // 年份变化时过滤显示的数据和获取执行数据
  useEffect(() => {
    filterTargetsByYear();
    fetchTargetExecution();
    // 管理员/查看员获取指标描述
    if (!isUserRole) {
      fetchDescription();
    }
    // 普通用户自动获取案件明细
    if (isUserRole && userAffiliation) {
      fetchUserCaseDetails();
    }
  }, [selectedYear, allTargets, isUserRole, userAffiliation]);

  // 获取指标描述数据（今年实时、往年快照）
  const fetchDescription = async () => {
    try {
      setDescriptionLoading(true);
      const params = new URLSearchParams({ year: selectedYear.toString() });
      const response = await axios.get(`/api/dashboard/targets/description?${params.toString()}`);
      setDescriptionData(response.data.description || null);
    } catch (error) {
      console.error('Error fetching description:', error);
    } finally {
      setDescriptionLoading(false);
    }
  };
  // 获取所有年份的指标数据
  const fetchAllTargets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard/targets');
      setAllTargets(response.data.targets || []);
    } catch (error) {
      message.error('获取指标数据失败');
      console.error('Error fetching targets:', error);
    } finally {
      setLoading(false);
    }
  };

  // 根据选中的年份过滤指标数据
  const filterTargetsByYear = () => {
    if (allTargets.length === 0) return;
    
    // 如果选择了特定年份，则过滤显示该年份的数据
    const filtered = allTargets.filter(target => target.year === selectedYear);
    setFilteredTargets(filtered);
  };

  // 刷新数据
  const fetchTargets = fetchAllTargets; // 重命名以保持兼容性

  const fetchTargetExecution = async () => {
    try {
      const response = await axios.get(`/api/dashboard/targets/execution?year=${selectedYear}`);
      setTargetExecution(response.data.execution || []);
    } catch (error) {
      message.error('获取指标执行数据失败');
      console.error('Error fetching target execution:', error);
    }
  };

  // 获取案件及指标信息
  const fetchCasesWithTargetInfo = async () => {
    try {
      setCasesLoading(true);
      const params = new URLSearchParams({
        year: selectedYear.toString(),
      });
      if (affiliationFilter) {
        params.append('affiliation', affiliationFilter);
      }
      const response = await axios.get(`/api/dashboard/targets/case-targets?${params.toString()}`);
      setCasesWithTargetInfo(response.data.cases || []);
      setAnnualTargetId(response.data.annualTargetId || '');
    } catch (error) {
      message.error('获取案件指标信息失败');
      console.error('Error fetching cases with target info:', error);
    } finally {
      setCasesLoading(false);
    }
  };

  // 打开案件选择模态框
  const openCasesModal = () => {
    if (!annualTargetId) {
      fetchCasesWithTargetInfo();
    }
    setCasesModalVisible(true);
  };

  // 处理案件纳入指标统计的开关
  const handleCaseToggle = async (caseId: string, checked: boolean) => {
    try {
      const caseInfo = casesWithTargetInfo.find(c => c.id === caseId);
      if (!caseInfo) return;

      // 临时更新UI状态
      setCasesWithTargetInfo(prev => prev.map(c => 
        c.id === caseId ? { ...c, isIncludedInTarget: checked } : c
      ));

      // 发送请求到服务器
      await axios.post('/api/dashboard/targets/case-targets', {
        annualTargetId,
        caseId,
        isIncludedInTarget: checked,
        caseClosureTarget: caseInfo.caseClosureTarget || caseInfo.annualClosureTarget || '',
        lossPreventionTarget: caseInfo.lossPreventionTarget || 0,
        amountReductionTarget: caseInfo.amountReductionTarget || 0,
      });

      message.success(`案件${checked ? '已纳入' : '已排除'}指标统计`);
      // 刷新执行汇总与整体指标卡片
      fetchTargetExecution();
    } catch (error) {
      // 回滚UI状态
      setCasesWithTargetInfo(prev => prev.map(c => 
        c.id === caseId ? { ...c, isIncludedInTarget: !checked } : c
      ));
      message.error(`操作失败，请重试`);
      console.error('Error toggling case inclusion:', error);
    }
  };

  // 更新案件指标
  const handleCaseTargetUpdate = async (caseId: string, field: string, value: number | string) => {
    try {
      const caseInfo = casesWithTargetInfo.find(c => c.id === caseId);
      if (!caseInfo) return;

      // 临时更新UI状态
      setCasesWithTargetInfo(prev => prev.map(c => 
        c.id === caseId ? { ...c, [field]: value } : c
      ));

      // 发送请求到服务器
      await axios.post('/api/dashboard/targets/case-targets', {
        annualTargetId,
        caseId,
        isIncludedInTarget: caseInfo.isIncludedInTarget,
        caseClosureTarget: field === 'caseClosureTarget' ? value : caseInfo.caseClosureTarget,
        lossPreventionTarget: field === 'lossPreventionTarget' ? value : caseInfo.lossPreventionTarget,
        amountReductionTarget: field === 'amountReductionTarget' ? value : (caseInfo.amountReductionTarget || 0),
      });

      message.success('案件指标更新成功');
      // 刷新执行汇总与整体指标卡片
      fetchTargetExecution();
    } catch (error) {
      message.error('案件指标更新失败，请重试');
      console.error('Error updating case target:', error);
      // 重新获取数据以确保一致性
      fetchCasesWithTargetInfo();
    }
  };

  // 批量保存所有案件指标更改
  const handleSaveAllCaseTargets = async () => {
    try {
      const caseTargets = casesWithTargetInfo.map(c => ({
        caseId: c.id,
        isIncludedInTarget: c.isIncludedInTarget,
        caseClosureTarget: c.caseClosureTarget || c.annualClosureTarget || '',
        lossPreventionTarget: c.lossPreventionTarget,
        amountReductionTarget: c.amountReductionTarget || 0,
      }));

      await axios.put('/api/dashboard/targets/case-targets', {
        annualTargetId,
        caseTargets,
      });

      message.success('所有案件指标已保存');
      setCasesModalVisible(false);
      // 重新获取执行数据以反映更改
      fetchTargetExecution();
    } catch (error) {
      message.error('保存失败，请重试');
      console.error('Error saving all case targets:', error);
    }
  };

  const handleEdit = (target: AnnualTarget) => {
    setCurrentTarget(target);
    form.setFieldsValue({
      year: target.year,
      totalCaseClosureTarget: target.totalCaseClosureTarget,
      totalAmountReductionTarget: target.totalAmountReductionTarget,
      totalLossPreventionTarget: target.totalLossPreventionTarget,
    });
    setEditModalVisible(true);
  };

  const handleCreate = () => {
    setCurrentTarget(null);
    form.setFieldsValue({
      year: selectedYear,
      totalCaseClosureTarget: 0,
      totalAmountReductionTarget: 0,
      totalLossPreventionTarget: 0,
    });
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = form.getFieldsValue();
      const payload = {
        ...values,
        affiliationTargets: [] as AffiliationTarget[]
      };

      if (currentTarget) {
        // 更新时将ID包含在请求体中，而不是URL路径
        await axios.put('/api/dashboard/targets', { 
          id: currentTarget.id, 
          ...payload 
        });
        message.success('指标更新成功');
      } else {
        await axios.post('/api/dashboard/targets', payload);
        message.success('指标创建成功');
      }
      setEditModalVisible(false);
      fetchTargets();
      fetchTargetExecution();
    } catch (error: any) {
      // 显示更具体的错误信息
      if (error.response && error.response.data && error.response.data.error) {
        message.error(error.response.data.error);
      } else {
        message.error('保存失败，请重试');
      }
      console.error('Error saving target:', error);
    }
  };

  const handleDelete = async () => {
    if (!currentTarget) return;

    try {
      // 显示确认对话框
      Modal.confirm({
        title: '确认删除',
        content: '确定要删除此指标吗？此操作不可撤销。',
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          await axios.delete(`/api/dashboard/targets?id=${currentTarget.id}`);
          message.success('指标删除成功');
          setEditModalVisible(false);
          fetchTargets();
          fetchTargetExecution();
        }
      });
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.error) {
        message.error(error.response.data.error);
      } else {
        message.error('删除失败，请重试');
      }
      console.error('Error deleting target:', error);
    }
  };

  const targetColumns: ColumnsType<AnnualTarget> = [
    {
      title: '年份',
      dataIndex: 'year',
      key: 'year',
    },
    {
      title: '总结案目标',
      dataIndex: 'totalCaseClosureTarget',
      key: 'totalCaseClosureTarget',
    },
    {
      title: '标的压降目标(万元)',
      dataIndex: 'totalAmountReductionTarget',
      key: 'totalAmountReductionTarget',
      render: (value: number) => (value / 10000).toFixed(2),
    },
    {
      title: '防损目标(万元)',
      dataIndex: 'totalLossPreventionTarget',
      key: 'totalLossPreventionTarget',
      render: (value: number) => (value / 10000).toFixed(2),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作人',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      render: (user: { name: string } | null | undefined) => user?.name || '-',
    },
    ...(isAdmin ? [
      {
        title: '操作',
        key: 'action',
        render: (_: any, record: AnnualTarget) => (
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        ),
      },
    ] : []),
  ]

  // 获取特定隶属单位的案件明细
  const fetchCaseDetails = async (affiliation: string) => {
    try {
      setDetailLoading(true);
      await fetchCaseDetailsData(affiliation, setCaseDetails);
    } catch (error) {
      message.error('获取案件明细失败');
      console.error('Error fetching case details:', error);
    } finally {
      setDetailLoading(false);
    }
  };
  
  // 获取普通用户的案件明细
  const fetchUserCaseDetails = async () => {
    if (!userAffiliation) return;
    
    try {
      setUserCaseDetailLoading(true);
      await fetchCaseDetailsData(userAffiliation, setUserCaseDetails);
    } catch (error) {
      message.error('获取案件明细失败');
      console.error('Error fetching user case details:', error);
    } finally {
      setUserCaseDetailLoading(false);
    }
  };
  
  // 共享的案件明细获取逻辑
  const fetchCaseDetailsData = async (affiliation: string, setData: (data: CaseDetail[]) => void) => {
    // 先获取案件基础数据
    const params = new URLSearchParams({
      year: selectedYear.toString(),
      affiliation: affiliation,
    });
    const response = await axios.get(`/api/dashboard/targets/case-targets?${params.toString()}`);
    const cases = response.data.cases || [];
    
    // 处理案件明细数据，根据要求映射字段
    const enrichedCases = cases.map((caseData: any) => {
      // 实际防损：按年度已实现金额
      const lossPreventionActual = Number(caseData.annualRealizedAmount) || 0;
      // 实际压降：状态为未结案或审结时，等于实际防损；其他状态时为标的余额
      const amountReductionActual = (caseData.status === '未结案' || caseData.status === '审结')
        ? lossPreventionActual
        : (Number(caseData.caseBalance) || 0);
      
      // 判断是否计入实际结案：排除"未结案"和"审结"状态的案件
      const shouldCountAsActualClosure = caseData.status !== '未结案' && caseData.status !== '审结';
        
      return {
        ...caseData,
        // 确保必要字段存在
        caseBalance: caseData.caseBalance || 0,
        annualRealizedAmount: caseData.annualRealizedAmount || 0,
        // 标的压降目标：来自案件设置
        amountReductionTarget: caseData.amountReductionTarget || 0,
        // 实际压降与实际防损（独立口径）
        amountReductionActual,
        lossPreventionActual,
        // 根据案件状态设置是否计入实际结案
        caseClosureActual: shouldCountAsActualClosure ? 1 : 0
      };
    });
    
    setData(enrichedCases);
  };

  // 新增：批量获取多个隶属单位的案件明细并合并
  const fetchCaseDetailsForAffiliations = async (affiliations: string[]) => {
    try {
      setDetailLoading(true);
      const aggregated: CaseDetail[] = [];
      for (const aff of affiliations) {
        const params = new URLSearchParams({ year: selectedYear.toString(), affiliation: aff });
        const response = await axios.get(`/api/dashboard/targets/case-targets?${params.toString()}`);
        const cases = response.data.cases || [];
        const enriched = cases.map((caseData: any) => {
          const lossPreventionActual = Number(caseData.annualRealizedAmount) || 0;
          const amountReductionActual = (caseData.status === '未结案' || caseData.status === '审结')
            ? lossPreventionActual
            : (Number(caseData.caseBalance) || 0);
          const shouldCountAsActualClosure = caseData.status !== '未结案' && caseData.status !== '审结';
          return {
            ...caseData,
            caseBalance: caseData.caseBalance || 0,
            annualRealizedAmount: caseData.annualRealizedAmount || 0,
            amountReductionTarget: caseData.amountReductionTarget || 0,
            amountReductionActual,
            lossPreventionActual,
            caseClosureActual: shouldCountAsActualClosure ? 1 : 0
          } as CaseDetail;
        });
        aggregated.push(...enriched);
      }
      setCaseDetails(aggregated);
    } catch (error) {
      message.error('获取案件明细失败');
      console.error('Error fetching multiple case details:', error);
    } finally {
      setDetailLoading(false);
    }
  };
  const openDetailModal = (affiliation: string) => {
    // 对于普通用户，只能查看自己隶属单位的明细
    const targetAffiliation = isUserRole && userAffiliation ? userAffiliation : affiliation;
    setSelectedAffiliation(targetAffiliation);
    setDetailMetric(null);
    fetchCaseDetails(targetAffiliation);
    setDetailModalVisible(true);
  };

  const openMetricDetail = (metric: 'closure' | 'reduction' | 'prevention') => {
    if (isUserRole && userAffiliation) {
      setSelectedAffiliation(userAffiliation);
      setDetailMetric(metric);
      fetchCaseDetails(userAffiliation);
      setDetailModalVisible(true);
      return;
    }
    // 管理员/查看员：默认打开列表中的所有隶属单位数据
    const affiliations = Array.from(new Set(targetExecution.map(x => x.affiliation))).filter(Boolean);
    if (affiliations.length === 0) {
      message.warning('暂无隶属单位执行数据');
      return;
    }
    setSelectedAffiliation('所有隶属单位');
    setDetailMetric(metric);
    fetchCaseDetailsForAffiliations(affiliations);
    setDetailModalVisible(true);
  };
  const executionColumns: ColumnsType<TargetExecution> = [
    {
      title: '隶属单位',
      dataIndex: 'affiliation',
      key: 'affiliation',
      render: (text: string) => (
        <Button
          type="link"
          onClick={() => openDetailModal(text)}
          style={{ padding: 0, height: 'auto' }}
          disabled={isUserRole}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '结案目标',
      dataIndex: 'caseClosureTarget',
      key: 'caseClosureTarget',
    },
    {
      title: '实际结案',
      dataIndex: 'caseClosureActual',
      key: 'caseClosureActual',
    },
    {
      title: '结案完成率',
      key: 'caseCompletionRate',
      render: (_, record) => {
        const rate = record.caseClosureTarget > 0 ? (record.caseClosureActual / record.caseClosureTarget) * 100 : 0;
        return `${rate.toFixed(2)}%`;
      },
    },
    {
      title: '标的压降目标(万元)',
      dataIndex: 'amountReductionTarget',
      key: 'amountReductionTarget',
      render: (value) => (value / 10000).toFixed(2),
    },
    {
      title: '实际压降(万元)',
      dataIndex: 'amountReductionActual',
      key: 'amountReductionActual',
      render: (value) => (value / 10000).toFixed(2),
    },
    {
      title: '压降完成率',
      key: 'amountCompletionRate',
      render: (_, record) => {
        const rate = record.amountReductionTarget > 0 ? (record.amountReductionActual / record.amountReductionTarget) * 100 : 0;
        return `${rate.toFixed(2)}%`;
      },
    },
    {
      title: '防损目标(万元)',
      dataIndex: 'lossPreventionTarget',
      key: 'lossPreventionTarget',
      render: (value) => (value / 10000).toFixed(2),
    },
    {
      title: '实际防损(万元)',
      dataIndex: 'lossPreventionActual',
      key: 'lossPreventionActual',
      render: (value) => (value / 10000).toFixed(2),
    },
    {
      title: '防损完成率',
      key: 'lossCompletionRate',
      render: (_, record) => {
        const rate = record.lossPreventionTarget > 0 ? (record.lossPreventionActual / record.lossPreventionTarget) * 100 : 0;
        return `${rate.toFixed(2)}%`;
      },
    },
  ];

  // 案件指标表格的列定义
  // 案件明细表格的列定义
  const detailColumns: ColumnsType<CaseDetail> = [
    {
      title: '案件编号',
      dataIndex: 'caseNumber',
      key: 'caseNumber',
      render: (text: string, record: CaseDetail) => (
        <a 
          href={`/dashboard/cases/${record.id}`} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: '#1890ff', cursor: 'pointer' }}
        >
          {text}
        </a>
      ),
      width: 180,
    },
    {
      title: '案件名称',
      dataIndex: 'caseName',
      key: 'caseName',
      fixed: 'left',
      width: 240,
    },
    {      
      title: '案件金额(万元)',
      dataIndex: 'caseBalance',
      key: 'caseBalance',
      render: (value: number) => (value / 10000).toFixed(2),
    },
    {
      title: '案件状态',
      dataIndex: 'status',
      key: 'status',
    },
    {      
      title: '结案目标',
      dataIndex: 'caseClosureTarget',
      key: 'caseClosureTarget',
      render: (value: string) => {
        // 创建结案目标的中英文映射表
        const closureTargetMap: Record<string, string> = {
          'EXECUTION_CLOSURE': '执行结案',
          'TRIAL_CLOSURE': '审理结案',
          'NORMAL_PROGRESS': '正常推进',
        };
        // 返回对应的中文值，如果没有匹配则返回原值
        return closureTargetMap[value] || value || '未设置';
      },
    },
    {
      title: '实际结案',
      dataIndex: 'caseClosureActual',
      key: 'caseClosureActual',
      render: (value?: number) => value || 0,
    },
    {
      title: '标的压降目标(万元)',
      dataIndex: 'amountReductionTarget',
      key: 'amountReductionTarget',
      render: (value: number) => (value / 10000).toFixed(2),
    },
    {
      title: '实际压降(万元)',
      key: 'actualReduction',
      render: (_, record) => {
        const actualReduction = record.amountReductionActual || 0;
        return (actualReduction / 10000).toFixed(2);
      },
    },
    {
      title: '防损目标(万元)',
      dataIndex: 'lossPreventionTarget',
      key: 'lossPreventionTarget',
      render: (value: number) => (value / 10000).toFixed(2),
    },
    {
      title: '实际防损(万元)',
      key: 'actualPrevention',
      render: (_, record) => ((record.lossPreventionActual || 0) / 10000).toFixed(2),
    },
    {
      title: '是否纳入统计',
      key: 'included',
      render: (_, record) => (
        <Badge
          status={record.isIncludedInTarget ? 'success' : 'default'}
          text={record.isIncludedInTarget ? '已纳入' : '未纳入'}
        />
      ),
    },
  ];

  const caseColumns: ColumnsType<CaseWithTarget> = [
    {
      title: '案件编号',
      dataIndex: 'caseNumber',
      key: 'caseNumber',
    },
    {
      title: '案件名称',
      dataIndex: 'caseName',
      key: 'caseName',
    },
    {
      title: '隶属单位',
      dataIndex: 'affiliation',
      key: 'affiliation',
    },
    {      title: '案件金额(万元)',      dataIndex: 'caseBalance',      key: 'caseBalance',      render: (value: number) => (value / 10000).toFixed(2),    },
    {
      title: '案件状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '纳入统计',
      key: 'include',
      render: (_, record) => (
        <Switch
          checked={record.isIncludedInTarget}
          onChange={(checked) => handleCaseToggle(record.id, checked)}
        />
      ),
    },
    {
      title: '结案目标',
      key: 'caseClosureTarget',
      render: (_, record) => (
        <Select
          value={record.caseClosureTarget || record.annualClosureTarget || 'NORMAL_PROGRESS'}
          onChange={(value) => handleCaseTargetUpdate(record.id, 'caseClosureTarget', value)}
          disabled={!record.isIncludedInTarget}
          style={{ width: 120 }}
        >
          <Option value="EXECUTION_CLOSURE">执行结案</Option>
          <Option value="TRIAL_CLOSURE">审理结案</Option>
          <Option value="NORMAL_PROGRESS">正常推进</Option>
        </Select>
      ),
    },
    {
      title: '标的压降目标(万元)',
      key: 'amountReductionTarget',
      render: (_, record) => (
        <InputNumber
          min={0}
          value={(record.amountReductionTarget || 0) / 10000}
          onChange={(value) => handleCaseTargetUpdate(record.id, 'amountReductionTarget', (value || 0) * 10000)}
          disabled={!record.isIncludedInTarget}
          style={{ width: 120 }}
        />
      ),
    },
    {
      title: '防损目标(万元)',
      key: 'lossPreventionTarget',
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.lossPreventionTarget / 10000}
          onChange={(value) => handleCaseTargetUpdate(record.id, 'lossPreventionTarget', (value || 0) * 10000)}
          disabled={!record.isIncludedInTarget}
          style={{ width: 120 }}
        />
      ),
    },
  ];



  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Title level={4} style={{ margin: 0 }}>指标情况</Title>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Select
            value={selectedYear}
            onChange={(value) => {
              setSelectedYear(value);
              setAnnualTargetId(''); // 年份变化时重置年度目标ID
            }}
            style={{ width: 120 }}
          >
            {Array.from(new Set(allTargets.map(target => target.year)))
              .sort((a, b) => b - a) // 降序排列，最新年份在前
              .map(year => (
                <Option key={year} value={year}>{year}年</Option>
              ))}
          </Select>
          <Button
            onClick={fetchTargets}
            icon={<ReloadOutlined />}
          >
            刷新
          </Button>
          {!isUserRole && (
            <>
              {isAdmin && (
                <>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={openCasesModal}
                  >
                    选择案件
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreate}
                  >
                    创建指标
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {!isUserRole && (
        <Card title="整体指标完成情况" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <div onClick={() => openMetricDetail('closure')} style={{ cursor: 'pointer' }}>
                <StatCard
                  title={`结案（目标 ${overallTotals.caseClosureTarget} / 实际 ${overallTotals.caseClosureActual}）`}
                  value={Number(overallTotals.caseClosureRate.toFixed(2))}
                  precision={2}
                  suffix="%"
                  icon={<BarChartOutlined />}
                  color="#52c41a"
                />
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div onClick={() => openMetricDetail('reduction')} style={{ cursor: 'pointer' }}>
                <StatCard
                  title={`压降（目标 ${(overallTotals.amountReductionTarget / 10000).toFixed(2)}万 / 实际 ${(overallTotals.amountReductionActual / 10000).toFixed(2)}万）`}
                  value={Number(overallTotals.amountReductionRate.toFixed(2))}
                  precision={2}
                  suffix="%"
                  icon={<BarChartOutlined />}
                  color="#1890ff"
                />
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div onClick={() => openMetricDetail('prevention')} style={{ cursor: 'pointer' }}>
                <StatCard
                  title={`防损（目标 ${(overallTotals.lossPreventionTarget / 10000).toFixed(2)}万 / 实际 ${(overallTotals.lossPreventionActual / 10000).toFixed(2)}万）`}
                  value={Number(overallTotals.lossPreventionRate.toFixed(2))}
                  precision={2}
                  suffix="%"
                  icon={<BarChartOutlined />}
                  color="#faad14"
                />
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* 指标描述模块（管理员、查看员可见） */}
      {!isUserRole && (
        <Card
          size="small"
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ProfileOutlined />
              <span>指标描述</span>
              <Tooltip title="今年取实时数据，往年取快照；金额单位为万元">
                <InfoCircleOutlined />
              </Tooltip>
            </div>
          }
          headStyle={{ padding: '6px 10px' }}
          bodyStyle={{ padding: 10 }}
          style={{ marginBottom: 12 }}
          extra={<Badge color="blue" text={`${selectedYear}年`} />}
        >
          {descriptionLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <Spin size="large" />
            </div>
          ) : descriptionData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* 1. 民事案件总体情况 */}
              <Divider orientation="left" style={{ margin: '6px 0' }}>
                <DatabaseOutlined style={{ marginRight: 8 }} />1. 民事案件总体情况
              </Divider>

              <Row gutter={[6, 6]} style={{ marginTop: 4 }}>
                <Col xs={24} md={8}>
                  <Text strong>1.1 总体情况</Text>
                  <MetricGroupCard
                    column={1}
                    items={[
                      { label: '处置案件数量', value: descriptionData.section1.overall.disposalCaseCount },
                      { label: '涉案标的余额(万)', value: fmtWan(descriptionData.section1.overall.totalBalance) },
                      { label: '重大案件数量', value: descriptionData.section1.overall.majorCaseCount },
                      { label: '重大标的余额(万)', value: fmtWan(descriptionData.section1.overall.majorBalance) },
                      { label: '一般案件数量', value: descriptionData.section1.overall.normalCaseCount },
                      { label: '一般标的余额(万)', value: fmtWan(descriptionData.section1.overall.normalBalance) },
                    ]}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Text strong style={{ marginTop: 6 }}>1.2 存量案件情况</Text>
                  <MetricGroupCard
                    column={1}
                    items={[
                      { label: '存量案件数量', value: descriptionData.section1.existing.disposalCaseCount },
                      { label: '存量标的余额(万)', value: fmtWan(descriptionData.section1.existing.totalBalance) },
                      { label: '存量重大案件数量', value: descriptionData.section1.existing.majorCaseCount },
                      { label: '存量重大标的余额(万)', value: fmtWan(descriptionData.section1.existing.majorBalance) },
                      { label: '存量一般案件数量', value: descriptionData.section1.existing.normalCaseCount },
                      { label: '存量一般标的余额(万)', value: fmtWan(descriptionData.section1.existing.normalBalance) },
                    ]}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Text strong style={{ marginTop: 6 }}>1.3 新发案件情况</Text>
                  <MetricGroupCard
                    column={1}
                    items={[
                      { label: '新发案件数量', value: descriptionData.section1.new.disposalCaseCount },
                      { label: '新发标的余额(万)', value: fmtWan(descriptionData.section1.new.totalBalance) },
                      { label: '新发重大案件数量', value: descriptionData.section1.new.majorCaseCount },
                      { label: '新发重大标的余额(万)', value: fmtWan(descriptionData.section1.new.majorBalance) },
                      { label: '新发一般案件数量', value: descriptionData.section1.new.normalCaseCount },
                      { label: '新发一般标的余额(万)', value: fmtWan(descriptionData.section1.new.normalBalance) },
                    ]}
                  />
                </Col>
              </Row>
              {/* 2. 指标 */}
              <Divider orientation="left" style={{ margin: '6px 0' }}>
                <FolderOpenOutlined style={{ marginRight: 8 }} />2. 指标
              </Divider>

              <Row gutter={[6, 6]} style={{ marginTop: 4 }}>
                <Col xs={24} md={8}>
                  <Text strong>2.1 总体指标</Text>
                  <MetricGroupCard
                    column={1}
                    items={[
                      { label: '数量压降目标(件)', value: descriptionData.section2.overall.qtyTarget },
                      { label: '压降目标(万)', value: fmtWan(descriptionData.section2.overall.amountReductionTarget) },
                      { label: '防损目标(万)', value: fmtWan(descriptionData.section2.overall.lossPreventionTarget) },
                      { label: '数量压降(件)', value: descriptionData.section2.overall.qtyActual },
                      { label: '压降(万)', value: fmtWan(descriptionData.section2.overall.amountReductionActual) },
                      { label: '防损(万)', value: fmtWan(descriptionData.section2.overall.lossPreventionActual) },
                    ]}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Text strong style={{ marginTop: 6 }}>2.2 集团指标（重大案件）</Text>
                  <MetricGroupCard
                    column={1}
                    items={[
                      { label: '数量压降目标(件)', value: descriptionData.section2.major.qtyTarget },
                      { label: '压降目标(万)', value: fmtWan(descriptionData.section2.major.amountReductionTarget) },
                      { label: '防损目标(万)', value: fmtWan(descriptionData.section2.major.lossPreventionTarget) },
                      { label: '数量压降(件)', value: descriptionData.section2.major.qtyActual },
                      { label: '压降(万)', value: fmtWan(descriptionData.section2.major.amountReductionActual) },
                      { label: '防损(万)', value: fmtWan(descriptionData.section2.major.lossPreventionActual) },
                    ]}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Text strong style={{ marginTop: 6 }}>2.3 一般案件指标</Text>
                  <MetricGroupCard
                    column={1}
                    items={[
                      { label: '数量压降目标(件)', value: descriptionData.section2.normal.qtyTarget },
                      { label: '压降目标(万)', value: fmtWan(descriptionData.section2.normal.amountReductionTarget) },
                      { label: '防损目标(万)', value: fmtWan(descriptionData.section2.normal.lossPreventionTarget) },
                      { label: '数量压降(件)', value: descriptionData.section2.normal.qtyActual },
                      { label: '压降(万)', value: fmtWan(descriptionData.section2.normal.amountReductionActual) },
                      { label: '防损(万)', value: fmtWan(descriptionData.section2.normal.lossPreventionActual) },
                    ]}
                  />
                </Col>
              </Row>

              {/* 3. 目前在手案件情况 */}
              <Divider orientation="left" style={{ margin: '6px 0' }}>
                <FolderOpenOutlined style={{ marginRight: 8 }} />3. 目前在手案件情况
              </Divider>
               <MetricGroupCard
                column={{ xs: 1, md: 6 }}
                items={[
                  { label: '在手案件数量(件)', value: descriptionData.section3.currentInHand.qty },
                  { label: '在手标的余额(万)', value: fmtWan(descriptionData.section3.currentInHand.balance) },
                  { label: '在手重大案件数量(件)', value: descriptionData.section3.currentInHand.majorQty },
                  { label: '在手重大案件余额(万)', value: fmtWan(descriptionData.section3.currentInHand.majorBalance) },
                  { label: '在手一般案件数量(件)', value: descriptionData.section3.currentInHand.normalQty },
                  { label: '在手一般案件余额(万)', value: fmtWan(descriptionData.section3.currentInHand.normalBalance) },
                ]}
              />
              
              </div>
          ) : (
            <Text type="secondary">暂无数据</Text>
          )}
        </Card>
      )}

      {!isUserRole && (
        <Card title="年度目标设置" style={{ marginBottom: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table
              columns={targetColumns}
              dataSource={filteredTargets}
              rowKey="id"
              pagination={false}
              locale={{ emptyText: '暂无指标数据' }}
            />
          )}
        </Card>
      )}

      {!isUserRole && (
        <Card title="指标执行情况" style={{ marginBottom: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table
              columns={executionColumns}
              dataSource={targetExecution}
              rowKey="affiliation"
              pagination={false}
              locale={{ emptyText: '暂无执行数据' }}
              scroll={{ x: 'max-content' }}
            />
          )}
        </Card>
      )}

      {isUserRole && (
        <Card title="指标案件明细" style={{ marginBottom: 24 }}>
          {userCaseDetailLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table
              columns={detailColumns}
              dataSource={userCaseDetails.filter(c => c.isIncludedInTarget)}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: '暂无纳入指标的案件数据' }}
              scroll={{ x: 'max-content' }}
            />
          )}
        </Card>
      )}



      <Modal
        title={currentTarget ? '编辑指标' : '创建指标'}
        open={editModalVisible}
        onOk={handleSave}
        onCancel={() => setEditModalVisible(false)}
        okText="保存"
        cancelText="取消"
        footer={currentTarget ? (
          <>
            <Button onClick={() => setEditModalVisible(false)}>取消</Button>
            <Button onClick={handleDelete} danger>删除</Button>
            <Button type="primary" onClick={handleSave}>保存</Button>
          </>
        ) : undefined}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="year"
            label="年份"
            rules={[{ required: true, message: '请输入年份' }]}
          >
            <InputNumber disabled={!!currentTarget} />
          </Form.Item>
          <Form.Item
            name="totalCaseClosureTarget"
            label="总结案目标"
            rules={[{ required: true, message: '请输入总结案目标' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="totalAmountReductionTarget"
            label="标的压降目标(元)"
            rules={[{ required: true, message: '请输入标的压降目标' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="totalLossPreventionTarget"
            label="防损目标(元)"
            rules={[{ required: true, message: '请输入防损目标' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 案件选择模态框 - 只有非普通用户可以看到 */}
      {!isUserRole && (
        <Modal
          title={`${selectedYear}年案件指标设置`}
          open={casesModalVisible}
          onCancel={() => setCasesModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setCasesModalVisible(false)}>
              取消
            </Button>,
            <Button
              key="refresh"
              onClick={fetchCasesWithTargetInfo}
              loading={casesLoading}
            >
              刷新数据
            </Button>,
            <Button
              key="save"
              type="primary"
              onClick={handleSaveAllCaseTargets}
            >
              保存所有更改
            </Button>,
          ]}
          wrapClassName="responsive-modal"
        >
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Typography.Text>隶属单位筛选：</Typography.Text>
              <Select
                value={affiliationFilter}
                onChange={setAffiliationFilter}
                style={{ width: 200 }}
                placeholder="选择隶属单位"
                allowClear
              >
                {Array.from(new Set(casesWithTargetInfo.map(c => c.affiliation)))
                  .sort()
                  .map(affiliation => (
                    <Option key={affiliation} value={affiliation}>{affiliation}</Option>
                  ))}
              </Select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Typography.Text>案件名称搜索：</Typography.Text>
              <Input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="输入案件名称关键词"
                style={{ width: 200 }}
              />
            </div>
            
            <Button onClick={() => {
              setAffiliationFilter('');
              setSearchKeyword('');
              fetchCasesWithTargetInfo();
            }}>
              清除筛选
            </Button>
            
            <Typography.Text type="secondary" style={{ marginLeft: 'auto' }}>
              已选择 {casesWithTargetInfo.filter(c => c.isIncludedInTarget).length} 个案件
            </Typography.Text>
          </div>

          {casesLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table
              columns={caseColumns}
              dataSource={casesWithTargetInfo
                .filter(c => 
                  (!affiliationFilter || c.affiliation === affiliationFilter) &&
                  (!searchKeyword || c.caseName.toLowerCase().includes(searchKeyword.toLowerCase()))
                )
                .sort((a, b) => {
                  // 优先显示已纳入统计的案件
                  if (a.isIncludedInTarget !== b.isIncludedInTarget) {
                    return a.isIncludedInTarget ? -1 : 1;
                  }
                  // 其他情况可以按案件编号排序
                  return a.caseNumber.localeCompare(b.caseNumber);
                })
              }
              rowKey="id"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: '暂无符合条件的案件数据' }}
              scroll={{ x: 'max-content' }}
            />
          )}
        </Modal>
      )}

      {/* 案件明细模态框 */}
      <Modal
        title={`${isUserRole ? '我的隶属单位' : selectedAffiliation}案件明细${detailMetric ? ' - ' + (detailMetric === 'closure' ? '实际结案' : detailMetric === 'reduction' ? '实际压降' : '实际防损') : ''}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        wrapClassName="responsive-modal"
        bodyStyle={{ minHeight: 400 }}>
        {detailLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={detailColumns}
            dataSource={caseDetails.filter(c => {
              if (!c.isIncludedInTarget) return false;
              if (detailMetric === 'closure') return (c.caseClosureActual || 0) > 0;
              if (detailMetric === 'reduction') return (c.amountReductionActual || 0) > 0;
              if (detailMetric === 'prevention') return (c.lossPreventionActual || 0) > 0;
              return true;
            })}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: '暂无案件明细数据' }}
            scroll={{ x: 'max-content' }}
          />
        )}
      </Modal>
    </div>
  );
};

import { DashboardLayout } from '@/components/DashboardLayout';

const WrappedTargetsPage = () => {
  return (
    <DashboardLayout>
      <TargetsPage />
    </DashboardLayout>
  );
};

export default WrappedTargetsPage;