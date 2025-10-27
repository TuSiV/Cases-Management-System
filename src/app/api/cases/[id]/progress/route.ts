import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/auth'
import { UserRole } from '@/types'
import { getPrismaClient } from '@/middleware/prismaMiddleware'

const prisma = getPrismaClient()

// 获取案件的所有月度进展记录
// 按时间由近到远排序
export const GET = async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions)
    
    // 验证用户是否已登录
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    // 从数据库获取当前案件的所有月度进展记录，按时间倒序排序
    const caseProgress = await prisma.monthlyProgress.findMany({
      where: {
        caseId: params.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        createdBy: {
          select: {
            name: true
          }
        }
      }
    })

    // 格式化返回数据，保持与原API兼容的结构
    const formattedProgress = caseProgress.map((record: { id: string; caseId: string; content: string; createdAt: Date; createdBy: { name: string } }) => ({
      id: record.id,
      caseId: record.caseId,
      content: record.content,
      createdAt: record.createdAt.toISOString(),
      createdBy: record.createdBy.name
    }))

    return NextResponse.json(formattedProgress)
  } catch (error) {
    console.error('获取月度进展记录失败:', error)
    return NextResponse.json({ error: '获取月度进展记录失败' }, { status: 500 })
  }
}

// 添加新的月度进展记录
export const POST = async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions)
    
    // 验证用户是否已登录
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    
    // 获取请求数据
    const data = await request.json()
    
    // 验证数据
    if (!data.content || typeof data.content !== 'string' || data.content.trim().length < 10) {
      return NextResponse.json({ error: '进展内容至少需要10个字符' }, { status: 400 })
    }

    // 验证内容长度上限
    if (data.content.length > 500) {
      return NextResponse.json({ error: '进展内容不能超过500个字符' }, { status: 400 })
    }

    // 在数据库中创建新的月度进展记录
    const newProgress = await prisma.monthlyProgress.create({
      data: {
        content: data.content,
        caseId: params.id,
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: {
            name: true
          }
        }
      }
    })

    // 格式化返回数据，保持与原API兼容的结构
    const formattedProgress = {
      id: newProgress.id,
      caseId: newProgress.caseId,
      content: newProgress.content,
      createdAt: newProgress.createdAt.toISOString(),
      createdBy: newProgress.createdBy.name
    }

    return NextResponse.json(formattedProgress, { status: 201 })
  } catch (error) {
    console.error('添加月度进展记录失败:', error)
    return NextResponse.json({ error: '添加月度进展记录失败' }, { status: 500 })
  }
}

// 删除月度进展记录（仅管理员可操作）
export const DELETE = async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions)
    
    // 验证用户是否已登录
    if (!session?.user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    
    // 验证用户是否为管理员
    if (session.user.role?.toLowerCase() !== UserRole.ADMIN.toLowerCase()) {
      return NextResponse.json({ error: '只有管理员可以删除月度进展记录' }, { status: 403 })
    }

    // 获取要删除的进展记录ID
    const progressId = request.nextUrl.searchParams.get('progressId')
    if (!progressId) {
      return NextResponse.json({ error: '缺少进展记录ID' }, { status: 400 })
    }

    // 检查记录是否存在且属于指定案件
    const record = await prisma.monthlyProgress.findFirst({
      where: {
        id: progressId,
        caseId: params.id
      }
    })

    if (!record) {
      return NextResponse.json({ error: '找不到该进展记录' }, { status: 404 })
    }

    // 从数据库中删除记录
    await prisma.monthlyProgress.delete({
      where: {
        id: progressId
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除月度进展记录失败:', error)
    return NextResponse.json({ error: '删除月度进展记录失败' }, { status: 500 })
  }
}