'use client'

import { useState, useEffect } from 'react'
import { Card, Descriptions, Button, Spin, message, Divider, Tag, Typography } from 'antd'
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CaseFloatNavigation } from '@/components/CaseFloatNavigation'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Case, CaseStatus, annualClosureTargetTextMap } from '@/types'

const { Title, Paragraph } = Typography

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCaseDetail = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/api/cases/${params.id}`)
        setCaseData(response.data)
      } catch (error) {
        console.error('获取案件详情失败:', error)
        message.error('获取案件详情失败')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchCaseDetail()
    }
  }, [params.id])

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" />
        </div>
      </DashboardLayout>
    )
  }

  if (!caseData) {
    return (
      <DashboardLayout>
        <div>案件不存在或已被删除</div>
      </DashboardLayout>
    )
  }

  const getStatusTag = (status: CaseStatus) => {
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
  }

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push('/dashboard/cases')}
        >
          返回
        </Button>
        <div>
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => router.push(`/dashboard/cases/edit/${params.id}`)}
            style={{ marginRight: 16 }}
          >
            编辑案件
          </Button>
          <Button 
            icon={<EditOutlined />}
            onClick={() => router.push(`/dashboard/cases/${params.id}/progress`)}
            style={{ marginRight: 16 }}
          >
            月度进展
          </Button>
          <Button 
            icon={<EditOutlined />}
            onClick={() => router.push(`/dashboard/cases/${params.id}/changelogs`)}
          >
            查看变更记录
          </Button>
        </div>
      </div>

      <Card>
        <Title level={4}>{caseData.caseName}</Title>
        <Tag color="blue">{caseData.caseNumber}</Tag>
        {getStatusTag(caseData.status as CaseStatus)}
        
        <div id="basic-info"><Divider orientation="left">基本信息</Divider></div>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="隶属">{caseData.affiliation}</Descriptions.Item>
          <Descriptions.Item label="案件类型">{caseData.caseType}</Descriptions.Item>
          <Descriptions.Item label="立案日期">{new Date(caseData.filingDate).toLocaleDateString('zh-CN')}</Descriptions.Item>
          <Descriptions.Item label="诉讼地位">{caseData.litigationStatus}</Descriptions.Item>
          <Descriptions.Item label="案由">{caseData.causeOfAction}</Descriptions.Item>
          <Descriptions.Item label="纠纷解决方式">{caseData.disputeResolutionMethod}</Descriptions.Item>
          <Descriptions.Item label="审理机构">{caseData.trialInstitution}</Descriptions.Item>
          <Descriptions.Item label="所处阶段">{caseData.currentStage}</Descriptions.Item>
          <Descriptions.Item label="案件所属领域">{caseData.caseDomain}</Descriptions.Item>
          {caseData.trialConclusionDate && (
            <Descriptions.Item label="审结日期">{new Date(caseData.trialConclusionDate).toLocaleDateString('zh-CN')}</Descriptions.Item>
          )}
          {caseData.executionConclusionDate && (
            <Descriptions.Item label="执结日期">{new Date(caseData.executionConclusionDate).toLocaleDateString('zh-CN')}</Descriptions.Item>
          )}
        </Descriptions>

        <div id="party-info"><Divider orientation="left">当事人信息</Divider></div>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="原告名称">{caseData.plaintiffName}</Descriptions.Item>
          <Descriptions.Item label="被告名称">{caseData.defendantName}</Descriptions.Item>
          <Descriptions.Item label="对方性质">{caseData.opponentType}</Descriptions.Item>
        </Descriptions>

        <div id="amount-info"><Divider orientation="left">金额信息</Divider></div>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="案件标的额">{caseData.claimAmount.toLocaleString('zh-CN')} 元</Descriptions.Item>
          <Descriptions.Item label="标的额中本金金额">{caseData.principalAmount.toLocaleString('zh-CN')} 元</Descriptions.Item>
          <Descriptions.Item label="案件余额">{caseData.caseBalance.toLocaleString('zh-CN')} 元</Descriptions.Item>
          <Descriptions.Item label="年度结案指标">{annualClosureTargetTextMap[caseData.annualClosureTarget] || caseData.annualClosureTarget}</Descriptions.Item>
          <Descriptions.Item label="年度避免或挽回损失指标">{caseData.annualLossPreventionTarget.toLocaleString('zh-CN')} 元</Descriptions.Item>
          <Descriptions.Item label="年度已实现金额">{caseData.annualRealizedAmount.toLocaleString('zh-CN')} 元</Descriptions.Item>
          <Descriptions.Item label="已实现金额">{caseData.totalRealizedAmount.toLocaleString('zh-CN')} 元</Descriptions.Item>
          <Descriptions.Item label="计提坏账情况">{caseData.badDebtProvision}</Descriptions.Item>
          <Descriptions.Item label="风险敞口">{caseData.riskExposure.toLocaleString('zh-CN')} 元</Descriptions.Item>
        </Descriptions>

        <div id="cost-info"><Divider orientation="left">费用信息</Divider></div>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="诉讼费用">{caseData.litigationCosts.toLocaleString('zh-CN')} 元</Descriptions.Item>
          <Descriptions.Item label="律所情况">{caseData.lawFirmSituation}</Descriptions.Item>
          <Descriptions.Item label="代理费用">{caseData.agencyFees.toLocaleString('zh-CN')} 元</Descriptions.Item>
          <Descriptions.Item label="其他费用情况">{caseData.otherExpensesSituation}</Descriptions.Item>
          <Descriptions.Item label="其他费用">{caseData.otherExpenses.toLocaleString('zh-CN')} 元</Descriptions.Item>
          <Descriptions.Item label="抵押担保情况">{caseData.collateralSituation}</Descriptions.Item>
        </Descriptions>

        <div id="progress-info"><Divider orientation="left">案情与进展</Divider></div>
        <Card type="inner" title="基本案情" style={{ marginBottom: 16 }}>
          <Paragraph>{caseData.basicCaseFacts}</Paragraph>
        </Card>
        <Card type="inner" title="处置措施简要描述" style={{ marginBottom: 16 }}>
          <Paragraph>{caseData.disposalMeasuresDescription}</Paragraph>
        </Card>
        
        <div id="other-info"><Divider orientation="left">其他信息</Divider></div>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="项目组成员">{caseData.projectTeamMembers}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{new Date(caseData.createdAt).toLocaleString('zh-CN')}</Descriptions.Item>
          <Descriptions.Item label="最后更新时间">{new Date(caseData.updatedAt).toLocaleString('zh-CN')}</Descriptions.Item>
        </Descriptions>
      </Card>
      <CaseFloatNavigation caseId={params.id} caseData={caseData} />
    </DashboardLayout>
  )
}