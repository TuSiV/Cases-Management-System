'use client'

import { useState, useEffect } from 'react'
import { Card, Badge, Tooltip } from 'antd'
import {
  FileTextOutlined,
  EditOutlined,
  BarChartOutlined,
  DollarCircleOutlined,
  UserOutlined,
  FileSearchOutlined,
  ClockCircleOutlined,
  FileAddOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import { Case } from '@/types'

interface CaseFloatNavigationProps {
  caseId: string
  caseData?: Case | null
  isEditMode?: boolean
}

export function CaseFloatNavigation({ caseId, caseData, isEditMode = false }: CaseFloatNavigationProps) {
  const router = useRouter()
  const [visible, setVisible] = useState(true)
  const [activeSection, setActiveSection] = useState<string>('')

  // 监听滚动位置以显示/隐藏浮窗导航
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setVisible(scrollPosition > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 导航项配置
  const navigationItems = [
    {
      key: 'basic',
      icon: <FileTextOutlined />,
      title: '基本信息',
      sectionId: 'basic-info',
      onClick: () => {
        if (isEditMode) {
          document.getElementById('basic-info')?.scrollIntoView({ behavior: 'smooth' })
        } else {
          router.push(`/dashboard/cases/${caseId}`)
        }
      }
    },
    {
      key: 'party',
      icon: <UserOutlined />,
      title: '当事人信息',
      sectionId: 'party-info',
      onClick: () => {
        if (isEditMode) {
          document.getElementById('party-info')?.scrollIntoView({ behavior: 'smooth' })
        } else {
          document.getElementById('party-info')?.scrollIntoView({ behavior: 'smooth' })
        }
      }
    },
    {
      key: 'amount',
      icon: <DollarCircleOutlined />,
      title: '金额信息',
      sectionId: 'amount-info',
      onClick: () => {
        if (isEditMode) {
          document.getElementById('amount-info')?.scrollIntoView({ behavior: 'smooth' })
        } else {
          document.getElementById('amount-info')?.scrollIntoView({ behavior: 'smooth' })
        }
      }
    },
    {
      key: 'cost',
      icon: <BarChartOutlined />,
      title: '费用信息',
      sectionId: 'cost-info',
      onClick: () => {
        if (isEditMode) {
          document.getElementById('cost-info')?.scrollIntoView({ behavior: 'smooth' })
        } else {
          document.getElementById('cost-info')?.scrollIntoView({ behavior: 'smooth' })
        }
      }
    },
    {
      key: 'progress',
      icon: <ClockCircleOutlined />,
      title: '案情与进展',
      sectionId: 'progress-info',
      onClick: () => {
        if (isEditMode) {
          document.getElementById('progress-info')?.scrollIntoView({ behavior: 'smooth' })
        } else {
          router.push(`/dashboard/cases/${caseId}/progress`)
        }
      },
      badge: 0
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      title: '编辑案件',
      onClick: () => {
        router.push(`/dashboard/cases/edit/${caseId}`)
      },
      hiddenInEditMode: true
    },
    {
      key: 'add-progress',
      icon: <FileAddOutlined />,
      title: '添加进展',
      onClick: () => {
        router.push(`/dashboard/cases/${caseId}/progress/edit`)
      },
      hiddenInEditMode: true
    }
  ].filter(item => !(isEditMode && item.hiddenInEditMode))

  return (
    <div
      style={{
        position: 'fixed',
        right: 24,
        top: '50%',
        transform: visible ? 'translateY(-50%)' : 'translate(150%, -50%)',
        transition: 'all 0.3s ease-in-out',
        zIndex: 1000,
        opacity: visible ? 1 : 0
      }}
    >
      <Card
        style={{
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: 'none',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(4px)'
        }}
        styles={{
          body: {
            padding: '12px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8
          }
        }}
      >
        {navigationItems.map(item => (
          <Tooltip key={item.key} title={item.title} placement="left">
            <div
              onClick={item.onClick}
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: activeSection === item.key ? '#1890ff' : '#666',
                backgroundColor: activeSection === item.key ? 'rgba(24, 144, 255, 0.1)' : 'transparent',
                transition: 'all 0.2s ease-in-out',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(24, 144, 255, 0.1)'
                e.currentTarget.style.color = '#1890ff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = activeSection === item.key ? 'rgba(24, 144, 255, 0.1)' : 'transparent'
                e.currentTarget.style.color = activeSection === item.key ? '#1890ff' : '#666'
              }}
            >
              {item.icon}
              {item.badge && (
                <Badge
                  count={item.badge}
                  size="small"
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: '#ff4d4f'
                  }}
                />
              )}
            </div>
          </Tooltip>
        ))}
      </Card>
    </div>
  )
}