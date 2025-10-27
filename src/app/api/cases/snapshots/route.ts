import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/auth';
import { UserRole } from '@/types';
import { getPrismaClient } from '@/middleware/prismaMiddleware';

const prisma = getPrismaClient();

export const GET = async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    const isAdmin = session.user.role?.toLowerCase() === UserRole.ADMIN;
    const isViewer = session.user.role?.toLowerCase() === UserRole.VIEWER;
    const userAffiliation = session.user.affiliation;

    const where: any = { year };
    // 非管理员和非查看员仅能查看自己隶属的案件快照
    if (!isAdmin && !isViewer) {
      where.case = { affiliation: userAffiliation };
    }

    const snapshots = await prisma.caseSnapshot.findMany({
      where,
      orderBy: { snapshotAt: 'desc' },
      include: {
        case: {
          select: {
            caseNumber: true,
            caseName: true,
            affiliation: true,
            status: true,
          },
        },
      },
    });

    const result = snapshots.map((s: any) => ({
      id: s.id,
      caseId: s.caseId,
      year: s.year,
      snapshotAt: s.snapshotAt,
      caseNumber: s.case?.caseNumber || '',
      caseName: s.case?.caseName || '',
      affiliation: s.case?.affiliation || '',
      status: s.case?.status || '',
      data: s.data,
    }));

    return NextResponse.json({ snapshots: result });
  } catch (error) {
    console.error('获取案件快照失败:', error);
    return NextResponse.json({ error: '获取案件快照失败' }, { status: 500 });
  }
};