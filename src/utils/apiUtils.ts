import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, withLogger } from '@/middleware';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

type ApiHandler = (request: NextRequest) => Promise<NextResponse>;

type ApiRouteHandlers = {
  [key in HttpMethod]?: ApiHandler;
};

/**
 * 创建API路由处理器
 * @param handlers HTTP方法处理器映射
 * @returns API路由处理函数
 */
export function createApiRoute(handlers: ApiRouteHandlers) {
  return async function handler(request: NextRequest): Promise<NextResponse> {
    return withLogger(request, async (req) => {
      return withErrorHandler(req, async (req) => {
        const method = req.method as HttpMethod;
        const handler = handlers[method];

        if (!handler) {
          return NextResponse.json(
            { error: `不支持的方法: ${method}` },
            { status: 405 }
          );
        }

        return await handler(req);
      });
    });
  };
}

/**
 * 创建分页参数
 * @param request NextRequest对象
 * @param defaultPageSize 默认每页大小
 * @returns 分页参数对象
 */
export function getPaginationParams(request: NextRequest, defaultPageSize = 10) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || defaultPageSize.toString());

  return {
    page: Math.max(1, page),
    pageSize: Math.min(100, Math.max(1, pageSize)),
    skip: (Math.max(1, page) - 1) * Math.min(100, Math.max(1, pageSize)),
  };
}

/**
 * 创建分页响应
 * @param items 分页项目
 * @param total 总数
 * @param page 当前页码
 * @param pageSize 每页大小
 * @returns 分页响应对象
 */
export function createPaginationResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return {
    items,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}