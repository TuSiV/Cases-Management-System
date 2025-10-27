const { PrismaClient } = require('@prisma/client');

// 创建Prisma客户端实例
const prisma = new PrismaClient();

async function getFirstUserId() {
  try {
    console.log('获取第一个用户的ID...');
    
    // 查询第一个用户
    const firstUser = await prisma.user.findFirst();
    
    if (firstUser) {
      console.log(`第一个用户的ID: ${firstUser.id}`);
      console.log(`用户名: ${firstUser.username}`);
      console.log(`角色: ${firstUser.role}`);
      console.log(`隶属: ${firstUser.affiliation}`);
      return firstUser.id;
    } else {
      console.log('未找到任何用户');
    }
  } catch (error) {
    console.error('查询用户失败:', error);
  } finally {
    // 关闭Prisma客户端连接
    await prisma.$disconnect();
    console.log('已关闭数据库连接');
  }
}

// 执行查询
getFirstUserId().catch(console.error);