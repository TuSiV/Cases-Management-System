import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/auth';
import { Affiliation, CaseType, UserRole, Case, AffiliationCode, CaseTypeCode } from '@/types';
import { createApiRoute } from '@/utils/apiUtils';
import { getPrismaClient } from '@/middleware/prismaMiddleware';

// 批量导入案件的API路由
const prisma = getPrismaClient();

// 生成案件号 - 使用随机4位数字作为后四位
async function generateCaseNumber(affiliation: Affiliation, filingDate: Date, caseType: CaseType): Promise<string> {
  try {
    // 获取隶属代码
    const affiliationCode = AffiliationCode[affiliation];
    
    // 获取年份
    const year = filingDate.getFullYear().toString();
    
    // 获取案件类型代码
    const typeCode = CaseTypeCode[caseType] || 'QT';
    
    // 生成前7位
    const prefix = `${affiliationCode}${year}${typeCode}`;
    
    // 最多尝试10次生成唯一的随机编号
    let maxAttempts = 10;
    let attempts = 0;
    let caseNumber = null;
    
    while (attempts < maxAttempts && !caseNumber) {
      // 生成4位随机数字作为序列号
      const randomSequence = Math.floor(1000 + Math.random() * 9000).toString(); // 生成1000-9999之间的随机数
      
      // 构建完整编号
      const candidateNumber = `${prefix}${randomSequence}`;
      
      // 检查数据库中是否已存在该编号
      const existingCase = await prisma.case.findUnique({
        where: {
          caseNumber: candidateNumber
        }
      });
      
      // 如果不存在，则使用此编号
      if (!existingCase) {
        caseNumber = candidateNumber;
      }
      
      attempts++;
    }
    
    // 如果尝试多次后仍未生成唯一编号，返回备用方案
    if (!caseNumber) {
      console.warn(`生成随机编号失败，使用备用方案`);
      return `BK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    return caseNumber;
  } catch (error) {
    console.error('生成案件号失败:', error);
    // 如果生成失败，使用时间戳加随机数作为备用方案
    return `BK_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }
}

// 批量创建案件
async function handleBatchCreateCases(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // 验证用户是否已登录
  if (!session?.user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }
  
  try {
    const casesData = await request.json() as Omit<Case, 'id' | 'caseNumber' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>[];
    
    if (!casesData || !Array.isArray(casesData) || casesData.length === 0) {
      return NextResponse.json({ error: '请提供有效的案件数据' }, { status: 400 });
    }
    
    // 限制批量处理的案件数量，防止请求过大
    if (casesData.length > 500) {
      return NextResponse.json({ error: '单次导入案件数量不能超过500条' }, { status: 400 });
    }
    
    const results = {
      successCount: 0,
      failures: [] as { index: number; error: string }[]
    };
    
    // 开始事务处理
    await prisma.$transaction(async (prisma) => {
      for (let i = 0; i < casesData.length; i++) {
        try {
          const data = casesData[i];
          
          // 非管理员只能创建自己隶属的案件
          if (session.user.role?.toLowerCase() !== UserRole.ADMIN && data.affiliation !== session.user.affiliation) {
            throw new Error('您没有权限创建其他隶属的案件');
          }
          
          // 可选字段，不再强制验证
          
          // 生成案件号
          const filingDate = data.filingDate ? new Date(data.filingDate) : new Date();
          const caseNumber = await generateCaseNumber(
            data.affiliation as Affiliation,
            filingDate,
            data.caseType as CaseType
          );
          
          const caseData = {
            ...data,
            caseNumber,
            createdById: session.user.id,
            updatedById: session.user.id
          };
          
          // 创建案件
          await prisma.case.create({
            data: caseData
          });
          
          results.successCount++;
        } catch (error) {
          results.failures.push({
            index: i,
            error: error instanceof Error ? error.message : '创建案件失败'
          });
          console.error(`批量创建案件时出错（索引${i}）:`, error);
          // 继续处理下一条，不中断整个批次
        }
      }
      
      // 记录变更日志（为了提高性能，这里简化了日志记录逻辑）
      if (results.successCount > 0) {
        try {
          // 记录一条批量操作的日志，而不是为每个案件单独记录
          // 实际项目中可能需要更详细的日志记录策略
          console.log(`用户 ${session.user.name} 批量创建了 ${results.successCount} 个案件`);
        } catch (logError) {
          console.error('记录批量操作日志失败:', logError);
          // 日志记录失败不影响主业务流程
        }
      }
    });
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('批量创建案件失败:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : '批量创建案件失败',
      successCount: 0,
      failures: []
    }, { status: 500 });
  }
}

export const POST = createApiRoute({
  POST: handleBatchCreateCases
});