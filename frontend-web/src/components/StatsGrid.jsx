import React from 'react';
import './StatsGrid.css';

export default function StatsGrid({ stats }) {
  const statCards = [
    {
      icon: '📚',
      value: stats.studyDays || 0,
      label: 'Study Days',
      color: 'var(--color-primary)'
    },
    {
      icon: '✅',
      value: `${stats.completedTopics || 0}/${stats.totalTopics || 0}`,
      label: 'Topics Completed',
      color: 'var(--color-success)'
    },
    {
      icon: '📝',
      value: stats.totalSessions || 0,
      label: 'Study Sessions',
      color: 'var(--color-secondary)'
    },
    {
      icon: '🎯',
      value: `${stats.examReadiness || 0}%`,
      label: 'Exam Readiness',
      color: 'var(--color-accent)'
    }
  ];

  return (
    <section className="container">
      <div className="stats-grid fade-in-up">
        {statCards.map((card, index) => (
          <div key={index} className="stat-card" style={{ '--accent-color': card.color }}>
            <div className="stat-card-icon">{card.icon}</div>
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-label">{card.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
