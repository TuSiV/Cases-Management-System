'use client';

import React from 'react';
import { Card, message } from 'antd';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import UserForm from '@/components/UserForm';
import { UserRole, User } from '@/types';

const NewUserPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // 检查用户是否已认证
  if (status === 'loading') {
    return <div>加载中...</div>;
  }
  
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }
  
  // 检查用户是否为管理员
  if (session?.user?.role !== UserRole.ADMIN) {
    message.error('您没有权限访问此页面');
    router.push('/dashboard');
    return null;
  }
  
  // 提交表单
  const handleSubmit = async (values: Partial<User> & { confirmPassword?: string }) => {
    try {
      // 从values中解构出除confirmPassword外的所有字段
      // 注意：confirmPassword只用于前端验证，不需要发送到API
      const userData = {...values};
      delete userData.confirmPassword;
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '创建用户失败');
      }
      
      return await response.json();
    } catch (error: unknown) {
      console.error('创建用户失败:', error);
      throw error;
    }
  };
  
  return (
    <DashboardLayout>
      <Card title="新增用户" bordered={false}>
        <UserForm onSubmit={handleSubmit} />
      </Card>
    </DashboardLayout>
  );
};

export default NewUserPage;