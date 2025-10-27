import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/auth';
import prisma from '@/middleware/prismaMiddleware';
import { UserRole, CaseType } from '@/types';

// 阈值：重大案件判定（标的额 >= 10000000 元）
const MAJOR_THRESHOLD = 10000000;

function getYearRange(year: number) {
  const start = new Date(year, 0, 1, 0, 0, 0, 0);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return { start, end };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const role = session.user.role?.toLowerCase();
    const isAdmin = role === UserRole.ADMIN;
    const isViewer = role === UserRole.VIEWER;

    // 仅管理员和查看员可访问
    if (!isAdmin && !isViewer) {
      return NextResponse.json({ error: '无权限访问' }, { status: 403 });
    }

    const url = new URL(request.url);
    const yearParam = url.searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    const { start: yearStart, end: yearEnd } = getYearRange(year);

    // 查找该年份的年度目标记录（用于 2.x 指标）
    const annualTarget = await prisma.annualTarget.findFirst({ where: { year } });

    // 结果结构体
    const result: any = {
      year,
      section1: {
        overall: {
          disposalCaseCount: 0,
          totalBalance: 0,
          majorCaseCount: 0,
          majorBalance: 0,
          normalCaseCount: 0,
          normalBalance: 0,
        },
        existing: {
          disposalCaseCount: 0,
          totalBalance: 0,
          majorCaseCount: 0,
          majorBalance: 0,
          normalCaseCount: 0,
          normalBalance: 0,
        },
        new: {
          disposalCaseCount: 0,
          totalBalance: 0,
          majorCaseCount: 0,
          majorBalance: 0,
          normalCaseCount: 0,
          normalBalance: 0,
        },
      },
      section2: {
        overall: {
          qtyTarget: 0,
          amountReductionTarget: 0,
          lossPreventionTarget: 0,
          qtyActual: 0,
          amountReductionActual: 0,
          lossPreventionActual: 0,
        },
        major: {
          qtyTarget: 0,
          amountReductionTarget: 0,
          lossPreventionTarget: 0,
          qtyActual: 0,
          amountReductionActual: 0,
          lossPreventionActual: 0,
        },
        normal: {
          qtyTarget: 0,
          amountReductionTarget: 0,
          lossPreventionTarget: 0,
          qtyActual: 0,
          amountReductionActual: 0,
          lossPreventionActual: 0,
        },
      },
      section3: {
        currentInHand: {
          qty: 0,
          balance: 0,
          majorQty: 0,
          majorBalance: 0,
          normalQty: 0,
          normalBalance: 0,
        },
      },
    };

    // 计算 1.x 模块（民事案件总体情况：今年实时/往年快照）
    if (year === currentYear) {
      // 实时：从 case 表统计（仅民事）
      const baseCases = await prisma.case.findMany({
        where: {
          caseType: CaseType.CIVIL,
          OR: [
            { executionConclusionDate: null },
            { executionConclusionDate: { gte: yearStart, lte: yearEnd } },
          ],
        },
        select: {
          id: true,
          caseBalance: true,
          claimAmount: true,
          filingDate: true,
        },
      });

      const classify = (cases: any[]) => {
        const overall = {
          disposalCaseCount: cases.length,
          totalBalance: cases.reduce((s, c) => s + (Number(c.caseBalance) || 0), 0),
          majorCaseCount: cases.filter(c => (Number(c.claimAmount) || 0) >= MAJOR_THRESHOLD).length,
          majorBalance: cases.filter(c => (Number(c.claimAmount) || 0) >= MAJOR_THRESHOLD).reduce((s, c) => s + (Number(c.caseBalance) || 0), 0),
          normalCaseCount: cases.filter(c => (Number(c.claimAmount) || 0) < MAJOR_THRESHOLD).length,
          normalBalance: cases.filter(c => (Number(c.claimAmount) || 0) < MAJOR_THRESHOLD).reduce((s, c) => s + (Number(c.caseBalance) || 0), 0),
        };
        const existing = cases.filter(c => c.filingDate && (new Date(c.filingDate)).getFullYear() !== year);
        const newly = cases.filter(c => c.filingDate && (new Date(c.filingDate)).getFullYear() === year);
        const agg = (list: any[]) => ({
          disposalCaseCount: list.length,
          totalBalance: list.reduce((s, c) => s + (Number(c.caseBalance) || 0), 0),
          majorCaseCount: list.filter(c => (Number(c.claimAmount) || 0) >= MAJOR_THRESHOLD).length,
          majorBalance: list.filter(c => (Number(c.claimAmount) || 0) >= MAJOR_THRESHOLD).reduce((s, c) => s + (Number(c.caseBalance) || 0), 0),
          normalCaseCount: list.filter(c => (Number(c.claimAmount) || 0) < MAJOR_THRESHOLD).length,
          normalBalance: list.filter(c => (Number(c.claimAmount) || 0) < MAJOR_THRESHOLD).reduce((s, c) => s + (Number(c.caseBalance) || 0), 0),
        });

        return { overall, existing: agg(existing), new: agg(newly) };
      };

      const s1 = classify(baseCases);
      result.section1 = s1;
    } else {
      // 往年：从 caseSnapshot 快照统计（仅民事）
      const snapshots = await prisma.caseSnapshot.findMany({
        where: { year },
        select: { data: true },
      });
      // 提取民事与条件
      const snapCases = snapshots.map(s => s.data as any).filter(d => d?.caseType === CaseType.CIVIL && (
        !d?.executionConclusionDate || (new Date(d.executionConclusionDate)).getFullYear() === year
      ));

      const classify = (cases: any[]) => {
        const overall = {
          disposalCaseCount: cases.length,
          totalBalance: cases.reduce((s, c) => s + (Number(c.caseBalance) || 0), 0),
          majorCaseCount: cases.filter(c => (Number(c.claimAmount) || 0) >= MAJOR_THRESHOLD).length,
          majorBalance: cases.filter(c => (Number(c.claimAmount) || 0) >= MAJOR_THRESHOLD).reduce((s, c) => s + (Number(c.caseBalance) || 0), 0),
          normalCaseCount: cases.filter(c => (Number(c.claimAmount) || 0) < MAJOR_THRESHOLD).length,
          normalBalance: cases.filter(c => (Number(c.claimAmount) || 0) < MAJOR_THRESHOLD).reduce((s, c) => s + (Number(c.caseBalance) || 0), 0),
        };
        const existing = cases.filter(c => c.filingDate && (new Date(c.filingDate)).getFullYear() !== year);
        const newly = cases.filter(c => c.filingDate && (new Date(c.filingDate)).getFullYear() === year);
        const agg = (list: any[]) => ({
          disposalCaseCount: list.length,
          totalBalance: list.reduce((s, c) => s + (Number(c.caseBalance) || 0), 0),
          majorCaseCount: list.filter(c => (Number(c.claimAmount) || 0) >= MAJOR_THRESHOLD).length,
          majorBalance: list.filter(c => (Number(c.claimAmount) || 0) >= MAJOR_THRESHOLD).reduce((s, c) => s + (Number(c.caseBalance) || 0), 0),
          normalCaseCount: list.filter(c => (Number(c.claimAmount) || 0) < MAJOR_THRESHOLD).length,
          normalBalance: list.filter(c => (Number(c.claimAmount) || 0) < MAJOR_THRESHOLD).reduce((s, c) => s + (Number(c.caseBalance) || 0), 0),
        });

        return { overall, existing: agg(existing), new: agg(newly) };
      };

      const s1 = classify(snapCases);
      result.section1 = s1;
    }

    // 计算 2.x 模块（总体/重大/一般指标）——依赖年度目标与纳入指标案件
    if (annualTarget) {
      if (year === currentYear) {
        // 今年：读取纳入指标的案件目标与实时实际
        const caseTargets = await prisma.$queryRaw<{ caseId: string; caseClosureTarget: string; amountReductionTarget: number; lossPreventionTarget: number }[]>`
          SELECT caseId, caseClosureTarget, amountReductionTarget, lossPreventionTarget
          FROM CaseAnnualTarget
          WHERE annualTargetId = ${annualTarget.id} AND isIncludedInTarget = 1
        `;
        const caseIds = caseTargets.map(t => t.caseId);
        const cases = await prisma.case.findMany({
          where: { id: { in: caseIds } },
          select: { id: true, claimAmount: true, status: true, caseBalance: true, annualRealizedAmount: true },
        });
        const caseMap = new Map(cases.map(c => [c.id, c]));

        // 聚合函数
        const aggTargets = (targets: typeof caseTargets) => ({
          qtyTarget: targets.filter(t => t.caseClosureTarget === 'EXECUTION_CLOSURE').length,
          amountReductionTarget: targets.reduce((s, t) => s + (Number(t.amountReductionTarget) || 0), 0),
          lossPreventionTarget: targets.reduce((s, t) => s + (Number(t.lossPreventionTarget) || 0), 0),
        });
        const aggActuals = (targets: typeof caseTargets) => {
          let qtyActual = 0, amountReductionActual = 0, lossPreventionActual = 0;
          targets.forEach(t => {
            const c = caseMap.get(t.caseId);
            if (!c) return;
            if (c.status !== '未结案' && c.status !== '审结') qtyActual++;
            const actualLoss = Number(c.annualRealizedAmount) || 0;
            lossPreventionActual += actualLoss;
            const actualReduction = (c.status === '未结案' || c.status === '审结') ? actualLoss : (Number(c.caseBalance) || 0);
            amountReductionActual += actualReduction;
          });
          return { qtyActual, amountReductionActual, lossPreventionActual };
        };

        // 总体
        const overallTargets = aggTargets(caseTargets);
        const overallActuals = aggActuals(caseTargets);
        result.section2.overall = { ...overallTargets, ...overallActuals };

        // 重大/一般分组
        const majorTargets = caseTargets.filter(t => (Number(caseMap.get(t.caseId)?.claimAmount) || 0) >= MAJOR_THRESHOLD);
        const normalTargets = caseTargets.filter(t => (Number(caseMap.get(t.caseId)?.claimAmount) || 0) < MAJOR_THRESHOLD);
        result.section2.major = { ...aggTargets(majorTargets), ...aggActuals(majorTargets) };
        result.section2.normal = { ...aggTargets(normalTargets), ...aggActuals(normalTargets) };
      } else {
        // 往年：读取纳入指标的案件目标与快照实际
        const caseTargets = await prisma.$queryRaw<{ caseId: string; caseClosureTarget: string; amountReductionTarget: number; lossPreventionTarget: number }[]>`
          SELECT caseId, caseClosureTarget, amountReductionTarget, lossPreventionTarget
          FROM CaseAnnualTarget
          WHERE annualTargetId = ${annualTarget.id} AND isIncludedInTarget = 1 AND year = ${year}
        `;
        const caseIds = caseTargets.map(t => t.caseId);
        const snapshots = await prisma.caseSnapshot.findMany({
          where: { year, caseId: { in: caseIds } },
          select: { caseId: true, data: true },
        });
        const snapMap = new Map(snapshots.map(s => [s.caseId, s.data as any]));

        const aggTargets = (targets: typeof caseTargets) => ({
          qtyTarget: targets.filter(t => t.caseClosureTarget === 'EXECUTION_CLOSURE').length,
          amountReductionTarget: targets.reduce((s, t) => s + (Number(t.amountReductionTarget) || 0), 0),
          lossPreventionTarget: targets.reduce((s, t) => s + (Number(t.lossPreventionTarget) || 0), 0),
        });
        const aggActualsFromSnap = (targets: typeof caseTargets) => {
          let qtyActual = 0, amountReductionActual = 0, lossPreventionActual = 0;
          targets.forEach(t => {
            const d = snapMap.get(t.caseId);
            if (!d) return;
            const status = d?.status;
            if (status !== '未结案' && status !== '审结') qtyActual++;
            const actualLoss = Number(d?.annualRealizedAmount) || 0;
            lossPreventionActual += actualLoss;
            const actualReduction = (status === '未结案' || status === '审结') ? actualLoss : (Number(d?.caseBalance) || 0);
            amountReductionActual += actualReduction;
          });
          return { qtyActual, amountReductionActual, lossPreventionActual };
        };

        const overallTargets = aggTargets(caseTargets);
        const overallActuals = aggActualsFromSnap(caseTargets);
        result.section2.overall = { ...overallTargets, ...overallActuals };

        const majorTargets = caseTargets.filter(t => (Number(snapMap.get(t.caseId)?.claimAmount) || 0) >= MAJOR_THRESHOLD);
        const normalTargets = caseTargets.filter(t => (Number(snapMap.get(t.caseId)?.claimAmount) || 0) < MAJOR_THRESHOLD);
        result.section2.major = { ...aggTargets(majorTargets), ...aggActualsFromSnap(majorTargets) };
        result.section2.normal = { ...aggTargets(normalTargets), ...aggActualsFromSnap(normalTargets) };
      }
    }

    // 计算 3.x 模块（在手案件情况）：
    // 3.1 在手案件数量 = 1.1.1 处置案件数量 - 2.1.4 数量压降
    // 3.2 在手标的余额 = 1.1.2 涉案标的余额 - 2.1.5 压降
    // 3.3 各细分同理
    const s1o = result.section1.overall;
    const s2o = result.section2.overall;
    const s2m = result.section2.major;
    const s2n = result.section2.normal;
    result.section3.currentInHand = {
      qty: (s1o.disposalCaseCount || 0) - (s2o.qtyActual || 0),
      balance: (s1o.totalBalance || 0) - (s2o.amountReductionActual || 0),
      majorQty: (s1o.majorCaseCount || 0) - (s2m.qtyActual || 0),
      majorBalance: (s1o.majorBalance || 0) - (s2m.amountReductionActual || 0),
      normalQty: (s1o.normalCaseCount || 0) - (s2n.qtyActual || 0),
      normalBalance: (s1o.normalBalance || 0) - (s2n.amountReductionActual || 0),
    };

    return NextResponse.json({ description: result });
  } catch (error) {
    console.error('获取指标描述失败:', error);
    return NextResponse.json({ error: '获取指标描述失败' }, { status: 500 });
  }
}