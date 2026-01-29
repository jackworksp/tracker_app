import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

export default function LoginModal({ visible, onClose, onLogin, onSwitchToSignup }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await onLogin(values);
      form.resetFields();
      message.success('Login successful!');
    } catch (error) {
      message.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Welcome Back! 👋"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={450}
      centered
    >
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

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
          </span>
          <Button 
            type="link" 
            onClick={() => {
              handleCancel();
              onSwitchToSignup();
            }}
            style={{ padding: 0 }}
          >
            Sign Up
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
