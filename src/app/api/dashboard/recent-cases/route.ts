import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/auth'
import { UserRole } from '@/types'
import { createApiRoute, getPrismaClient } from '@/middleware'
import { NextRequest } from 'next/server'

const prisma = getPrismaClient()

// 获取最近案件列表
export const GET = createApiRoute(
  async (request: NextRequest) => {
    // 获取会话
    const session = await getServerSession(authOptions);
    
    // 验证用户是否已登录
    if (!session?.user) {
      return { error: '请先登录' };
    }
    
    const isAdmin = session.user.role?.toLowerCase() === UserRole.ADMIN
    const isViewer = session.user.role?.toLowerCase() === UserRole.VIEWER
    const userAffiliation = session.user.affiliation
    
    // 构建查询条件
    const where: { affiliation?: string } = {}
    
    // 非管理员和非查看员只能查看自己隶属的案件
    if (!isAdmin && !isViewer) {
      where.affiliation = userAffiliation
    }
    
    // 查询最近案件
    const recentCases = await prisma.case.findMany({
      where,
      take: 5,
      orderBy: {
        filingDate: 'desc'
      },
      include: {
        createdBy: {
          select: {
            name: true
          }
        }
      }
    })
    
    return recentCases
  }
)