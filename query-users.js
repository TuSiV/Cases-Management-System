const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('用户列表:');
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('查询用户失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();