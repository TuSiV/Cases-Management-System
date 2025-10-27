'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, Breadcrumb, Spin, message } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ResetPasswordForm from '@/components/ResetPasswordForm';
import { UserRole, User } from '@/types';

interface ResetPasswordPageProps {
  params: {
    id: string;
  };
}

const ResetPasswordPage = ({ params }: ResetPasswordPageProps) => {
  const { id } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${id}`);
      
      if (!response.ok) {
        throw new Error('获取用户信息失败');
      }
      
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      message.error('获取用户信息失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      // 检查是否有权限（管理员或用户本人）
      if (session?.user?.role !== UserRole.ADMIN && session?.user?.id !== id) {
        message.error('您没有权限访问此页面');
        router.push('/dashboard');
        return;
      }
      
      fetchUser();
    }
  }, [status, router, session, id, fetchUser]);

  // 原fetchUser函数内容已移至上方

  const handleResetPassword = async (values?: { oldPassword?: string; newPassword: string; confirmPassword: string }) => {
    try {
      const response = await fetch(`/api/users/${id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '重置密码失败');
      }
      
      message.success('密码已成功重置');
      
      // 如果是管理员重置他人密码，返回用户列表页
      if (session?.user?.role === UserRole.ADMIN && session?.user?.id !== id) {
        router.push('/dashboard/users');
      }
    } catch (error: unknown) {
      console.error('重置密码出错:', error);
      message.error(error instanceof Error ? error.message : '重置密码失败');
    }
  };

  if (loading) {
    return (
      <div className="reset-password-container">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  const isCurrentUser = session?.user?.id === id;

  return (
    <div className="reset-password-container">
      <Breadcrumb
        items={[
          { title: <Link href="/dashboard">仪表盘</Link> },
          { title: <Link href="/dashboard/users">用户管理</Link> },
          { title: user?.name || '用户' },
          { title: '重置密码' },
        ]}
        style={{ marginBottom: '16px' }}
      />
      
      <Card title={`重置密码 - ${user?.name || '用户'}`}>
        <ResetPasswordForm
          userId={id}
          onSuccess={handleResetPassword} 
          isSelf={isCurrentUser}
        />
      </Card>

      <style jsx global>{`
        .reset-password-container {
          padding: 24px;
        }
      `}</style>
    </div>
  );
};

export default ResetPasswordPage;