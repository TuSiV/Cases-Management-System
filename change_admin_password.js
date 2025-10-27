const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * 修改管理员admin的密码
 * @param {string} newPassword - 新密码
 */
async function changeAdminPassword(newPassword = 'admin123') {
  try {
    // 查找username为'admin'的用户
    const adminUser = await prisma.user.findUnique({
      where: {
        username: 'admin'
      }
    });
    
    if (adminUser) {
      // 加密新密码
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // 更新密码
      await prisma.user.update({
        where: {
          username: 'admin'
        },
        data: {
          password: hashedPassword
        }
      });
      
      console.log(`✅ 管理员密码修改成功！`);
      console.log(`用户名: admin`);
      console.log(`新密码: ${newPassword}`);
      console.log(`用户ID: ${adminUser.id}`);
      console.log(`用户角色: ${adminUser.role}`);
      console.log(`隶属: ${adminUser.affiliation}`);
      
    } else {
      console.log('❌ 未找到用户名"admin"的用户');
      console.log('尝试查找所有管理员角色的用户:');
      
      // 查找所有管理员角色的用户
      const adminUsers = await prisma.user.findMany({
        where: {
          role: 'admin'
        }
      });
      
      if (adminUsers.length > 0) {
        console.log(`找到 ${adminUsers.length} 个管理员角色的用户:`);
        adminUsers.forEach((user, index) => {
          console.log(`${index + 1}. 用户名: ${user.username}, ID: ${user.id}, 姓名: ${user.name}`);
        });
      } else {
        console.log('未找到任何管理员角色的用户');
      }
    }
    
  } catch (error) {
    console.error('修改管理员密码时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行密码修改
// 从命令行参数获取密码，没有参数则使用默认值
const commandLinePassword = process.argv[2]; // process.argv[0]是node，process.argv[1]是脚本名
changeAdminPassword(commandLinePassword);