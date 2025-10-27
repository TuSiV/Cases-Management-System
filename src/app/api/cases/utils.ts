import { getPrismaClient } from '@/middleware/prismaMiddleware';

const prisma = getPrismaClient();

/**
 * 记录案件变更日志的工具函数
 * @param caseId 案件ID
 * @param changedById 变更人ID
 * @param changedFields 变更的字段列表
 * @param oldValues 变更前的值
 * @param newValues 变更后的值
 * @param changeDescription 变更描述（可选）
 */
export async function recordCaseChangeLog(
  caseId: string,
  changedById: string,
  changedFields: string[],
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
  changeDescription?: string
) {
  try {
    // 手动生成UUID作为id值，因为SQLite数据库中没有设置默认值
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    const id = generateUUID();
    
    console.log('准备记录案件变更日志:', {
      id,
      caseId,
      changedById,
      changedFieldsCount: changedFields.length
    });
    
    // 创建变更日志数据，包含手动生成的id
    const logData = {
      id,
      caseId,
      changedById,
      changedFields: JSON.stringify(changedFields),
      oldValues: JSON.stringify(oldValues),
      newValues: JSON.stringify(newValues),
      changeDescription
    };
    
    console.log('变更日志数据:', JSON.stringify(logData));
    
    // 使用Prisma ORM方法插入数据
    const result = await prisma.caseChangeLog.create({
      data: logData
    });
    
    console.log('案件变更日志记录成功:', result.id);
  } catch (error) {
    console.error('记录案件变更日志失败:', error);
    // 这里不抛出异常，避免影响主要业务流程
  }
}