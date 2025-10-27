import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/auth';
import { createApiError } from './errorHandler';
import { UserRole, Affiliation } from '@/types';
import { Session } from 'next-auth';

// 扩展Session接口以包含我们自定义的用户属性
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      name: string;
      role: UserRole;
      affiliation: Affiliation;
    };
  }
}

/**
 * 检查用户是否已认证
 * @returns 已认证的会话或抛出错误
 */
export async function requireAuth(): Promise<Session> {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    throw createApiError('未授权访问', 401, 'UNAUTHORIZED');
  }
  
  return session;
}

/**
 * 检查用户是否为管理员
 * @returns 已认证的管理员会话或抛出错误
 */
export async function requireAdmin() {
  const session = await requireAuth();
  
  console.log('requireAdmin - user role:', session.user.role);
  if (session.user.role?.toLowerCase() !== UserRole.ADMIN) {
    throw createApiError('权限不足', 403, 'FORBIDDEN');
  }
  
  return session;
}

/**
 * 检查用户是否有权限访问特定隶属的资源
 * @param affiliation 资源隶属
 * @returns 已认证且有权限的会话或抛出错误
 */
export async function requireAffiliationAccess(affiliation: Affiliation): Promise<Session> {
  const session = await requireAuth();
  
  // 管理员和查看员可以访问任何隶属的资源 - 使用不区分大小写的比较
  if (session.user.role?.toLowerCase() === UserRole.ADMIN || session.user.role?.toLowerCase() === UserRole.VIEWER) {
    return session;
  }
  
  // 普通用户只能访问自己隶属的资源
  if (session.user.affiliation !== affiliation) {
    throw createApiError('权限不足', 403, 'FORBIDDEN');
  }
  
  return session;
}

/**
 * 检查用户是否有权限访问特定用户的资源
 * @param userId 用户ID
 * @returns 已认证且有权限的会话或抛出错误
 */
export async function requireUserAccess(userId: string): Promise<Session> {
  const session = await requireAuth();
  
  // 管理员可以访问任何用户的资源 - 使用不区分大小写的比较
  if (session.user.role?.toLowerCase() === UserRole.ADMIN) {
    return session;
  }
  
  // 普通用户只能访问自己的资源
  if (session.user.id !== userId) {
    throw createApiError('权限不足', 403, 'FORBIDDEN');
  }
  
  return session;
}