import { NextResponse } from 'next/server';
import prisma from '@/middleware/prismaMiddleware';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
    const currentYear = new Date().getFullYear();

    // 获取年度目标
    const annualTarget = await prisma.annualTarget.findFirst({
      where: { year },
    });

    if (!annualTarget) {
      return NextResponse.json({ execution: [] });
    }

    // 按隶属单位分组统计容器
    const affiliationStats: Record<
      string,
      {
        caseClosureActual: number;
        amountReductionActual: number;
        lossPreventionActual: number;
        caseClosureTarget: number;
        amountReductionTarget: number;
        lossPreventionTarget: number;
      }
    > = {};

    if (year === currentYear) {
      // 今年：使用实时Case表的数据
      // 通过原生查询读取目标字段，避免 Prisma 客户端缺少 amountReductionTarget 字段导致读取失败
      const caseTargets = await prisma.$queryRaw<{ caseId: string; caseClosureTarget: string; amountReductionTarget: number; lossPreventionTarget: number }[]>`
        SELECT caseId, caseClosureTarget, amountReductionTarget, lossPreventionTarget
        FROM CaseAnnualTarget
        WHERE annualTargetId = ${annualTarget.id} AND isIncludedInTarget = 1
      `;

      const caseIds = caseTargets.map(t => t.caseId);
      const cases = await prisma.case.findMany({
        where: { id: { in: caseIds } },
        select: {
          id: true,
          affiliation: true,
          status: true,
          caseBalance: true,
          annualRealizedAmount: true,
          executionConclusionDate: true,
        },
      });
      const caseMap = new Map(cases.map(c => [c.id, c]));

      // 初始化隶属单位集合与目标
      const allAffiliations = new Set<string>();
      caseTargets.forEach((t) => {
        const c = caseMap.get(t.caseId);
        if (c) {
          allAffiliations.add(c.affiliation);
        }
      });

      allAffiliations.forEach((aff) => {
        const targetsOfAff = caseTargets.filter(t => (caseMap.get(t.caseId)?.affiliation) === aff);
        const caseClosureTargetCount = targetsOfAff.filter(t => t.caseClosureTarget === 'EXECUTION_CLOSURE').length;
        const amountReductionTargetSum = targetsOfAff.reduce((sum, t) => sum + (Number(t.amountReductionTarget) || 0), 0);
        const lossPreventionTargetSum = targetsOfAff.reduce((sum, t) => sum + (Number(t.lossPreventionTarget) || 0), 0);

        affiliationStats[aff] = {
          caseClosureActual: 0,
          amountReductionActual: 0,
          lossPreventionActual: 0,
          caseClosureTarget: caseClosureTargetCount,
          amountReductionTarget: amountReductionTargetSum,
          lossPreventionTarget: lossPreventionTargetSum,
        };
      });

      // 计算实际执行（按案件实际值汇总）
      caseTargets.forEach((t) => {
        const c = caseMap.get(t.caseId);
        if (!c) return;
        const affiliation = c.affiliation;
        const status = c.status;

        if (!affiliationStats[affiliation]) {
          affiliationStats[affiliation] = {
            caseClosureActual: 0,
            amountReductionActual: 0,
            lossPreventionActual: 0,
            caseClosureTarget: 0,
            amountReductionTarget: 0,
            lossPreventionTarget: 0,
          };
        }

        // 实际结案：排除"未结案"和"审结"
        if (status !== '未结案' && status !== '审结') {
          affiliationStats[affiliation].caseClosureActual++;
        }

        // 实际防损：按年度已实现金额
        const actualLossPrevention = Number(c.annualRealizedAmount) || 0;
        affiliationStats[affiliation].lossPreventionActual += actualLossPrevention;

        // 实际压降：状态为未结案或审结时，等于实际防损；其他状态取标的余额
        const actualReduction = (status === '未结案' || status === '审结')
          ? actualLossPrevention
          : (Number(c.caseBalance) || 0);
        affiliationStats[affiliation].amountReductionActual += actualReduction;
      });
    } else {
      // 往年：使用CaseSnapshot快照
      const caseTargets = await prisma.$queryRaw<{ caseId: string; caseClosureTarget: string; amountReductionTarget: number; lossPreventionTarget: number }[]>`
        SELECT caseId, caseClosureTarget, amountReductionTarget, lossPreventionTarget
        FROM CaseAnnualTarget
        WHERE annualTargetId = ${annualTarget.id} AND isIncludedInTarget = 1 AND year = ${year}
      `;

      const caseIds = caseTargets.map((t) => t.caseId);
      const snapshots = await prisma.caseSnapshot.findMany({
        where: { year, caseId: { in: caseIds } },
        select: { caseId: true, data: true },
      });

      const snapshotMap = new Map(snapshots.map((s) => [s.caseId, s]));
      const filteredTargets = caseTargets.filter((t) => snapshotMap.has(t.caseId));

      const allAffiliations = new Set<string>();
      filteredTargets.forEach((t) => {
        const snap = snapshotMap.get(t.caseId)!;
        const affiliation = (snap.data as any)?.affiliation;
        if (affiliation) allAffiliations.add(affiliation);
      });

      allAffiliations.forEach((affiliation) => {
        const targetsOfAff = filteredTargets.filter((t) => {
          const snap = snapshotMap.get(t.caseId)!;
          return (snap.data as any)?.affiliation === affiliation;
        });

        const caseClosureTargetCount = targetsOfAff.filter(
          (t) => t.caseClosureTarget === 'EXECUTION_CLOSURE'
        ).length;
        const amountReductionTargetSum = targetsOfAff.reduce(
          (sum, t) => sum + (Number(t.amountReductionTarget) || 0),
          0
        );
        const lossPreventionTargetSum = targetsOfAff.reduce(
          (sum, t) => sum + (Number(t.lossPreventionTarget) || 0),
          0
        );

        affiliationStats[affiliation] = {
          caseClosureActual: 0,
          amountReductionActual: 0,
          lossPreventionActual: 0,
          caseClosureTarget: caseClosureTargetCount,
          amountReductionTarget: amountReductionTargetSum,
          lossPreventionTarget: lossPreventionTargetSum,
        };
      });

      filteredTargets.forEach((t) => {
        const snap = snapshotMap.get(t.caseId)!;
        const data = snap.data as any;
        const affiliation = data?.affiliation;
        const status = data?.status;

        if (!affiliationStats[affiliation]) {
          affiliationStats[affiliation] = {
            caseClosureActual: 0,
            amountReductionActual: 0,
            lossPreventionActual: 0,
            caseClosureTarget: 0,
            amountReductionTarget: 0,
            lossPreventionTarget: 0,
          };
        }

        // 实际结案：排除"未结案"和"审结"
        if (status !== '未结案' && status !== '审结') {
          affiliationStats[affiliation].caseClosureActual++;
        }

        // 实际防损：按年度已实现金额
        const actualLossPrevention = Number(data?.annualRealizedAmount) || 0;
        affiliationStats[affiliation].lossPreventionActual += actualLossPrevention;

        // 实际压降：状态为未结案或审结时，等于实际防损；其他状态取标的余额
        const actualReduction = (status === '未结案' || status === '审结')
          ? actualLossPrevention
          : (Number(data?.caseBalance) || 0);
        affiliationStats[affiliation].amountReductionActual += actualReduction;
      });
    }

    const execution = Object.entries(affiliationStats).map(([affiliation, stats]) => ({
      affiliation,
      ...stats,
    }));

    return NextResponse.json({ execution });
  } catch (error) {
    console.error('获取指标执行数据失败:', error);
    return NextResponse.json({ error: '获取指标执行数据失败' }, { status: 500 });
  }
}