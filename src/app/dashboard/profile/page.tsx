'use client'

import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, message, Spin } from 'antd'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { UserRole } from '@/types';

export default function ProfilePage() {
  const { data: session } = useSession()
  const [form] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/users/profile')
        form.setFieldsValue({
          username: response.data.username,
          name: response.data.name,
          email: response.data.email || '',
          phone: response.data.phone || '',
          affiliation: response.data.affiliation,
          role: response.data.role === UserRole.ADMIN ? '管理员' : response.data.role === UserRole.VIEWER ? '查看员' : '普通用户',
        })
      } catch (error) {
        console.error('获取用户信息失败:', error)
        message.error('获取用户信息失败')
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchUserProfile()
    }
  }, [session, form])

  const handleUpdateProfile = async (values: {
    username: string
    name: string
    email: string
    phone: string
    affiliation: string
    role: string
  }) => {
    try {
      setSubmitting(true)
      await axios.put('/api/users/profile', {
        name: values.name,
        email: values.email,
        phone: values.phone,
      })
      message.success('个人信息更新成功')
    } catch (error: unknown) {
      console.error('更新个人信息失败:', error)
      message.error('更新个人信息失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChangePassword = async (values: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }) => {
    try {
      setChangingPassword(true)
      await axios.post('/api/users/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      })
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error: unknown) {
      console.error('修改密码失败:', error)
      message.error('修改密码失败，请确认当前密码是否正确')
    } finally {
      setChangingPassword(false)
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

  return (
    <DashboardLayout>
      <h1 style={{ marginBottom: 24 }}>个人信息</h1>
      
      <Card style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
        >
          <Form.Item
            name="username"
            label="用户名"
          >
            <Input disabled />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="角色"
          >
            <Input disabled />
          </Form.Item>
          
          <Form.Item
            name="affiliation"
            label="隶属"
          >
            <Input disabled />
          </Form.Item>
          
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="电话"
          >
            <Input />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={submitting}
            >
              更新信息
            </Button>
          </Form.Item>
        </Form>
      </Card>
      
      <h2 style={{ marginBottom: 16 }}>修改密码</h2>
      <Card>
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="currentPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password />
          </Form.Item>
          
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[{ required: true, message: '请输入新密码' }]}
          >
            <Input.Password />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={changingPassword}
            >
              修改密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </DashboardLayout>
  )
}