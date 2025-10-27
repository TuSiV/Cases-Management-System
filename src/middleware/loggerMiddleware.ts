import { NextRequest, NextResponse } from 'next/server';

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * 日志记录器接口
 */
export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

/**
 * 控制台日志记录器实现
 */
export class ConsoleLogger implements Logger {
  debug(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, meta);
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(meta ? { meta } : {}),
    };

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(JSON.stringify(logEntry));
        break;
      case LogLevel.INFO:
        console.info(JSON.stringify(logEntry));
        break;
      case LogLevel.WARN:
        console.warn(JSON.stringify(logEntry));
        break;
      case LogLevel.ERROR:
        console.error(JSON.stringify(logEntry));
        break;
    }
  }
}

// 创建默认日志记录器实例
const defaultLogger = new ConsoleLogger();

/**
 * 获取日志记录器实例
 * @returns Logger实例
 */
export function getLogger(): Logger {
  return defaultLogger;
}

/**
 * 记录API请求日志
 * @param request NextRequest对象
 * @param response NextResponse对象
 */
export function logApiRequest(request: NextRequest, response: NextResponse): void {
  const { method, url, headers } = request;
  const status = response.status;
  const contentLength = response.headers.get('content-length') || '0';
  const userAgent = headers.get('user-agent') || 'unknown';
  const referer = headers.get('referer') || 'unknown';
  const requestId = headers.get('x-request-id') || 'unknown';

  const logLevel = status >= 500 ? LogLevel.ERROR : status >= 400 ? LogLevel.WARN : LogLevel.INFO;
  const logMessage = `${method} ${url} ${status} ${contentLength}b`;

  const meta = {
    method,
    url,
    status,
    contentLength,
    userAgent,
    referer,
    requestId,
    responseTime: response.headers.get('x-response-time') || 'unknown',
  };

  switch (logLevel) {
    case LogLevel.ERROR:
      defaultLogger.error(logMessage, meta);
      break;
    case LogLevel.WARN:
      defaultLogger.warn(logMessage, meta);
      break;
    default:
      defaultLogger.info(logMessage, meta);
  }
}

/**
 * API请求日志中间件
 * @param request NextRequest对象
 * @param handler 请求处理函数
 * @returns NextResponse响应
 */
export async function withLogger(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const response = await handler(request);
    
    // 添加响应时间头
    const responseTime = Date.now() - startTime;
    response.headers.set('x-response-time', `${responseTime}ms`);
    
    // 记录请求日志
    logApiRequest(request, response);
    
    return response;
  } catch (error) {
    // 记录错误日志
    defaultLogger.error(`请求处理错误: ${error instanceof Error ? error.message : String(error)}`, {
      method: request.method,
      url: request.url,
      error,
    });
    
    throw error;
  }
}