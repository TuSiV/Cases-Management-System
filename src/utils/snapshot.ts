import { getPrismaClient } from '@/middleware/prismaMiddleware';

const prisma = getPrismaClient();

export async function generateCaseSnapshots(year: number) {
  // 获取全部案件（不限定年份，表示该年份年底的全量快照）
  const cases = await prisma.case.findMany();

  // 组装快照数据
  const operations = cases.map((c: any) => {
    const data = {
      id: c.id,
      caseNumber: c.caseNumber,
      affiliation: c.affiliation,
      status: c.status,
      caseName: c.caseName,
      plaintiffName: c.plaintiffName,
      defendantName: c.defendantName,
      opponentType: c.opponentType,
      caseType: c.caseType,
      filingDate: c.filingDate,
      trialConclusionDate: c.trialConclusionDate,
      executionConclusionDate: c.executionConclusionDate,
      litigationStatus: c.litigationStatus,
      causeOfAction: c.causeOfAction,
      disputeResolutionMethod: c.disputeResolutionMethod,
      trialInstitution: c.trialInstitution,
      currentStage: c.currentStage,
      caseDomain: c.caseDomain,
      claimAmount: c.claimAmount,
      principalAmount: c.principalAmount,
      caseBalance: c.caseBalance,
      annualClosureTarget: c.annualClosureTarget,
      annualLossPreventionTarget: c.annualLossPreventionTarget,
      annualRealizedAmount: c.annualRealizedAmount,
      totalRealizedAmount: c.totalRealizedAmount,
      badDebtProvision: c.badDebtProvision,
      riskExposure: c.riskExposure,
      projectTeamMembers: c.projectTeamMembers,
      litigationCosts: c.litigationCosts,
      lawFirmSituation: c.lawFirmSituation,
      agencyFees: c.agencyFees,
      otherExpensesSituation: c.otherExpensesSituation,
      otherExpenses: c.otherExpenses,
      collateralSituation: c.collateralSituation,
      basicCaseFacts: c.basicCaseFacts,
      disposalMeasuresDescription: c.disposalMeasuresDescription,
      monthlyProgressSituation: c.monthlyProgressSituation,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };

    return prisma.caseSnapshot.upsert({
      where: { caseId_year: { caseId: c.id, year } },
      update: { data, snapshotAt: new Date() },
      create: {
        caseId: c.id,
        year,
        data,
      },
    });
  });

  const results = await prisma.$transaction(operations);
  return { total: results.length };
}