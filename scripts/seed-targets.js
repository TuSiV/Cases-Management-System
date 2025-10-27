// 指标种子数据脚本
// 运行方式: node scripts/seed-targets.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTargets() {
  try {
    console.log('开始添加指标种子数据...');

    // 获取一个用户作为创建者和更新者
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      console.error('没有找到用户数据，请先创建用户');
      return;
    }

    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    // 创建当前年份的指标
    await prisma.annualTarget.upsert({
      where: { year: currentYear },
      update: {},
      create: {
        year: currentYear,
        totalCaseClosureTarget: 20,
        totalAmountReductionTarget: 50000000, // 5000万元
        totalLossPreventionTarget: 20000000,   // 2000万元
        createdById: firstUser.id,
        updatedById: firstUser.id,
        affiliationTargets: {
          create: [
            {
              affiliation: '江苏法拍',
              caseClosureTarget: 'NORMAL_PROGRESS',
              amountReductionTarget: 20000000,
              lossPreventionTarget: 8000000,
            },
            {
              affiliation: '安徽法拍',
              caseClosureTarget: 'NORMAL_PROGRESS',
              amountReductionTarget: 15000000,
              lossPreventionTarget: 6000000,
            },
            {
              affiliation: '广东法拍',
              caseClosureTarget: 'NORMAL_PROGRESS',
              amountReductionTarget: 15000000,
              lossPreventionTarget: 6000000,
            },
          ],
        },
      },
    });

    // 创建下一年度的指标（2025年）
    await prisma.annualTarget.upsert({
      where: { year: nextYear },
      update: {},
      create: {
        year: nextYear,
        totalCaseClosureTarget: 25,
        totalAmountReductionTarget: 60000000, // 6000万元
        totalLossPreventionTarget: 25000000,   // 2500万元
        createdById: firstUser.id,
        updatedById: firstUser.id,
        affiliationTargets: {
          create: [
            {
              affiliation: '江苏法拍',
              caseClosureTarget: 'NORMAL_PROGRESS',
              amountReductionTarget: 24000000,
              lossPreventionTarget: 10000000,
            },
            {
              affiliation: '安徽法拍',
              caseClosureTarget: 'NORMAL_PROGRESS',
              amountReductionTarget: 18000000,
              lossPreventionTarget: 7500000,
            },
            {
              affiliation: '广东法拍',
              caseClosureTarget: 'NORMAL_PROGRESS',
              amountReductionTarget: 18000000,
              lossPreventionTarget: 7500000,
            },
          ],
        },
      },
    });

    // 创建目标执行数据
    await prisma.annualTargetExecution.deleteMany({});
    
    // 为当前年份创建执行数据
    const currentTarget = await prisma.annualTarget.findUnique({ where: { year: currentYear } });
    if (currentTarget) {
      await prisma.annualTargetExecution.createMany({
        data: [
          {
            annualTargetId: currentTarget.id,
            affiliation: '江苏法拍',
            year: currentYear,
            caseClosureActual: 5,
            amountReductionActual: 12000000,
            lossPreventionActual: 5000000,
          },
          {
            annualTargetId: currentTarget.id,
            affiliation: '安徽法拍',
            year: currentYear,
            caseClosureActual: 4,
            amountReductionActual: 8000000,
            lossPreventionActual: 3500000,
          },
          {
            annualTargetId: currentTarget.id,
            affiliation: '广东法拍',
            year: currentYear,
            caseClosureActual: 3,
            amountReductionActual: 9000000,
            lossPreventionActual: 4000000,
          },
        ],
      });
    }

    console.log('指标种子数据添加成功！');
  } catch (error) {
    console.error('添加指标种子数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTargets();