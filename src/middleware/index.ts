// 导出所有中间件
export * from './errorHandler';
export * from './authMiddleware';
export * from './validationMiddleware';
export * from './prismaMiddleware';
export * from './loggerMiddleware';

// 导出默认的Prisma客户端
export { default as prisma } from './prismaMiddleware';