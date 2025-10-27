const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // 查找所有管理员角色的用户
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'admin'
      }
    });
    
    // 也查询所有用户，按角色分组显示
    const allUsers = await prisma.user.findMany({
      orderBy: {
        role: 'desc'
      }
    });
    
    console.log('管理员用户列表:');
    console.log(JSON.stringify(adminUsers, null, 2));
    
    console.log('\n所有用户列表（按角色排序）:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.name}, 角色: ${user.role}, 隶属: ${user.affiliation}`);
    });
    
  } catch (error) {
    console.error('查询用户失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();