const { PrismaClient } = require('@prisma/client');

// 初始化Prisma客户端
const prisma = new PrismaClient();

async function countCases() {
  try {
    console.log('开始检查数据库中的案件数量...');
    
    // 查询案件总数
    const count = await prisma.case.count();
    console.log(`当前数据库中的案件数量: ${count}`);
    
    // 可选：查询一些样本数据以验证审结日期和执结日期是否正确导入
    const sampleCases = await prisma.case.findMany({
      take: 5,
      select: {
        caseNumber: true,
        filingDate: true,
        trialConclusionDate: true,
        executionConclusionDate: true
      }
    });
    
    console.log('\n样本案件数据:');
    sampleCases.forEach((caseItem, index) => {
      console.log(`\n案件 ${index + 1}:`);
      console.log(`- 案件编号: ${caseItem.caseNumber}`);
      console.log(`- 立案日期: ${caseItem.filingDate ? new Date(caseItem.filingDate).toLocaleDateString() : '未设置'}`);
      console.log(`- 审结日期: ${caseItem.trialConclusionDate ? new Date(caseItem.trialConclusionDate).toLocaleDateString() : '未设置'}`);
      console.log(`- 执结日期: ${caseItem.executionConclusionDate ? new Date(caseItem.executionConclusionDate).toLocaleDateString() : '未设置'}`);
    });
    
    console.log('\n验证完成！');
  } catch (error) {
    console.error('检查案件数量失败:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Prisma客户端已关闭');
  }
}

countCases();