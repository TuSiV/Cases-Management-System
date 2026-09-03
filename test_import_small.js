const XLSX = require('xlsx');
const fs = require('fs');

// 只测试Excel读取和数据解析
function testExcelImport() {
  try {
    console.log('=== 开始测试Excel导入 ===');
    
    const filePath = process.env.EXCEL_FILE_PATH || './data/cases_import.xlsx';
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error('❌ 文件不存在:', filePath);
      return;
    }
    
    console.log('✅ 文件存在，开始读取...');
    
    // 读取Excel文件
    const workbook = XLSX.readFile(filePath);
    console.log('✅ Excel文件读取成功');
    console.log(`  工作表数量: ${workbook.SheetNames.length}`);
    console.log(`  工作表名称: ${workbook.SheetNames.join(', ')}`);
    
    // 读取第一个工作表
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`✅ 转换为JSON成功，共 ${jsonData.length} 条记录`);
    
    // 显示前3条数据作为示例
    console.log('\n=== 前3条数据示例 ===');
    for (let i = 0; i < Math.min(3, jsonData.length); i++) {
      const row = jsonData[i];
      console.log(`\n第${i + 1}行数据:`);
      console.log(`  案件名称: ${row['案件名称'] || 'N/A'}`);
      console.log(`  原告名称: ${row['原告名称'] || 'N/A'}`);
      console.log(`  被告名称: ${row['被告名称'] || 'N/A'}`);
      console.log(`  隶属: ${row['隶属'] || 'N/A'}`);
    }
    
    // 验证必填字段
    console.log('\n=== 必填字段验证 ===');
    let validCount = 0;
    let invalidCount = 0;
    
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const isValid = row['案件名称'] && row['原告名称'] && row['被告名称'];
      
      if (isValid) {
        validCount++;
      } else {
        invalidCount++;
        console.log(`❌ 第${i + 2}行缺少必填字段:`);
        if (!row['案件名称']) console.log(`  - 缺少案件名称`);
        if (!row['原告名称']) console.log(`  - 缺少原告名称`);
        if (!row['被告名称']) console.log(`  - 缺少被告名称`);
      }
    }
    
    console.log(`\n验证结果:`);
    console.log(`✅ 有效记录: ${validCount}`);
    console.log(`❌ 无效记录: ${invalidCount}`);
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 执行测试
testExcelImport();