const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('开始删除数据库中的所有案件...');
    
    // 查询当前案件总数
    const currentCaseCount = await prisma.case.count();
    console.log(`删除前的案件总数: ${currentCaseCount}`);
    
    if (currentCaseCount === 0) {
      console.log('数据库中已经没有案件需要删除');
      return;
    }
    
    // 开始计时
    const startTime = Date.now();
    
    // 删除所有案件
    // 注意：由于schema.prisma中定义了onDelete: Cascade
    // 删除案件时，相关的月度进展记录和变更日志也会被自动删除
    await prisma.case.deleteMany({});
    
    // 结束计时
    const endTime = Date.now();
    
    // 验证删除结果
    const remainingCaseCount = await prisma.case.count();
    console.log(`删除操作完成！耗时: ${endTime - startTime}ms`);
    console.log(`删除后的案件总数: ${remainingCaseCount}`);
    
    if (remainingCaseCount === 0) {
      console.log('✓ 所有案件已成功删除');
    } else {
      console.log('✗ 仍有案件未删除，请检查');
    }
    
  } catch (error) {
    console.error('删除案件时出错:', error);
  } finally {
    // 关闭数据库连接
    await prisma.$disconnect();
    console.log('数据库连接已关闭');
  }
}

// 执行脚本
main().catch(console.error);