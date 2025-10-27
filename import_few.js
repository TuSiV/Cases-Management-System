const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importFewRecords() {
  console.log('=== 导入前5条数据测试 ===');
  
  try {
    // 读取Excel
    const filePath = 'E:\\OneDrive\\桌面\\案件导入模板_20251015_172017.xlsx';
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    // 只取前5条
    const fewRecords = jsonData.slice(0, 5);
    console.log(`准备导入 ${fewRecords.length} 条记录`);
    
    // 获取第一个用户
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('创建临时用户...');
      const tempUser = await prisma.user.create({
        data: {
          username: 'temp_user',
          password: 'temp123',
          name: '临时用户',
          role: 'viewer',
          affiliation: '总部'
        }
      });
      user = tempUser;
    }
    
    // 导入数据
    let success = 0;
    let fail = 0;
    
    for (let i = 0; i < fewRecords.length; i++) {
      const row = fewRecords[i];
      try {
        await prisma.case.create({
          data: {
            caseNumber: `25TEST${i+1}`,
            caseName: row['案件名称'],
            plaintiffName: row['原告名称'],
            defendantName: row['被告名称'],
            affiliation: row['隶属'] || '总部',
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
        console.log(`✅ 成功: ${row['案件名称']}`);
      } catch (e) {
        fail++;
        console.log(`❌ 失败: ${row['案件名称']} - ${e.message}`);
      }
    }
    
    console.log(`\n结果: ${success}成功, ${fail}失败`);
    
  } catch (e) {
    console.error('错误:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

importFewRecords();