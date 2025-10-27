'use client';

import React from 'react';
import { Descriptions, Tag, Card, Row, Col, Typography, Divider } from 'antd';
import { formatDate, formatAmount, getCaseStatusColor, getCaseTypeColor, getLitigationStatusColor } from '@/utils';
import { Affiliation, CaseStatus, CaseType, LitigationStatus, DisputeResolutionMethod, CaseDomain } from '@/types';

const { Title } = Typography;

interface UserInfo {
  name?: string;
}

interface CaseDetailData {
  id?: string;
  caseNumber?: string;
  affiliation?: Affiliation;
  status?: CaseStatus;
  caseName?: string;
  caseType?: CaseType;
  filingDate?: string;
  litigationStatus?: LitigationStatus;
  causeOfAction?: string;
  disputeResolutionMethod?: DisputeResolutionMethod;
  caseDomain?: CaseDomain;
  trialAgency?: string;
  currentStage?: string;
  trialEndDate?: string;
  executionEndDate?: string;
  plaintiffName?: string;
  defendantName?: string;
  counterpartyType?: string;
  caseAmount?: number;
  principalAmount?: number;
  caseBalance?: number;
  annualClosingTarget?: number;
  annualLossPreventionTarget?: number;
  annualRealizedAmount?: number;
  realizedAmount?: number;
  badDebtProvision?: string;
  riskExposure?: number;
  litigationCosts?: number;
  lawFirmSituation?: string;
  agencyFee?: number;
  otherExpensesSituation?: string;
  otherExpenses?: number;
  mortgageGuaranteeSituation?: string;
  basicCaseFacts?: string;
  disposalMeasuresDescription?: string;
  monthlyProgressSituation?: string;
  projectTeamMembers?: string;
  createdBy?: UserInfo;
  createdAt?: string;
  updatedBy?: UserInfo;
  updatedAt?: string;
}

interface CaseDetailProps {
  caseData: CaseDetailData | null;
}

const CaseDetail: React.FC<CaseDetailProps> = ({ caseData }) => {
  if (!caseData) return null;
  
  return (
    <div className="case-detail">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card bordered={false}>
            <Title level={4}>基本信息</Title>
            <Descriptions bordered column={3}>
              <Descriptions.Item label="案件号" span={1}>
                {caseData.caseNumber}
              </Descriptions.Item>
              <Descriptions.Item label="隶属" span={1}>
                {caseData.affiliation}
              </Descriptions.Item>
              <Descriptions.Item label="结案情况" span={1}>
                <Tag color={getCaseStatusColor(caseData.status || '')}>{caseData.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="案件名称" span={3}>
                {caseData.caseName}
              </Descriptions.Item>
              <Descriptions.Item label="案件类型" span={1}>
                <Tag color={getCaseTypeColor(caseData.caseType || '')}>{caseData.caseType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="立案日期" span={1}>
                {formatDate(caseData.filingDate)}
              </Descriptions.Item>
              <Descriptions.Item label="诉讼地位" span={1}>
                <Tag color={getLitigationStatusColor(caseData.litigationStatus || '')}>{caseData.litigationStatus}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="案由" span={1}>
                {caseData.causeOfAction || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="纠纷解决方式" span={1}>
                {caseData.disputeResolutionMethod}
              </Descriptions.Item>
              <Descriptions.Item label="案件所属领域" span={1}>
                {caseData.caseDomain}
              </Descriptions.Item>
              <Descriptions.Item label="审理机构" span={1}>
                {caseData.trialAgency || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="所处阶段" span={1}>
                {caseData.currentStage || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="审结日期" span={1}>
                {formatDate(caseData.trialEndDate) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="执结日期" span={1}>
                {formatDate(caseData.executionEndDate) || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card bordered={false}>
            <Title level={4}>当事人信息</Title>
            <Descriptions bordered column={3}>
              <Descriptions.Item label="原告名称" span={1}>
                {caseData.plaintiffName}
              </Descriptions.Item>
              <Descriptions.Item label="被告名称" span={1}>
                {caseData.defendantName}
              </Descriptions.Item>
              <Descriptions.Item label="对方性质" span={1}>
                {caseData.counterpartyType}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card bordered={false}>
            <Title level={4}>金额信息</Title>
            <Descriptions bordered column={3}>
              <Descriptions.Item label="案件标的额" span={1}>
                {formatAmount(caseData.caseAmount) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="本金金额" span={1}>
                {formatAmount(caseData.principalAmount) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="案件余额" span={1}>
                {formatAmount(caseData.caseBalance) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="年度结案指标" span={1}>
                {formatAmount(caseData.annualClosingTarget) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="年度避免或挽回损失指标" span={1}>
                {formatAmount(caseData.annualLossPreventionTarget) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="年度已实现金额" span={1}>
                {formatAmount(caseData.annualRealizedAmount) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="已实现金额" span={1}>
                {formatAmount(caseData.realizedAmount) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="计提坏账情况" span={1}>
                {caseData.badDebtProvision || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="风险敞口" span={1}>
                {formatAmount(caseData.riskExposure) || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card bordered={false}>
            <Title level={4}>费用信息</Title>
            <Descriptions bordered column={3}>
              <Descriptions.Item label="诉讼费用" span={1}>
                {formatAmount(caseData.litigationCosts) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="律所情况" span={1}>
                {caseData.lawFirmSituation || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="代理费用" span={1}>
                {formatAmount(caseData.agencyFee) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="其他费用情况" span={1}>
                {caseData.otherExpensesSituation || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="其他费用" span={1}>
                {formatAmount(caseData.otherExpenses) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="抵押担保情况" span={1}>
                {caseData.mortgageGuaranteeSituation || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card bordered={false}>
            <Title level={4}>案情与进展</Title>
            <Divider orientation="left">基本案情</Divider>
            <div className="case-content">
              {caseData.basicCaseFacts || '-'}
            </div>
            
            <Divider orientation="left">处置措施</Divider>
            <div className="case-content">
              {caseData.disposalMeasuresDescription || '-'}
            </div>
            
            <Divider orientation="left">月度进展情况</Divider>
            <div className="case-content">
              {caseData.monthlyProgressSituation || '-'}
            </div>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card bordered={false}>
            <Title level={4}>其他信息</Title>
            <Descriptions bordered column={3}>
              <Descriptions.Item label="项目组成员" span={3}>
                {caseData.projectTeamMembers || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建人" span={1}>
                {caseData.createdBy?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={1}>
                {formatDate(caseData.createdAt, 'YYYY-MM-DD HH:mm:ss') || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="最后更新人" span={1}>
                {caseData.updatedBy?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="最后更新时间" span={1}>
                {formatDate(caseData.updatedAt, 'YYYY-MM-DD HH:mm:ss') || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
      
      <style jsx global>{`
        .case-detail .ant-card {
          margin-bottom: 16px;
        }
        .case-detail .ant-card-head-title {
          font-weight: bold;
        }
        .case-content {
          white-space: pre-wrap;
          padding: 8px 16px;
          background-color: #f9f9f9;
          border-radius: 4px;
          min-height: 60px;
        }
      `}</style>
    </div>
  );
};

export default CaseDetail;