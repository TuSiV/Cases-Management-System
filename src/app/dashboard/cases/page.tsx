'use client'

import { useState, useEffect, useCallback } from 'react'
import { Table, Button, Input, Space, Tag, Card, message, Popconfirm, DatePicker, Select, Form } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, DownloadOutlined, FileExcelOutlined, UploadOutlined } from '@ant-design/icons'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { Case, CaseStatus, Affiliation, CaseType, UserRole, MonthlyProgress } from '@/types'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'

const { RangePicker } = DatePicker
const { Option } = Select

export default function CasesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [filters, setFilters] = useState({
    caseNumber: '',
    caseName: '',
    status: undefined as CaseStatus | undefined,
    statusGroup: undefined as 'closed' | undefined,
    inHand: undefined as boolean | undefined,
    caseType: undefined as CaseType | undefined,
    filingDateRange: [] as [dayjs.Dayjs | null, dayjs.Dayjs | null] | [],
    affiliation: session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.VIEWER ? undefined : session?.user?.affiliation as Affiliation,
  })
  
  // 解析URL查询参数，初始化筛选条件
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const statusParam = params.get('status') as CaseStatus | null
    const statusGroupParam = params.get('statusGroup')
    const inHandParam = params.get('inHand')
    setFilters(prev => ({
      ...prev,
      status: statusParam || undefined,
      statusGroup: statusGroupParam === 'closed' ? 'closed' : undefined,
      inHand: inHandParam === '1' || inHandParam === 'true' ? true : undefined,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
    
    const fetchCases = useCallback(async (page = 1, pageSize = 10, sortField?: string, sortOrder?: string) => {
    try {
      setLoading(true)
      // 创建不包含filingDateRange的参数对象
      const { filingDateRange, ...otherFilters } = filters
      const params: Record<string, any> = {
        page,
        pageSize,
        ...otherFilters,
        filingDateStart: filingDateRange[0] ? filingDateRange[0].format('YYYY-MM-DD') : undefined,
        filingDateEnd: filingDateRange[1] ? filingDateRange[1].format('YYYY-MM-DD') : undefined,
        sortField,
        sortOrder
      }
      
      const response = await axios.get('/api/cases', { params })
      setCases(response.data.cases)
      setPagination({
        current: page,
        pageSize,
        total: response.data.total,
      })
    } catch (error) {
      console.error('获取案件列表失败:', error)
      message.error('获取案件列表失败')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (session) {
      fetchCases()
    }
  }, [session, fetchCases])

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    const sortField = typeof sorter === 'object' && sorter?.field ? String(sorter.field) : undefined;
    const sortOrder = sorter?.order;
    fetchCases(pagination.current || 1, pagination.pageSize || 10, sortField, sortOrder)
  }

  const handleSearch = () => {
    fetchCases(1, pagination.pageSize)
  }

  const handleReset = () => {
    setFilters({
      caseNumber: '',
      caseName: '',
      status: undefined,
      statusGroup: undefined,
      inHand: undefined,
      caseType: undefined,
      filingDateRange: [],
      affiliation: session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.VIEWER ? undefined : session?.user?.affiliation as Affiliation,
    })
    fetchCases(1, pagination.pageSize)
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/cases/${id}`)
      message.success('案件删除成功')
      fetchCases(pagination.current, pagination.pageSize)
    } catch (error) {
      console.error('删除案件失败:', error)
      message.error('删除案件失败')
    }
  }

  // 批量导入案件
  const handleImport = async (file: File) => {
    // 显示加载提示
    const loadingMessage = message.loading('开始导入案件数据...', 0);
    let successCount = 0;
    let errorCount = 0;
    const errorMessages: string[] = [];
    const batchSize = 50; // 每批处理50条
    
    try {
      // 读取Excel文件
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // 获取第一个工作表
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      
      // 将工作表转换为JSON数据
      const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);
      
      if (!jsonData || jsonData.length === 0) {
        message.error('Excel文件中没有数据');
        return;
      }
      
      // 准备批量导入数据
      const batchCases: {data: any, rowIndex: number}[] = [];
      
      // 处理每一行数据
      for (let i = 0; i < jsonData.length; i++) {
        try {
          const row: Record<string, any> = jsonData[i];
          
          // 构建案件数据对象
          const caseData = {
            caseNumber: row['案件号'] || '',
            caseName: row['案件名称'] ? String(row['案件名称']).trim() : '',
            affiliation: row['隶属'] || session?.user?.affiliation,
            status: row['状态'] || '未结案',
            caseType: row['案件类型'] || '民事',
            filingDate: row['立案日期'] ? new Date(String(row['立案日期'])).toISOString() : null,
            litigationStatus: row['诉讼地位'] || '主动',
            disputeResolutionMethod: row['纠纷解决方式'] || '诉讼',
            trialInstitution: row['审理机构'] || '',
            currentStage: row['所处阶段'] || '',
            caseDomain: row['案件所属领域'] || '集采',
            causeOfAction: row['案由'] || '',
            trialConclusionDate: row['审结日期'] ? new Date(String(row['审结日期'])).toISOString() : null,
            executionConclusionDate: row['执结日期'] ? new Date(String(row['执结日期'])).toISOString() : null,
            plaintiffName: row['原告名称'] ? String(row['原告名称']).trim() : '',
            defendantName: row['被告名称'] ? String(row['被告名称']).trim() : '',
            opponentType: row['对方性质'] || '自然人',
            claimAmount: row['案件标的额'] ? Number(row['案件标的额']) : 0,
            principalAmount: row['标的额中本金金额'] ? Number(row['标的额中本金金额']) : 0,
            caseBalance: row['案件余额'] ? Number(row['案件余额']) : 0,
            annualClosureTarget: row['年度结案指标'] ? Number(row['年度结案指标']) : 0,
            annualLossPreventionTarget: row['年度避免或挽回损失指标'] ? Number(row['年度避免或挽回损失指标']) : 0,
            annualRealizedAmount: row['年度已实现金额'] ? Number(row['年度已实现金额']) : 0,
            totalRealizedAmount: row['已实现金额'] ? Number(row['已实现金额']) : 0,
            badDebtProvision: row['计提坏账情况'] || '',
            riskExposure: row['风险敞口'] ? Number(row['风险敞口']) : 0,
            projectTeamMembers: row['项目组成员'] || '',
            litigationCosts: row['诉讼费用'] ? Number(row['诉讼费用']) : 0,
            lawFirmSituation: row['律所情况'] || '',
            agencyFees: row['代理费用'] ? Number(row['代理费用']) : 0,
            otherExpensesSituation: row['其他费用情况'] || '',
            otherExpenses: row['其他费用'] ? Number(row['其他费用']) : 0,
            collateralSituation: row['抵押担保情况'] || '',
            basicCaseFacts: row['基本案情'] || '',
            disposalMeasuresDescription: row['处置措施简要描述'] || ''
          };
          
                    
          // 添加到批量数据中
          batchCases.push({data: caseData, rowIndex: i + 1});
        } catch (error) {
          errorCount++;
          const errorMsg = error instanceof Error ? error.message : `第${i+1}行: 数据格式错误`;
          errorMessages.push(errorMsg);
          console.error(`第${i+1}行数据解析失败:`, error);
        }
      }
      
      // 分批执行批量导入
      for (let start = 0; start < batchCases.length; start += batchSize) {
        const end = Math.min(start + batchSize, batchCases.length);
        const currentBatch = batchCases.slice(start, end).map(item => {
          // 移除rowIndex字段，只保留案件数据
          const { rowIndex, ...caseData } = item;
          return caseData;
        });
        
        try {
          // 调用批量导入API
          const response = await axios.post('/api/cases/batch', currentBatch);
          
          if (response.data) {
            successCount += response.data.successCount || 0;
            
            // 处理可能的部分失败
            if (response.data.failures && response.data.failures.length > 0) {
              response.data.failures.forEach((failure: any) => {
                errorCount++;
                const originalRow = batchCases[start + failure.index]?.rowIndex || '未知';
                errorMessages.push(`第${originalRow}行: ${failure.error}`);
              });
            }
          }
        } catch (error) {
          console.error(`批量导入案件失败(批次${Math.floor(start/batchSize)+1}):`, error);
          // 标记当前批次所有案件为失败
          for (let i = start; i < end; i++) {
            errorCount++;
            errorMessages.push(`第${batchCases[i].rowIndex}行: 批量导入请求失败`);
          }
        }
      }
      
      // 显示导入结果
      message.success(`批量导入完成：成功 ${successCount} 条，失败 ${errorCount} 条`);
      
      // 如果有错误，显示错误信息并提供下载
      if (errorCount > 0) {
        console.error('导入错误明细:', errorMessages);
        // 将错误信息保存到文件并提供下载
        const errorLogContent = errorMessages.join('\n');
        const blob = new Blob([errorLogContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `导入错误日志_${dayjs().format('YYYYMMDD_HHmmss')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        message.info('已下载错误日志文件');
      }
      
      // 刷新案件列表
      fetchCases();
    } catch (error) {
      console.error('批量导入案件失败:', error);
      message.error('批量导入案件失败');
    } finally {
      if (loadingMessage) {
        loadingMessage() // 关闭加载提示
      }
    }
  };

  // 下载导入模板
  const handleDownloadTemplate = () => {
    try {
      // 创建模板数据结构
      const templateData = [
        {
          '案件名称': '示例案件名称',
          '隶属': '示例隶属',
          '状态': '未结案',
          '案件类型': '民事',
          '立案日期': '2024-01-01',
          '诉讼地位': '主动',
          '纠纷解决方式': '诉讼',
          '审理机构': '示例法院',
          '所处阶段': '一审',
          '案件所属领域': '集采',
          '案由': '示例案由',
          '审结日期': '',
          '执结日期': '',
          '原告名称': '示例原告',
          '被告名称': '示例被告',
          '对方性质': '自然人',
          '案件标的额': '100000',
          '标的额中本金金额': '90000',
          '案件余额': '100000',
          '年度结案指标': '50000',
          '年度避免或挽回损失指标': '40000',
          '年度已实现金额': '0',
          '已实现金额': '0',
          '计提坏账情况': '',
          '风险敞口': '100000',
          '项目组成员': '张三,李四',
          '诉讼费用': '5000',
          '律所情况': '示例律所',
          '代理费用': '10000',
          '其他费用情况': '',
          '其他费用': '0',
          '抵押担保情况': '',
          '基本案情': '示例案情描述',
          '处置措施简要描述': '示例处置措施'
        }
      ];

      // 创建字段说明数据
      const fieldDescription = [
        {
          '字段名': '案件名称',
          '必填': '否',
          '说明': '案件的名称，必填项',
          '示例': '张三诉李四借款纠纷'
        },
        {
          '字段名': '隶属',
          '必填': '否',
          '说明': '案件所属部门，默认为当前用户隶属',
          '示例': '法务部'
        },
        {
          '字段名': '状态',
          '必填': '否',
          '说明': '案件状态，默认为"未结案"',
          '示例': '未结案、已结案'
        },
        {
          '字段名': '案件类型',
          '必填': '否',
          '说明': '案件类型，默认为"民事"',
          '示例': '民事、刑事、行政'
        },
        {
          '字段名': '立案日期',
          '必填': '否',
          '说明': '案件立案日期，格式：YYYY-MM-DD',
          '示例': '2024-01-15'
        },
        {
          '字段名': '原告名称',
          '必填': '否',
          '说明': '原告的名称，必填项',
          '示例': '张三公司'
        },
        {
          '字段名': '被告名称',
          '必填': '否',
          '说明': '被告的名称，必填项',
          '示例': '李四公司'
        },
        {
          '字段名': '案件标的额',
          '必填': '否',
          '说明': '案件的标的金额，数字格式',
          '示例': '100000'
        }
      ];

      // 创建工作簿和工作表
      const workbook = XLSX.utils.book_new();
      const templateSheet = XLSX.utils.json_to_sheet(templateData);
      const descriptionSheet = XLSX.utils.json_to_sheet(fieldDescription);
      
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, templateSheet, '案件导入模板');
      XLSX.utils.book_append_sheet(workbook, descriptionSheet, '字段说明');

      // 下载Excel模板文件
      const exportDate = dayjs().format('YYYYMMDD_HHmmss');
      XLSX.writeFile(workbook, `案件导入模板_${exportDate}.xlsx`);

      message.success('模板下载成功');
    } catch (error) {
      console.error('下载模板失败:', error);
      message.error('下载模板失败');
    }
  };

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件类型
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
        message.error('请选择Excel文件 (.xlsx 或 .xls)');
        return;
      }
      
      // 检查文件大小（限制10MB）
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        message.error('文件大小不能超过10MB');
        return;
      }
      
      handleImport(file);
      
      // 重置input，允许重复选择同一文件
      e.target.value = '';
    }
  };

  // 导出案件数据为Excel
  const handleExport = async () => {
    let loadingMessage: any;
    try {
      loadingMessage = message.loading('正在准备导出数据...', 0)
      
      // 获取所有案件数据（不包含分页）
      const { filingDateRange, ...otherFilters } = filters
      const params = {
        page: 1,
        pageSize: 10000, // 获取大量数据
        ...otherFilters,
        filingDateStart: filingDateRange[0] ? filingDateRange[0].format('YYYY-MM-DD') : undefined,
        filingDateEnd: filingDateRange[1] ? filingDateRange[1].format('YYYY-MM-DD') : undefined,
      }
      
      const response = await axios.get('/api/cases', { params })
      const allCases = response.data.cases
      
      // 为每个案件获取月度进展数据
      const casesWithProgress = []
      for (const caseItem of allCases) {
        try {
          const progressResponse = await axios.get(`/api/cases/${caseItem.id}/progress`)
          const progressList = progressResponse.data as MonthlyProgress[]
          
          // 按创建时间从近到远排序
          progressList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          
          casesWithProgress.push({
            ...caseItem,
            progressList
          })
        } catch (error) {
          console.error(`获取案件 ${caseItem.id} 的月度进展失败:`, error)
          casesWithProgress.push({ ...caseItem, progressList: [] })
        }
      }
      
      // 准备Excel数据
      const excelData = casesWithProgress.map((caseItem, index) => {
        const rowData: Record<string, any> = {
          '序号': index + 1,
          '案件号': caseItem.caseNumber,
          '案件名称': caseItem.caseName,
          '隶属': caseItem.affiliation,
          '案件类型': caseItem.caseType,
          '立案日期': caseItem.filingDate ? new Date(caseItem.filingDate).toLocaleDateString('zh-CN') : '',
          '审结日期': caseItem.trialConclusionDate ? new Date(caseItem.trialConclusionDate).toLocaleDateString('zh-CN') : '',
          '执结日期': caseItem.executionConclusionDate ? new Date(caseItem.executionConclusionDate).toLocaleDateString('zh-CN') : '',
          '状态': caseItem.status,
          '原告名称': caseItem.plaintiffName,
          '被告名称': caseItem.defendantName,
          '对方性质': caseItem.opponentType,
          '诉讼地位': caseItem.litigationStatus,
          '案由': caseItem.causeOfAction,
          '纠纷解决方式': caseItem.disputeResolutionMethod,
          '审理机构': caseItem.trialInstitution,
          '所处阶段': caseItem.currentStage,
          '案件所属领域': caseItem.caseDomain,
          '案件标的额': caseItem.claimAmount,
          '标的额中本金金额': caseItem.principalAmount,
          '案件余额': caseItem.caseBalance,
          '年度结案指标': caseItem.annualClosureTarget,
          '年度避免或挽回损失指标': caseItem.annualLossPreventionTarget,
          '年度已实现金额': caseItem.annualRealizedAmount,
          '已实现金额': caseItem.totalRealizedAmount,
          '计提坏账情况': caseItem.badDebtProvision,
          '风险敞口': caseItem.riskExposure,
          '项目组成员': caseItem.projectTeamMembers,
          '诉讼费用': caseItem.litigationCosts,
          '律所情况': caseItem.lawFirmSituation,
          '代理费用': caseItem.agencyFees,
          '其他费用情况': caseItem.otherExpensesSituation,
          '其他费用': caseItem.otherExpenses,
          '抵押担保情况': caseItem.collateralSituation,
          '基本案情': caseItem.basicCaseFacts,
          '处置措施简要描述': caseItem.disposalMeasuresDescription,
          '创建时间': caseItem.createdAt ? new Date(caseItem.createdAt).toLocaleDateString('zh-CN') : '',
          '更新时间': caseItem.updatedAt ? new Date(caseItem.updatedAt).toLocaleDateString('zh-CN') : '',
        }
        
        // 添加月度进展信息，按时间由近到远排列
        caseItem.progressList.forEach((progress: MonthlyProgress, progressIndex: number) => {
          rowData[`月度进展 ${progressIndex + 1} - 时间`] = progress.createdAt ? new Date(progress.createdAt).toLocaleDateString('zh-CN') : ''
          rowData[`月度进展 ${progressIndex + 1} - 内容`] = progress.content || ''
        })
        
        return rowData
      })
      
      // 创建工作簿和工作表
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '案件信息')
      
      // 下载Excel文件
      const exportDate = dayjs().format('YYYYMMDD_HHmmss')
      XLSX.writeFile(workbook, `案件信息_${exportDate}.xlsx`)
      
      message.success('导出成功')
    } catch (error) {
      console.error('导出案件失败:', error)
      message.error('导出案件失败')
    } finally {
      if (loadingMessage) {
        loadingMessage() // 关闭加载提示
      }
    }
  }

  const columns = [
    {
      title: '案件号',
      dataIndex: 'caseNumber',
      key: 'caseNumber',
      width: 150,
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
      width: 100,
    },
    {      title: '案件标的额',      dataIndex: 'claimAmount',      key: 'claimAmount',      width: 120,      sorter: (a: Case, b: Case) => (a.claimAmount || 0) - (b.claimAmount || 0),      defaultSortOrder: undefined,      render: (value: number) => `¥${value.toLocaleString()}`    },    {      title: '案件标的余额',      dataIndex: 'caseBalance',      key: 'caseBalance',      width: 120,      sorter: (a: Case, b: Case) => (a.caseBalance || 0) - (b.caseBalance || 0),      defaultSortOrder: undefined,      render: (value: number) => `¥${value.toLocaleString()}`    },
    {
      title: '案件类型',
      dataIndex: 'caseType',
      key: 'caseType',
      width: 100,
    },
    {      title: '立案日期',      dataIndex: 'filingDate',      key: 'filingDate',      width: 120,      sorter: (a: Case, b: Case) => new Date(a.filingDate).getTime() - new Date(b.filingDate).getTime(),      defaultSortOrder: undefined,      render: (text: string) => dayjs(text).format('YYYY-MM-DD'),    },
    {
      title: '更新时间',
      dataIndex: 'latestUpdateTime',
      key: 'latestUpdateTime',
      width: 120,
      sorter: (a: any, b: any) => new Date(a.latestUpdateTime || 0).getTime() - new Date(b.latestUpdateTime || 0).getTime(),
      defaultSortOrder: 'descend' as const,
      render: (_: any, record: any) => record.latestUpdateTime ? dayjs(record.latestUpdateTime).format('YYYY-MM-DD') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: CaseStatus) => {
        let color = 'blue'
        if (status === CaseStatus.PENDING) {
          color = 'gold'
        } else if (
          status === CaseStatus.TRIAL_CONCLUDED || 
          status === CaseStatus.EXECUTION_CONCLUDED || 
          status === CaseStatus.MEDIATION || 
          status === CaseStatus.SETTLEMENT
        ) {
          color = 'green'
        } else if (status === CaseStatus.WITHDRAWN || status === CaseStatus.BANKRUPTCY) {
          color = 'red'
        }
        return <Tag color={color}>{status}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: React.ReactNode, record: Case) => (
        <Space size="small">
          <Button 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => router.push(`/dashboard/cases/${record.id}`)}
          >
            查看
          </Button>
          <Button 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => router.push(`/dashboard/cases/edit/${record.id}`)}
            >
              编辑
            </Button>
            {session?.user?.role?.toLowerCase() === UserRole.ADMIN && (
              <Popconfirm
                title="确定要删除这个案件吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button 
                  icon={<DeleteOutlined />} 
                  size="small"
                  danger
                >
                  删除
                </Button>
              </Popconfirm>
            )}
        </Space>
      ),
    },
  ]



  return (
    <DashboardLayout>
      <h1 style={{ marginBottom: 24 }}>案件管理</h1>
      
      <Card style={{ marginBottom: 24 }}>
        <Form layout="inline" style={{ marginBottom: 24 }}>
          <Form.Item label="案件号">
            <Input 
              placeholder="输入案件号"
              value={filters.caseNumber}
              onChange={(e) => setFilters({ ...filters, caseNumber: e.target.value })}
              style={{ width: 150 }}
            />
          </Form.Item>
          <Form.Item label="案件名称">
            <Input 
              placeholder="输入案件名称"
              value={filters.caseName}
              onChange={(e) => setFilters({ ...filters, caseName: e.target.value })}
              style={{ width: 150 }}
            />
          </Form.Item>
          <Form.Item label="状态">
            <Select
              placeholder="选择状态"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              allowClear
              style={{ width: 120 }}
            >
              {Object.values(CaseStatus).map((status) => (
                <Option key={status} value={status}>{status}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="案件类型">
            <Select
              placeholder="选择类型"
              value={filters.caseType}
              onChange={(value) => setFilters({ ...filters, caseType: value })}
              allowClear
              style={{ width: 120 }}
            >
              {Object.values(CaseType).map((type) => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Form.Item>
          {session?.user?.role === UserRole.ADMIN && (
            <Form.Item label="隶属">
              <Select
                placeholder="选择隶属"
                value={filters.affiliation}
                onChange={(value) => setFilters({ ...filters, affiliation: value })}
                allowClear
                style={{ width: 120 }}
              >
                {Object.values(Affiliation).map((affiliation) => (
                  <Option key={affiliation} value={affiliation}>{affiliation}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item label="立案日期">
            <RangePicker 
              value={filters.filingDateRange as [dayjs.Dayjs | null, dayjs.Dayjs | null]}
              onChange={(dates) => setFilters({ ...filters, filingDateRange: dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] })}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
        
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Space>
            {/* 隐藏的文件输入元素 */}
            <input
              type="file"
              id="caseImportFile"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept=".xlsx, .xls"
            />
            {/* 导入相关按钮 - 只显示给管理员用户 */}
            {session?.user?.role === UserRole.ADMIN && (
              <>
                <Button 
                  icon={<FileExcelOutlined />}
                  onClick={handleDownloadTemplate}
                  title="下载Excel导入模板"
                >
                  下载模板
                </Button>
                <Button 
                  icon={<UploadOutlined />}
                  onClick={() => document.getElementById('caseImportFile')?.click()}
                  title="上传Excel文件批量导入案件"
                >
                  导入案件
                </Button>
              </>
            )}
            {/* 导出按钮 */}
            <Button 
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出Excel
            </Button>
            {/* 查看快照按钮 */}
            <Button 
              onClick={() => router.push('/dashboard/cases/snapshots')}
              style={{ marginLeft: 8 }}
            >
              查看快照
            </Button>
            {/* 新增按钮 - 非查看员显示 */}
            {session?.user?.role !== UserRole.VIEWER && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => router.push('/dashboard/cases/new')}
              >
                新增案件
              </Button>
            )}
          </Space>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={cases} 
          rowKey="id" 
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
        />
      </Card>
    </DashboardLayout>
  )
}