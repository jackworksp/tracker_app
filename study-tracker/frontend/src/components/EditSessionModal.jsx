import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, message } from 'antd';

const { TextArea } = Input;

export default function EditSessionModal({ visible, onClose, onSubmit, session }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Update form when session changes
  useEffect(() => {
    if (session && visible) {
      form.setFieldsValue({
        activity: session.activity,
        topics: session.topics_covered,
        timeSpent: session.time_spent / 60, // Convert minutes to hours
        notes: session.notes || '',
      });
    }
  }, [session, visible, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // Format the data for the API
      const sessionData = {
        activity: values.activity,
        time_spent: values.timeSpent * 60, // Convert hours to minutes
        topics_covered: values.topics,
        notes: values.notes || '',
      };
      
      await onSubmit(sessionData);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Form validation failed:', error);
      message.error('Failed to update study session');
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
      title="✏️ Edit Study Session"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Update Session"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="activity"
          label="Activity / What did you study?"
          rules={[{ required: true, message: 'Please describe your study activity' }]}
        >
          <Input placeholder="e.g., Studied Lambda Functions" size="large" />
        </Form.Item>

        <Form.Item
          name="topics"
          label="Topics Covered"
          rules={[{ required: true, message: 'Please enter topics covered' }]}
        >
          <Input placeholder="e.g., Lambda, API Gateway, DynamoDB" size="large" />
        </Form.Item>

        <Form.Item
          name="timeSpent"
          label="Time Spent (hours)"
          rules={[{ required: true, message: 'Please enter time spent' }]}
        >
          <InputNumber 
            min={0.5} 
            max={24} 
            step={0.5}
            placeholder="e.g., 2"
            size="large"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="notes"
          label="Notes / Comments"
        >
          <TextArea 
            rows={4} 
            placeholder="What did you learn? Any key takeaways?"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
