import React, { useState } from 'react';
import { Modal, Form, Input, Switch, message, Select } from 'antd';
import {
  BookOpen, GraduationCap, Code, Database, Cloud, Cpu,
  Layers, Lock, Server, Globe, Wrench, Palette, Music,
  Camera, Zap, Heart, Star, Trophy, Target, Lightbulb
} from 'lucide-react';

const { TextArea } = Input;

// Available Lucide icons for subjects
const ICON_OPTIONS = [
  { value: 'BookOpen', icon: BookOpen, label: 'Book' },
  { value: 'GraduationCap', icon: GraduationCap, label: 'Education' },
  { value: 'Code', icon: Code, label: 'Code' },
  { value: 'Database', icon: Database, label: 'Database' },
  { value: 'Cloud', icon: Cloud, label: 'Cloud' },
  { value: 'Cpu', icon: Cpu, label: 'CPU' },
  { value: 'Layers', icon: Layers, label: 'Layers' },
  { value: 'Lock', icon: Lock, label: 'Security' },
  { value: 'Server', icon: Server, label: 'Server' },
  { value: 'Globe', icon: Globe, label: 'Web' },
  { value: 'Wrench', icon: Wrench, label: 'Tools' },
  { value: 'Palette', icon: Palette, label: 'Design' },
  { value: 'Music', icon: Music, label: 'Music' },
  { value: 'Camera', icon: Camera, label: 'Media' },
  { value: 'Zap', icon: Zap, label: 'Performance' },
  { value: 'Heart', icon: Heart, label: 'Health' },
  { value: 'Star', icon: Star, label: 'Favorite' },
  { value: 'Trophy', icon: Trophy, label: 'Achievement' },
  { value: 'Target', icon: Target, label: 'Goal' },
  { value: 'Lightbulb', icon: Lightbulb, label: 'Idea' }
];

export default function CreateSubjectModal({ visible, onClose, onSubmit }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await onSubmit(values);
      form.resetFields();
      message.success('Life area created successfully!');
      onClose();
    } catch (error) {
      console.error('Form validation failed:', error);
      message.error('Failed to create life area');
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
      title="Create New Life Area"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Create Life Area"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          icon: 'BookOpen',
          color: '#06D6A0',
          seedWithAWS: false,
        }}
      >
        <Form.Item
          name="name"
          label="Life Area Name"
          rules={[{ required: true, message: 'Please enter a life area name' }]}
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
          label="Icon"
          rules={[{ required: true, message: 'Please select an icon' }]}
        >
          <Select
            size="large"
            placeholder="Select an icon"
            optionLabelProp="label"
          >
            {ICON_OPTIONS.map(({ value, icon: Icon, label }) => (
              <Select.Option key={value} value={value} label={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon size={18} />
                  <span>{label}</span>
                </div>
              </Select.Option>
            ))}
          </Select>
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
