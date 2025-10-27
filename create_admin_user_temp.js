const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('正在创建管理员用户...');
    
    // 检查是否已存在管理员用户
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (existingAdmin) {
      console.log('管理员用户已存在，正在使用现有账号');
      return existingAdmin;
    }
    
    // 创建新的管理员用户
    const hashedPassword = await bcrypt.hash('admin123456', 10);
    
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin_temp',
        password: hashedPassword,
        name: '临时管理员',
        role: 'ADMIN',
        affiliation: '总部',
        email: 'admin_temp@example.com',
        phone: '13800138000'
      }
    });
    
    console.log('✅ 管理员用户创建成功:');
    console.log(`  ID: ${adminUser.id}`);
    console.log(`  用户名: ${adminUser.username}`);
    console.log(`  角色: ${adminUser.role}`);
    
    return adminUser;
    
  } catch (error) {
    console.error('❌ 创建管理员用户失败:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 执行创建管理员用户
if (require.main === module) {
  createAdminUser().catch(error => {
    console.error('创建管理员用户过程中发生错误');
    process.exit(1);
  });
}

module.exports = { createAdminUser };