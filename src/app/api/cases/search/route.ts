import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/auth';
import { createApiRoute, getPaginationParams } from '@/utils';
import { getPrismaClient } from '@/middleware/prismaMiddleware';
import { UserRole } from '@/types';
import { NextResponse } from 'next/server';

/**
 * 搜索案件
 * @param request NextRequest对象
 * @returns 搜索结果
 */
// 创建API路由
export const GET = createApiRoute({
  GET: async (request: NextRequest) => {
    // 获取会话
    const session = await getServerSession(authOptions);
    
    // 验证用户是否已登录
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    
    const prisma = getPrismaClient();
    const { role, affiliation } = session.user;
    const { page, pageSize, skip } = getPaginationParams(request);
    const searchParams = request.nextUrl.searchParams;

    // 获取搜索参数
    const keyword = searchParams.get('keyword') || '';
    const status = searchParams.get('status') || undefined;
    const caseType = searchParams.get('caseType') || undefined;
    const affiliationFilter = searchParams.get('affiliation') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    // 构建查询条件
    const whereCondition: Partial<{
      affiliation?: string;
      OR?: Array<{
        name?: { contains: string };
        caseNumber?: { contains: string };
        plaintiff?: { contains: string };
        defendant?: { contains: string };
        caseReason?: { contains: string };
      }>;
      status?: string;
      caseType?: string;
      filingDate?: {
        gte?: Date;
        lte?: Date;
      };
    }> = {};

    // 非管理员和非查看者只能查看自己隶属的案件
    if (role !== UserRole.ADMIN && role !== UserRole.VIEWER) {
      whereCondition.affiliation = affiliation;
    } else if (affiliationFilter) {
      whereCondition.affiliation = affiliationFilter;
    }

    // 关键词搜索
    if (keyword) {
      whereCondition.OR = [
        { name: { contains: keyword } },
        { caseNumber: { contains: keyword } },
        { plaintiff: { contains: keyword } },
        { defendant: { contains: keyword } },
        { caseReason: { contains: keyword } },
      ];
    }

    // 状态筛选
    if (status) {
      whereCondition.status = status;
    }

    // 案件类型筛选
    if (caseType) {
      whereCondition.caseType = caseType;
    }

    // 日期范围筛选
    if (startDate || endDate) {
      whereCondition.filingDate = {};
      if (startDate) {
        whereCondition.filingDate.gte = new Date(startDate);
      }
      if (endDate) {
        whereCondition.filingDate.lte = new Date(endDate);
      }
    }

    // 查询案件总数
    const total = await prisma.case.count({
      where: whereCondition,
    });

    // 查询案件列表
    const cases = await prisma.case.findMany({
      where: whereCondition,
      orderBy: {
        filingDate: 'desc',
      },
      skip,
      take: pageSize,
    });

    return NextResponse.json({
      cases,
      total,
      page,
      pageSize
    });
  }
});