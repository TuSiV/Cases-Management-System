const { PrismaClient } = require('@prisma/client');

// 创建Prisma客户端实例
const prisma = new PrismaClient();

async function testFix() {
  try {
    console.log('开始测试修复效果...');

    // 查询所有案件
    const cases = await prisma.case.findMany();
    console.log(`数据库中找到 ${cases.length} 个案件记录`);
    
    // 检查每个案件的monthlyProgressSituation字段
    cases.forEach((caseRecord, index) => {
      console.log(`案件 ${index + 1}:`);
      console.log(`  ID: ${caseRecord.id}`);
      console.log(`  案件号: ${caseRecord.caseNumber}`);
      console.log(`  monthlyProgressSituation类型: ${typeof caseRecord.monthlyProgressSituation}`);
      console.log(`  monthlyProgressSituation值: ${caseRecord.monthlyProgressSituation || 'null/undefined'}`);
    });

    // 尝试创建一个没有monthlyProgressSituation的案件
    try {
      console.log('\n尝试创建一个没有monthlyProgressSituation的案件...');
      const testCase = await prisma.case.create({
        data: {
          caseNumber: 'TEST0001',
          affiliation: 'REGION_1',
          status: '未结案',
          caseName: '测试案件',
          plaintiffName: '测试原告',
          defendantName: '测试被告',
          opponentType: '个人',
          caseType: '民事',
          filingDate: new Date(),
          litigationStatus: '主动',
          causeOfAction: '测试案由',
          disputeResolutionMethod: '诉讼',
          trialInstitution: '测试法院',
          currentStage: '测试阶段',
          caseDomain: '集采',
          claimAmount: 10000,
          principalAmount: 8000,
          caseBalance: 10000,
          annualClosureTarget: 5000,
          annualLossPreventionTarget: 3000,
          annualRealizedAmount: 0,
          totalRealizedAmount: 0,
          badDebtProvision: '无',
          riskExposure: 10000,
          projectTeamMembers: '测试人员',
          litigationCosts: 0,
          lawFirmSituation: '无',
          agencyFees: 0,
          otherExpensesSituation: '无',
          otherExpenses: 0,
          collateralSituation: '无',
          basicCaseFacts: '测试案情',
          disposalMeasuresDescription: '测试处置措施',
          // 注意：这里故意不提供monthlyProgressSituation
          createdById: '471bef5d-258b-4965-b1d5-40521a7a53e7',
          updatedById: '471bef5d-258b-4965-b1d5-40521a7a53e7'
        }
      });
      console.log('✓ 成功创建没有monthlyProgressSituation的案件！');
      console.log(`  新案件ID: ${testCase.id}`);
      
      // 清理测试数据
      await prisma.case.delete({ where: { id: testCase.id } });
      console.log('  已删除测试案件');
    } catch (error) {
      console.error('✗ 创建没有monthlyProgressSituation的案件失败:', error.message);
    }

    // 尝试创建一个有monthlyProgressSituation的案件
    try {
      console.log('\n尝试创建一个有monthlyProgressSituation的案件...');
      const testCase = await prisma.case.create({
        data: {
          caseNumber: 'TEST0002',
          affiliation: 'REGION_1',
          status: '未结案',
          caseName: '测试案件2',
          plaintiffName: '测试原告2',
          defendantName: '测试被告2',
          opponentType: '个人',
          caseType: '民事',
          filingDate: new Date(),
          litigationStatus: '主动',
          causeOfAction: '测试案由2',
          disputeResolutionMethod: '诉讼',
          trialInstitution: '测试法院2',
          currentStage: '测试阶段2',
          caseDomain: '集采',
          claimAmount: 20000,
          principalAmount: 16000,
          caseBalance: 20000,
          annualClosureTarget: 'NORMAL_PROGRESS',
          annualLossPreventionTarget: 6000,
          annualRealizedAmount: 0,
          totalRealizedAmount: 0,
          badDebtProvision: '无',
          riskExposure: 20000,
          projectTeamMembers: '测试人员2',
          litigationCosts: 0,
          lawFirmSituation: '无',
          agencyFees: 0,
          otherExpensesSituation: '无',
          otherExpenses: 0,
          collateralSituation: '无',
          basicCaseFacts: '测试案情2',
          disposalMeasuresDescription: '测试处置措施2',
          monthlyProgressSituation: '测试月度进展',
          createdById: '471bef5d-258b-4965-b1d5-40521a7a53e7',
          updatedById: '471bef5d-258b-4965-b1d5-40521a7a53e7'
        }
      });
      console.log('✓ 成功创建有monthlyProgressSituation的案件！');
      console.log(`  新案件ID: ${testCase.id}`);
      console.log(`  monthlyProgressSituation值: ${testCase.monthlyProgressSituation}`);
      
      // 清理测试数据
      await prisma.case.delete({ where: { id: testCase.id } });
      console.log('  已删除测试案件');
    } catch (error) {
      console.error('✗ 创建有monthlyProgressSituation的案件失败:', error.message);
    }

  } catch (error) {
    console.error('测试过程中发生错误:', error);
  } finally {
    // 关闭Prisma客户端连接
    await prisma.$disconnect();
    console.log('\n测试完成，已关闭数据库连接');
  }
}

// 执行测试
console.log('测试脚本已启动');
testFix().catch(console.error);