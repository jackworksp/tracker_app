import React, { useState } from 'react';
import { Modal, Form, Input, Switch, message } from 'antd';

const { TextArea } = Input;

export default function CreateSubjectModal({ visible, onClose, onSubmit }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onSubmit(values);
      form.resetFields();
      message.success('Subject created successfully!');
      onClose();
    } catch (error) {
      console.error('Form validation failed:', error);
      message.error('Failed to create subject');
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
      title="📚 Create New Subject"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Create Subject"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          icon: '📚',
          color: '#06D6A0',
          seedWithAWS: false,
        }}
      >
        <Form.Item
          name="name"
          label="Subject Name"
          rules={[{ required: true, message: 'Please enter a subject name' }]}
        >
          <Input placeholder="e.g., AWS Developer Associate" size="large" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea 
            rows={3} 
            placeholder="e.g., Preparing for AWS Certified Developer certification"
          />
        </Form.Item>

        <Form.Item
          name="icon"
          label="Icon (Emoji)"
          rules={[{ required: true, message: 'Please enter an icon' }]}
        >
          <Input placeholder="e.g., ☁️, 🐳, 🐍" size="large" maxLength={2} />
        </Form.Item>

        <Form.Item
          name="color"
          label="Color (Hex Code)"
        >
          <Input 
            type="color" 
            size="large"
            style={{ width: '100%', height: '50px', cursor: 'pointer' }}
          />
        </Form.Item>

        <Form.Item
          name="seedWithAWS"
          label="Seed with AWS Topics"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
