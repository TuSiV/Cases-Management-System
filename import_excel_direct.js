const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 生成案件号
function generateCaseNumber(year) {
  const date = new Date();
  const currentYear = year || date.getFullYear().toString().slice(2);
  return `${currentYear}${Math.floor(1000 + Math.random() * 9000)}`;
}

// 直接导入到数据库
async function importExcelDirect(filePath) {
  try {
    console.log(`开始直接导入文件到数据库: ${filePath}`);
    
    // 读取Excel文件
    const workbook = XLSX.readFile(filePath);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
    
    console.log(`共 ${jsonData.length} 条记录需要导入`);
    
    // 检查管理员用户是否存在
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      console.error('❌ 错误：未找到管理员用户，请先创建管理员账号');
      await prisma.$disconnect();
      return;
    }
    
    console.log(`使用管理员账号: ${adminUser.email} 进行导入`);
    
    let successCount = 0;
    let failCount = 0;
    const failures = [];
    
    // 批量处理数据
    console.log('\n开始处理数据...');
    
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNum = i + 2; // Excel行号
      
      try {
        // 验证必填字段
        if (!row['案件名称'] || !row['原告名称'] || !row['被告名称']) {
          throw new Error('案件名称、原告名称和被告名称为必填字段');
        }
        
        // 提取年份（如果有立案日期）
        let caseYear = '';
        if (row['立案日期']) {
          const filingDate = new Date(row['立案日期']);
          if (!isNaN(filingDate.getTime())) {
            caseYear = filingDate.getFullYear().toString().slice(2);
          }
        }
        
        // 创建案件数据
        const caseData = {
          caseNumber: generateCaseNumber(caseYear),
          caseName: row['案件名称'].toString().trim(),
          plaintiffName: row['原告名称'].toString().trim(),
          defendantName: row['被告名称'].toString().trim(),
          affiliatedTo: row['隶属']?.toString().trim() || '',
          status: row['状态']?.toString().trim() || '',
          caseType: row['案件类型']?.toString().trim() || '',
          filingDate: row['立案日期'] ? new Date(row['立案日期']) : null,
          litigationStatus: row['诉讼地位']?.toString().trim() || '',
          disputeResolutionMethod: row['纠纷解决方式']?.toString().trim() || '',
          trialInstitution: row['审理机构']?.toString().trim() || '',
          currentStage: row['所处阶段']?.toString().trim() || '',
          caseField: row['案件所属领域']?.toString().trim() || '',
          caseReason: row['案由']?.toString().trim() || '',
          conclusionDate: row['审结日期'] ? new Date(row['审结日期']) : null,
          opponentNature: row['对方性质']?.toString().trim() || '',
          caseAmount: parseFloat(row['案件标的额']) || 0,
          principalAmount: parseFloat(row['标的额中本金金额']) || 0,
          caseBalance: parseFloat(row['案件余额']) || 0,
          annualClosingTarget: parseFloat(row['年度结案指标']) || 0,
          annualLossAvoidanceTarget: parseFloat(row['年度避免或挽回损失指标']) || 0,
          annualRealizedAmount: parseFloat(row['年度已实现金额']) || 0,
          realizedAmount: parseFloat(row['已实现金额']) || 0,
          badDebtProvision: row['计提坏账情况']?.toString().trim() || '',
          riskExposure: parseFloat(row['风险敞口']) || 0,
          projectTeamMembers: row['项目组成员']?.toString().trim() || '',
          litigationCosts: parseFloat(row['诉讼费用']) || 0,
          lawFirmSituation: row['律所情况']?.toString().trim() || '',
          otherCosts: row['其他费用情况']?.toString().trim() || '',
          mortgageSecurity: row['抵押担保情况']?.toString().trim() || '',
          basicCaseDetails: row['基本案情']?.toString().trim() || '',
          disposalMeasures: row['处置措施简要描述']?.toString().trim() || '',
          createdBy: adminUser.id,
          updatedBy: adminUser.id
        };
        
        // 插入数据库
        await prisma.case.create({
          data: caseData
        });
        
        successCount++;
        
        // 进度显示
        if (successCount % 10 === 0) {
          console.log(`✅ 已成功导入 ${successCount} 条记录`);
        }
        
      } catch (error) {
        failCount++;
        failures.push({
          row: rowNum,
          caseName: row['案件名称'] || '未知案件',
          error: error.message
        });
        
        // 记录错误但继续处理
        console.error(`❌ 第 ${rowNum} 行导入失败:`, error.message);
      }
    }
    
    // 输出总结
    console.log('\n🎉 导入操作完成！');
    console.log(`✅ 成功导入: ${successCount} 条记录`);
    console.log(`❌ 导入失败: ${failCount} 条记录`);
    
    if (failures.length > 0) {
      console.log('\n失败记录详情:');
      failures.slice(0, 10).forEach(failure => {
        console.log(`  第${failure.row}行: ${failure.caseName} - ${failure.error}`);
      });
      
      if (failures.length > 10) {
        console.log(`  ... 还有 ${failures.length - 10} 条失败记录`);
      }
    }
    
    await prisma.$disconnect();
    return { successCount, failCount, failures };
    
  } catch (error) {
    console.error('\n❌ 导入过程中发生严重错误:', error.message);
    await prisma.$disconnect();
    return { error: error.message };
  }
}

// 执行导入
const excelFilePath = process.env.EXCEL_FILE_PATH || './data/cases_import.xlsx';
importExcelDirect(excelFilePath);