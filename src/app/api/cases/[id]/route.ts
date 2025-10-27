import { createApiRoute, createApiError } from '@/middleware/errorHandler';
import { requireAuth, requireUserAccess, requireAffiliationAccess, requireAdmin } from '@/middleware/authMiddleware';
import { getPrismaClient } from '@/middleware/prismaMiddleware';
import { UserRole, Case, Affiliation } from '@/types';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { recordCaseChangeLog } from '../utils';
import dayjs from 'dayjs';

const prisma = getPrismaClient()

// 定义可更新的案件数据类型
export type CaseUpdateData = Partial<Omit<Case, 'id' | 'caseNumber' | 'createdBy' | 'updatedBy' | 'createdAt'>>

// 获取案件详情
export const GET = createApiRoute(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // 获取案件信息以检查权限
  const caseData = await prisma.case.findUnique({
    where: { id: params.id },
    select: { affiliation: true }
  });
  
  // 如果案件不存在，抛出错误
  if (!caseData) {
    throw createApiError('案件不存在', 404, 'NOT_FOUND');
  }
  
  // 检查用户是否有权限访问此案件
    await requireAffiliationAccess(caseData.affiliation as Affiliation);
  
  // 查询完整的案件信息
  const fullCaseData = await prisma.case.findUnique({
    where: { id: params.id },
    include: {
      createdBy: {
        select: { name: true }
      },
      updatedBy: {
        select: { name: true }
      }
    }
  });
  
  return fullCaseData;
});

// 更新案件
export const PUT = createApiRoute(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    // 获取当前案件信息
    const currentCase = await prisma.case.findUnique({
      where: { id: params.id },
      select: { affiliation: true }
    });
    
    if (!currentCase) {
      throw createApiError('案件不存在', 404, 'NOT_FOUND');
    }
    
    // 检查用户是否有权限访问此案件
    const session = await requireAffiliationAccess(currentCase.affiliation as Affiliation);
    
    // 重新查询完整的案件信息
    const fullCurrentCase = await prisma.case.findUnique({
      where: { id: params.id }
    }) as Case | null;
    
    const data = await request.json() as CaseUpdateData;
    
    // 不允许修改案件号 - 已在CaseUpdateData类型中排除
    // delete data.caseNumber;
    
    // 非管理员不能修改隶属 - 使用不区分大小写的比较
    if (session.user.role?.toLowerCase() !== UserRole.ADMIN) {
      delete data.affiliation;
    }
    
    // 找出变更的字段
    const changedFields: string[] = [];
    const oldValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};
    
    if (fullCurrentCase) {
      // 比较并记录变更的字段
      Object.keys(data).forEach(field => {
        if ((data as Record<string, any>)[field] !== undefined) {
          // 特殊处理日期类型字段，避免因为格式不一致导致的误判
          if (field.includes('Date')) {
            // 将日期转换为统一格式（只比较日期部分，不比较时间）后再进行比较
            const oldDateStr = fullCurrentCase[field as keyof Case] ? 
              dayjs(fullCurrentCase[field as keyof Case]).format('YYYY-MM-DD') : null;
            const newDateStr = (data as Record<string, any>)[field] ? 
              dayjs((data as Record<string, any>)[field]).format('YYYY-MM-DD') : null;
            
            if (oldDateStr !== newDateStr) {
              changedFields.push(field);
              oldValues[field] = fullCurrentCase[field as keyof Case];
              newValues[field] = (data as Record<string, any>)[field];
            }
          } else {
            // 非日期字段使用普通比较
            if ((data as Record<string, any>)[field] !== fullCurrentCase[field as keyof Case]) {
              changedFields.push(field);
              oldValues[field] = fullCurrentCase[field as keyof Case];
              newValues[field] = (data as Record<string, any>)[field];
            }
          }
        }
      });
    }
    
    // 更新案件
    const updatedCase = await prisma.case.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedById: session.user.id
      }
    }) as unknown as Case;
    
    // 如果有变更的字段，记录变更日志
    if (changedFields.length > 0 && fullCurrentCase) {
      await recordCaseChangeLog(
        params.id,
        session.user.id,
        changedFields,
        oldValues,
        newValues,
        `更新案件信息: ${changedFields.join(', ')}`
      );
    }
    
    return updatedCase;
  }
)

// 删除案件（仅管理员可操作）
export const DELETE = createApiRoute(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    // 检查用户是否为管理员
    await requireAdmin();
    
    // 获取案件信息以检查是否存在
    const caseData = await prisma.case.findUnique({
      where: { id: params.id },
      select: { id: true }
    });
    
    // 如果案件不存在，抛出错误
    if (!caseData) {
      throw createApiError('案件不存在', 404, 'NOT_FOUND');
    }
    
    // 删除案件
    await prisma.case.delete({
      where: { id: params.id }
    });
    
    return { success: true };
  }
)