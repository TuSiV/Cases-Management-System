import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { UserRole } from '../src/types'

const prisma = new PrismaClient()

async function main() {
  // 创建管理员用户
  const adminPassword = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'changeme', 10)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      name: '系统管理员',
      role: UserRole.ADMIN,
      affiliation: 'REGION_1'
    }
  })

  // 为每个隶属创建一个普通用户
  const userPassword = await bcrypt.hash(process.env.USER_DEFAULT_PASSWORD || 'changeme', 10)
  
  const affiliations = ['REGION_1', 'REGION_2', 'REGION_3', 'REGION_4', 'REGION_5', 'REGION_6', 'REGION_7', 'REGION_8', 'REGION_9', 'REGION_10', 'REGION_11']
  
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