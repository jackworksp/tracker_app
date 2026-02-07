import React, { useState } from 'react';
import { Modal, Button, List, Typography, Empty, Popconfirm, Tooltip } from 'antd';
import { Plus, Trash2, Check, BookOpen } from 'lucide-react';

const { Text } = Typography;

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
      title="📚 Manage Subjects"
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
          New Subject
        </Button>
      ]}
      width={600}
    >
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {subjects.length === 0 ? (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description="No subjects found. Create one to get started!"
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
                        actions={[
                            <Popconfirm
                                title="Delete Subject"
                                description="Are you sure? This will delete all tasks, sessions, and notes for this subject."
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
                                    justifyContent: 'center',
                                    fontSize: '1.2rem'
                                }}>
                                    {item.icon || '📚'}
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
