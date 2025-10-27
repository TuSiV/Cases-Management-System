import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/auth'
import { UserRole } from '@/types'
import { createApiRoute, getPrismaClient } from '@/middleware'
import { NextRequest } from 'next/server'

const prisma = getPrismaClient()

interface AffiliationBalance {
  name: string;
  value: number;
}

interface CaseTypeBalance {
  name: string;
  value: number;
}

// 获取仪表盘统计数据
export const GET = createApiRoute(
  async (request: NextRequest) => {
    // 获取会话
    const session = await getServerSession(authOptions);
    
    // 验证用户是否已登录
    if (!session?.user) {
      return { error: '请先登录' };
    }
    
    const isAdmin = session.user.role?.toLowerCase() === UserRole.ADMIN
    const isSupervisor = session.user.role?.toLowerCase() === 'supervisor'
    const isViewer = session.user.role?.toLowerCase() === UserRole.VIEWER
    const userAffiliation = session.user.affiliation
    
    // 构建查询条件
    const where: { affiliation?: string } = {}    
    
    // 非管理员和非查看员只能查看自己隶属的案件
    if (!isAdmin && !isViewer) {
      where.affiliation = userAffiliation
    }
    
    // 查询案件总数
    const totalCases = await prisma.case.count({ where })
    
    // 查询未结案件数
    const pendingCases = await prisma.case.count({
      where: {
        ...where,
        status: '未结案'
      }
    })
    
    // 查询审结案件数
    const trialConcludedCases = await prisma.case.count({
      where: {
        ...where,
        status: '审结'
      }
    })
    
    // 查询已结案件数（除了未结案和审结案件以外的其他状态）
    const closedCases = await prisma.case.count({
      where: {
        ...where,
        status: {
          notIn: ['未结案', '审结']
        }
      }
    })
    
    // 计算案件标的余额总和
    const caseBalanceResult = await prisma.case.aggregate({
      _sum: {
        caseBalance: true
      },
      where
    })
    
    const totalCaseBalance = caseBalanceResult._sum.caseBalance || 0
    
    // 如果是管理员，还需要查询用户总数
    let totalUsers = 0
    if (isAdmin) {
      totalUsers = await prisma.user.count()
    }
    
    // 对于管理员和supervisor，获取按隶属分组的案件标的余额数据
    let affiliationBalanceData: AffiliationBalance[] = []
    // 获取重大案件和一般案件的统计数据
    let caseTypeBalanceData: CaseTypeBalance[] = []
    
    if (isAdmin || isSupervisor || isViewer) {
      // 先获取原始的groupBy结果
      const groupByResult = await prisma.case.groupBy({
        by: ['affiliation'],
        _sum: {
          caseBalance: true
        },
        where: where
      })
      
      // 过滤掉affiliation为null的记录并格式化数据
      affiliationBalanceData = groupByResult
        .filter(item => item.affiliation)
        .map(item => ({
          name: item.affiliation as string,
          value: (item._sum?.caseBalance || 0) as number
        }))
        
      // 获取当前年份
      const currentYear = new Date().getFullYear()
      const currentYearStart = new Date(currentYear, 0, 1)
      
      // 查询存量重大案件（立案时间在当前年份以前，案件标的额大于等于10000000元）
      const existingMajorCasesBalance = await prisma.case.aggregate({
        _sum: {
          caseBalance: true
        },
        where: {
          ...where,
          filingDate: {
            lt: currentYearStart
          },
          claimAmount: {
            gte: 10000000
          }
        }
      })
      
      // 查询新发重大案件（立案时间为当前年份，案件标的额大于等于10000000元）
      const newMajorCasesBalance = await prisma.case.aggregate({
        _sum: {
          caseBalance: true
        },
        where: {
          ...where,
          filingDate: {
            gte: currentYearStart
          },
          claimAmount: {
            gte: 10000000
          }
        }
      })
      
      // 查询存量一般案件（立案时间在当前年份以前，案件标的额小于10000000元）
      const existingNormalCasesBalance = await prisma.case.aggregate({
        _sum: {
          caseBalance: true
        },
        where: {
          ...where,
          filingDate: {
            lt: currentYearStart
          },
          claimAmount: {
            lt: 10000000
          }
        }
      })
      
      // 查询新发一般案件（立案时间为当前年份，案件标的额小于10000000元）
      const newNormalCasesBalance = await prisma.case.aggregate({
        _sum: {
          caseBalance: true
        },
        where: {
          ...where,
          filingDate: {
            gte: currentYearStart
          },
          claimAmount: {
            lt: 10000000
          }
        }
      })
      
      // 构建案件类型余额数据
      caseTypeBalanceData = [
        {
          name: '存量重大案件',
          value: (existingMajorCasesBalance._sum.caseBalance || 0) as number
        },
        {
          name: '新发重大案件',
          value: (newMajorCasesBalance._sum.caseBalance || 0) as number
        },
        {
          name: '存量一般案件',
          value: (existingNormalCasesBalance._sum.caseBalance || 0) as number
        },
        {
          name: '新发一般案件',
          value: (newNormalCasesBalance._sum.caseBalance || 0) as number
        }
      ]
    }
    
    // 查询在手案件数量（案件标的余额不为0的案件）
    const activeCases = await prisma.case.count({
      where: {
        ...where,
        caseBalance: {
          not: 0
        }
      }
    })
    
    return {
      totalCases,
      pendingCases,
      trialConcludedCases,
      closedCases,
      activeCases,
      totalUsers,
      totalCaseBalance,
      affiliationBalanceData,
      caseTypeBalanceData
    }
  }
)