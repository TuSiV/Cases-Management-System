'use client'

import { useState, useEffect, useCallback } from 'react'
import { Table, Button, Input, Space, Tag, Card, message, Popconfirm, Modal, Form, Select } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, LockOutlined } from '@ant-design/icons'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { User, Affiliation, UserRole } from '@/types'

const { Option } = Select

export default function UsersPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalTitle, setModalTitle] = useState('新增用户')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()
  const [searchUsername, setSearchUsername] = useState('')
  const [searchName, setSearchName] = useState('')
  const [searchAffiliation, setSearchAffiliation] = useState<Affiliation | undefined>(undefined)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  // 检查是否是管理员 - 使用不区分大小写的比较
  useEffect(() => {
    if (session?.user?.role?.toLowerCase() !== UserRole.ADMIN) {
      message.error('您没有权限访问此页面')
      router.push('/dashboard')
    }
  }, [session, router])

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        username: searchUsername || undefined,
        name: searchName || undefined,
        affiliation: searchAffiliation || undefined,
      }
      const response = await axios.get('/api/users', { params })
      setUsers(response.data.users || [])
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0
      }))
    } catch (error) {
      console.error('获取用户列表失败:', error)
      message.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }, [searchUsername, searchName, searchAffiliation, pagination.current, pagination.pageSize])

  useEffect(() => {
    if (session?.user?.role?.toLowerCase() === UserRole.ADMIN) {
      fetchUsers()
    }
  }, [session, fetchUsers])

  const handleSearch = () => {
    fetchUsers()
  }

  const handleReset = () => {
    setSearchUsername('')
    setSearchName('')
    setSearchAffiliation(undefined)
    setPagination({
      current: 1,
      pageSize: 10,
      total: 0
    })
    fetchUsers()
  }

  const showAddModal = () => {
    setModalTitle('新增用户')
    setEditingUser(null)
    form.resetFields()
    setModalVisible(true)
  }

  const showEditModal = (user: User) => {
    setModalTitle('编辑用户')
    setEditingUser(user)
    form.setFieldsValue({
      ...user,
      password: '', // 不显示密码
    })
    setModalVisible(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingUser) {
        // 更新用户
        await axios.put(`/api/users/${editingUser.id}`, values)
        message.success('用户更新成功')
      } else {
        // 创建用户
        await axios.post('/api/users', values)
        message.success('用户创建成功')
      }
      
      setModalVisible(false)
      // 重置到第一页，以显示最新的数据
      setPagination(prev => ({ ...prev, current: 1 }))
      fetchUsers()
    } catch (error) {
      console.error('保存用户失败:', error)
      message.error('保存用户失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/users/${id}`)
      message.success('用户删除成功')
      // 重置到第一页，以避免删除最后一页所有数据后出现空白页
      setPagination(prev => ({ ...prev, current: 1 }))
      fetchUsers()
    } catch (error) {
      console.error('删除用户失败:', error)
      message.error('删除用户失败')
    }
  }

  const handleResetPassword = async (id: string) => {
    try {
      await axios.post(`/api/users/${id}/reset-password`)
      message.success('密码重置成功')
    } catch (error) {
      console.error('重置密码失败:', error)
      message.error('重置密码失败')
    }
  }

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => (
        <Tag color={role === UserRole.ADMIN ? 'red' : role === UserRole.VIEWER ? 'green' : 'blue'}>
          {role === UserRole.ADMIN ? '管理员' : role === UserRole.VIEWER ? '查看员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '隶属',
      dataIndex: 'affiliation',
      key: 'affiliation',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '最后登录时间',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (text: string) => text ? new Date(text).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: React.ReactNode, record: User) => (
        <Space size="small">
          <Button 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => showEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要重置密码吗？"
            onConfirm={() => handleResetPassword(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              icon={<LockOutlined />} 
              size="small"
            >
              重置密码
            </Button>
          </Popconfirm>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              icon={<DeleteOutlined />} 
              size="small"
              danger
              disabled={record.id === session?.user?.id}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  if (session?.user?.role !== UserRole.ADMIN) {
    return null
  }

  return (
    <DashboardLayout>
      <h1 style={{ marginBottom: 24 }}>用户管理</h1>
      
      <Card style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input 
              placeholder="用户名"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              style={{ width: 150 }}
            />
            <Input 
              placeholder="姓名"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              style={{ width: 150 }}
            />
            <Select
              placeholder="选择隶属"
              value={searchAffiliation}
              onChange={(value) => setSearchAffiliation(value)}
              allowClear
              style={{ width: 150 }}
            >
              {Object.values(Affiliation).map((affiliation) => (
                <Option key={affiliation} value={affiliation}>{affiliation}</Option>
              ))}
            </Select>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={showAddModal}
          >
            新增用户
          </Button>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={users} 
          rowKey="id" 
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize
              }))
            },
            onShowSizeChange: (current, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: 1,
                pageSize
              }))
            }
          }}
        />
      </Card>

      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>
          
          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: !editingUser, message: '请输入密码' }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              <Option value={UserRole.ADMIN}>管理员</Option>
              <Option value={UserRole.USER}>普通用户</Option>
              <Option value={UserRole.VIEWER}>查看员</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="affiliation"
            label="隶属"
            rules={[{ required: true, message: '请选择隶属' }]}
          >
            <Select>
              {Object.values(Affiliation).map((affiliation) => (
                <Option key={affiliation} value={affiliation}>{affiliation}</Option>
              ))}
            </Select>
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
        </Form>
      </Modal>
    </DashboardLayout>
  )
}