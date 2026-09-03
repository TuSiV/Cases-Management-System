const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    // 查询所有用户以了解数据情况
    const allUsers = await prisma.user.findMany();
    
    console.log(`数据库中共有 ${allUsers.length} 个用户：`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.name}, 角色: ${user.role}, 隶属: ${user.affiliation}`);
    });
    
    // 如果有用户，选择第一个用户作为管理员用户进行更新
    if (allUsers.length > 0) {
      const adminPassword = await bcrypt.hash('changeme', 10);
      
      // 将第一个用户更新为管理员用户（注意：角色使用小写的'admin'与UserRole枚举保持一致）
      await prisma.user.update({
        where: {
          id: allUsers[0].id
        },
        data: {
          password: adminPassword,
          username: 'admin',
          name: '系统管理员',
          role: 'admin',
          affiliation: 'REGION_1'
        }
      });
      
      console.log(`\n已将第一个用户设置为管理员账户：`);
      console.log(`用户名: admin`);
      console.log(`密码: changeme`);
      console.log(`姓名: 系统管理员`);
      console.log(`角色: admin`);
      console.log(`隶属: REGION_1`);
    } else {
      console.log('数据库中没有用户，请先初始化数据');
    }
    
  } catch (error) {
    console.error('更新管理员密码时出错：', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();