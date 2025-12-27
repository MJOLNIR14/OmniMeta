import React from 'react';
import './StatusPulse.css';

function StatusPulse({ status = 'ready', message = 'System Ready' }) {
  return (
    <div className="status-pulse">
      <div className={`pulse-indicator ${status}`}>
        <div className="pulse-ring"></div>
        <div className="pulse-dot"></div>
      </div>
      <span className="pulse-text">{message}</span>
    </div>
  );
}

export default StatusPulse;