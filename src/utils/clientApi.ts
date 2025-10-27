import { Case, User } from '@/types';

/**
 * 客户端API工具
 * 用于在前端组件中调用API
 */

/**
 * 基础API请求函数
 * @param url API路径
 * @param options 请求选项
 * @returns 响应数据
 */
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `请求失败: ${response.status}`);
  }

  return response.json();
}

/**
 * 案件API
 */
export const caseApi = {
  /**
   * 获取案件列表
   * @param params 查询参数
   * @returns 案件列表和分页信息
   */
  getList: async (params?: Record<string, string | number | boolean>) => {
    const queryParams = params
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : '';
    return fetchApi<{ cases: Case[], total: number, page: number, pageSize: number }>(`/api/cases${queryParams}`);
  },

  /**
   * 获取案件详情
   * @param id 案件ID
   * @returns 案件详情
   */
  getById: async (id: string) => {
    return fetchApi(`/api/cases/${id}`);
  },

  /**
   * 创建案件
   * @param data 案件数据
   * @returns 创建的案件
   */
  create: async (data: Omit<Case, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy' | 'createdBy'>) => {
    return fetchApi<Case>('/api/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * 更新案件
   * @param id 案件ID
   * @param data 案件数据
   * @returns 更新的案件
   */
  update: async (id: string, data: Partial<Omit<Case, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy' | 'createdBy'>>) => {
    return fetchApi<Case>(`/api/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * 删除案件
   * @param id 案件ID
   * @returns 删除结果
   */
  delete: async (id: string) => {
    return fetchApi(`/api/cases/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * 用户API
 */
export const userApi = {
  /**
   * 获取用户列表
   * @param params 查询参数
   * @returns 用户列表和分页信息
   */
  getList: async (params?: Record<string, string | number | boolean>) => {
    const queryParams = params
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : '';
    return fetchApi<{ users: User[], total: number, page: number, pageSize: number }>(`/api/users${queryParams}`);
  },

  /**
   * 获取用户详情
   * @param id 用户ID
   * @returns 用户详情
   */
  getById: async (id: string) => {
    return fetchApi(`/api/users/${id}`);
  },

  /**
   * 创建用户
   * @param data 用户数据
   * @returns 创建的用户
   */
  create: async (data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>) => {
    return fetchApi<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * 更新用户
   * @param id 用户ID
   * @param data 用户数据
   * @returns 更新的用户
   */
  update: async (id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>>) => {
    return fetchApi<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * 删除用户
   * @param id 用户ID
   * @returns 删除结果
   */
  delete: async (id: string) => {
    return fetchApi(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * 修改密码
   * @param data 密码数据
   * @returns 修改结果
   */
  changePassword: async (data: { currentPassword: string, newPassword: string, confirmPassword: string }) => {
    return fetchApi<{ success: boolean, message: string }>('/api/users/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};

/**
 * 仪表盘API
 */
export const dashboardApi = {
  /**
   * 获取统计数据
   * @returns 统计数据
   */
  getStats: async () => {
    return fetchApi('/api/dashboard/stats');
  },

  /**
   * 获取最近案件
   * @returns 最近案件列表
   */
  getRecentCases: async () => {
    return fetchApi('/api/dashboard/recent-cases');
  },
};