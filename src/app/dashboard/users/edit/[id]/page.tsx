'use client';

import React, { useState, useEffect } from 'react';
import { Card, message, Spin } from 'antd';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import UserForm from '@/components/UserForm';
import { UserRole, User } from '@/types';

interface EditUserPageProps {
  params: {
    id: string;
  };
}

const EditUserPage = ({ params }: EditUserPageProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 获取用户信息
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${params.id}`);
        
        if (!response.ok) {
          throw new Error('获取用户信息失败');
        }
        
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('获取用户信息失败:', error);
        message.error('获取用户信息失败');
        router.push('/dashboard/users');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [params.id, router]);
  
  // 检查用户是否已认证
  if (status === 'loading') {
    return <div>加载中...</div>;
  }
  
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }
  
  // 检查用户是否为管理员或本人
  const isAdmin = session?.user?.role === UserRole.ADMIN;
  const isSelf = session?.user?.id === params.id;
  
  if (!isAdmin && !isSelf) {
    message.error('您没有权限访问此页面');
    router.push('/dashboard');
    return null;
  }
  
  // 提交表单
  const handleSubmit = async (values: Partial<User>) => {
    try {
      const response = await fetch(`/api/users/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '更新用户失败');
      }
      
      return await response.json();
    } catch (error: unknown) {
      console.error('更新用户失败:', error);
      throw error;
    }
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <Card title="编辑用户" bordered={false}>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        </Card>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <Card title="编辑用户" bordered={false}>
        <UserForm 
          initialValues={user || undefined} 
          isEdit={true} 
          onSubmit={handleSubmit} 
        />
      </Card>
    </DashboardLayout>
  );
};

export default EditUserPage;