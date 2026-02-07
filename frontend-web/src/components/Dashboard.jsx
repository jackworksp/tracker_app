import React, { memo } from 'react';
import OverviewCards from './OverviewCards';
import './Dashboard.css';

export default memo(function Dashboard({ progress, stats, onAddSession }) {
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
});
