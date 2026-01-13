import React, { useState } from 'react';
import { Bell, BellRing, X } from 'lucide-react';
import './ReminderPicker.css';

const ReminderPicker = ({ task, onSetReminder, onCancel }) => {
  const [reminderTime, setReminderTime] = useState('');
  const [alertType, setAlertType] = useState('basic');

  const handleSubmit = () => {
    if (!reminderTime) return;
    
    onSetReminder({
      reminder_time: new Date(reminderTime).toISOString(),
      alert_type: alertType
    });
  };

  // Get current datetime for min attribute (ISO format for datetime-local)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="reminder-picker-overlay" onClick={onCancel}>
      <div className="reminder-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reminder-header">
          <h3>Set Reminder</h3>
          <button className="close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="reminder-body">
          {/* Task Title */}
          <div className="reminder-task-info">
            <p className="task-title-preview">{task.title}</p>
          </div>

          {/* Date & Time Picker */}
          <div className="input-group">
            <label>Reminder Time</label>
            <input 
              type="datetime-local"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              min={getMinDateTime()}
              className="datetime-input"
            />
          </div>

          {/* Alert Type Selector */}
          <div className="alert-type-section">
            <label>Alert Type</label>
            
            <div className="alert-options">
              <div 
                className={`alert-option ${alertType === 'basic' ? 'selected' : ''}`}
                onClick={() => setAlertType('basic')}
              >
                <div className="alert-icon basic-icon">
                  <Bell size={32} />
                </div>
                <h4>Basic</h4>
                <p>Single notification tone</p>
              </div>

              <div 
                className={`alert-option ${alertType === 'persistent' ? 'selected' : ''}`}
                onClick={() => setAlertType('persistent')}
              >
                <div className="alert-icon persistent-icon">
                  <BellRing size={32} />
                </div>
                <h4>Persistent</h4>
                <p>Continuous ring until dismissed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="reminder-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSubmit}
            disabled={!reminderTime}
          >
            Set Reminder
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderPicker;
