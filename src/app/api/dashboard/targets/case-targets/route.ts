import { NextResponse } from 'next/server';
import prisma from '@/middleware/prismaMiddleware';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/auth';
import { UserRole } from '@/types';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
    const currentYear = new Date().getFullYear();

    const affiliation = (session.user.role?.toLowerCase() === UserRole.ADMIN || 
                        session.user.role?.toLowerCase() === UserRole.VIEWER) ? 
      url.searchParams.get('affiliation') : 
      session.user.affiliation;

    const annualTarget = await prisma.annualTarget.findFirst({
      where: { year },
    });

    if (!annualTarget) {
      return NextResponse.json({ error: `未找到${year}年度目标` }, { status: 404 });
    }

    if (year === currentYear) {
      // 今年：实时Case + CaseAnnualTarget
      const whereCondition: any = {
        affiliation: affiliation ? { equals: affiliation } : undefined,
      };

      const cases = await prisma.case.findMany({
        where: whereCondition,
        include: {
          caseAnnualTargets: {
            where: { annualTargetId: annualTarget.id },
          },
        },
      });

      // 通过原生查询获取每个案件的标的压降目标，避免 Prisma 客户端未更新导致无法读取字段
      const amountRows = await prisma.$queryRaw<{ caseId: string; amountReductionTarget: number }[]>`
        SELECT caseId, amountReductionTarget FROM CaseAnnualTarget WHERE annualTargetId = ${annualTarget.id}
      `;
      const amountMap = new Map(amountRows.map(r => [r.caseId, r.amountReductionTarget ?? 0]));

      const caseWithTargetInfo = cases.map((c: any) => ({
        id: c.id,
        caseNumber: c.caseNumber,
        caseName: c.caseName,
        affiliation: c.affiliation,
        caseAmount: c.caseAmount,
        caseBalance: c.caseBalance,
        status: c.status,
        // 新增：返回年度已实现金额与执行结论日期，供前端计算“实际压降/防损”
        annualRealizedAmount: c.annualRealizedAmount || 0,
        executionConclusionDate: c.executionConclusionDate || null,
        isIncludedInTarget:
          c.caseAnnualTargets.length > 0 && c.caseAnnualTargets[0].isIncludedInTarget,
        caseClosureTarget: c.caseAnnualTargets.length > 0 ? c.caseAnnualTargets[0].caseClosureTarget : '',
        lossPreventionTarget:
          c.caseAnnualTargets.length > 0 ? c.caseAnnualTargets[0].lossPreventionTarget : 0,
        amountReductionTarget: amountMap.get(c.id) ?? 0,
        targetId: c.caseAnnualTargets.length > 0 ? c.caseAnnualTargets[0].id : null,
      }));

      return NextResponse.json({ cases: caseWithTargetInfo, annualTargetId: annualTarget.id });
    } else {
      // 往年：CaseSnapshot + CaseAnnualTarget
      // 通过原生查询获取年度目标记录，包含标的压降字段
      const caseTargets = await prisma.$queryRaw<{ id: string; caseId: string; isIncludedInTarget: number; caseClosureTarget: string; amountReductionTarget: number; lossPreventionTarget: number }[]>`
        SELECT id, caseId, isIncludedInTarget, caseClosureTarget, amountReductionTarget, lossPreventionTarget
        FROM CaseAnnualTarget
        WHERE annualTargetId = ${annualTarget.id} AND year = ${year}
      `;

      const snapshots = await prisma.caseSnapshot.findMany({
        where: { year },
        select: { caseId: true, data: true },
      });

      const filteredSnapshots = snapshots.filter((s) => {
        const aff = (s.data as any)?.affiliation;
        if (!affiliation) return true;
        return aff === affiliation;
      });

      const targetMap = new Map(caseTargets.map((t) => [t.caseId, t]));

      const caseWithTargetInfo = filteredSnapshots.map((s) => {
        const t = targetMap.get(s.caseId);
        const data = s.data as any;
        return {
          ...data,
          isIncludedInTarget: t ? !!t.isIncludedInTarget : false,
          caseClosureTarget: t ? t.caseClosureTarget : '',
          lossPreventionTarget: t ? t.lossPreventionTarget : 0,
          amountReductionTarget: t ? t.amountReductionTarget : 0,
          targetId: t ? t.id : null,
        };
      });

      return NextResponse.json({ cases: caseWithTargetInfo, annualTargetId: annualTarget.id });
    }
  } catch (error) {
    console.error('获取案件指标信息失败:', error);
    return NextResponse.json({ error: '获取案件指标信息失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role?.toLowerCase() !== UserRole.ADMIN.toLowerCase()) {
      return NextResponse.json({ error: '只有管理员可以设置案件指标' }, { status: 403 });
    }

    const data = await request.json();
    const { annualTargetId, caseId, isIncludedInTarget, caseClosureTarget, lossPreventionTarget, amountReductionTarget } = data;
    // 分别处理两类目标值，避免互相覆盖

    const annualTarget = await prisma.annualTarget.findUnique({
      where: { id: annualTargetId },
    });

    if (!annualTarget) {
      return NextResponse.json({ error: '年度目标不存在' }, { status: 404 });
    }

    let caseTarget = await prisma.caseAnnualTarget.findUnique({
      where: { caseId_annualTargetId: { caseId, annualTargetId } },
    });

    if (caseTarget) {
      caseTarget = await prisma.caseAnnualTarget.update({
        where: { caseId_annualTargetId: { caseId, annualTargetId } },
        data: {
          isIncludedInTarget,
          caseClosureTarget: (caseClosureTarget as string) || '',
          lossPreventionTarget: lossPreventionTarget !== undefined ? Number(lossPreventionTarget) : caseTarget.lossPreventionTarget,
          // 去除 amountReductionTarget 以避免 Prisma 客户端未更新时报错
        },
      });
      if (amountReductionTarget !== undefined) {
        await prisma.$executeRaw`UPDATE CaseAnnualTarget SET amountReductionTarget = ${Number(amountReductionTarget)} WHERE id = ${caseTarget.id}`;
      }
    } else {
      caseTarget = await prisma.caseAnnualTarget.create({
        data: {
          caseId,
          annualTargetId,
          year: annualTarget.year,
          isIncludedInTarget,
          caseClosureTarget: (caseClosureTarget as string) || '',
          lossPreventionTarget: lossPreventionTarget !== undefined ? Number(lossPreventionTarget) : 0,
          amountReductionTarget: amountReductionTarget !== undefined ? Number(amountReductionTarget) : 0,
        },
      });
      if (amountReductionTarget !== undefined) {
        await prisma.$executeRaw`UPDATE CaseAnnualTarget SET amountReductionTarget = ${Number(amountReductionTarget)} WHERE id = ${caseTarget.id}`;
      }
    }

    return NextResponse.json({ caseTarget }, { status: 201 });
  } catch (error) {
    console.error('设置案件指标失败:', error);
    return NextResponse.json({ error: '设置案件指标失败' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role?.toLowerCase() !== UserRole.ADMIN.toLowerCase()) {
      return NextResponse.json({ error: '只有管理员可以批量更新案件指标' }, { status: 403 });
    }

    const data = await request.json();
    const { annualTargetId, caseTargets } = data;

    const annualTarget = await prisma.annualTarget.findUnique({
      where: { id: annualTargetId },
    });

    if (!annualTarget) {
      return NextResponse.json({ error: '年度目标不存在' }, { status: 404 });
    }

    const results = [] as any[];
    for (const targetInfo of caseTargets) {
      const { caseId, isIncludedInTarget, caseClosureTarget, lossPreventionTarget, amountReductionTarget } = targetInfo;

      let caseTarget = await prisma.caseAnnualTarget.findUnique({
        where: { caseId_annualTargetId: { caseId, annualTargetId } },
      });

      if (caseTarget) {
        caseTarget = await prisma.caseAnnualTarget.update({
          where: { caseId_annualTargetId: { caseId, annualTargetId } },
          data: {
            isIncludedInTarget,
            caseClosureTarget: (caseClosureTarget as string) || '',
            lossPreventionTarget: lossPreventionTarget !== undefined ? Number(lossPreventionTarget) : caseTarget.lossPreventionTarget,
            // 不在此处写 amountReductionTarget，改为原生更新
          },
        });
        if (amountReductionTarget !== undefined) {
          await prisma.$executeRaw`UPDATE CaseAnnualTarget SET amountReductionTarget = ${Number(amountReductionTarget)} WHERE id = ${caseTarget.id}`;
        }
      } else if (isIncludedInTarget) {
        caseTarget = await prisma.caseAnnualTarget.create({
          data: {
            caseId,
            annualTargetId,
            year: annualTarget.year,
            isIncludedInTarget,
            caseClosureTarget: (caseClosureTarget as string) || '',
            lossPreventionTarget: lossPreventionTarget !== undefined ? Number(lossPreventionTarget) : 0,
            amountReductionTarget: amountReductionTarget !== undefined ? Number(amountReductionTarget) : 0,
          },
        });
        if (amountReductionTarget !== undefined) {
          await prisma.$executeRaw`UPDATE CaseAnnualTarget SET amountReductionTarget = ${Number(amountReductionTarget)} WHERE id = ${caseTarget.id}`;
        }
      }

      results.push(caseTarget);
    }

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error('批量更新案件指标失败:', error);
    return NextResponse.json({ error: '批量更新案件指标失败' }, { status: 500 });
  }
}