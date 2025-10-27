import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { UserRole } from '../src/types'

const prisma = new PrismaClient()

async function main() {
  // 创建管理员用户
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      name: '系统管理员',
      role: UserRole.ADMIN,
      affiliation: '总部'
    }
  })

  // 为每个隶属创建一个普通用户
  const userPassword = await bcrypt.hash('user123', 10)
  
  const affiliations = ['总部', '东北', '中南', '云贵', '华北', '实业', '华南', '玖隆', '华东', '西南', '西北']
  
  for (const affiliation of affiliations) {
    const username = `user_${affiliation}`
    await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        password: userPassword,
        name: `${affiliation}用户`,
        role: UserRole.USER,
        affiliation
      }
    })
  }

  console.log('用户数据初始化完成')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })