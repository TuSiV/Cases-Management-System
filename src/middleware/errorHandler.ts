import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * 创建API错误响应
 * @param error 错误对象
 * @param defaultMessage 默认错误消息
 * @returns NextResponse错误响应
 */
export function createErrorResponse(error: unknown, defaultMessage = '服务器内部错误') {
  console.error('API错误:', error);
  
  // 如果是ApiError类型，使用其状态码和消息
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      { 
        error: apiError.message || defaultMessage,
        code: apiError.code || 'INTERNAL_SERVER_ERROR'
      },
      { status: apiError.statusCode || 500 }
    );
  }
  
  // 如果是普通Error，使用其消息
  if (error instanceof Error) {
    return NextResponse.json(
      { 
        error: error.message || defaultMessage,
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
  
  // 默认错误响应
  return NextResponse.json(
    { 
      error: defaultMessage,
      code: 'INTERNAL_SERVER_ERROR'
    },
    { status: 500 }
  );
}

/**
 * 创建API错误对象
 * @param message 错误消息
 * @param statusCode HTTP状态码
 * @param code 错误代码
 * @returns ApiError对象
 */
export function createApiError(message: string, statusCode = 500, code = 'INTERNAL_SERVER_ERROR'): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

/**
 * 处理API请求的错误
 * @param request NextRequest对象
 * @param handler 请求处理函数
 * @returns NextResponse响应
 */
export async function withErrorHandler(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler(request);
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * 创建带有认证和错误处理的API路由处理器
 * @param handler 带认证的请求处理函数
 * @returns 处理后的API路由处理器
 */
export function createApiRoute<T extends (...args: any[]) => Promise<any>>(
  handler: T
) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      const result = await handler(request, ...args);
      return NextResponse.json(result);
    } catch (error) {
      return createErrorResponse(error);
    }
  };
}