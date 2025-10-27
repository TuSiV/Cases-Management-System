import { createApiRoute } from '@/middleware/errorHandler';
import { getPrismaClient } from '@/middleware/prismaMiddleware'
import bcrypt from 'bcryptjs'
import { UserRole, User } from '@/types'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/auth'
import { NextRequest } from 'next/server'

const prisma = getPrismaClient()

// 验证用户访问权限
async function validateUserAccess(session: any, userId: string): Promise<boolean> {
  // 管理员可以访问所有用户
  if (session.user.role?.toLowerCase() === UserRole.ADMIN) {
    return true;
  }
  
  // 用户只能访问自己
  return session.user.id === userId;
}

// 导出API路由处理函数
export const GET = createApiRoute(
  async (request: NextRequest, context: { params: { id: string } }) => {
    // 获取会话
    const session = await getServerSession(authOptions);
    
    // 验证用户是否已登录
    if (!session?.user) {
      return { error: '请先登录' };
    }
    
    const { id } = context.params;
    
    // 验证访问权限
    const hasAccess = await validateUserAccess(session, id);
    if (!hasAccess) {
      return { error: '无访问权限' };
    }
    
    // 获取用户详情
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        affiliation: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    }) as Partial<User> | null
    
    if (!user) {
      throw new Error('用户不存在')
    }
    
    return user
  }
)

export const PUT = createApiRoute(
  async (request: NextRequest, context: { params: { id: string } }) => {
    // 获取会话
    const session = await getServerSession(authOptions);
    
    // 验证用户是否已登录
    if (!session?.user) {
      return { error: '请先登录' };
    }
    
    const { id } = context.params;
    
    // 验证访问权限
    const hasAccess = await validateUserAccess(session, id);
    if (!hasAccess) {
      return { error: '无访问权限' };
    }
    
    const data = await request.json() as Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
    
    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
        where: { id }
      }) as User | null
    
    if (!existingUser) {
      throw new Error('用户不存在')
    }
    
    // 如果要更新用户名，检查是否已存在
    if (data.username && data.username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username: data.username }
      })
      
      if (usernameExists) {
        throw new Error('用户名已存在')
      }
    }
    
    // 非管理员不能修改角色和隶属 - 使用不区分大小写的比较
    if (session.user.role?.toLowerCase() !== UserRole.ADMIN) {
      delete data.role
      delete data.affiliation
    }

    // 如果包含密码，则加密
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10)
    }
    
    // 更新用户
    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        affiliation: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    }) as Partial<User>
    
    return updatedUser
  }
)

export const DELETE = createApiRoute(
  async (request: NextRequest, context: { params: { id: string } }) => {
    // 获取会话
    const session = await getServerSession(authOptions);
    
    // 验证用户是否已登录
    if (!session?.user) {
      return { error: '请先登录' };
    }
    
    // 验证是否为管理员
    if (session.user.role?.toLowerCase() !== UserRole.ADMIN) {
      return { error: '需要管理员权限' };
    }
    
    const { id } = context.params;
    
    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!existingUser) {
      throw new Error('用户不存在')
    }
    
    // 不能删除自己
    if (session.user.id === id) {
      throw new Error('不能删除自己的账户')
    }
    
    // 删除用户
    await prisma.user.delete({
      where: { id }
    })
    
    return { success: true }
  }
)