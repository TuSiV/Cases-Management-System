const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function importAllCases() {
  try {
    // Excel文件路径
    const excelPath = process.env.EXCEL_FILE_PATH || './data/cases_import.xlsx';
    
    // 读取Excel文件
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为JSON格式
    const casesData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`开始导入案件数据，共 ${casesData.length} 条记录`);
    
    // 获取或创建用户
    let user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!user) {
      // 如果没有管理员用户，创建一个临时的
      const tempUser = await prisma.user.create({
        data: {
          username: 'import_temp_admin',
          password: 'changeme', // 实际应用中应使用加密密码
          name: '导入临时管理员',
          role: 'ADMIN',
          department: '技术部',
          position: '系统管理员',
          contactNumber: '13800000000',
          email: 'admin@example.com',
          status: 'ACTIVE',
          affiliation: 'REGION_1'
        }
      });
      user = tempUser;
    }
    
    let success = 0;
    let fail = 0;
    const errors = [];
    
    // 循环导入每条数据
    for (let i = 0; i < casesData.length; i++) {
      const row = casesData[i];
      try {
        await prisma.case.create({
          data: {
            caseNumber: `25CASE${i+1}`,
            caseName: row['案件名称'],
            plaintiffName: row['原告名称'],
            defendantName: row['被告名称'],
            affiliation: row['隶属'] || 'REGION_1',
            status: row['状态'] || '进行中',
            opponentType: row['对方性质'] || '企业',
            caseType: row['案件类型'] || '合同纠纷',
            filingDate: row['立案日期'] ? new Date(row['立案日期']) : new Date(),
            litigationStatus: row['诉讼状态'] || '一审',
            causeOfAction: row['案由'] || '合同纠纷',
            disputeResolutionMethod: row['争议解决方式'] || '诉讼',
            trialInstitution: row['审理机构'] || '未知',
            currentStage: row['当前阶段'] || '立案',
            caseDomain: row['案件领域'] || '民商事',
            claimAmount: row['诉讼标的额'] ? parseFloat(row['诉讼标的额']) : 0,
            principalAmount: row['本金'] ? parseFloat(row['本金']) : 0,
            caseBalance: row['案件余额'] ? parseFloat(row['案件余额']) : 0,
            annualClosureTarget: row['年度清收目标'] ? parseFloat(row['年度清收目标']) : 0,
            annualLossPreventionTarget: row['年度止损目标'] ? parseFloat(row['年度止损目标']) : 0,
            annualRealizedAmount: row['年度已实现金额'] ? parseFloat(row['年度已实现金额']) : 0,
            totalRealizedAmount: row['累计已实现金额'] ? parseFloat(row['累计已实现金额']) : 0,
            badDebtProvision: row['坏账准备'] || '正常',
            riskExposure: row['风险敞口'] ? parseFloat(row['风险敞口']) : 0,
            projectTeamMembers: row['项目团队成员'] || '系统管理员',
            litigationCosts: row['诉讼费用'] ? parseFloat(row['诉讼费用']) : 0,
            lawFirmSituation: row['律所情况'] || '内部处理',
            agencyFees: row['代理费'] ? parseFloat(row['代理费']) : 0,
            otherExpensesSituation: row['其他费用情况'] || '无',
            otherExpenses: row['其他费用'] ? parseFloat(row['其他费用']) : 0,
            collateralSituation: row['抵押物情况'] || '无',
            basicCaseFacts: row['基本案情'] || '暂无详细案情',
            disposalMeasuresDescription: row['处置措施说明'] || '暂无处置措施',
            createdBy: { connect: { id: user.id } },
            updatedBy: { connect: { id: user.id } }
          }
        });
        success++;
        console.log(`第 ${i+1} 条记录导入成功`);
      } catch (err) {
        fail++;
        console.error(`第 ${i+1} 条记录导入失败:`, err.message);
        errors.push({
          rowIndex: i+1,
          error: err.message,
          data: row
        });
      }
    }
    
    // 保存错误信息到文件
    if (errors.length > 0) {
      const fs = require('fs');
      const errorFileName = `import_errors_${Date.now()}.json`;
      fs.writeFileSync(errorFileName, JSON.stringify(errors, null, 2));
      console.log(`错误信息已保存到: ${errorFileName}`);
    }
    
    console.log(`\n导入完成! 成功: ${success}, 失败: ${fail}`);
    
  } catch (error) {
    console.error('导入过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
    console.log('数据库连接已关闭');
  }
}

importAllCases();