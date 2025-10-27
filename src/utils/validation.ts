import { z } from 'zod';
import { Affiliation, CaseStatus, CaseType, LitigationStatus, UserRole, OpponentType, DisputeResolutionMethod, CaseDomain } from '@/types';

/**
 * 案件表单验证模式
 */
export const caseFormSchema = z.object({
  id: z.string().optional(),
  caseNumber: z.string().optional(),
  caseName: z.string().min(1, '案件名称不能为空').max(100, '案件名称不能超过100个字符'),
  affiliation: z.nativeEnum(Affiliation),
  status: z.nativeEnum(CaseStatus),
  plaintiffName: z.string().min(1, '原告不能为空').max(100, '原告不能超过100个字符'),
  defendantName: z.string().min(1, '被告不能为空').max(100, '被告不能超过100个字符'),
  opponentType: z.nativeEnum(OpponentType),
  caseType: z.nativeEnum(CaseType),
  filingDate: z.string().min(1, '立案日期不能为空'),
  trialConclusionDate: z.string().optional().nullable(),
  executionConclusionDate: z.string().optional().nullable(),
  litigationStatus: z.nativeEnum(LitigationStatus),
  causeOfAction: z.string().min(1, '案由不能为空').max(200, '案由不能超过200个字符'),
  disputeResolutionMethod: z.nativeEnum(DisputeResolutionMethod),
  trialInstitution: z.string().min(1, '审理机关不能为空').max(100, '审理机关不能超过100个字符'),
  currentStage: z.string().min(1, '所处阶段不能为空').max(100, '所处阶段不能超过100个字符'),
  caseDomain: z.nativeEnum(CaseDomain),
  claimAmount: z.number().min(0, '案件标的额不能小于0'),
  principalAmount: z.number().min(0, '本金金额不能小于0'),
  caseBalance: z.number().min(0, '案件余额不能小于0'),
  basicCaseFacts: z.string().min(1, '基本案情不能为空'),
  disposalMeasuresDescription: z.string().min(1, '处置措施不能为空'),
  monthlyProgressSituation: z.string().optional(),
});

/**
 * 用户表单验证模式
 */
export const userFormSchema = z.object({
  id: z.string().optional(),
  username: z.string().min(3, '用户名至少需要3个字符').max(20, '用户名不能超过20个字符'),
  password: z.string()
    .min(6, '密码至少需要6个字符')
    .max(100, '密码不能超过100个字符')
    .optional(),
  name: z.string().min(1, '姓名不能为空').max(50, '姓名不能超过50个字符'),
  role: z.nativeEnum(UserRole),
  affiliation: z.nativeEnum(Affiliation),
  email: z.string().email('请输入有效的电子邮件地址').optional().nullable(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码').optional().nullable(),
});

/**
 * 登录表单验证模式
 */
export const loginFormSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

/**
 * 修改密码表单验证模式
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '当前密码不能为空'),
  newPassword: z.string().min(6, '新密码至少需要6个字符').max(100, '新密码不能超过100个字符'),
  confirmPassword: z.string().min(1, '确认密码不能为空'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '新密码和确认密码不匹配',
  path: ['confirmPassword'],
});