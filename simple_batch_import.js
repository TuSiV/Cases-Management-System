const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

// 初始化Prisma客户端
const prisma = new PrismaClient();

// 隶属代码映射 - 从types文件同步
const AffiliationCode = {
  '总部': 'WZ',
  '东北': 'DB',
  '中南': 'ZN',
  '云贵': 'YG',
  '华北': 'HB',
  '实业': 'SY',
  '华南': 'HN',
  '玖隆': 'JL',
  '华东': 'HD',
  '西南': 'XN',
  '西北': 'XB'
};

// 案件类型代码映射 - 从types文件同步
const CaseTypeCode = {
  '民事': 'M',
  '刑事': 'X'
};

// 年度结案指标映射
const AnnualClosureTargetMap = {
  '执行结案': 'EXECUTION_CLOSURE',
  '审理结案': 'TRIAL_CLOSURE',
  '正常推进': 'NORMAL_PROGRESS'
};

// Excel日期转换函数 - 改进版
function excelDateToJSDate(excelDate) {
  // 检查是否为空或无效值
  if (!excelDate) return null;
  
  // 如果已经是字符串日期格式，直接转换
  if (typeof excelDate === 'string') {
    const date = new Date(excelDate);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // 如果是Excel数字格式日期
  if (typeof excelDate === 'number') {
    // 有效的Excel日期范围通常在1到2958465之间（1900-01-01到9999-12-31）
    if (excelDate >= 1 && excelDate <= 2958465) {
      return new Date(Date.UTC(1899, 11, 30, 0, 0, 0) + excelDate * 24 * 60 * 60 * 1000);
    }
  }
  
  return null;
}

// 生成案件编号 - 使用随机4位数字作为后四位
async function generateCaseNumber(affiliation, filingDate, caseType) {
  try {
    // 获取隶属代码
    const affiliationCode = AffiliationCode[affiliation] || 'QT';
    
    // 获取年份
    const year = filingDate.getFullYear().toString();
    
    // 获取案件类型代码
    const typeCode = CaseTypeCode[caseType] || 'Q';
    
    // 生成前7位
    const prefix = `${affiliationCode}${year}${typeCode}`;
    
    // 最多尝试10次生成唯一的随机编号
    let maxAttempts = 10;
    let attempts = 0;
    let caseNumber = null;
    
    while (attempts < maxAttempts && !caseNumber) {
      // 生成4位随机数字作为序列号
      const randomSequence = Math.floor(1000 + Math.random() * 9000).toString(); // 生成1000-9999之间的随机数
      
      // 构建完整编号
      const candidateNumber = `${prefix}${randomSequence}`;
      
      // 检查数据库中是否已存在该编号
      const existingCase = await prisma.case.findUnique({
        where: {
          caseNumber: candidateNumber
        }
      });
      
      // 如果不存在，则使用此编号
      if (!existingCase) {
        caseNumber = candidateNumber;
      }
      
      attempts++;
    }
    
    // 如果尝试多次后仍未生成唯一编号，返回备用方案
    if (!caseNumber) {
      console.warn(`生成随机编号失败，使用备用方案`);
      return `BK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    return caseNumber;
  } catch (error) {
    console.error('生成案件号失败:', error);
    // 如果生成失败，使用时间戳加随机数作为备用方案
    return `BK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
}

async function main() {
  console.log('开始导入Excel数据...');
  
  try {
    // 读取Excel文件
    const excelPath = 'E:/OneDrive/桌面/cases_import.xlsx';
    console.log(`文件路径: ${excelPath}`);
    
    if (!fs.existsSync(excelPath)) {
      throw new Error('文件不存在');
    }
    
    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`读取到 ${data.length} 条记录`);
    
    // 获取第一个用户ID
    const user = await prisma.user.findFirst();
    if (!user) {
      throw new Error('数据库中没有用户记录');
    }
    
    console.log(`使用用户ID: ${user.id}`);
    
    // 准备要导入的数据 - 全部记录
    console.log(`开始处理 ${data.length} 条记录...`);
    
    // 先创建基本数据结构，后续会为无编号的记录生成编号
    const casesData = data.map((row) => ({
      excelCaseNumber: row['案件编号'], // 暂存Excel中的案件编号
      affiliation: row['隶属'] || '默认',
      status: row['状态'] || '新建',
      caseName: row['案件名称'] || '',
      plaintiffName: row['原告名称'] || '',
      defendantName: row['被告名称'] || '',
      opponentType: row['对方性质'] || '未知',
      caseType: row['案件类型'] || '民事',
      filingDate: excelDateToJSDate(row['立案日期']) || new Date(),
      // 添加审结日期和执结日期处理
      trialConclusionDate: excelDateToJSDate(row['审结日期']),
      executionConclusionDate: excelDateToJSDate(row['执结日期']),
      litigationStatus: row['诉讼地位'] || '未知',
      causeOfAction: row['案由'] || '',
      disputeResolutionMethod: row['纠纷解决方式'] || '诉讼',
      trialInstitution: row['审理机构'] || '',
      currentStage: row['所处阶段'] || '初始',
      caseDomain: row['案件所属领域'] || '',
      claimAmount: parseFloat(row['案件标的额']) || 0,
      principalAmount: parseFloat(row['标的额中本金金额']) || 0,
      caseBalance: parseFloat(row['案件余额']) || 0,
      annualClosureTarget: AnnualClosureTargetMap[row['年度结案指标']] || 'NORMAL_PROGRESS',
      annualLossPreventionTarget: parseFloat(row['年度避免或挽回损失指标']) || 0,
      annualRealizedAmount: parseFloat(row['年度已实现金额']) || 0,
      totalRealizedAmount: parseFloat(row['已实现金额']) || 0,
      badDebtProvision: String(row['计提坏账情况']) || '',
      riskExposure: parseFloat(row['风险敞口']) || 0,
      projectTeamMembers: row['项目组成员'] || '',
      litigationCosts: parseFloat(row['诉讼费用']) || 0,
      lawFirmSituation: String(row['律所情况'] || ''),
      agencyFees: parseFloat(row['代理费']) || 0,
      otherExpensesSituation: String(row['其他费用情况'] || ''),
      otherExpenses: parseFloat(row['其他费用']) || 0,
      collateralSituation: String(row['抵押担保情况'] || ''),
      basicCaseFacts: String(row['基本案情'] || ''),
      disposalMeasuresDescription: String(row['处置措施简要描述'] || ''),
      createdById: user.id,
      updatedById: user.id
    }));
    
    // 为没有案件编号的记录生成新编号
    console.log('为无编号记录生成案件编号...');
    const casesToImport = [];
    const generatedCaseNumbers = new Set(); // 用于跟踪已生成的案件编号
    
    // 为Excel中提供的编号也添加到跟踪集合中
    const excelCaseNumbers = new Set(casesData.map(c => c.excelCaseNumber).filter(Boolean));
    
    for (const caseData of casesData) {
      let caseNumber;
      
      if (caseData.excelCaseNumber) {
        // 使用Excel中提供的案件编号
        caseNumber = caseData.excelCaseNumber;
      } else {
        // 生成新的案件编号，确保唯一性
        let attempts = 0;
        const maxAttempts = 15; // 增加尝试次数
        
        while (attempts < maxAttempts) {
          // 在生成编号时加入当前时间戳的一部分，增加唯一性
          const timestampFragment = Date.now().toString().slice(-3);
          
          caseNumber = await generateCaseNumber(
            caseData.affiliation,
            caseData.filingDate,
            caseData.caseType
          );
          
          // 检查是否已在当前批次中生成过此编号或Excel中已存在
          if (!generatedCaseNumbers.has(caseNumber) && !excelCaseNumbers.has(caseNumber)) {
            generatedCaseNumbers.add(caseNumber);
            break;
          }
          
          attempts++;
          // 尝试不同的备用方案
          if (attempts >= 5 && attempts < 10) {
            // 方案1：添加时间戳片段
            caseNumber = `${caseNumber}_${timestampFragment}`;
          } else if (attempts >= 10 && attempts < maxAttempts) {
            // 方案2：添加时间戳和随机数
            caseNumber = `${caseNumber}_${timestampFragment}_${Math.floor(Math.random() * 100)}`;
          } else if (attempts >= maxAttempts) {
            // 最终方案：完全随机的编号
            caseNumber = `BK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            console.warn(`为案件生成完全随机编号: ${caseNumber} (尝试${attempts}次)`);
          }
        }
      }
      
      // 创建最终的导入数据对象
      const caseToImport = {
        ...caseData,
        caseNumber
      };
      // 删除临时字段
      delete caseToImport.excelCaseNumber;
      
      casesToImport.push(caseToImport);
    }
    
    console.log('案件编号处理完成');
    console.log(`成功生成 ${generatedCaseNumbers.size} 个新案件编号`);
    
    // 分批处理记录，每批50条
    const batchSize = 50;
    let totalImported = 0;
    
    // 检查重复的案件编号并准备更新数据
    console.log('检查案件编号是否重复...');
    const caseNumbers = casesToImport.map(c => c.caseNumber);
    const existingCases = await prisma.case.findMany({
      where: {
        caseNumber: {
          in: caseNumbers
        }
      },
      select: {
        id: true,
        caseNumber: true
      }
    });
    
    const existingCaseMap = new Map(existingCases.map(c => [c.caseNumber, c.id]));
    const newCases = casesToImport.filter(c => !existingCaseMap.has(c.caseNumber));
    const updateCases = casesToImport.filter(c => existingCaseMap.has(c.caseNumber));
    
    console.log(`发现 ${existingCaseMap.size} 个已存在的案件编号`);
    console.log(`总共有 ${newCases.length} 条新记录需要导入`);
    console.log(`总共有 ${updateCases.length} 条记录需要更新`);
    
    let importedCount = 0;
    let updatedCount = 0;
    
    // 分批更新已有记录
    if (updateCases.length > 0) {
      console.log('开始更新已有记录...');
      
      for (const caseToUpdate of updateCases) {
        try {
          const caseId = existingCaseMap.get(caseToUpdate.caseNumber);
          // 删除caseNumber和id，避免更新这两个字段
          const { caseNumber, ...updateData } = caseToUpdate;
          
          await prisma.case.update({
            where: { id: caseId },
            data: updateData
          });
          updatedCount++;
          
          // 每更新10条记录显示一次进度
          if (updatedCount % 10 === 0) {
            console.log(`已更新 ${updatedCount}/${updateCases.length} 条记录`);
          }
        } catch (error) {
          console.error(`更新案件编号 ${caseToUpdate.caseNumber} 失败:`, error);
        }
      }
    }
    
    // 分批导入新记录（如果有）
    if (newCases.length > 0) {
      console.log('开始导入新记录...');
      
      for (let i = 0; i < newCases.length; i += batchSize) {
        const batch = newCases.slice(i, i + batchSize);
        console.log(`正在导入第 ${Math.floor(i / batchSize) + 1} 批，共 ${batch.length} 条记录...`);
        
        const result = await prisma.case.createMany({
          data: batch
        });
        
        importedCount += result.count;
        console.log(`✅ 第 ${Math.floor(i / batchSize) + 1} 批导入成功: ${result.count} 条记录`);
        
        // 每批之间短暂休息，避免数据库压力
        if (i + batchSize < newCases.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.log(`✅ 数据处理完成: 更新了 ${updatedCount} 条记录，导入了 ${importedCount} 条新记录`);
    
  } catch (error) {
    console.error('❌ 导入失败:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('Prisma客户端已关闭');
  }
}

main();