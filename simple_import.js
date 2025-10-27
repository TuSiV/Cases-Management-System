const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 生成案件号
function generateCaseNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(2);
  return `${year}${Math.floor(1000 + Math.random() * 9000)}`;
}

async function main() {
  try {
    console.log('=== 开始案件数据导入流程 ===');
    
    // 1. 创建管理员用户（如果不存在）
    console.log('\n1. 检查/创建管理员用户...');
    let adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    
    if (!adminUser) {
      console.log('  - 未找到管理员用户，正在创建...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      adminUser = await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          name: '管理员',
          role: 'ADMIN',
          affiliation: '总部'
        }
      });
      console.log('  - ✅ 管理员用户创建成功');
    } else {
      console.log('  - ✅ 管理员用户已存在，使用现有账号');
    }
    
    // 2. 读取Excel文件
    console.log('\n2. 读取Excel文件...');
    const filePath = 'E:\\OneDrive\\桌面\\案件导入模板_20251015_172017.xlsx';
    
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`  - ✅ 成功读取文件，共 ${jsonData.length} 条记录`);
      
      // 3. 导入数据
      console.log('\n3. 开始导入数据...');
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNum = i + 2;
        
        try {
          // 基本验证
          if (!row['案件名称'] || !row['原告名称'] || !row['被告名称']) {
            throw new Error('缺少必填字段');
          }
          
          // 创建案件记录
          await prisma.case.create({
            data: {
              caseNumber: generateCaseNumber(),
              caseName: row['案件名称'].toString().trim(),
              plaintiffName: row['原告名称'].toString().trim(),
              defendantName: row['被告名称'].toString().trim(),
              affiliatedTo: row['隶属']?.toString().trim() || '',
              status: row['状态']?.toString().trim() || '',
              caseType: row['案件类型']?.toString().trim() || '',
              createdBy: adminUser.id,
              updatedBy: adminUser.id
            }
          });
          
          successCount++;
          if (successCount % 10 === 0) {
            console.log(`  - 已导入 ${successCount} 条记录`);
          }
          
        } catch (error) {
          failCount++;
          console.log(`  - ❌ 第${rowNum}行导入失败: ${error.message}`);
        }
      }
      
      // 4. 显示结果
      console.log('\n=== 导入完成 ===');
      console.log(`✅ 成功导入: ${successCount} 条记录`);
      console.log(`❌ 导入失败: ${failCount} 条记录`);
      
    } catch (error) {
      console.log(`  - ❌ 读取文件失败: ${error.message}`);
    }
    
  } catch (error) {
    console.error('\n❌ 导入过程中发生严重错误:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n数据库连接已关闭');
  }
}

// 执行导入
main();