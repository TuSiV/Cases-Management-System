const { PrismaClient } = require('@prisma/client');

// 创建Prisma客户端实例
const prisma = new PrismaClient();

async function querySupervisorUser() {
  try {
    console.log('查询supervisor用户信息...');
    
    // 查询supervisor用户
    const supervisorUser = await prisma.user.findUnique({
      where: { username: 'supervisor' }
    });
    
    if (!supervisorUser) {
      console.log('未找到supervisor用户');
      await prisma.$disconnect();
      return;
    }
    
    console.log('supervisor用户信息:');
    console.log(`- ID: ${supervisorUser.id}`);
    console.log(`- 用户名: ${supervisorUser.username}`);
    console.log(`- 姓名: ${supervisorUser.name}`);
    console.log(`- 角色: ${supervisorUser.role}`);
    console.log(`- 隶属: ${supervisorUser.affiliation}`);
    console.log(`- 创建时间: ${supervisorUser.createdAt}`);
    console.log(`- 最后登录: ${supervisorUser.lastLogin || '从未登录'}`);
    
    // 查询所有用户角色分布
    const userRoles = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    });
    
    console.log('\n用户角色分布:');
    userRoles.forEach(role => {
      console.log(`${role.role}: ${role._count.id} 个用户`);
    });
    
    // 关闭数据库连接
    await prisma.$disconnect();
  } catch (error) {
    console.error('查询用户时出错:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// 执行函数
querySupervisorUser();