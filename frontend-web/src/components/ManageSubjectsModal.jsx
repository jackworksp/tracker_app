import React, { useState } from 'react';
import { Modal, Button, List, Typography, Empty, Popconfirm, Tooltip } from 'antd';
import {
  Plus, Trash2, Check, BookOpen, GraduationCap, Code, Database,
  Cloud, Cpu, Layers, Lock, Server, Globe, Wrench, Palette,
  Music, Camera, Zap, Heart, Star, Trophy, Target, Lightbulb
} from 'lucide-react';

const { Text } = Typography;

// Icon map for rendering Lucide icons from string names
const ICON_MAP = {
  BookOpen, GraduationCap, Code, Database, Cloud, Cpu,
  Layers, Lock, Server, Globe, Wrench, Palette, Music,
  Camera, Zap, Heart, Star, Trophy, Target, Lightbulb
};

// Helper component to render icon from string name
const SubjectIcon = ({ iconName, size = 24, color = 'white' }) => {
  const Icon = ICON_MAP[iconName] || BookOpen;
  return <Icon size={size} color={color} />;
};

export default function ManageSubjectsModal({ 
  visible, 
  onClose, 
  subjects, 
  onSelect, 
  onDelete, 
  onCreate,
  currentSubject 
}) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Prevent row selection
    try {
      setDeletingId(id);
      await onDelete(id);
    } catch (error) {
      console.error('Failed to delete subject:', error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Modal
      title="Manage Life Areas"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button 
            key="create" 
            type="primary" 
            icon={<Plus size={16} />} 
            onClick={() => {
                onClose();
                onCreate();
            }}
        >
          New Life Area
        </Button>
      ]}
      width={600}
    >
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {subjects.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description="No life areas found. Create one to get started!"
          >
             <Button type="primary" onClick={() => { onClose(); onCreate(); }}>
                Create Now
             </Button>
          </Empty>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={subjects}
            renderItem={(item) => {
                const isSelected = currentSubject?.id === item.id;
                return (
                    <List.Item
                        actions={item.name === 'Home' ? [] : [
                            <Popconfirm
                                title="Delete Life Area"
                                description="Are you sure? This will delete all tasks, activities, and notes for this life area."
                                onConfirm={(e) => handleDelete(item.id, e)}
                                onCancel={(e) => e?.stopPropagation()}
                                okText="Yes, Delete"
                                cancelText="Cancel"
                            >
                                <Button 
                                    danger 
                                    type="text" 
                                    icon={<Trash2 size={16} />}
                                    loading={deletingId === item.id}
                                    onClick={(e) => e.stopPropagation()} 
                                />
                            </Popconfirm>
                        ]}
                        style={{
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(6, 214, 160, 0.1)' : 'transparent',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '8px',
                            border: isSelected ? '1px solid #06d6a0' : '1px solid transparent',
                            transition: 'all 0.2s'
                        }}
                        className="subject-list-item"
                        onClick={() => {
                            onSelect(item.id);
                            onClose();
                        }}
                    >
                        <List.Item.Meta
                            avatar={
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    background: item.color || '#eee',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <SubjectIcon iconName={item.icon || 'BookOpen'} size={20} color="white" />
                                </div>
                            }
                            title={
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Text strong>{item.name}</Text>
                                    {isSelected && <Check size={16} color="#06d6a0" />}
                                </div>
                            }
                            description={item.description || 'No description'}
                        />
                    </List.Item>
                );
            }}
          />
        )}
      </div>
    </Modal>
  );
}
