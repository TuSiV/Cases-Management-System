import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/auth';
import { createApiRoute } from '@/utils';
import { getPrismaClient } from '@/middleware/prismaMiddleware';
import { UserRole } from '@/types';

/**
 * 获取当前用户个人信息
 * @param request NextRequest对象
 * @returns NextResponse响应
 */
async function handleGetProfile(_request: NextRequest) {
  // 获取当前用户会话
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const prisma = getPrismaClient();

  // 获取用户信息
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      affiliation: true,
      email: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      lastLogin: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  return NextResponse.json(user);
}

/**
 * 更新当前用户个人信息
 * @param request NextRequest对象
 * @returns NextResponse响应
 */
async function handleUpdateProfile(request: NextRequest) {
  // 获取当前用户会话
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  // 解析请求体
  const body = await request.json();
  const prisma = getPrismaClient();

  // 获取用户信息
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  // 普通用户不能修改角色和隶属
  const updateData: Partial<{
    name: string;
    email: string;
    phone: string;
    role?: string;
    affiliation?: string;
  }> = {
    name: body.name,
    email: body.email,
    phone: body.phone,
  };

  // 只有管理员可以修改角色和隶属
  if (user.role === UserRole.ADMIN) {
    if (body.role) updateData.role = body.role;
    if (body.affiliation) updateData.affiliation = body.affiliation;
  }

  // 更新用户信息
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      affiliation: true,
      email: true,
      phone: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updatedUser);
}

// 创建API路由
export const GET = createApiRoute({
  GET: handleGetProfile,
});

export const PUT = createApiRoute({
  PUT: handleUpdateProfile,
});