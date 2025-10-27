import { createApiRoute } from '@/middleware/errorHandler';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/auth';
import { getPrismaClient } from '@/middleware/prismaMiddleware';
import { UserRole } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 获取案件统计数据
 * @param request NextRequest对象
 * @returns 统计数据
 */
// 创建API路由
export const GET = createApiRoute(
  async (request: NextRequest) => {
    // 获取会话
    const session = await getServerSession(authOptions);
    
    // 验证用户是否已登录
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const { role, affiliation } = session.user;

    // 构建查询条件
    const whereCondition = role === UserRole.ADMIN ? {} : { affiliation };

    // 获取案件总数
    const totalCases = await prisma.case.count({
      where: whereCondition,
    });

    // 获取未结案件数
    const pendingCases = await prisma.case.count({
      where: {
        ...whereCondition,
        status: '未结案',
      },
    });

    // 获取已结案件数
    const closedCases = totalCases - pendingCases;

    // 获取各类型案件数量
    const caseTypeStats = role === UserRole.ADMIN 
      ? await prisma.case.groupBy({
          by: ['caseType'],
          _count: true,
        })
      : await prisma.case.groupBy({
          by: ['caseType'],
          where: { affiliation },
          _count: true,
        });

    // 获取各隶属案件数量（仅管理员可见）
    let affiliationStats: any[] = [];
    if (role === UserRole.ADMIN) {
      affiliationStats = await (prisma.case.groupBy as any)({
        by: ['affiliation'],
        _count: true,
      });
    }

    // 获取各状态案件数量
    const statusStats = role === UserRole.ADMIN 
      ? await prisma.case.groupBy({
          by: ['status'],
          _count: true,
        })
      : await prisma.case.groupBy({
          by: ['status'],
          where: { affiliation },
          _count: true,
        });

    // 获取最近案件
    const recentCases = await prisma.case.findMany({
      where: whereCondition,
      orderBy: {
        filingDate: 'desc',
      },
      take: 5,
      select: {
        id: true,
        caseNumber: true,
        status: true,
        affiliation: true,
        filingDate: true,
        caseType: true,
      },
    });

    return {
      totalCases,
      pendingCases,
      closedCases,
      caseTypeStats,
      statusStats,
      affiliationStats: role === UserRole.ADMIN ? affiliationStats : [],
      recentCases,
    };
  }
);