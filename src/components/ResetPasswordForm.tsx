'use client';

import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useSession } from 'next-auth/react';

interface ResetPasswordData {
  oldPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

interface ResetPasswordFormProps {
  userId: string;
  isSelf?: boolean;
  onSuccess?: (values?: ResetPasswordData) => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ userId, isSelf = false, onSuccess }) => {
  const [form] = Form.useForm();
  // 不需要session，因为isAdmin变量已被移除
  useSession();
  const [loading, setLoading] = useState(false);
  
  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields() as ResetPasswordData;
      
      setLoading(true);
      
      const response = await fetch(`/api/users/${userId}/reset-password`, {        
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '重置密码失败');
      }
      
      message.success('密码重置成功');
      form.resetFields();
      
      if (onSuccess) {
        onSuccess(values);
      }
    } catch (error) {
      console.error('重置密码失败:', error);
      if (error instanceof Error) {
        message.error(error.message || '重置密码失败');
      } else {
        message.error('重置密码失败');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Form
      form={form}
      layout="vertical"
    >
      {isSelf && (
        <Form.Item
          name="oldPassword"
          label="当前密码"
          rules={[{ required: true, message: '请输入当前密码' }]}
        >
          <Input.Password placeholder="请输入当前密码" />
        </Form.Item>
      )}
      
      <Form.Item
        name="newPassword"
        label="新密码"
        rules={[{ required: true, message: '请输入新密码' }]}
      >
        <Input.Password placeholder="请输入新密码" />
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
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的密码不一致'));
            },
          }),
        ]}
      >
        <Input.Password placeholder="请确认新密码" />
      </Form.Item>
      
      <Form.Item>
        <Button type="primary" onClick={handleSubmit} loading={loading}>
          重置密码
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ResetPasswordForm;