const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 模拟导入函数
async function testImportExcel(filePath) {
  try {
    console.log(`开始分析文件: ${filePath}`);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error('❌ 错误：文件不存在');
      return;
    }
    
    // 读取Excel文件
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    
    console.log(`文件包含 ${sheetNames.length} 个工作表: ${sheetNames.join(', ')}`);
    
    // 使用第一个工作表
    const firstSheet = workbook.Sheets[sheetNames[0]];
    
    // 转换为JSON
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
    
    console.log(`\n工作表数据概览:`);
    console.log(`- 总行数: ${jsonData.length}`);
    
    if (jsonData.length === 0) {
      console.log('❌ 警告：工作表中没有数据行');
      return;
    }
    
    // 显示列标题
    const headers = Object.keys(jsonData[0]);
    console.log(`- 列标题: ${headers.join(', ')}`);
    
    // 检查必填字段
    console.log('\n开始验证数据行:');
    
    const requiredFields = {
      caseName: ['案件名称'],
      plaintiffName: ['原告名称'],
      defendantName: ['被告名称']
    };
    
    const fieldMap = {};
    headers.forEach(header => {
      for (const [key, possibleNames] of Object.entries(requiredFields)) {
        if (possibleNames.includes(header)) {
          fieldMap[key] = header;
          break;
        }
      }
    });
    
    console.log(`字段映射关系:`);
    console.log(fieldMap);
    
    // 验证每一行
    const failedRows = [];
    const successRows = [];
    
    jsonData.forEach((row, index) => {
      const rowNum = index + 2; // Excel行号从1开始，第一行是标题
      const errors = [];
      
      // 验证必填字段
      if (!fieldMap.caseName || !row[fieldMap.caseName] || row[fieldMap.caseName].toString().trim() === '') {
        errors.push('案件名称不能为空');
      }
      
      if (!fieldMap.plaintiffName || !row[fieldMap.plaintiffName] || row[fieldMap.plaintiffName].toString().trim() === '') {
        errors.push('原告名称不能为空');
      }
      
      if (!fieldMap.defendantName || !row[fieldMap.defendantName] || row[fieldMap.defendantName].toString().trim() === '') {
        errors.push('被告名称不能为空');
      }
      
      // 检查数据长度限制
      if (fieldMap.caseName && row[fieldMap.caseName]) {
        const caseName = row[fieldMap.caseName].toString().trim();
        if (caseName.length > 200) {
          errors.push(`案件名称长度超过限制(当前${caseName.length}字符，最大200字符)`);
        }
      }
      
      if (errors.length > 0) {
        failedRows.push({
          row: rowNum,
          data: row,
          errors: errors
        });
      } else {
        successRows.push(row);
      }
    });
    
    // 输出结果
    console.log(`\n验证结果统计:`);
    console.log(`✅ 可导入行数: ${successRows.length}`);
    console.log(`❌ 不可导入行数: ${failedRows.length}`);
    
    if (failedRows.length > 0) {
      console.log(`\n错误详情:`);
      failedRows.slice(0, 5).forEach(failure => {
        console.log(`\n第${failure.row}行:`);
        console.log(`  错误原因: ${failure.errors.join('; ')}`);
        console.log(`  数据示例: ${JSON.stringify(failure.data, null, 2)}`);
      });
      
      if (failedRows.length > 5) {
        console.log(`\n... 还有 ${failedRows.length - 5} 行错误未显示`);
      }
    }
    
    console.log('\n导入模拟完成！');
    return {
      successCount: successRows.length,
      failCount: failedRows.length,
      failedRows: failedRows
    };
    
  } catch (error) {
    console.error('\n❌ 处理文件时发生错误:', error.message);
    return { error: error.message };
  }
}

// 执行测试
const excelFilePath = process.env.EXCEL_FILE_PATH || './data/cases_import.xlsx';
testImportExcel(excelFilePath);