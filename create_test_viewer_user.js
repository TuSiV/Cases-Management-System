const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// 创建Prisma客户端实例
const prisma = new PrismaClient();

async function createTestViewerUser() {
  try {
    console.log('正在创建测试VIEWER用户...');
    
    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username: 'testviewer' }
    });
    
    if (existingUser) {
      console.log('用户已存在，更新用户信息...');
      // 更新现有用户
      const updatedUser = await prisma.user.update({
        where: { username: 'testviewer' },
        data: {
          role: 'viewer',
          affiliation: 'REGION_2', // 设置为不同的隶属关系
          name: '测试查看员'
        }
      });
      console.log('用户更新成功:', updatedUser);
    } else {
      // 加密密码
      const password = await bcrypt.hash('changeme', 10);
      
      // 创建新用户
      const newUser = await prisma.user.create({
        data: {
          username: 'testviewer',
          password: password,
          name: '测试查看员',
          role: 'viewer',
          affiliation: 'REGION_2' // 设置为不同的隶属关系
        }
      });
      console.log('用户创建成功:', newUser);
    }
    
    // 关闭数据库连接
    await prisma.$disconnect();
  } catch (error) {
    console.error('创建用户失败:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// 执行函数
createTestViewerUser();