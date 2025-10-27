import { PrismaClient, Prisma } from '@prisma/client';

// 声明全局变量以在开发环境中缓存连接
// 注意：在全局范围内声明变量时，TypeScript要求必须使用var而不是let或const
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// 创建Prisma客户端实例
const prisma = globalThis.prisma || new PrismaClient();

// 在开发环境中缓存连接
if (process.env.NODE_ENV === 'development') {
  globalThis.prisma = prisma;
}

/**
 * 获取Prisma客户端实例
 * @returns PrismaClient实例
 */
export function getPrismaClient() {
  return prisma;
}

/**
 * 执行数据库事务
 * @param callback 事务回调函数
 * @returns 事务执行结果
 */
export async function withTransaction<T>(
  callback: (prisma: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    return callback(tx);
  });
  return result;
}

/**
 * 安全关闭Prisma连接
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

export default prisma;
