import { NextResponse } from 'next/server';
import prisma from '@/middleware/prismaMiddleware';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/auth';
import { UserRole } from '@/types';

// 获取指标数据
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const url = new URL(request.url);
    const yearParam = url.searchParams.get('year');
    
    // 如果没有提供年份参数或年份参数无效，则不限制年份，返回所有指标
    const whereCondition = yearParam ? { year: parseInt(yearParam) } : {};

    const targets = await prisma.annualTarget.findMany({
      where: whereCondition,
      include: {
        createdBy: { select: { name: true } },
        updatedBy: { select: { name: true } },
        // @ts-ignore - 类型定义与schema.prisma不匹配，等待权限问题解决后运行prisma generate
        affiliationTargets: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ targets });
  } catch (error) {
    console.error('获取指标数据失败:', error);
    return NextResponse.json({ error: '获取指标数据失败' }, { status: 500 });
  }
}

// 创建新指标
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role.toLowerCase() !== UserRole.ADMIN.toLowerCase()) {
      return NextResponse.json({ error: '只有管理员可以创建指标' }, { status: 403 });
    }

    const data = await request.json();
    const { year, totalCaseClosureTarget, totalAmountReductionTarget, totalLossPreventionTarget } = data;

    // 检查该年份是否已有指标
    const existingTarget = await prisma.annualTarget.findFirst({
      where: { year },
    });

    if (existingTarget) {
      return NextResponse.json({ error: '该年份已有指标设置' }, { status: 400 });
    }

    const newTarget = await prisma.annualTarget.create({
      data: {
        year,
        // @ts-ignore - 类型定义与schema.prisma不匹配，等待权限问题解决后运行prisma generate
        totalCaseClosureTarget,
        totalAmountReductionTarget,
        totalLossPreventionTarget,
        createdById: session.user.id,
        updatedById: session.user.id,
      },
    });

    return NextResponse.json({ target: newTarget }, { status: 201 });
  } catch (error) {
    console.error('创建指标失败:', error);
    return NextResponse.json({ error: '创建指标失败' }, { status: 500 });
  }
}

// 更新指标 - 注意：在Next.js App Router中，带参数的路由需要单独创建文件
// 这里保留这个端点作为兼容处理，但理想情况下应该创建[id]文件夹和对应的route.ts文件
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role.toLowerCase() !== UserRole.ADMIN.toLowerCase()) {
      return NextResponse.json({ error: '只有管理员可以更新指标' }, { status: 403 });
    }

    // 从请求体中获取targetId，因为URL路径解析在App Router中不可靠
    const data = await request.json();
    const { id: targetId, ...updateData } = data;

    if (!targetId) {
      return NextResponse.json({ error: '缺少指标ID' }, { status: 400 });
    }

    const updatedTarget = await prisma.annualTarget.update({
      where: { id: targetId },
      data: {
        // @ts-ignore - 类型定义与schema.prisma不匹配，等待权限问题解决后运行prisma generate
        totalCaseClosureTarget: updateData.totalCaseClosureTarget,
        totalAmountReductionTarget: updateData.totalAmountReductionTarget,
        totalLossPreventionTarget: updateData.totalLossPreventionTarget,
        updatedById: session.user.id,
      },
    });

    return NextResponse.json({ target: updatedTarget });
  } catch (error) {
    console.error('更新指标失败:', error);
    return NextResponse.json({ error: '更新指标失败' }, { status: 500 });
  }
}

// 删除指标
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role.toLowerCase() !== UserRole.ADMIN.toLowerCase()) {
      return NextResponse.json({ error: '只有管理员可以删除指标' }, { status: 403 });
    }

    const url = new URL(request.url);
    const targetId = url.searchParams.get('id');

    if (!targetId) {
      return NextResponse.json({ error: '缺少指标ID' }, { status: 400 });
    }

    // 检查指标是否存在
    const existingTarget = await prisma.annualTarget.findUnique({ where: { id: targetId } });
    if (!existingTarget) {
      return NextResponse.json({ error: '指标不存在' }, { status: 404 });
    }

    // 删除指标
    await prisma.annualTarget.delete({ where: { id: targetId } });

    return NextResponse.json({ message: '指标删除成功' }, { status: 200 });
  } catch (error) {
    console.error('删除指标失败:', error);
    return NextResponse.json({ error: '删除指标失败' }, { status: 500 });
  }
}