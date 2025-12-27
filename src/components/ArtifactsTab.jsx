import React from 'react';
import './ArtifactsTab.css';

function ArtifactsTab({ strings, patterns }) {
  if (!strings || !patterns) {
    return <div className="tab-empty">No artifacts extracted</div>;
  }

  return (
    <div className="artifacts-tab">
      {/* Pattern Summary */}
      <div className="pattern-summary">
        <div className="pattern-card">
          <div className="pattern-count">{patterns.urls.length}</div>
          <div className="pattern-label">URLs</div>
        </div>
        <div className="pattern-card">
          <div className="pattern-count">{patterns.emails.length}</div>
          <div className="pattern-label">Emails</div>
        </div>
        <div className="pattern-card">
          <div className="pattern-count">{patterns.ipAddresses.length}</div>
          <div className="pattern-label">IP Addresses</div>
        </div>
        <div className="pattern-card">
          <div className="pattern-count">{patterns.paths.length}</div>
          <div className="pattern-label">File Paths</div>
        </div>
      </div>

      {/* String Log */}
      <div className="string-log">
        <h3 className="log-title">Extracted Strings ({strings.length})</h3>
        <div className="log-container">
          {strings.map((str, index) => (
            <div key={index} className="string-row">
              <span className="string-offset mono">
                {str.offset.toString(16).padStart(8, '0').toUpperCase()}
              </span>
              <span className="string-value">{str.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ArtifactsTab;