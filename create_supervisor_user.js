const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// 创建Prisma客户端实例
const prisma = new PrismaClient();

async function createSupervisorUser() {
  try {
    console.log('正在创建supervisor用户...');
    
    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username: 'supervisor' }
    });
    
    if (existingUser) {
      console.log('用户已存在，更新用户信息...');
      // 更新现有用户
      const updatedUser = await prisma.user.update({
        where: { username: 'supervisor' },
        data: {
          role: 'viewer',
          affiliation: '总部',
          name: '查看员'
        }
      });
      console.log('用户更新成功:', updatedUser);
    } else {
      // 加密密码
      const password = await bcrypt.hash('supervisor123', 10);
      
      // 创建新用户
      const newUser = await prisma.user.create({
        data: {
          username: 'supervisor',
          password: password,
          name: '查看员',
          role: 'viewer',
          affiliation: '总部'
        }
      });
      console.log('用户创建成功:', newUser);
    }
    
  } catch (error) {
    console.error('创建用户失败:', error);
  } finally {
    // 关闭Prisma客户端连接
    await prisma.$disconnect();
    console.log('已关闭数据库连接');
  }
}

// 执行创建用户函数
createSupervisorUser().catch(console.error);