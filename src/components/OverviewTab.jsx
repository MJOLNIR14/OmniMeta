import React from 'react';
import EntropyGauge from './EntropyGauge';
import './OverviewTab.css';

function OverviewTab({ analysis }) {
  if (!analysis) return null;

  const { metadata } = analysis;

  return (
    <div className="overview-tab">
      {/* Identification Card */}
      <div className="overview-card">
        <h3 className="card-title">Identification</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">File Signature</span>
            <span className="info-value mono">{metadata.forensic.signature}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Detected Type</span>
            <span className="info-value">{metadata.forensic.detectedType}</span>
          </div>
          <div className="info-item">
            <span className="info-label">MIME Type</span>
            <span className="info-value mono">{metadata.basic.type}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Extension</span>
            <span className="info-value">{metadata.basic.extension}</span>
          </div>
        </div>
      </div>

      {/* Forensics Card */}
      <div className="overview-card">
        <h3 className="card-title">Forensic Analysis</h3>
        <div className="forensic-grid">
          <EntropyGauge entropy={parseFloat(metadata.forensic.entropy)} />
          
          <div className="indicator-group">
            <div className="indicator">
              <span className="indicator-label">Compressed</span>
              <span className={`indicator-badge ${metadata.forensic.isCompressed ? 'yes' : 'no'}`}>
                {metadata.forensic.isCompressed ? 'YES' : 'NO'}
              </span>
            </div>
            <div className="indicator">
              <span className="indicator-label">Encrypted</span>
              <span className={`indicator-badge ${metadata.forensic.isEncrypted ? 'warning' : 'no'}`}>
                {metadata.forensic.isEncrypted ? 'POSSIBLE' : 'NO'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Image Geometry (if applicable) */}
      {metadata.image && (
        <div className="overview-card">
          <h3 className="card-title">Visual Geometry</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Dimensions</span>
              <span className="info-value">{metadata.image.width} × {metadata.image.height} px</span>
            </div>
            <div className="info-item">
              <span className="info-label">Aspect Ratio</span>
              <span className="info-value">{metadata.image.aspectRatio}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Megapixels</span>
              <span className="info-value">{metadata.image.megapixels} MP</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OverviewTab;