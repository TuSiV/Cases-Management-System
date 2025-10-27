'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, InputNumber, Button, Row, Col, Tabs, message } from 'antd';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import {
  Affiliation,
  CaseStatus,
  CaseType,
  OpponentType,
  LitigationStatus,
  DisputeResolutionMethod,
  CaseDomain,
  UserRole,
  AnnualClosureTarget,
  annualClosureTargetTextMap
} from '@/types';
import { formatDate } from '@/utils';

const { TextArea } = Input;
const { TabPane } = Tabs;

interface CaseFormData {
  // 基本信息
  caseName: string;
  affiliation: Affiliation;
  status: CaseStatus;
  caseType: CaseType;
  filingDate?: dayjs.Dayjs | string;
  litigationStatus: LitigationStatus;
  disputeResolutionMethod: DisputeResolutionMethod;
  trialAgency?: string;
  currentStage?: string;
  caseDomain: CaseDomain;
  causeOfAction?: string;
  trialEndDate?: dayjs.Dayjs | string;
  executionEndDate?: dayjs.Dayjs | string;
  
  // 当事人信息
  plaintiffName: string;
  defendantName: string;
  opponentType: OpponentType;
  
  // 金额信息
  caseAmount?: number;
  principalAmount?: number;
  caseBalance?: number;
  annualClosureTarget?: AnnualClosureTarget;
  annualLossPreventionTarget?: number;
  annualRealizedAmount?: number;
  realizedAmount?: number;
  badDebtProvision?: string;
  riskExposure?: number;
  
  // 费用信息
  litigationCosts?: number;
  lawFirmSituation?: string;
  agencyFee?: number;
  otherExpensesSituation?: string;
  otherExpenses?: number;
  mortgageGuaranteeSituation?: string;
  
  // 案情与进展
  basicCaseFacts?: string;
  disposalMeasuresDescription?: string;
  
  // 其他信息
  projectTeamMembers?: string;
  
  // 可能存在的其他字段
  // 注意：为了类型安全，避免使用索引签名
}

interface CaseFormProps {
  initialValues?: Partial<CaseFormData>;
  isEdit?: boolean;
  onSubmit: (values: CaseFormData) => Promise<void>;
}

const CaseForm: React.FC<CaseFormProps> = ({ initialValues = {}, isEdit = false, onSubmit }) => {
  const [form] = Form.useForm();
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  
  // 设置初始值
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      // 处理日期字段
      const formattedValues = {
        ...initialValues,
        filingDate: initialValues.filingDate ? dayjs(initialValues.filingDate) : null,
        trialEndDate: initialValues.trialEndDate ? dayjs(initialValues.trialEndDate) : null,
        executionEndDate: initialValues.executionEndDate ? dayjs(initialValues.executionEndDate) : null,
      };
      form.setFieldsValue(formattedValues);
    } else if (session?.user) {
      // 新建案件时，如果不是管理员，则默认设置隶属为用户所属隶属
      if (session.user.role?.toLowerCase() !== UserRole.ADMIN) {
        form.setFieldsValue({ affiliation: session.user.affiliation });
      }
    }
  }, [initialValues, form, session]);
  
  // 表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 处理日期字段
      const formattedValues = {
        ...values,
        filingDate: values.filingDate ? formatDate(values.filingDate.toDate()) : null,
        trialEndDate: values.trialEndDate ? formatDate(values.trialEndDate.toDate()) : null,
        executionEndDate: values.executionEndDate ? formatDate(values.executionEndDate.toDate()) : null,
      };
      
      setLoading(true);
      await onSubmit(formattedValues);
      message.success(isEdit ? '案件更新成功' : '案件创建成功');
      router.push('/dashboard/cases');
    } catch (error: unknown) {
      console.error('表单提交错误:', error);
      message.error(typeof error === 'object' && error !== null && 'message' in error ? (error.message as string) : '提交失败，请检查表单');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        status: '未结案',
        caseType: '民事',
        litigationStatus: '主动',
        disputeResolutionMethod: '诉讼',
        caseDomain: '集采',
        ...initialValues
      }}
    >
      <Tabs defaultActiveKey="1">
        <TabPane tab="基本信息" key="1">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="caseName"
                label="案件名称"
                rules={[{ required: true, message: '请输入案件名称' }]}
              >
                <Input placeholder="请输入案件名称" />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="affiliation"
                label="隶属"
                rules={[{ required: true, message: '请选择隶属' }]}
              >
                <Select
                  placeholder="请选择隶属"
                  disabled={session?.user?.role !== UserRole.ADMIN && isEdit}
                >
                  {Object.values(Affiliation).map(value => (
                    <Select.Option key={value} value={value}>{value}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="status"
                label="结案情况"
                rules={[{ required: true, message: '请选择结案情况' }]}
              >
                <Select placeholder="请选择结案情况">
                  {Object.values(CaseStatus).map(value => (
                    <Select.Option key={value} value={value}>{value}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="caseType"
                label="案件类型"
                rules={[{ required: true, message: '请选择案件类型' }]}
              >
                <Select placeholder="请选择案件类型">
                  {Object.values(CaseType).map(value => (
                    <Select.Option key={value} value={value}>{value}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="filingDate"
                label="立案日期"
                rules={[{ required: true, message: '请选择立案日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择立案日期" />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="litigationStatus"
                label="诉讼地位"
                rules={[{ required: true, message: '请选择诉讼地位' }]}
              >
                <Select placeholder="请选择诉讼地位">
                  {Object.values(LitigationStatus).map(value => (
                    <Select.Option key={value} value={value}>{value}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="disputeResolutionMethod"
                label="纠纷解决方式"
                rules={[{ required: true, message: '请选择纠纷解决方式' }]}
              >
                <Select placeholder="请选择纠纷解决方式">
                  {Object.values(DisputeResolutionMethod).map(value => (
                    <Select.Option key={value} value={value}>{value}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="trialAgency"
                label="审理机构"
              >
                <Input placeholder="请输入审理机构" />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="currentStage"
                label="所处阶段"
              >
                <Input placeholder="请输入所处阶段" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="caseDomain"
                label="案件所属领域"
                rules={[{ required: true, message: '请选择案件所属领域' }]}
              >
                <Select placeholder="请选择案件所属领域">
                  {Object.values(CaseDomain).map(value => (
                    <Select.Option key={value} value={value}>{value}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="causeOfAction"
                label="案由"
              >
                <Input placeholder="请输入案由" />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="trialEndDate"
                label="审结日期"
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择审结日期" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="executionEndDate"
                label="执结日期"
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择执结日期" />
              </Form.Item>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab="当事人信息" key="2">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="plaintiffName"
                label="原告名称"
                rules={[{ required: true, message: '请输入原告名称' }]}
              >
                <Input placeholder="请输入原告名称" />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="defendantName"
                label="被告名称"
                rules={[{ required: true, message: '请输入被告名称' }]}
              >
                <Input placeholder="请输入被告名称" />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="opponentType"
                label="对方性质"
                rules={[{ required: true, message: '请选择对方性质' }]}
              >
                <Select placeholder="请选择对方性质">
                  {Object.values(OpponentType).map((value: string) => (
                    <Select.Option key={value} value={value}>{value}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab="金额信息" key="3">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="caseAmount"
                label="案件标的额"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入案件标的额"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="principalAmount"
                label="本金金额"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入本金金额"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\¥\s?|(,*)/g, '')}
                  disabled={session?.user?.role !== UserRole.ADMIN && isEdit}
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="caseBalance"
                label="案件余额"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入案件余额"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="annualClosureTarget"
                label="年度结案指标"
                required={false}
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
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="annualLossPreventionTarget"
                label="年度避免或挽回损失指标"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入年度避免或挽回损失指标"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="annualRealizedAmount"
                label="年度已实现金额"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入年度已实现金额"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="realizedAmount"
                label="已实现金额"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入已实现金额"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="badDebtProvision"
                label="计提坏账情况"
              >
                <Input placeholder="请输入计提坏账情况" />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="riskExposure"
                label="风险敞口"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入风险敞口"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab="费用信息" key="4">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="litigationCosts"
                label="诉讼费用"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入诉讼费用"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="lawFirmSituation"
                label="律所情况"
              >
                <Input placeholder="请输入律所情况" />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="agencyFee"
                label="代理费用"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入代理费用"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="otherExpensesSituation"
                label="其他费用情况"
              >
                <Input placeholder="请输入其他费用情况" />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="otherExpenses"
                label="其他费用"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入其他费用"
                  formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value!.replace(/\¥\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="mortgageGuaranteeSituation"
                label="抵押担保情况"
              >
                <Input placeholder="请输入抵押担保情况" />
              </Form.Item>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tab="案情与进展" key="5">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="basicCaseFacts"
                label="基本案情"
              >
                <TextArea rows={4} placeholder="请输入基本案情" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="disposalMeasuresDescription"
                label="处置措施"
              >
                <TextArea rows={4} placeholder="请输入处置措施" />
              </Form.Item>
            </Col>
          </Row>
          

        </TabPane>
        
        <TabPane tab="其他信息" key="6">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="projectTeamMembers"
                label="项目组成员"
              >
                <Input placeholder="请输入项目组成员" />
              </Form.Item>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
      
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Button type="primary" onClick={handleSubmit} loading={loading}>
          {isEdit ? '更新案件' : '创建案件'}
        </Button>
        <Button style={{ marginLeft: 8 }} onClick={() => router.push('/dashboard/cases')}>
          取消
        </Button>
      </div>
    </Form>
  );
};

export default CaseForm;