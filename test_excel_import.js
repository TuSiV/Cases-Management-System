const XLSX = require('xlsx');
const fs = require('fs');

// 测试Excel文件路径
const excelFilePath = 'E:/OneDrive/桌面/cases_import.xlsx';

// 简单的文件检查
console.log('开始检查Excel文件...');
console.log('检查路径:', excelFilePath);

try {
  // 检查文件是否存在
  if (fs.existsSync(excelFilePath)) {
    console.log('✅ 文件存在');
    
    // 读取文件
    console.log('正在读取Excel文件...');
    const workbook = XLSX.readFile(excelFilePath);
    console.log('Excel文件读取成功');
    
    // 获取工作表信息
    const sheetNames = workbook.SheetNames;
    console.log('工作表数量:', sheetNames.length);
    console.log('工作表名称:', sheetNames);
    
    // 读取第一个工作表
    const firstSheet = workbook.Sheets[sheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet);
    
    console.log('\n数据概览:');
    console.log('总记录数:', data.length);
    
    if (data.length > 0) {
      console.log('\n前5条记录:');
      const sampleData = data.slice(0, 5);
      sampleData.forEach((row, index) => {
        console.log(`\n记录 ${index + 1}:`);
        // 只显示部分关键字段
        console.log('  案件名称:', row['案件名称'] || 'N/A');
        console.log('  原告名称:', row['原告名称'] || 'N/A');
        console.log('  被告名称:', row['被告名称'] || 'N/A');
        console.log('  立案日期:', row['立案日期'] || 'N/A');
      });
      
      console.log('\n数据字段列表:');
      const firstRowKeys = Object.keys(data[0]);
      console.log(firstRowKeys.join(', '));
    }
    
  } else {
    console.error('❌ 文件不存在:', excelFilePath);
  }
} catch (error) {
  console.error('❌ 发生错误:', error.message);
  console.error('错误详情:', error);
}