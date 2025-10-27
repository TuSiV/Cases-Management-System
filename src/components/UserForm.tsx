'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Row, Col, message } from 'antd';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Affiliation, UserRole } from '@/types';

interface UserFormData {
  username: string;
  name: string;
  password?: string;
  confirmPassword?: string;
  role: UserRole;
  affiliation: Affiliation;
  id?: string;
}

interface UserFormProps {
  initialValues?: Partial<UserFormData>;
  isEdit?: boolean;
  onSubmit: (values: UserFormData) => Promise<void>;
}

const UserForm: React.FC<UserFormProps> = ({ initialValues = {}, isEdit = false, onSubmit }) => {
  const [form] = Form.useForm();
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  
  // 设置初始值
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);
  
  // 表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields() as UserFormData;
      
      setLoading(true);
      await onSubmit(values);
      message.success(isEdit ? '用户更新成功' : '用户创建成功');
      router.push('/dashboard/users');
    } catch (error) {
      console.error('表单提交错误:', error);
      if (error instanceof Error) {
        message.error(error.message || '提交失败，请检查表单');
      } else {
        message.error('提交失败，请检查表单');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 检查是否为管理员
  const isAdmin = session?.user?.role === UserRole.ADMIN;
  
  // 检查是否为编辑自己
  const isSelf = isEdit && session?.user?.id === initialValues?.id;
  
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        role: UserRole.USER,
        ...initialValues
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" disabled={isEdit} />
          </Form.Item>
        </Col>
        
        <Col span={12}>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
        </Col>
      </Row>
      
      {!isEdit && (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="confirmPassword"
              label="确认密码"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="请确认密码" />
            </Form.Item>
          </Col>
        </Row>
      )}
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select 
              placeholder="请选择角色"
              disabled={!isAdmin || (isEdit && isSelf)}
            >
              <Select.Option value={UserRole.ADMIN}>管理员</Select.Option>
              <Select.Option value={UserRole.USER}>普通用户</Select.Option>
              <Select.Option value={UserRole.VIEWER}>查看员</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        
        <Col span={12}>
          <Form.Item
            name="affiliation"
            label="隶属"
            rules={[{ required: true, message: '请选择隶属' }]}
          >
            <Select 
              placeholder="请选择隶属"
              disabled={!isAdmin}
            >
              {Object.values(Affiliation).map(value => (
                <Select.Option key={value} value={value}>{value}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Button type="primary" onClick={handleSubmit} loading={loading}>
          {isEdit ? '更新用户' : '创建用户'}
        </Button>
        <Button style={{ marginLeft: 8 }} onClick={() => router.push('/dashboard/users')}>
          取消
        </Button>
      </div>
    </Form>
  );
};

export default UserForm;