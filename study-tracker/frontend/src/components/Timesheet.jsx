import React from 'react';
import { Table, Tag, Empty, Popconfirm, Space, Tooltip } from 'antd';
import { Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import './Timesheet.css';

export default function Timesheet({ sessions, onEdit, onDelete, onRevise }) {
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => (
        <div className="session-date">
          <Calendar size={16} style={{ marginRight: 8 }} />
          {new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </div>
      ),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: 'Day',
      dataIndex: 'day',
      key: 'day',
      render: (day) => <Tag color="blue">{day}</Tag>,
    },
    {
      title: 'Activity',
      dataIndex: 'activity',
      key: 'activity',
      ellipsis: true,
      width: '25%', // More space for activity
    },
    {
      title: 'Time Spent',
      dataIndex: 'time_spent',
      key: 'time_spent',
      width: 120, // Less space for time spent
      render: (minutes) => (
        <div className="time-spent">
          <Clock size={16} style={{ marginRight: 8 }} />
          {Math.floor(minutes / 60)}h {minutes % 60}m
        </div>
      ),
      sorter: (a, b) => a.time_spent - b.time_spent,
    },
    {
      title: 'Revision Count',
      dataIndex: 'revision_count',
      key: 'revision_count',
      width: 140,
      align: 'center',
      render: (count = 0, record) => {
        const revisionCount = count || 0;
        // Calculate background darkness based on count (max at 10 revisions)
        const intensity = Math.min(revisionCount / 10, 1);
        const lightness = 90 - (intensity * 40); // Goes from 90% to 50%
        const saturation = 60 + (intensity * 20); // Goes from 60% to 80%
        
        return (
          <Tooltip title={`Click to add revision (Current: ${revisionCount})`}>
            <button
              onClick={() => onRevise?.(record.id)}
              className="revision-badge"
              style={{
                background: `hsl(145, ${saturation}%, ${lightness}%)`,
                color: revisionCount > 5 ? '#fff' : '#1a5c3a',
              }}
              aria-label={`Revision count: ${revisionCount}. Click to increment`}
            >
              <div className="revision-badge-count">{revisionCount}</div>
              <div className="revision-badge-label">revisions</div>
            </button>
          </Tooltip>
        );
      },
      sorter: (a, b) => (a.revision_count || 0) - (b.revision_count || 0),
    },
    {
      title: 'Topics Covered',
      dataIndex: 'topics_covered',
      key: 'topics_covered',
      ellipsis: true,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit session">
            <button
              onClick={() => onEdit?.(record)}
              className="action-btn action-btn-edit"
              aria-label="Edit session"
            >
              <Edit2 size={16} />
            </button>
          </Tooltip>
          <Popconfirm
            title="Delete session"
            description="Are you sure you want to delete this session?"
            onConfirm={() => onDelete?.(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete session">
              <button
                className="action-btn action-btn-delete"
                aria-label="Delete session"
              >
                <Trash2 size={16} />
              </button>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!sessions || sessions.length === 0) {
    return (
      <div className="glass-card">
        <Empty 
          description="No study sessions yet. Click 'Add Study Session' to get started!"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="timesheet-container">
      <Table 
        columns={columns}
        dataSource={sessions.map(s => ({ ...s, key: s.id }))}
        pagination={false}
        className="study-table"
        scroll={{ y: 600 }}
      />
    </div>
  );
}
