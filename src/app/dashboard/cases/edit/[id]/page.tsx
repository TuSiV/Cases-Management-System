'use client'

import { useState, useEffect } from 'react'
import { Form, Input, Button, Select, DatePicker, InputNumber, Card, message, Spin, Divider } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CaseFloatNavigation } from '@/components/CaseFloatNavigation'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { 
  Case, 
  CaseStatus, 
  OpponentType, 
  CaseType, 
  LitigationStatus, 
  DisputeResolutionMethod, 
  CaseDomain,
  Affiliation,
  UserRole,
  AnnualClosureTarget,
  annualClosureTargetTextMap
} from '@/types'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

export default function EditCasePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [caseData, setCaseData] = useState<Case | null>(null)

  useEffect(() => {
    const fetchCaseDetail = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/api/cases/${params.id}`)
        setCaseData(response.data)
        
        // 格式化日期字段，将trialInstitution映射到表单的trialInstitution字段
        const formData = {
          ...response.data,
          filingDate: response.data.filingDate ? dayjs(response.data.filingDate) : null,
          trialConclusionDate: response.data.trialConclusionDate ? dayjs(response.data.trialConclusionDate) : null,
          executionConclusionDate: response.data.executionConclusionDate ? dayjs(response.data.executionConclusionDate) : null,
          // 确保字段名称匹配
          trialInstitution: response.data.trialInstitution
        }
        
        form.setFieldsValue(formData)
      } catch (error) {
        console.error('获取案件详情失败:', error)
        message.error('获取案件详情失败')
      } finally {
        setLoading(false)
      }
4    }

    fetchCaseDetail()
  }, [params.id, form])

  interface CaseFormData {
    caseNumber?: string
    affiliation: Affiliation
    status: CaseStatus
    caseName: string
    caseType: CaseType
    filingDate?: dayjs.Dayjs
    litigationStatus: LitigationStatus
    disputeResolutionMethod: DisputeResolutionMethod
    caseDomain: CaseDomain
    causeOfAction: string
    trialInstitution: string
    currentStage: string
    trialConclusionDate?: dayjs.Dayjs
    executionConclusionDate?: dayjs.Dayjs
    plaintiffName: string
    defendantName: string
    opponentType: OpponentType
    claimAmount: number
    principalAmount: number
    caseBalance: number
    annualClosureTarget: number
    annualLossPreventionTarget: number
    annualRealizedAmount: number
    totalRealizedAmount: number
    badDebtProvision: string
    riskExposure: number
    litigationCosts: number
    lawFirmSituation: string
    agencyFees: number
    otherExpensesSituation: string
    otherExpenses: number
    collateralSituation: string
    basicCaseFacts: string
    disposalMeasuresDescription: string
    projectTeamMembers: string
    id?: string
    createdAt?: string
    updatedAt?: string
    updatedBy?: { id: string; name: string }
  }
  
  const onFinish = async (values: CaseFormData) => {
    try {
      setSubmitting(true)
      
      // 格式化日期字段
      const formattedValues = {
        ...values,
        filingDate: values.filingDate ? values.filingDate.toISOString() : null,
        trialConclusionDate: values.trialConclusionDate ? values.trialConclusionDate.toISOString() : null,
        executionConclusionDate: values.executionConclusionDate ? values.executionConclusionDate.toISOString() : null,
      }
      
      await axios.put(`/api/cases/${params.id}`, formattedValues)
      message.success('案件更新成功')
      router.push(`/dashboard/cases/${params.id}`)
    } catch (error: unknown) {
      console.error('更新案件失败:', error)
      // 显示更具体的错误信息
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      message.error(`更新案件失败: ${errorMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

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

  // 检查用户是否有权限编辑该案件
  const isAdmin = session?.user?.role === UserRole.ADMIN
  const isSameAffiliation = session?.user?.affiliation === caseData.affiliation
  
  if (!isAdmin && !isSameAffiliation) {
    return (
      <DashboardLayout>
        <div>您没有权限编辑此案件</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push(`/dashboard/cases/${params.id}`)}
        >
          返回
        </Button>
        <h1>编辑案件</h1>
        <div></div> {/* 占位，保持标题居中 */}
      </div>

      <Card className="case-form-container">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            affiliation: session?.user?.role === UserRole.ADMIN ? caseData.affiliation : session?.user?.affiliation,
          }}
        >
          <div id="basic-info"><Divider orientation="left">基本信息</Divider></div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="caseNumber"
              label="案件号"
              style={{ width: '33%' }}
            >
              <Input disabled />
            </Form.Item>
            
            <Form.Item
              name="affiliation"
              label="隶属"
              rules={[{ required: true, message: '请选择隶属' }]}
              style={{ width: '33%' }}
            >
              <Select disabled={!isAdmin}>
                {Object.values(Affiliation).map((affiliation) => (
                  <Option key={affiliation} value={affiliation}>{affiliation}</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="status"
              label="结案情况"
              rules={[{ required: true, message: '请选择结案情况' }]}
              style={{ width: '33%' }}
            >
              <Select>
                {Object.values(CaseStatus).map((status) => (
                  <Option key={status} value={status}>{status}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="caseName"
              label="案件名称"
              rules={[{ required: true, message: '请输入案件名称' }]}
              style={{ width: '50%' }}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="caseType"
              label="案件类型"
              rules={[{ required: true, message: '请选择案件类型' }]}
              style={{ width: '50%' }}
            >
              <Select>
                {Object.values(CaseType).map((type) => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="filingDate"
              label="立案日期"
              rules={[{ required: true, message: '请选择立案日期' }]}
              style={{ width: '33%' }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="trialInstitution"
              label="审理机构"
              rules={[{ required: true, message: '请输入审理机构' }]}
              style={{ width: '33%' }}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="currentStage"
              label="所处阶段"
              rules={[{ required: true, message: '请输入所处阶段' }]}
              style={{ width: '33%' }}
            >
              <Input />
            </Form.Item>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="causeOfAction"
              label="案由"
              rules={[{ required: true, message: '请输入案由' }]}
              style={{ width: '33%' }}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="trialConclusionDate"
              label="审结日期"
              style={{ width: '33%' }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="executionConclusionDate"
              label="执结日期"
              style={{ width: '33%' }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="litigationStatus"
              label="诉讼地位"
              rules={[{ required: true, message: '请选择诉讼地位' }]}
              style={{ width: '33%' }}
            >
              <Select>
                {Object.values(LitigationStatus).map((status) => (
                  <Option key={status} value={status}>{status}</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="disputeResolutionMethod"
              label="纠纷解决方式"
              rules={[{ required: true, message: '请选择纠纷解决方式' }]}
              style={{ width: '33%' }}
            >
              <Select>
                {Object.values(DisputeResolutionMethod).map((method) => (
                  <Option key={method} value={method}>{method}</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="caseDomain"
              label="案件所属领域"
              rules={[{ required: true, message: '请选择案件所属领域' }]}
              style={{ width: '33%' }}
            >
              <Select>
                {Object.values(CaseDomain).map((domain) => (
                  <Option key={domain} value={domain}>{domain}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          
          <div id="party-info"><Divider orientation="left">当事人信息</Divider></div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="plaintiffName"
              label="原告名称"
              rules={[{ required: true, message: '请输入原告名称' }]}
              style={{ width: '33%' }}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="defendantName"
              label="被告名称"
              rules={[{ required: true, message: '请输入被告名称' }]}
              style={{ width: '33%' }}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="opponentType"
              label="对方性质"
              rules={[{ required: true, message: '请选择对方性质' }]}
              style={{ width: '33%' }}
            >
              <Select>
                {Object.values(OpponentType).map((type) => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          
          <div id="amount-info"><Divider orientation="left">金额信息</Divider></div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="claimAmount"
              label="案件标的额"
              rules={[{ required: true, message: '请输入案件标的额' }]}
              style={{ width: '33%' }}
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            
            <Form.Item
              name="principalAmount"
              label="标的额中本金金额"
              rules={[{ required: true, message: '请输入标的额中本金金额' }]}
              style={{ width: '33%' }}
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            
            <Form.Item
              name="caseBalance"
              label="案件余额"
              rules={[{ required: true, message: '请输入案件余额' }]}
              style={{ width: '33%' }}
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="annualClosureTarget"
              label="年度结案指标"
              rules={[{ required: true, message: '请选择年度结案指标' }]}
              style={{ width: '33%' }}
            >
              <Select
                style={{ width: '100%' }}
                placeholder="请选择年度结案指标"
                options={Object.entries(annualClosureTargetTextMap).map(([value, label]) => ({
                  value,
                  label
                }))}
                disabled={session?.user?.role !== UserRole.ADMIN}
              />
            </Form.Item>
            
            <Form.Item
              name="annualLossPreventionTarget"
              label="年度避免或挽回损失指标"
              rules={[{ required: true, message: '请输入年度避免或挽回损失指标' }]}
              style={{ width: '33%' }}
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            
            <Form.Item
              name="annualRealizedAmount"
              label="年度已实现金额"
              rules={[{ required: true, message: '请输入年度已实现金额' }]}
              style={{ width: '33%' }}
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="totalRealizedAmount"
              label="已实现金额"
              rules={[{ required: true, message: '请输入已实现金额' }]}
              style={{ width: '33%' }}
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            
            <Form.Item
              name="badDebtProvision"
              label="计提坏账情况"
              rules={[{ required: true, message: '请输入计提坏账情况' }]}
              style={{ width: '33%' }}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="riskExposure"
              label="风险敞口"
              rules={[{ required: true, message: '请输入风险敞口' }]}
              style={{ width: '33%' }}
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </div>
          
          <div id="cost-info"><Divider orientation="left">费用信息</Divider></div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="litigationCosts"
              label="诉讼费用"
              rules={[{ required: true, message: '请输入诉讼费用' }]}
              style={{ width: '33%' }}
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            
            <Form.Item
              name="lawFirmSituation"
              label="律所情况"
              rules={[{ required: true, message: '请输入律所情况' }]}
              style={{ width: '33%' }}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="agencyFees"
              label="代理费用"
              rules={[{ required: true, message: '请输入代理费用' }]}
              style={{ width: '33%' }}
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="otherExpensesSituation"
              label="其他费用情况"
              rules={[{ required: true, message: '请输入其他费用情况' }]}
              style={{ width: '50%' }}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="otherExpenses"
              label="其他费用"
              rules={[{ required: true, message: '请输入其他费用' }]}
              style={{ width: '50%' }}
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
          </div>
          
          <Form.Item
            name="collateralSituation"
            label="抵押担保情况"
            rules={[{ required: true, message: '请输入抵押担保情况' }]}
          >
            <Input />
          </Form.Item>
          
          <div id="progress-info"><Divider orientation="left">案情与进展</Divider></div>
          <Form.Item
            name="basicCaseFacts"
            label="基本案情"
            rules={[{ required: true, message: '请输入基本案情' }]}
          >
            <TextArea rows={4} />
          </Form.Item>
          
          <Form.Item
            name="disposalMeasuresDescription"
            label="处置措施简要描述"
            rules={[{ required: true, message: '请输入处置措施简要描述' }]}
          >
            <TextArea rows={4} />
          </Form.Item>
          
          <Divider orientation="left">其他信息</Divider>
          <Form.Item
            name="projectTeamMembers"
            label="项目组成员"
            rules={[{ required: true, message: '请输入项目组成员' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SaveOutlined />}
              loading={submitting}
              style={{ marginRight: 8 }}
            >
              保存
            </Button>
            <Button onClick={() => router.push(`/dashboard/cases/${params.id}`)}>取消</Button>
          </Form.Item>
        </Form>
      </Card>
      <CaseFloatNavigation caseId={params.id} caseData={caseData} isEditMode={true} />
    </DashboardLayout>
  )
}