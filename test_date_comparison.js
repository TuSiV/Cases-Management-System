const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const dayjs = require('dayjs');

async function testDateComparison() {
  try {
    console.log('开始测试日期比较逻辑...');
    
    // 查找一个测试用的案件ID
    const cases = await prisma.case.findMany({ take: 1 });
    if (cases.length === 0) {
      console.log('没有找到案件记录，请先创建一个案件。');
      return;
    }
    
    const caseId = cases[0].id;
    const originalCase = await prisma.case.findUnique({ where: { id: caseId } });
    console.log(`找到测试案件ID: ${caseId}`);
    console.log(`原立案日期: ${originalCase?.filingDate}`);
    
    // 准备测试数据 - 保持立案日期不变，但修改其他字段
    const testData = {
      caseName: `测试案件 - 更新于 ${new Date().toISOString()}`,
      // 保持立案日期不变（使用相同的值或格式化相同的日期）
      filingDate: originalCase?.filingDate ? 
        new Date(originalCase.filingDate).toISOString() : null,
    };
    
    console.log(`测试数据立案日期: ${testData.filingDate}`);
    
    // 由于直接API调用需要身份验证，我们将直接使用Prisma模拟API的逻辑
    // 1. 模拟获取当前案件完整信息
    const fullCurrentCase = await prisma.case.findUnique({ where: { id: caseId } });
    
    if (!fullCurrentCase) {
      console.log('案件不存在');
      return;
    }
    
    // 2. 模拟API中的日期比较逻辑
    console.log('模拟API中的日期比较逻辑...');
    const changedFields = [];
    const oldValues = {};
    const newValues = {};
    
    // 遍历测试数据的字段
    Object.keys(testData).forEach(field => {
      if (testData[field] !== undefined) {
        // 特殊处理日期类型字段
        if (field.includes('Date')) {
          // 将日期转换为统一格式（只比较日期部分，不比较时间）后再进行比较
          const oldDateStr = fullCurrentCase[field] ? 
            dayjs(fullCurrentCase[field]).format('YYYY-MM-DD') : null;
          const newDateStr = testData[field] ? 
            dayjs(testData[field]).format('YYYY-MM-DD') : null;
          
          console.log(`比较 ${field}: 旧值[${oldDateStr}] vs 新值[${newDateStr}]`);
          if (oldDateStr !== newDateStr) {
            changedFields.push(field);
            oldValues[field] = fullCurrentCase[field];
            newValues[field] = testData[field];
          }
        } else {
          // 非日期字段使用普通比较
          console.log(`比较 ${field}: 旧值[${fullCurrentCase[field]}] vs 新值[${testData[field]}]`);
          if (testData[field] !== fullCurrentCase[field]) {
            changedFields.push(field);
            oldValues[field] = fullCurrentCase[field];
            newValues[field] = testData[field];
          }
        }
      }
    });
    
    console.log('变更的字段:', changedFields);
    
    // 3. 如果有变更，更新案件并记录日志
    if (changedFields.length > 0) {
      console.log('执行案件更新...');
      const updatedCase = await prisma.case.update({
        where: { id: caseId },
        data: {
          ...testData,
          updatedById: fullCurrentCase.updatedById // 使用相同的更新人ID
        }
      });
      
      console.log('案件更新成功');
      
      // 记录变更日志（简化版）
      console.log('记录变更日志...');
      const logResult = await prisma.caseChangeLog.create({
        data: {
          caseId: caseId,
          changedById: fullCurrentCase.updatedById,
          changedFields: JSON.stringify(changedFields),
          oldValues: JSON.stringify(oldValues),
          newValues: JSON.stringify(newValues),
          changeDescription: `测试更新: ${changedFields.join(', ')}`
        }
      });
      
      console.log('变更日志记录成功:', logResult.id);
      
      // 验证结果
      if (changedFields.includes('filingDate')) {
        console.log('❌ 测试失败: 立案日期未变更但被记录为变更！');
      } else {
        console.log('✅ 测试成功: 立案日期未变更，未被记录为变更！');
      }
    } else {
      console.log('没有变更的字段，无需更新');
    }
    
    console.log('案件更新成功');
    
    // 查询最新的变更日志
    console.log('查询最新的变更日志...');
    const changeLogs = await prisma.caseChangeLog.findMany({
      where: { caseId },
      orderBy: { changeTime: 'desc' },
      take: 1
    });
    
    if (changeLogs.length > 0) {
      const latestLog = changeLogs[0];
      console.log(`最新变更日志ID: ${latestLog.id}`);
      console.log(`变更时间: ${latestLog.changeTime}`);
      console.log(`变更字段: ${latestLog.changedFields}`);
      
      // 检查变更字段中是否包含filingDate
      const changedFields = JSON.parse(latestLog.changedFields);
      if (changedFields.includes('filingDate')) {
        console.log('❌ 测试失败: 立案日期未变更但被记录为变更！');
        console.log(`旧值: ${latestLog.oldValues}`);
        console.log(`新值: ${latestLog.newValues}`);
      } else {
        console.log('✅ 测试成功: 立案日期未变更，未被记录为变更！');
      }
    } else {
      console.log('❌ 测试失败: 未找到变更日志记录！');
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDateComparison();