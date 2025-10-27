import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/auth';
import { UserRole } from '@/types';
import { generateCaseSnapshots } from '@/utils/snapshot';

export const POST = async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    // 仅管理员可触发快照生成
    if (session.user.role?.toLowerCase() !== UserRole.ADMIN) {
      return NextResponse.json({ error: '权限不足，仅管理员可执行' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const force = searchParams.get('force') === 'true';
    const now = new Date();
    const targetYear = yearParam ? parseInt(yearParam) : now.getFullYear();

    // 非force时，只有在该年的12月31日23:59:59之后才允许生成
    if (!force) {
      const cutoff = new Date(targetYear, 11, 31, 23, 59, 59);
      if (now < cutoff) {
        return NextResponse.json({ error: `未到${targetYear}年年底，禁止生成快照。可传force=true强制生成` }, { status: 400 });
      }
    }

    const result = await generateCaseSnapshots(targetYear);
    return NextResponse.json({ message: '快照生成完成', year: targetYear, total: result.total });
  } catch (error) {
    console.error('生成案件快照失败:', error);
    return NextResponse.json({ error: '生成案件快照失败' }, { status: 500 });
  }
};