import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, message } from 'antd';
import './SessionModal.css';

const { TextArea } = Input;
const { Option } = Select;

export default function AddSessionModal({ visible, onClose, onSubmit, subjectId }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  // Watch type field for UI updates
  const type = Form.useWatch('type', form);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // Format the data for the API
      const sessionData = {
        subject_id: subjectId,
        date: new Date().toISOString().split('T')[0],
        day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        activity: values.activity,
        time_spent: values.timeSpent * 60, // Convert hours to minutes
        topics_covered: values.topics,
        notes: values.notes || '',
        type: values.type || 'STUDY',
        url: values.url || ''
      };
      
      await onSubmit(sessionData);
      form.resetFields();
      message.success('Study session added successfully!');
      onClose();
    } catch (error) {
      console.error('Form validation failed:', error);
      message.error(`Failed to add: ${error.message}`);
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
      title={null}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Save Session"
      width={600}
      className="session-modal"
      footer={null}
    >
      <div className="session-form-container">
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⏱️</span> Log Study Session
        </h3>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Type Selection Pills */}
          <Form.Item name="type" initialValue="STUDY" noStyle>
            <div className="type-selector-pills">
              {['STUDY', 'WATCH', 'READ', 'COURSE'].map(t => (
                <div 
                  key={t}
                  className={`type-pill ${type === t ? 'active' : ''}`}
                  onClick={() => form.setFieldsValue({ type: t })}
                >
                  {t === 'STUDY' && '📚 Study'}
                  {t === 'WATCH' && '📺 Watch'}
                  {t === 'READ' && '📖 Read'}
                  {t === 'COURSE' && '🎓 Course'}
                </div>
              ))}
            </div>
          </Form.Item>

          <div style={{ marginTop: '1.5rem' }}>
             <Form.Item
              name="activity"
              rules={[{ required: true, message: 'Required' }]}
              style={{ marginBottom: '1rem' }}
            >
              <Input 
                placeholder="What did you work on?" 
                size="large" 
                className="custom-input"
                prefix={<span style={{ marginRight: 8 }}>📝</span>}
              />
            </Form.Item>

            <Form.Item name="url" style={{ marginBottom: '1rem' }}>
              <Input 
                placeholder="Link (optional)" 
                className="custom-input"
                prefix={<span style={{ marginRight: 8 }}>🔗</span>}
              />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <Form.Item name="topics" rules={[{ required: true, message: 'Required' }]}>
                <Input 
                  placeholder="Topics (e.g. React, DB)" 
                  className="custom-input"
                  prefix={<span style={{ marginRight: 8 }}>🏷️</span>}
                />
              </Form.Item>
              <Form.Item name="timeSpent" rules={[{ required: true, message: 'Required' }]}>
                <InputNumber 
                  placeholder="Hrs" 
                  min={0.1} 
                  step={0.5} 
                  style={{ width: '100%' }} 
                  className="custom-input"
                  prefix={<span style={{ marginRight: 8 }}>⏳</span>}
                />
              </Form.Item>
            </div>

            <Form.Item name="notes">
              <TextArea 
                placeholder="Key takeaways or notes..." 
                rows={3} 
                className="custom-input"
              />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Session</button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
