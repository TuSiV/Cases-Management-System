'use client'

import { useState } from 'react'
import { Form, Input, Button, Select, DatePicker, InputNumber, Card, message, Divider } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import {
  CaseStatus,
  OpponentType,
  CaseType,
  LitigationStatus,
  DisputeResolutionMethod,
  CaseDomain,
  Affiliation,
  UserRole
} from '@/types'

const { TextArea } = Input
const { Option } = Select

export default function NewCasePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  // 定义表单数据类型接口
  interface CaseFormData {
    affiliation: Affiliation;
    status: CaseStatus;
    caseName: string;
    caseType: CaseType;
    filingDate: Date | null;
    trialConclusionDate?: Date | null;
    executionConclusionDate?: Date | null;
    litigationStatus: LitigationStatus;
    disputeResolutionMethod: DisputeResolutionMethod;
    caseDomain: CaseDomain;
    causeOfAction: string;
    trialInstitution: string;
    currentStage: string;
    plaintiffName: string;
    defendantName: string;
    opponentType: OpponentType;
    claimAmount: number;
    principalAmount: number;
    caseBalance: number;
    annualClosureTarget: number | null;
    annualLossPreventionTarget: number;
    annualRealizedAmount: number;
    totalRealizedAmount: number;
    badDebtProvision: string;
    riskExposure: number;
    litigationCosts: number;
    lawFirmSituation: string;
    agencyFees: number;
    otherExpensesSituation: string;
    otherExpenses: number;
    collateralSituation: string;
    basicCaseFacts: string;
    disposalMeasuresDescription: string;
    monthlyProgressSituation: string;
    projectTeamMembers: string;
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
      
      const response = await axios.post('/api/cases', formattedValues)
      message.success('案件创建成功')
      router.push(`/dashboard/cases/${response.data.id}`)
    } catch (error: unknown) {
      console.error('创建案件失败:', error)
      message.error('创建案件失败')
    } finally {
      setSubmitting(false)
    }
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
        <h1>新增案件</h1>
        <div></div> {/* 占位，保持标题居中 */}
      </div>

      <Card className="case-form-container">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            affiliation: session?.user?.role === UserRole.ADMIN ? undefined : session?.user?.affiliation,
            status: CaseStatus.PENDING,
          }}
        >
          <Divider orientation="left">基本信息</Divider>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="affiliation"
              label="隶属"
              rules={[{ required: true, message: '请选择隶属' }]}
              style={{ width: '50%' }}
            >
              <Select disabled={session?.user?.role !== UserRole.ADMIN}>
                {Object.values(Affiliation).map((affiliation) => (
                  <Option key={affiliation} value={affiliation}>{affiliation}</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="status"
              label="结案情况"
              rules={[{ required: true, message: '请选择结案情况' }]}
              style={{ width: '50%' }}
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
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="causeOfAction"
              label="案由"
              rules={[{ required: true, message: '请输入案由' }]}
              style={{ width: '50%' }}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="trialInstitution"
              label="审理机构"
              rules={[{ required: true, message: '请输入审理机构' }]}
              style={{ width: '50%' }}
            >
              <Input />
            </Form.Item>
          </div>
          
          <Form.Item
            name="currentStage"
            label="所处阶段"
            rules={[{ required: true, message: '请输入所处阶段' }]}
          >
            <Input />
          </Form.Item>
          
          <Divider orientation="left">当事人信息</Divider>
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
          
          <Divider orientation="left">金额信息</Divider>
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
              style={{ width: '33%' }}
              initialValue={null}
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={2} disabled />
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
          
          <Divider orientation="left">费用信息</Divider>
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
          
          <Divider orientation="left">案情与进展</Divider>
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
            <Button onClick={() => router.push('/dashboard/cases')}>取消</Button>
          </Form.Item>
        </Form>
      </Card>
    </DashboardLayout>
  )
}