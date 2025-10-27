import { requireAuth, requireAffiliationAccess } from '@/middleware/authMiddleware';
import { getPrismaClient } from '@/middleware/prismaMiddleware';
import { UserRole, Affiliation } from '@/types';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const prisma = getPrismaClient()

// 获取案件变更日志列表
export const GET = async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    // 验证用户是否已登录
    const session = await requireAuth();
    
    // 使用Prisma的ORM方法获取案件信息以检查权限
    const caseInfo = await prisma.case.findUnique({
      where: { id: params.id },
      select: { affiliation: true }
    });
    
    // 如果案件不存在，返回错误
    if (!caseInfo) {
      return NextResponse.json({ error: '案件不存在' }, { status: 404 });
    }
    
    // 检查用户是否有权限访问此案件
    if (session.user.role?.toLowerCase() !== UserRole.ADMIN) {
      await requireAffiliationAccess(caseInfo.affiliation as Affiliation);
    }
    
    // 解析查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    
    // 计算偏移量
    const skip = (page - 1) * pageSize;
    
    // 使用Prisma的ORM方法查询总数
    const totalCount = await prisma.caseChangeLog.count({
      where: { caseId: params.id }
    });
    
    // 使用Prisma的ORM方法查询变更日志列表
    const changeLogs = await prisma.caseChangeLog.findMany({
      where: { caseId: params.id },
      include: {
        changedBy: {
          select: { name: true, username: true, role: true, affiliation: true }
        }
      },
      orderBy: {
        changeTime: 'desc'
      },
      skip: skip,
      take: pageSize
    });
    
    // 处理JSON字符串字段，转换为对象
    const processedLogs = changeLogs.map((log: any) => ({
      ...log,
      changedFields: JSON.parse(log.changedFields),
      oldValues: JSON.parse(log.oldValues),
      newValues: JSON.parse(log.newValues)
    }));
    
    // 返回分页数据
    return NextResponse.json({
      changeLogs: processedLogs,
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    });
  } catch (error) {
    console.error('获取案件变更日志失败:', error);
    if (error instanceof Error && error.message.includes('FORBIDDEN')) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }
    return NextResponse.json({ error: '获取案件变更日志失败' }, { status: 500 });
  }
};