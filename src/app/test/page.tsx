'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from 'antd';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TestPage() {
  const router = useRouter();
  
  // 获取URL参数
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('caseId');
    
    console.log('测试页面加载，URL参数:', { caseId });
  }, []);
  
  const handleGoToCaseDetail = () => {
    router.push('/dashboard/cases/d1eb9661-1123-4dff-80f2-b36c1edefa92');
  };
  
  const handleGoToProgress = () => {
    router.push('/dashboard/cases/d1eb9661-1123-4dff-80f2-b36c1edefa92/progress');
  };
  
  return (
    <DashboardLayout>
      <h1>测试页面</h1>
      <p>这个页面用于测试路由导航功能。</p>
      
      <Button onClick={handleGoToCaseDetail} style={{ marginRight: '10px' }}>
        跳转到案件详情页
      </Button>
      
      <Button type="primary" onClick={handleGoToProgress}>
        跳转到月度进展页
      </Button>
    </DashboardLayout>
  );
}