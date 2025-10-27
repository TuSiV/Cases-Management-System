import bcrypt from 'bcryptjs'
import { UserRole } from '@/types'
import { createApiRoute } from '@/middleware/errorHandler'
import { getPrismaClient } from '@/middleware/prismaMiddleware'
import { NextRequest } from 'next/server'
import { authOptions } from '@/app/auth'
import { getServerSession } from 'next-auth/next'

const prisma = getPrismaClient()

// 获取用户列表
export const GET = createApiRoute(
  async (request: NextRequest) => {
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
    
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const username = searchParams.get('username')
    const name = searchParams.get('name')
    const affiliation = searchParams.get('affiliation')
    
    // 构建查询条件
    const where: Partial<{
      username?: {
        contains: string;
      };
      name?: {
        contains: string;
      };
      affiliation?: string;
    }> = {}
    
    if (username) {
      where.username = {
        contains: username
      }
    }
    
    if (name) {
      where.name = {
        contains: name
      }
    }
    
    if (affiliation) {
      where.affiliation = affiliation
    }
    
    // 查询总数
    const total = await prisma.user.count({ where })
    
    // 查询分页数据
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        affiliation: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return {
      users,
      total,
      page,
      pageSize
    }
  }
)

// 创建用户
export const POST = createApiRoute(
  async (request: NextRequest) => {
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
    
    const body = await request.json()
    const { username, password, name, role, affiliation } = body
    
    // 验证必填字段
    if (!username || !password || !name || !role || !affiliation) {
      throw new Error('缺少必填字段')
    }
    
    // 检查用户名是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })
    
    if (existingUser) {
      throw new Error('用户名已存在')
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role,
        affiliation,
        email: body.email || null,
        phone: body.phone || null
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        affiliation: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    return user
  }
)

// 更新用户
export const PUT = createApiRoute(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
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
    
    const id = params.id
    const body = await request.json()
    const { name, role, affiliation, email, phone } = body
    
    // 验证必填字段
    if (!name || !role || !affiliation) {
      throw new Error('缺少必填字段')
    }
    
    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!existingUser) {
      throw new Error('用户不存在')
    }
    
    // 更新用户
    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        role,
        affiliation,
        email: email || null,
        phone: phone || null
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        affiliation: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    return user
  }
)