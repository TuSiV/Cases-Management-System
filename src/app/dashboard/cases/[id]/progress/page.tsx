'use client'
import { useState, useEffect } from 'react'
import { Card, List, Typography, Button, Spin, message, Divider, Avatar, Popconfirm, Tag } from 'antd'
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { Case, UserRole } from '@/types'

const { Title, Text, Paragraph } = Typography
const { Meta } = Card

export default function CaseMonthlyProgressPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [monthlyProgressList, setMonthlyProgressList] = useState<Array<{ id: string; content: string; createdAt: string; createdBy: string }>>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()

  // 获取月度进展列表的函数
  const fetchProgressList = async () => {
    try {
      setLoading(true)
      // 获取案件详情
      const caseResponse = await axios.get(`/api/cases/${params.id}`)
      setCaseData(caseResponse.data)
      
      // 从API获取月度进展列表
      const progressResponse = await axios.get(`/api/cases/${params.id}/progress`)
      setMonthlyProgressList(progressResponse.data)
    } catch (error) {
      console.error('获取案件详情或月度进展失败:', error)
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchProgressList()
    }
  }, [params.id])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Spin size="large" />
        </div>
      </DashboardLayout>
    )
  }

  if (!caseData) {
    return (
      <DashboardLayout>
        <div>案件不存在或已被删除</div>
      </DashboardLayout>
    )
  }

  const handleDelete = async (progressId: string) => {
    try {
      await axios.delete(`/api/cases/${params.id}/progress?progressId=${progressId}`)
      message.success('删除成功')
      // 重新获取进展列表
      await fetchProgressList()
    } catch (error) {
      console.error('删除月度进展失败:', error)
      message.error('删除失败，请重试')
    }
  }

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>      <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push(`/dashboard/cases/${params.id}`)}
        >
          返回案件详情
        </Button>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => router.push(`/dashboard/cases/${params.id}/progress/edit`)}
        >
          添加月度进展
        </Button>
      </div>

      <Card title={`${caseData.caseName} - 月度进展记录`}>
        {monthlyProgressList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Text type="secondary">暂无月度进展记录</Text>
          </div>
        ) : (
          <List
            itemLayout="vertical"
            dataSource={monthlyProgressList}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                actions={session?.user?.role?.toLowerCase() === UserRole.ADMIN.toLowerCase() ? [
                <Popconfirm
                  title="确定要删除这条进展记录吗？"
                  onConfirm={() => handleDelete(item.id)}
                  okText="确定"
                  cancelText="取消"
                  key="delete-confirm"
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                  >
                    删除
                  </Button>
                </Popconfirm>
              ] : []}
                extra={
                  <div style={{ textAlign: 'right' }}>
                    <Text type="secondary">{formatDate(item.createdAt)}</Text>
                    <div style={{ marginTop: 4 }}>
                      <Avatar size="small">{item.createdBy.substring(0, 1)}</Avatar>
                      <Text type="secondary" style={{ marginLeft: 4 }}>{item.createdBy}</Text>
                    </div>
                  </div>
                }
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Tag color="blue" style={{ marginRight: '8px' }}>
                        {new Date(item.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                      </Tag>
                      <Text strong>进展记录</Text>
                    </div>
                  }
                  description={
                    <Paragraph ellipsis={{ rows: 5 }}>{item.content}</Paragraph>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </DashboardLayout>
  )
}