import React from 'react';
import OverviewCards from './OverviewCards';
import './Dashboard.css';

export default function Dashboard({ progress, stats, onAddSession }) {
  return (
    <div className="dashboard-tab">
      <OverviewCards 
        progress={progress} 
        stats={stats} 
        onAddSession={onAddSession} 
      />
      {/* Additional dashboard content can go here */}
    </div>
  );
}
