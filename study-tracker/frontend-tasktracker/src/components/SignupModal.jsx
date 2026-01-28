import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';

export default function SignupModal({ visible, onClose, onSignup, onSwitchToLogin }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await onSignup(values);
      form.resetFields();
      message.success('Account created successfully!');
    } catch (error) {
      message.error(error.message || 'Signup failed');
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
      title="Create Account 🚀"
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
        initialValues={{ name: '', email: '', password: '', confirmPassword: '' }}
      >
        <Form.Item
          label="Full Name"
          name="name"
          rules={[{ required: true, message: 'Please enter your name' }]}
        >
          <Input 
            prefix={<UserOutlined />} 
            placeholder="John Doe" 
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input 
            prefix={<MailOutlined />} 
            placeholder="your.email@example.com" 
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: 'Please enter a password' },
            { min: 6, message: 'Password must be at least 6 characters' }
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="Create a strong password" 
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="Re-enter your password" 
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
            Create Account
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
          </span>
          <Button 
            type="link" 
            onClick={() => {
              handleCancel();
              onSwitchToLogin();
            }}
            style={{ padding: 0 }}
          >
            Login
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
