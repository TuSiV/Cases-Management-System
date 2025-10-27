import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/auth'
import bcrypt from 'bcryptjs'
import { UserRole } from '@/types'

const prisma = new PrismaClient()

// 重置用户密码
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }
    
    // 只有管理员可以重置其他用户密码
    // 用户本人可以修改自己的密码，但需要提供旧密码
    const isAdmin = session.user.role?.toLowerCase() === UserRole.ADMIN
    const isSelf = session.user.id === params.id
    
    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }
    
    const data = await request.json()
    
    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: params.id }
    })
    
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }
    
    // 如果是用户本人修改密码，需要验证旧密码
    if (isSelf && !isAdmin) {
      if (!data.oldPassword) {
        return NextResponse.json({ error: '请提供旧密码' }, { status: 400 })
      }
      
      const isPasswordValid = await bcrypt.compare(data.oldPassword, user.password)
      
      if (!isPasswordValid) {
        return NextResponse.json({ error: '旧密码不正确' }, { status: 400 })
      }
    }
    
    // 加密新密码
    const hashedPassword = await bcrypt.hash(data.newPassword, 10)
    
    // 更新密码
    await prisma.user.update({
      where: { id: params.id },
      data: {
        password: hashedPassword
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('重置密码失败:', error)
    return NextResponse.json({ error: '重置密码失败' }, { status: 500 })
  }
}