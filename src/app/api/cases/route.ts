import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/auth'
import { Affiliation, CaseType, CaseTypeCode, AffiliationCode, UserRole, Case, CaseStatus } from '@/types'
import { createApiRoute } from '@/utils/apiUtils'
import { requireAuth, requireAffiliationAccess } from '@/middleware/authMiddleware'
import { getPrismaClient } from '@/middleware/prismaMiddleware'
import { recordCaseChangeLog } from './utils'

const prisma = getPrismaClient()

// 生成案件号 - 使用随机4位数字作为后四位
async function generateCaseNumber(affiliation: Affiliation, filingDate: Date, caseType: CaseType): Promise<string> {
  try {
    // 获取隶属代码
    const affiliationCode = AffiliationCode[affiliation]
    
    // 获取年份
    const year = filingDate.getFullYear().toString()
    
    // 获取案件类型代码
    const typeCode = CaseTypeCode[caseType]
    
    // 生成前7位
    const prefix = `${affiliationCode}${year}${typeCode}`
    
    // 最多尝试10次生成唯一的随机编号
    let maxAttempts = 10
    let attempts = 0
    let caseNumber = null
    
    while (attempts < maxAttempts && !caseNumber) {
      // 生成4位随机数字作为序列号
      const randomSequence = Math.floor(1000 + Math.random() * 9000).toString() // 生成1000-9999之间的随机数
      
      // 构建完整编号
      const candidateNumber = `${prefix}${randomSequence}`
      
      // 检查数据库中是否已存在该编号
      const existingCase = await prisma.case.findUnique({
        where: {
          caseNumber: candidateNumber
        }
      })
      
      // 如果不存在，则使用此编号
      if (!existingCase) {
        caseNumber = candidateNumber
      }
      
      attempts++
    }
    
    // 如果尝试多次后仍未生成唯一编号，返回备用方案
    if (!caseNumber) {
      console.warn(`生成随机编号失败，使用备用方案`)
      return `BK_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    }
    
    return caseNumber
  } catch (error) {
    console.error('生成案件号失败:', error)
    // 如果生成失败，使用时间戳加随机数作为备用方案
    return `BK_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  }
}

// 获取案件列表
export const GET = createApiRoute({
  GET: async (request: NextRequest) => {
    // 获取会话
    const session = await getServerSession(authOptions);
    
    // 验证用户是否已登录
    if (!session?.user) {
      throw new Error('请先登录');
    }
    
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const caseNumber = searchParams.get('caseNumber')
    const caseName = searchParams.get('caseName')
    const status = searchParams.get('status')
    const statusGroup = searchParams.get('statusGroup')
    const inHand = searchParams.get('inHand')
    const caseType = searchParams.get('caseType')
    const filingDateStart = searchParams.get('filingDateStart')
    const filingDateEnd = searchParams.get('filingDateEnd')
    const affiliation = searchParams.get('affiliation') || (session.user.role?.toLowerCase() === UserRole.ADMIN || session.user.role?.toLowerCase() === UserRole.VIEWER ? undefined : session.user.affiliation)
    const sortField = searchParams.get('sortField') || 'latestUpdateTime'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    // 构建查询条件（使用any以支持notIn/比较操作）
    const where: any = {}
    
    // 非管理员只能查看自己隶属的案件
    if (affiliation) {
      where.affiliation = affiliation as Affiliation
    }
    
    if (caseNumber) {
      where.caseNumber = {
        contains: caseNumber
      }
    }
    
    if (caseName) {
      where.caseName = {
        contains: caseName
      }
    }
    
    // 状态筛选与分组筛选
    if (statusGroup === 'closed') {
      where.status = { notIn: ['未结案', '审结'] }
    } else if (status) {
      where.status = status as CaseStatus
    }
    
    if (caseType) {
      where.caseType = caseType as CaseType
    }
    
    // 在手案件：余额不为0
    if (inHand === '1' || inHand === 'true') {
      where.caseBalance = { not: 0 }
    }
    
    // 处理立案日期范围查询
    if (filingDateStart || filingDateEnd) {
      where.filingDate = {} as { gte?: Date; lte?: Date; }
      
      if (filingDateStart) {
        where.filingDate.gte = new Date(filingDateStart)
      }
      
      if (filingDateEnd) {
        where.filingDate.lte = new Date(filingDateEnd)
      }
    }
    
    // 查询总数
    const total = await prisma.case.count({ where })
    
    // 支持的排序字段
    const validSortFields = ['filingDate', 'claimAmount', 'caseBalance', 'latestUpdateTime']

    // 如果按“最新更新时间”排序，需合并案件的 updatedAt/createdAt 和最新月度进展时间
    if (sortField === 'latestUpdateTime') {
      // 取所有匹配案件（用于排序后分页）
      const allCases = await prisma.case.findMany({ where })
      const caseIds = allCases.map(c => c.id)

      // 获取每个案件的最新月度进展时间
      let progressMaxMap = new Map<string, Date>()
      if (caseIds.length > 0) {
        const grouped = await prisma.monthlyProgress.groupBy({
          by: ['caseId'],
          where: { caseId: { in: caseIds } },
          _max: { createdAt: true }
        })
        grouped.forEach(g => {
          if (g._max?.createdAt) progressMaxMap.set(g.caseId, g._max.createdAt as Date)
        })
      }

      // 计算最新更新时间并排序
      const sorted = allCases
        .map(c => {
          const lastProgressAt = progressMaxMap.get(c.id)
          const latest = new Date(Math.max(
            c.updatedAt ? new Date(c.updatedAt).getTime() : 0,
            c.createdAt ? new Date(c.createdAt).getTime() : 0,
            lastProgressAt ? new Date(lastProgressAt).getTime() : 0
          ))
          return { ...c, latestUpdateTime: latest.toISOString() }
        })
        .sort((a, b) => {
          const diff = new Date(a.latestUpdateTime).getTime() - new Date(b.latestUpdateTime).getTime()
          return sortOrder === 'asc' ? diff : -diff
        })

      const skip = (page - 1) * pageSize
      const paged = sorted.slice(skip, skip + pageSize)

      return NextResponse.json({
        cases: paged,
        total,
        page,
        pageSize
      })
    }

    // 其他字段的数据库排序
    const orderBy: Record<string, 'asc' | 'desc'> = {}
    if (validSortFields.includes(sortField)) {
      orderBy[sortField] = (sortOrder === 'asc' || sortOrder === 'desc') ? sortOrder as 'asc' | 'desc' : 'desc'
    } else {
      // 默认按“最新更新时间”（后备为立案日期）
      orderBy.filingDate = 'desc'
    }
    
    // 查询列表（数据库排序）
    const cases = await prisma.case.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    })
    
    return NextResponse.json({
      cases,
      total,
      page,
      pageSize
    })
  }
})

export const POST = createApiRoute({
  POST: async (request: NextRequest) => {
    // 获取会话
    const session = await getServerSession(authOptions);
    
    // 验证用户是否已登录
    if (!session?.user) {
      throw new Error('请先登录');
    }
    
    const data = await request.json() as Omit<Case, 'id' | 'caseNumber' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
    
    // 非管理员只能创建自己隶属的案件 - 使用不区分大小写的比较
    if (session.user.role?.toLowerCase() !== UserRole.ADMIN && data.affiliation !== session.user.affiliation) {
      throw new Error('您没有权限创建其他隶属的案件')
    }
    
    // 生成案件号
    const caseNumber = await generateCaseNumber(
      data.affiliation,
      new Date(data.filingDate),
      data.caseType
    )
    
    const caseData = {
      ...data,
      caseNumber,
      createdById: session.user.id,
      updatedById: session.user.id
    } as any

    // 创建案件
    const newCase = await prisma.case.create({
      data: caseData
    }) as unknown as Case
    
    // 记录案件创建日志
    // 提取变更的字段（排除id, createdAt, updatedAt等自动生成的字段）
    const changedFields: string[] = [];
    const newValues: Record<string, any> = {};
    
    Object.keys(caseData).forEach(field => {
      if (field !== 'id' && field !== 'createdAt' && field !== 'updatedAt') {
        changedFields.push(field);
        newValues[field] = caseData[field];
      }
    });
    
    await recordCaseChangeLog(
      newCase.id,
      session.user.id,
      changedFields,
      {}, // 旧值为空对象
      newValues,
      '创建案件'
    );
    
    return NextResponse.json(newCase)
  }
})