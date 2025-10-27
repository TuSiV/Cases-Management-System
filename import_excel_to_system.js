const XLSX = require('xlsx');
const fs = require('fs');
const axios = require('axios');

// 实际导入数据到系统
async function importExcelToSystem(filePath) {
  try {
    console.log(`开始导入文件到系统: ${filePath}`);
    
    // 读取Excel文件
    const workbook = XLSX.readFile(filePath);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
    
    console.log(`共 ${jsonData.length} 条记录需要导入`);
    
    // 构建导入数据
    const caseData = jsonData.map((row, index) => ({
      caseName: row['案件名称'] || '',
      plaintiffName: row['原告名称'] || '',
      defendantName: row['被告名称'] || '',
      // 添加其他必要字段
      affiliatedTo: row['隶属'] || '',
      status: row['状态'] || '',
      caseType: row['案件类型'] || '',
      filingDate: row['立案日期'] ? new Date(row['立案日期']).toISOString() : null,
      litigationStatus: row['诉讼地位'] || '',
      disputeResolutionMethod: row['纠纷解决方式'] || '',
      trialInstitution: row['审理机构'] || '',
      currentStage: row['所处阶段'] || '',
      caseField: row['案件所属领域'] || '',
      caseReason: row['案由'] || '',
      conclusionDate: row['审结日期'] ? new Date(row['审结日期']).toISOString() : null,
      opponentNature: row['对方性质'] || '',
      caseAmount: parseFloat(row['案件标的额']) || 0,
      principalAmount: parseFloat(row['标的额中本金金额']) || 0,
      caseBalance: parseFloat(row['案件余额']) || 0,
      annualClosingTarget: parseFloat(row['年度结案指标']) || 0,
      annualLossAvoidanceTarget: parseFloat(row['年度避免或挽回损失指标']) || 0,
      annualRealizedAmount: parseFloat(row['年度已实现金额']) || 0,
      realizedAmount: parseFloat(row['已实现金额']) || 0,
      badDebtProvision: row['计提坏账情况'] || '',
      riskExposure: parseFloat(row['风险敞口']) || 0,
      projectTeamMembers: row['项目组成员'] || '',
      litigationCosts: parseFloat(row['诉讼费用']) || 0,
      lawFirmSituation: row['律所情况'] || '',
      otherCosts: row['其他费用情况'] || '',
      mortgageSecurity: row['抵押担保情况'] || '',
      basicCaseDetails: row['基本案情'] || '',
      disposalMeasures: row['处置措施简要描述'] || ''
    }));
    
    // 分批导入（每批100条）
    const batchSize = 100;
    let totalSuccess = 0;
    let totalFailures = [];
    
    console.log('\n开始分批导入...');
    
    for (let i = 0; i < caseData.length; i += batchSize) {
      const batch = caseData.slice(i, i + batchSize);
      console.log(`导入批次 ${Math.floor(i / batchSize) + 1}: ${batch.length} 条记录`);
      
      try {
        // 调用批量导入API
        const response = await axios.post('http://localhost:3000/api/cases/batch', 
          { cases: batch },
          { 
            headers: {
              'Content-Type': 'application/json',
              'Cookie': 'session=test-session' // 假设需要会话认证
            }
          }
        );
        
        if (response.data && response.data.success) {
          console.log(`✅ 批次 ${Math.floor(i / batchSize) + 1} 导入成功: ${response.data.successCount} 条`);
          totalSuccess += response.data.successCount;
          
          if (response.data.failures && response.data.failures.length > 0) {
            totalFailures = [...totalFailures, ...response.data.failures];
            console.log(`❌ 批次 ${Math.floor(i / batchSize) + 1} 失败: ${response.data.failures.length} 条`);
          }
        }
        
      } catch (error) {
        console.error(`❌ 批次 ${Math.floor(i / batchSize) + 1} 导入失败:`, error.message);
        
        // 记录详细错误
        if (error.response) {
          console.log('  响应状态:', error.response.status);
          console.log('  响应数据:', error.response.data);
        }
        
        // 假设整批失败
        batch.forEach((item, idx) => {
          totalFailures.push({
            rowIndex: i + idx + 2,
            error: error.message,
            data: item
          });
        });
      }
    }
    
    console.log('\n🎉 导入完成！');
    console.log(`✅ 成功导入: ${totalSuccess} 条`);
    console.log(`❌ 导入失败: ${totalFailures.length} 条`);
    
    if (totalFailures.length > 0) {
      console.log('\n前5条失败记录详情:');
      totalFailures.slice(0, 5).forEach(failure => {
        console.log(`\n第 ${failure.rowIndex} 行:`);
        console.log(`  错误原因: ${failure.error}`);
        console.log(`  案件名称: ${failure.data.caseName}`);
      });
      
      // 保存错误记录到文件
      const errorLogPath = `import_errors_${Date.now()}.json`;
      fs.writeFileSync(errorLogPath, JSON.stringify(totalFailures, null, 2));
      console.log(`\n所有错误记录已保存到: ${errorLogPath}`);
    }
    
    return {
      totalRecords: jsonData.length,
      successCount: totalSuccess,
      failureCount: totalFailures.length
    };
    
  } catch (error) {
    console.error('\n❌ 导入过程中发生严重错误:', error.message);
    return { error: error.message };
  }
}

// 执行导入
const excelFilePath = 'E:\\OneDrive\\桌面\\案件导入模板_20251015_172017.xlsx';
importExcelToSystem(excelFilePath);