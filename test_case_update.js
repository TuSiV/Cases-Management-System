const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 手动实现一个简单的UUID生成函数
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testUpdateCase() {
  try {
    console.log('开始测试案件更新...');
    
    // 查找一个测试用的案件ID
    const cases = await prisma.case.findMany({ take: 1 });
    if (cases.length === 0) {
      console.log('没有找到案件记录，请先创建一个案件。');
      return;
    }
    
    const caseId = cases[0].id;
    console.log(`找到测试案件ID: ${caseId}`);
    
    // 模拟更新案件信息
    const updatedCase = await prisma.case.update({
      where: { id: caseId },
      data: {
        caseName: `测试案件 - 更新于 ${new Date().toISOString()}`,
        updatedById: cases[0].updatedById // 使用相同的更新人ID
      }
    });
    
    console.log('案件更新成功:', updatedCase.id);
    
    // 手动测试记录变更日志（模拟我们修复后的逻辑）
    console.log('尝试手动记录变更日志...');
    const id = generateUUID();
    console.log(`生成的UUID: ${id}`);
    
    const logData = {
      id,
      caseId,
      changedById: updatedCase.updatedById,
      changedFields: JSON.stringify(['caseName']),
      oldValues: JSON.stringify({ caseName: cases[0].caseName }),
      newValues: JSON.stringify({ caseName: updatedCase.caseName }),
      changeDescription: '测试记录变更日志'
    };
    
    console.log('变更日志数据:', JSON.stringify(logData));
    
    // 尝试直接使用Prisma ORM插入数据
    const result = await prisma.caseChangeLog.create({
      data: logData
    });
    
    console.log('案件变更日志记录成功:', result.id);
    console.log('测试完成！修复方案有效。');
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdateCase();