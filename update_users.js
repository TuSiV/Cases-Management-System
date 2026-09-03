const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 中文转拼音的映射表
const pinyinMap = {
  'REGION_1': 'zongbu',
  'REGION_2': 'dongbei',
  'REGION_3': 'zhongnan',
  'REGION_4': 'yungui',
  'REGION_5': 'huabei',
  'REGION_6': 'shiye',
  'REGION_7': 'huanan',
  'REGION_8': 'jiulong',
  'REGION_9': 'huadong',
  'REGION_10': 'xinan',
  'REGION_11': 'xibei'
};

async function updateUsers() {
  try {
    // 获取所有用户
    const users = await prisma.user.findMany();

    // 准备更新密码
    const defaultPassword = await bcrypt.hash('changeme', 10);
    let updatedCount = 0;

    // 更新每个用户
    for (const user of users) {
      const affiliation = user.affiliation;
      const pinyin = pinyinMap[affiliation] || affiliation;
      
      // 检查用户名是否已经是拼音格式或是否为admin用户
      const isAdmin = user.username === 'admin';
      const isAlreadyUpdated = Object.values(pinyinMap).includes(user.username);
      
      if (isAdmin) {
        // 为管理员用户保留其特殊性，只更新密码
        await prisma.user.update({
          where: {
            id: user.id
          },
          data: {
            password: defaultPassword
          }
        });
        console.log(`已更新管理员用户密码：ID=${user.id}，用户名=${user.username}`);
        updatedCount++;
      } else if (!isAlreadyUpdated) {
        try {
          // 只更新非管理员且用户名还不是拼音格式的用户
          await prisma.user.update({
            where: {
              id: user.id
            },
            data: {
              username: pinyin,
              name: `${affiliation}公司`,
              password: defaultPassword
            }
          });
          
          console.log(`已更新用户：ID=${user.id}，原用户名=${user.username}，新用户名=${pinyin}，新姓名=${affiliation}公司`);
          updatedCount++;
        } catch (error) {
          if (error.code === 'P2002') {
            // 处理唯一约束冲突，跳过该用户
            console.log(`跳过用户（用户名冲突）：ID=${user.id}，用户名=${user.username}`);
          } else {
            throw error;
          }
        }
      } else {
        console.log(`跳过用户（已更新）：ID=${user.id}，用户名=${user.username}`);
      }
    }

    console.log(`\n总共更新了 ${users.length} 个用户。`);
    console.log('用户名已修改为隶属的全拼');
    console.log('姓名已修改为"隶属+公司"');
    console.log('密码已统一重置');
    
  } catch (error) {
    console.error('更新用户数据时出错：', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUsers();