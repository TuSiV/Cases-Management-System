const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// 初始化Prisma客户端
const prisma = new PrismaClient();

// 生成唯一的案件编号
function generateCaseNumber(index) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `CASE${dateStr}${String(index).padStart(5, '0')}`;
}

// Excel日期转换函数（处理Excel数字格式日期）
function excelDateToJSDate(excelDate) {
  if (!excelDate || typeof excelDate !== 'number') return new Date();
  // Excel日期起始于1899-12-30
  return new Date(Date.UTC(1899, 11, 30, 0, 0, 0) + excelDate * 24 * 60 * 60 * 1000);
}

// 批量导入Excel数据到数据库
async function batchImportFromExcel(excelPath) {
  try {
    console.log(`开始从Excel文件导入数据: ${excelPath}`);
    
    // 检查文件是否存在
    if (!fs.existsSync(excelPath)) {
      throw new Error(`文件不存在: ${excelPath}`);
    }
    
    // 读取Excel文件
    const workbook = XLSX.readFile(excelPath);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
    
    console.log(`共读取到 ${jsonData.length} 条记录`);
    
    // 获取一个用户ID作为创建者和更新者
    // 实际应用中应该使用真实的用户认证
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      throw new Error('数据库中没有用户记录，请先创建用户');
    }
    const userId = firstUser.id;
    console.log(`使用用户ID: ${userId} 作为创建者和更新者`);
    
    // 构建案件数据，映射Excel字段到数据库模型
    const caseData = jsonData.map((row, index) => ({
      // 必填字段
      caseNumber: generateCaseNumber(index + 1),
      affiliation: row['隶属'] || '默认隶属',
      status: row['状态'] || '新建',
      caseName: row['案件名称'] || `未命名案件${index + 1}`,
      plaintiffName: row['原告名称'] || '',
      defendantName: row['被告名称'] || '',
      opponentType: row['对方性质'] || '未知',
      caseType: row['案件类型'] || '民事',
      filingDate: row['立案日期'] ? excelDateToJSDate(row['立案日期']) : new Date(),
      litigationStatus: row['诉讼地位'] || '未知',
      causeOfAction: row['案由'] || '',
      disputeResolutionMethod: row['纠纷解决方式'] || '诉讼',
      trialInstitution: row['审理机构'] || '',
      currentStage: row['所处阶段'] || '初始阶段',
      caseDomain: row['案件所属领域'] || '',
      claimAmount: parseFloat(row['案件标的额']) || 0,
      principalAmount: parseFloat(row['标的额中本金金额']) || 0,
      caseBalance: parseFloat(row['案件余额']) || 0,
      annualClosureTarget: parseFloat(row['年度结案指标']) || 0,
      annualLossPreventionTarget: parseFloat(row['年度避免或挽回损失指标']) || 0,
      annualRealizedAmount: parseFloat(row['年度已实现金额']) || 0,
      totalRealizedAmount: parseFloat(row['已实现金额']) || 0,
      badDebtProvision: row['计提坏账情况'] || '',
      riskExposure: parseFloat(row['风险敞口']) || 0,
      projectTeamMembers: row['项目组成员'] || '',
      litigationCosts: parseFloat(row['诉讼费用']) || 0,
      lawFirmSituation: row['律所情况'] || '',
      agencyFees: 0, // 默认值
      otherExpensesSituation: row['其他费用情况'] || '',
      otherExpenses: 0, // 默认值
      collateralSituation: row['抵押担保情况'] || '',
      basicCaseFacts: row['基本案情'] || '',
      disposalMeasuresDescription: row['处置措施简要描述'] || '',
      createdById: userId,
      updatedById: userId
    }));
    
    // 批量导入配置
    const batchSize = 100; // 每批处理100条
    let totalImported = 0;
    let totalFailed = 0;
    const failedRecords = [];
    
    console.log('开始批量导入数据库...');
    
    // 分批处理
    for (let i = 0; i < caseData.length; i += batchSize) {
      const batch = caseData.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`处理批次 ${batchNumber}: ${batch.length} 条记录`);
      
      try {
        // 使用createMany进行批量导入
        const result = await prisma.case.createMany({
          data: batch,
          skipDuplicates: true // 跳过重复记录
        });
        
        console.log(`✅ 批次 ${batchNumber} 成功导入 ${result.count} 条记录`);
        totalImported += result.count;
        
        // 计算失败的记录数（如果有）
        const failedCount = batch.length - result.count;
        if (failedCount > 0) {
          totalFailed += failedCount;
          console.log(`⚠️  批次 ${batchNumber} 有 ${failedCount} 条记录因重复被跳过`);
        }
        
      } catch (error) {
        console.error(`❌ 批次 ${batchNumber} 导入失败:`, error.message);
        totalFailed += batch.length;
        
        // 记录失败的批次信息
        failedRecords.push({
          batchNumber,
          startIndex: i,
          endIndex: i + batch.length - 1,
          error: error.message
        });
        
        // 尝试单条导入以找出具体失败的记录
        console.log('尝试单条导入以定位具体错误...');
        for (let j = 0; j < batch.length; j++) {
          try {
            await prisma.case.create({
              data: batch[j]
            });
            console.log(`  - 记录 ${i + j + 1} 导入成功`);
            totalImported++;
            totalFailed--;
          } catch (singleError) {
            console.log(`  - 记录 ${i + j + 1} 导入失败: ${singleError.message}`);
          }
        }
      }
      
      // 添加短暂延迟，避免数据库压力过大
      if (i + batchSize < caseData.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // 输出导入结果摘要
    console.log('\n===== 导入完成 =====');
    console.log(`总记录数: ${jsonData.length}`);
    console.log(`成功导入: ${totalImported}`);
    console.log(`失败数量: ${totalFailed}`);
    
    if (failedRecords.length > 0) {
      console.log('\n失败的批次详情:');
      failedRecords.forEach(record => {
        console.log(`  - 批次 ${record.batchNumber}: 记录 ${record.startIndex + 1}-${record.endIndex + 1}, 错误: ${record.error}`);
      });
    }
    
    return {
      success: true,
      totalRecords: jsonData.length,
      imported: totalImported,
      failed: totalFailed
    };
    
  } catch (error) {
    console.error('导入过程发生错误:', error.message);
    return {
      success: false,
      error: error.message
    };
  } finally {
    // 关闭Prisma客户端连接
    await prisma.$disconnect();
    console.log('Prisma客户端已关闭');
  }
}

// 执行导入
const excelFilePath = process.env.EXCEL_FILE_PATH || './data/cases_import.xlsx';

console.log('开始执行批量导入脚本...');
batchImportFromExcel(excelFilePath)
  .then(result => {
    console.log('\n导入结果:', result);
  })
  .catch(error => {
    console.error('脚本执行失败:', error);
  });