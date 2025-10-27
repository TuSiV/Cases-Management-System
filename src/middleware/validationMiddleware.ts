import { NextRequest } from 'next/server';
import { createApiError } from './errorHandler';

type ValidationSchemaField = {
  type?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: unknown[];
  min?: number;
  max?: number;
  custom?: (value: unknown) => boolean | string;
};

type ValidationSchema = Record<string, ValidationSchemaField>;

/**
 * 验证请求数据
 * @param data 请求数据
 * @param schema 验证模式
 * @returns 验证通过的数据或抛出错误
 */
export function validateData(data: Record<string, unknown>, schema: ValidationSchema) {
  const errors: string[] = [];
  const validatedData: Record<string, unknown> = {};

  // 遍历模式中的每个字段
  for (const field in schema) {
    const rules = schema[field];
    const value = data[field];

    // 检查必填字段
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} 是必填项`);
      continue;
    }

    // 如果字段不存在且不是必填项，跳过后续验证
    if (value === undefined || value === null || value === '') {
      continue;
    }

    // 验证类型
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${field} 必须是 ${rules.type} 类型`);
    }

    // 验证字符串长度
    if (typeof value === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        errors.push(`${field} 长度不能小于 ${rules.minLength} 个字符`);
      }
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        errors.push(`${field} 长度不能超过 ${rules.maxLength} 个字符`);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} 格式不正确`);
      }
    }

    // 验证数字范围
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} 不能小于 ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} 不能大于 ${rules.max}`);
      }
    }

    // 验证枚举值
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} 必须是以下值之一: ${rules.enum.join(', ')}`);
    }

    // 自定义验证
    if (rules.custom) {
      const customResult = rules.custom(value);
      if (customResult !== true) {
        errors.push(typeof customResult === 'string' ? customResult : `${field} 验证失败`);
      }
    }

    // 添加到验证通过的数据
    validatedData[field] = value;
  }

  // 如果有错误，抛出异常
  if (errors.length > 0) {
    throw createApiError(errors.join('; '), 400, 'VALIDATION_ERROR');
  }

  return validatedData;
}

/**
 * 验证请求体中间件
 * @param schema 验证模式
 * @returns 验证通过的请求体或抛出错误
 */
export async function validateBody(request: NextRequest, schema: ValidationSchema) {
  try {
    const body = await request.json();
    return validateData(body, schema);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw createApiError('无效的请求体格式', 400, 'INVALID_JSON');
    }
    throw error;
  }
}

/**
 * 验证查询参数中间件
 * @param request NextRequest对象
 * @param schema 验证模式
 * @returns 验证通过的查询参数或抛出错误
 */
export function validateQuery(request: NextRequest, schema: ValidationSchema) {
  const searchParams = request.nextUrl.searchParams;
  const query: Record<string, string> = {};
  
  // 将查询参数转换为对象（使用兼容的方式）
  Array.from(searchParams.entries()).forEach(([key, value]) => {
    query[key] = value;
  });
  
  return validateData(query, schema);
}