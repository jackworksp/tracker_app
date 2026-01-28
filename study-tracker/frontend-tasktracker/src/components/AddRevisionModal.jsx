import React, { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';

export default function AddRevisionModal({ visible, onClose, onSubmit, subjectId }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const revisionData = {
        subject_id: subjectId,
        title: values.title,
        category: values.category || '',
      };
      
      await onSubmit(revisionData);
      form.resetFields();
      message.success('Revision item added successfully!');
      onClose();
    } catch (error) {
      console.error('Form validation failed:', error);
      message.error('Failed to add revision item');
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
      title="🔄 Add Revision Item"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Add Item"
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="title"
          label="Item Title"
          rules={[{ required: true, message: 'Please enter a title' }]}
        >
          <Input placeholder="e.g., Lambda pricing model" size="large" />
        </Form.Item>

        <Form.Item
          name="category"
          label="Category (Optional)"
        >
          <Input placeholder="e.g., Serverless" size="large" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
