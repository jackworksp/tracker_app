import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

export default function LoginForm({ onLogin, onSwitchToSignup, loading: parentLoading }) {
  const [form] = Form.useForm();
  const [localLoading, setLocalLoading] = useState(false);

  const loading = parentLoading || localLoading;

  const handleSubmit = async (values) => {
    setLocalLoading(true);
    try {
      await onLogin(values);
      form.resetFields();
    } catch (error) {
       // Error handling is typically done by parent or global message, 
       // but we can ensure it's logged here if needed.
       // The parent onLogin is expected to handle success/fail logic mostly,
       // but if it throws we catch it.
       console.error("Login Error in Form:", error);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ email: '', password: '' }}
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input 
            prefix={<UserOutlined />} 
            placeholder="your.email@example.com" 
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="Enter your password" 
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            size="large"
            block
            style={{ marginTop: '1rem' }}
          >
            Login
          </Button>
        </Form.Item>

        {onSwitchToSignup && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
                Don't have an account?{' '}
            </span>
            <Button 
                type="link" 
                onClick={onSwitchToSignup}
                style={{ padding: 0 }}
            >
                Sign Up
            </Button>
            </div>
        )}
      </Form>
  );
}
