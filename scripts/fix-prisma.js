// 修复Prisma客户端权限问题的脚本
// 运行方式: node scripts/fix-prisma.js

const fs = require('fs');
const path = require('path');

function fixPrismaClientPermissions() {
  try {
    console.log('开始修复Prisma客户端权限问题...');
    
    const clientDir = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');
    
    // 检查目录是否存在
    if (fs.existsSync(clientDir)) {
      console.log(`找到了Prisma客户端目录: ${clientDir}`);
      
      // 尝试列出目录内容
      const files = fs.readdirSync(clientDir);
      console.log('目录内容:', files);
      
      // 尝试清理临时文件
      const tmpFiles = files.filter(file => file.includes('.tmp'));
      tmpFiles.forEach(file => {
        const filePath = path.join(clientDir, file);
        try {
          fs.unlinkSync(filePath);
          console.log(`已删除临时文件: ${file}`);
        } catch (err) {
          console.log(`删除临时文件失败 ${file}:`, err.message);
        }
      });
      
      console.log('Prisma客户端权限问题修复完成，请尝试重新运行: npx prisma generate');
    } else {
      console.log(`Prisma客户端目录不存在: ${clientDir}`);
      console.log('请先安装依赖: npm install');
    }
  } catch (error) {
    console.error('修复Prisma客户端权限问题失败:', error);
  }
}

fixPrismaClientPermissions();