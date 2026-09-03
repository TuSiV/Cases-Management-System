// 案件状态枚举
export enum CaseStatus {
  PENDING = '未结案',
  TRIAL_CONCLUDED = '审结',
  EXECUTION_CONCLUDED = '执结',
  MEDIATION = '调解',
  SETTLEMENT = '和解',
  WITHDRAWN = '撤诉',
  BANKRUPTCY = '破产'
}

// 对方性质枚举
export enum OpponentType {
  STATE_OWNED = '国有企业',
  PRIVATE = '民营企业',
  INDIVIDUAL = '个人',
  ADMINISTRATIVE = '行政机关',
  INSTITUTION = '事业单位',
  FOREIGN = '外国主体',
  OTHER = '其他'
}

// 案件类型枚举
export enum CaseType {
  CIVIL = '民事',
  CRIMINAL = '刑事'
}

// 诉讼地位枚举
export enum LitigationStatus {
  ACTIVE = '主动',
  PASSIVE = '被动'
}

// 纠纷解决方式枚举
export enum DisputeResolutionMethod {
  LITIGATION = '诉讼',
  ARBITRATION = '仲裁'
}

// 案件所属领域枚举
export enum CaseDomain {
  CENTRALIZED = '集采',
  NON_CENTRALIZED = '非集采'
}

// 隶属枚举
export enum Affiliation {
  HEADQUARTERS = 'REGION_1',
  NORTHEAST = 'REGION_2',
  CENTRAL_SOUTH = 'REGION_3',
  YUNNAN_GUIZHOU = 'REGION_4',
  NORTH_CHINA = 'REGION_5',
  INDUSTRY = 'REGION_6',
  SOUTH_CHINA = 'REGION_7',
  JIULONG = 'REGION_8',
  EAST_CHINA = 'REGION_9',
  SOUTHWEST = 'REGION_10',
  NORTHWEST = 'REGION_11'
}

// 隶属代码映射
export const AffiliationCode: Record<Affiliation, string> = {
  [Affiliation.HEADQUARTERS]: 'WZ',
  [Affiliation.NORTHEAST]: 'DB',
  [Affiliation.CENTRAL_SOUTH]: 'ZN',
  [Affiliation.YUNNAN_GUIZHOU]: 'YG',
  [Affiliation.NORTH_CHINA]: 'HB',
  [Affiliation.INDUSTRY]: 'SY',
  [Affiliation.SOUTH_CHINA]: 'HN',
  [Affiliation.JIULONG]: 'JL',
  [Affiliation.EAST_CHINA]: 'HD',
  [Affiliation.SOUTHWEST]: 'XN',
  [Affiliation.NORTHWEST]: 'XB'
}

// 案件类型代码映射
export const CaseTypeCode: Record<CaseType, string> = {
  [CaseType.CIVIL]: 'M',
  [CaseType.CRIMINAL]: 'X'
}

// 年度结案指标枚举
export enum AnnualClosureTarget {
  EXECUTION_CLOSURE = 'EXECUTION_CLOSURE', // 执行结案
  TRIAL_CLOSURE = 'TRIAL_CLOSURE',         // 审理结案
  NORMAL_PROGRESS = 'NORMAL_PROGRESS'      // 正常推进
}

// 年度结案指标显示文本映射
export const annualClosureTargetTextMap: Record<AnnualClosureTarget, string> = {
  [AnnualClosureTarget.EXECUTION_CLOSURE]: '执行结案',
  [AnnualClosureTarget.TRIAL_CLOSURE]: '审理结案',
  [AnnualClosureTarget.NORMAL_PROGRESS]: '正常推进'
};

// 案件接口定义
export interface Case {
  id: string;                      // 数据库ID
  caseNumber: string;              // 案件号
  affiliation: Affiliation;        // 隶属
  status: CaseStatus;              // 结案情况
  caseName: string;                // 案件名称
  plaintiffName: string;           // 原告名称
  defendantName: string;           // 被告名称
  opponentType: OpponentType;      // 对方性质
  caseType: CaseType;              // 案件类型
  filingDate: Date;                // 立案日期
  trialConclusionDate?: Date;      // 审结日期
  executionConclusionDate?: Date;  // 执结日期
  litigationStatus: LitigationStatus; // 诉讼地位
  causeOfAction: string;           // 案由
  disputeResolutionMethod: DisputeResolutionMethod; // 纠纷解决方式
  trialInstitution: string;        // 审理机构
  currentStage: string;            // 所处阶段
  caseDomain: CaseDomain;          // 案件所属领域
  claimAmount: number;             // 案件标的额
  principalAmount: number;         // 标的额中本金金额
  caseBalance: number;             // 案件余额
  annualClosureTarget: AnnualClosureTarget; // 年度结案指标
  annualLossPreventionTarget: number; // 年度避免或挽回损失指标
  annualRealizedAmount: number;    // 年度已实现金额
  totalRealizedAmount: number;     // 已实现金额
  badDebtProvision: string;        // 计提坏账情况
  riskExposure: number;            // 风险敞口
  projectTeamMembers: string;      // 项目组成员
  litigationCosts: number;         // 诉讼费用
  lawFirmSituation: string;        // 律所情况
  agencyFees: number;              // 代理费用
  otherExpensesSituation: string;  // 其他费用情况
  otherExpenses: number;           // 其他费用
  collateralSituation: string;     // 抵押担保情况
  basicCaseFacts: string;          // 基本案情
  disposalMeasuresDescription: string; // 处置措施简要描述
  createdAt: Date;                 // 创建时间
  updatedAt: Date;                 // 更新时间
  createdBy: string;               // 创建人ID
  updatedBy: string;               // 更新人ID
}

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer'
}

// 月度进展接口定义
export interface MonthlyProgress {
  id: string;            // 记录ID
  caseId: string;        // 关联的案件ID
  content: string;       // 进展内容
  createdAt: Date;       // 创建时间
  createdBy: string;     // 创建人ID
}

// 用户接口定义
export interface User {
  id: string;                      // 用户ID
  username: string;                // 用户名
  password: string;                // 密码（加密存储）
  name: string;                    // 姓名
  role: UserRole;                  // 角色
  affiliation: Affiliation;        // 隶属部门
  email?: string;                  // 邮箱
  phone?: string;                  // 电话
  createdAt: Date;                 // 创建时间
  updatedAt: Date;                 // 更新时间
  lastLogin?: Date;                // 最后登录时间
}