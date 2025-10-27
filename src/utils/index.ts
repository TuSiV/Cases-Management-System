import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

// 设置dayjs为中文
dayjs.locale('zh-cn')
import { Affiliation, CaseType, AffiliationCode, CaseTypeCode, UserRole } from '@/types'

// 导出API工具函数
export * from './apiUtils'

// 导出验证工具函数
export * from './validation'

// 导出客户端API工具
export * from './clientApi'

/**
 * 格式化日期
 * @param date 日期对象或日期字符串
 * @param format 格式化模式，默认为YYYY-MM-DD
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | string | null | undefined, format: string = 'YYYY-MM-DD'): string {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * 解析日期字符串为Date对象
 * @param dateStr 日期字符串
 * @returns Date对象
 */
export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null
  const date = dayjs(dateStr)
  return date.isValid() ? date.toDate() : null
}

/**
 * 格式化金额为带千分位的字符串
 * @param amount 金额数值
 * @returns 格式化后的金额字符串
 */
export function formatAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return ''
  return amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

/**
 * 生成案件号
 * @param affiliation 隶属
 * @param filingDate 立案日期
 * @param caseType 案件类型
 * @returns 生成的案件号（前端生成仅供预览，实际生成在后端）
 */
export function generateCaseNumber(
  affiliation: Affiliation,
  filingDate: Date,
  caseType: CaseType
): string {
  // 获取隶属代码
  const affiliationCode = AffiliationCode[affiliation] || 'QT'
  
  // 获取年份
  const year = filingDate.getFullYear().toString()
  
  // 获取案件类型代码
  const typeCode = CaseTypeCode[caseType] || 'QT'
  
  // 生成前7位
  const prefix = `${affiliationCode}${year}${typeCode}`
  
  // 生成4位随机数字作为序列号（前端生成仅供预览，实际生成在后端）
  const randomSequence = Math.floor(1000 + Math.random() * 9000).toString()
  
  return `${prefix}${randomSequence}`
}

/**
 * 解析案件号
 * @param caseNumber 案件号
 * @returns 解析结果，包含隶属代码、年份、案件类型代码和序列号
 */
export function parseCaseNumber(caseNumber: string): {
  affiliationCode: string;
  year: string;
  typeCode: string;
  sequence: string;
} | null {
  if (!caseNumber || caseNumber.length < 11) return null
  
  return {
    affiliationCode: caseNumber.substring(0, 2),
    year: caseNumber.substring(2, 6),
    typeCode: caseNumber.substring(6, 7),
    sequence: caseNumber.substring(7)
  }
}

/**
 * 获取当前用户是否有权限编辑指定案件
 * @param userRole 用户角色
 * @param userAffiliation 用户隶属
 * @param caseAffiliation 案件隶属
 * @returns 是否有编辑权限
 */
export function hasEditPermission(
  userRole: string,
  userAffiliation: string,
  caseAffiliation: string
): boolean {
  // 管理员可以编辑所有案件
  if (userRole === UserRole.ADMIN) return true
  
  // 普通用户只能编辑自己隶属的案件
  return userAffiliation === caseAffiliation
}

/**
 * 获取当前用户是否有权限查看指定案件
 * @param userRole 用户角色
 * @param userAffiliation 用户隶属
 * @param caseAffiliation 案件隶属
 * @returns 是否有查看权限
 */
export function hasViewPermission(
  userRole: string,
  userAffiliation: string,
  caseAffiliation: string
): boolean {
  // 管理员可以查看所有案件
  if (userRole === UserRole.ADMIN) return true
  
  // 查看角色可以查看所有案件
  if (userRole === UserRole.VIEWER) return true
  
  // 普通用户只能查看自己隶属的案件
  return userAffiliation === caseAffiliation
}

/**
 * 获取案件状态对应的标签颜色
 * @param status 案件状态
 * @returns 标签颜色
 */
export function getCaseStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    '未结案': 'processing',
    '审结': 'success',
    '执结': 'success',
    '调解': 'success',
    '和解': 'success',
    '撤诉': 'warning',
    '破产': 'error'
  }
  
  return colorMap[status] || 'default'
}

/**
 * 获取案件类型对应的标签颜色
 * @param type 案件类型
 * @returns 标签颜色
 */
export function getCaseTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    '民事': 'blue',
    '刑事': 'red'
  }
  
  return colorMap[type] || 'default'
}

/**
 * 获取诉讼地位对应的标签颜色
 * @param status 诉讼地位
 * @returns 标签颜色
 */
export function getLitigationStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    '主动': 'green',
    '被动': 'orange'
  }
  
  return colorMap[status] || 'default'
}