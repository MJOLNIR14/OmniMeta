import React from 'react';
import { Database, Upload } from 'lucide-react';
import './CommandCenter.css';

function CommandCenter({ onFileSelect }) {
  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFileSelect(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) onFileSelect(files);
  };

  return (
    <div className="command-center">
      <div className="command-card">
        <div className="branding">
          <div className="logo-icon">
            <Database size={48} strokeWidth={1.5} />
          </div>
          <h1 className="logo-text">OmniMeta</h1>
          <p className="tagline">Deep Bitstream Analysis</p>
        </div>

        <label 
          className="ingest-zone"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="ingest-icon">
            <Upload size={32} strokeWidth={1.5} />
          </div>
          <div className="ingest-text">
            <p className="ingest-primary">Drop files to analyze</p>
            <p className="ingest-secondary">or click to browse</p>
          </div>
          <input
            type="file"
            multiple
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </label>

        <div className="command-footer">
          <span className="footer-text">Professional Digital Forensics</span>
          <span className="credit-badge">Built by Mjolnir14 🌗</span>
        </div>
      </div>
    </div>
  );
}

export default CommandCenter;