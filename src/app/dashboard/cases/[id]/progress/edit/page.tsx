'use client'
import { useState, useEffect } from 'react'
import { Card, Button, Spin, message, Form, Input, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Case } from '@/types'

const { Title } = Typography
const { TextArea } = Input
const { Item } = Form

export default function AddMonthlyProgressPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)
  const [form] = Form.useForm()

  useEffect(() => {
    const fetchCaseDetail = async () => {
      try {
        setLoading(true)
        // 获取案件详情
        const caseResponse = await axios.get(`/api/cases/${params.id}`)
        setCaseData(caseResponse.data)
      } catch (error) {
        console.error('获取案件详情失败:', error)
        message.error('获取案件详情失败')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchCaseDetail()
    }
  }, [params.id])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      // 调用API保存月度进展
      await axios.post(`/api/cases/${params.id}/progress`, {
        content: values.content
      })
      
      message.success('月度进展添加成功')
      
      // 保存成功后返回月度进展列表页面
      router.push(`/dashboard/cases/${params.id}/progress`)
    } catch (error) {
      console.error('添加月度进展失败:', error)
      // 显示具体的错误信息
      if (error && typeof error === 'object' && 'response' in error) {
        const typedError = error as { response?: { data?: { error?: string } } };
        message.error(typedError.response?.data?.error || '添加月度进展失败，请重试')
      } else {
        message.error('添加月度进展失败，请重试')
      }
    }
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

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push(`/dashboard/cases/${params.id}/progress`)}
          style={{ marginRight: 16 }}
        >
          返回月度进展列表
        </Button>
        <Title level={4} style={{ margin: 0 }}>添加月度进展</Title>
      </div>

      <Card title={`${caseData.caseName}`}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Item
            name="content"
            label="进展内容"
            rules={[
              { required: true, message: '请输入进展内容' },
              { min: 10, message: '进展内容至少需要10个字符' }
            ]}
          >
            <TextArea rows={8} placeholder="请输入本月案件的进展情况" />
          </Item>
          
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </div>
        </Form>
      </Card>
    </DashboardLayout>
  )
}