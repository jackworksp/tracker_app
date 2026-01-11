import React from 'react';
import { Timeline as AntTimeline, Empty } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import './Timeline.css';

export default function Timeline({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="glass-card">
        <Empty 
          description="No study sessions in timeline yet!"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  // Sort sessions by date (newest first)
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  const timelineItems = sortedSessions.map(session => ({
    dot: <ClockCircleOutlined style={{ fontSize: '16px' }} />,
    color: 'green',
    children: (
      <div className="timeline-item-content">
        <div className="timeline-header">
          <div className="timeline-date">
            {new Date(session.date).toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className="timeline-time">
            {Math.floor(session.time_spent / 60)}h {session.time_spent % 60}m
          </div>
        </div>
        <div className="timeline-activity">{session.activity}</div>
        {session.topics_covered && (
          <div className="timeline-topics">
            <strong>Topics:</strong> {session.topics_covered}
          </div>
        )}
        {session.notes && (
          <div className="timeline-notes">
            {session.notes}
          </div>
        )}
      </div>
    ),
  }));

  return (
    <div className="timeline-container glass-card">
      <AntTimeline 
        mode="left"
        items={timelineItems}
      />
    </div>
  );
}
