import React from 'react';
import './EntropyGauge.css';

function EntropyGauge({ entropy }) {
  const percentage = (entropy / 8) * 100;
  const rotation = (percentage / 100) * 180 - 90;

  const getColor = () => {
    if (entropy < 5) return '#238636';
    if (entropy < 7) return '#D29922';
    return '#F85149';
  };

  const arcLength = percentage * 2.51;

  return (
    <div className="entropy-gauge">
      <div className="gauge-visual">
        <svg viewBox="0 0 200 120" className="gauge-svg">
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={getColor()}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} 251`}
          />
          
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="30"
            stroke="var(--text-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${rotation} 100 100)`}
          />
          
          <circle cx="100" cy="100" r="4" fill="var(--text-primary)" />
        </svg>
        
        <div className="gauge-value">
          <span className="gauge-number">{entropy.toFixed(2)}</span>
          <span className="gauge-label">Shannon Entropy</span>
        </div>
      </div>
      
      <div className="gauge-scale">
        <span>0</span>
        <span>4</span>
        <span>8</span>
      </div>
    </div>
  );
}

export default EntropyGauge;