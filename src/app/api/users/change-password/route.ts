import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/app/auth';
import { createApiRoute } from '@/utils';
import { getPrismaClient } from '@/middleware/prismaMiddleware';
import { changePasswordSchema } from '@/utils/validation';

/**
 * 处理修改密码请求
 * @param request NextRequest对象
 * @returns NextResponse响应
 */
async function handleChangePassword(request: NextRequest) {
  // 获取当前用户会话
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  // 解析请求体
  const body = await request.json();

  try {
    // 验证请求数据
    changePasswordSchema.parse(body);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: '验证失败', details: (error as any).errors },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = body;
  const prisma = getPrismaClient();

  // 获取用户信息
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, password: true },
  });

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  // 验证当前密码
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    return NextResponse.json({ error: '当前密码不正确' }, { status: 400 });
  }

  // 哈希新密码
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 更新密码
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return NextResponse.json({ message: '密码修改成功' });
}

// 创建API路由
export const POST = createApiRoute({
  POST: handleChangePassword,
});