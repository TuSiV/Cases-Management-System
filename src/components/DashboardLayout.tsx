'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Layout, Menu, Button, Dropdown, Avatar, Space, message } from 'antd'
import { 
  UserOutlined, 
  TeamOutlined, 
  FileTextOutlined, 
  DashboardOutlined, 
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import type { MenuProps } from 'antd'
import { UserRole } from '@/types'

const { Header, Sider, Content } = Layout

type Props = {
  children: React.ReactNode
}

export function DashboardLayout({ children }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <span>加载中...</span>
      </div>
    )
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    message.success('已退出登录')
    router.push('/login')
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => router.push('/dashboard/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  // 不区分大小写检查管理员角色
  const isAdmin = session?.user?.role?.toLowerCase() === UserRole.ADMIN

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link href="/dashboard">首页</Link>,
    },
    {
      key: 'targets',
      icon: <BarChartOutlined />,
      label: <Link href="/dashboard/targets">指标情况</Link>,
    },
    {
      key: 'cases',
      icon: <FileTextOutlined />,
      label: <Link href="/dashboard/cases">案件管理</Link>,
    },
    isAdmin ? {
      key: 'users',
      icon: <TeamOutlined />,
      label: <Link href="/dashboard/users">用户管理</Link>,
    } : null,
  ].filter(Boolean)

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} breakpoint="md" collapsedWidth={0} onBreakpoint={(broken) => setCollapsed(broken)} onCollapse={(c) => setCollapsed(c)}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontSize: collapsed ? 14 : 18 }}>{collapsed ? 'CMS' : '案件管理系统'}</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[pathname.split('/')[2] || 'dashboard']}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div style={{ marginRight: 24 }}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space>
                <Avatar icon={<UserOutlined />} />
                {!collapsed && <span>{typeof session?.user?.name === 'string' ? session.user.name : '用户'}</span>}
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content className="app-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}