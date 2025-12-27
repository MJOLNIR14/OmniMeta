import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Calendar, TrendingUp, Shield, Info } from 'lucide-react';
import { analyzeTimestamps, buildMultiFileTimeline } from '../utils/timelineAnalyzer';
import './TimelineTab.css';

function TimelineTab({ file, allFiles }) {
  const [timeline, setTimeline] = useState(null);
  const [multiTimeline, setMultiTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'multi'

  useEffect(() => {
    if (file) {
      analyzeSingleFile();
    }
  }, [file]);

  const analyzeSingleFile = async () => {
    setLoading(true);
    const analysis = await analyzeTimestamps(file);
    setTimeline(analysis);
    setLoading(false);
  };

  const analyzeMultipleFiles = async () => {
    if (!allFiles || allFiles.length < 2) {
      alert('Need at least 2 files for multi-file timeline');
      return;
    }
    
    setLoading(true);
    setViewMode('multi');
    const multi = await buildMultiFileTimeline(allFiles);
    setMultiTimeline(multi);
    setLoading(false);
  };

  if (!file) {
    return <div className="tab-empty">No file selected for timeline analysis</div>;
  }

  if (loading) {
    return (
      <div className="timeline-loading">
        <div className="spinner"></div>
        <p>Analyzing timestamps...</p>
      </div>
    );
  }

  return (
    <div className="timeline-tab">
      {/* Mode Switcher */}
      <div className="timeline-mode-switcher">
        <button
          className={`mode-btn ${viewMode === 'single' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('single');
            analyzeSingleFile();
          }}
        >
          <Clock size={16} />
          Single File Analysis
        </button>
        {allFiles && allFiles.length > 1 && (
          <button
            className={`mode-btn ${viewMode === 'multi' ? 'active' : ''}`}
            onClick={analyzeMultipleFiles}
          >
            <Calendar size={16} />
            Multi-File Timeline ({allFiles.length} files)
          </button>
        )}
      </div>

      {/* SINGLE FILE VIEW */}
      {viewMode === 'single' && timeline && (
        <>
          {/* File Info Banner */}
          <div className="timeline-banner">
            <Clock size={32} />
            <div>
              <h2>MACB Timeline Analysis</h2>
              <p>{timeline.file.name} • {(timeline.file.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>

          {/* Primary Timestamp */}
          <div className="timeline-section">
            <h3><Clock size={20} /> Primary File Timestamp</h3>
            <div className="timestamp-card primary">
              <div className="timestamp-header">
                <span className="timestamp-type">Last Modified</span>
                <span className="timestamp-relative">{timeline.timestamps.modified.readable}</span>
              </div>
              <div className="timestamp-details">
                <div className="timestamp-item">
                  <span className="label">Local Time:</span>
                  <span className="value mono">{timeline.timestamps.modified.local}</span>
                </div>
                <div className="timestamp-item">
                  <span className="label">ISO 8601:</span>
                  <span className="value mono">{timeline.timestamps.modified.iso}</span>
                </div>
                <div className="timestamp-item">
                  <span className="label">Unix Timestamp:</span>
                  <span className="value mono">{timeline.timestamps.modified.unix}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Embedded Timestamps */}
          {timeline.timestamps.embedded && timeline.timestamps.embedded.length > 0 && (
            <div className="timeline-section">
              <h3><Calendar size={20} /> Embedded Timestamps ({timeline.timestamps.embedded.length})</h3>
              <div className="embedded-timestamps">
                {timeline.timestamps.embedded.map((ts, idx) => (
                  <div key={idx} className="timestamp-card embedded">
                    <div className="timestamp-header">
                      <span className="timestamp-type">{ts.type}</span>
                      <span className="timestamp-relative">{formatRelativeTime(ts.timestamp)}</span>
                    </div>
                    <div className="timestamp-details">
                      <div className="timestamp-item">
                        <span className="label">Time:</span>
                        <span className="value mono">{ts.timestamp.toLocaleString()}</span>
                      </div>
                      <div className="timestamp-item">
                        <span className="label">Location:</span>
                        <span className="value">{ts.location}</span>
                      </div>
                      <div className="timestamp-item">
                        <span className="label">Raw Value:</span>
                        <span className="value mono">{ts.string}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Analysis */}
          <div className="timeline-section">
            <h3><TrendingUp size={20} /> Timeline Analysis</h3>
            <div className="analysis-grid">
              <div className="analysis-card">
                <div className="analysis-label">Total Timestamps</div>
                <div className="analysis-value">{timeline.analysis.totalTimestamps}</div>
              </div>
              <div className="analysis-card">
                <div className="analysis-label">Time Span</div>
                <div className="analysis-value">{timeline.analysis.timeSpan}</div>
              </div>
              <div className="analysis-card">
                <div className="analysis-label">Oldest Event</div>
                <div className="analysis-value mono small">
                  {timeline.analysis.oldestTimestamp.toLocaleDateString()}
                </div>
              </div>
              <div className="analysis-card">
                <div className="analysis-label">Newest Event</div>
                <div className="analysis-value mono small">
                  {timeline.analysis.newestTimestamp.toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Suspicious Gaps */}
            {timeline.analysis.suspiciousGaps.length > 0 && (
              <div className="suspicious-gaps">
                <h4><AlertTriangle size={16} /> Suspicious Time Gaps Detected</h4>
                {timeline.analysis.suspiciousGaps.map((gap, idx) => (
                  <div key={idx} className="gap-item">
                    <span className="gap-range">
                      {gap.from.toLocaleDateString()} → {gap.to.toLocaleDateString()}
                    </span>
                    <span className="gap-duration">{gap.gap}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flags & Anomalies */}
          {timeline.flags.length > 0 && (
            <div className="timeline-section">
              <h3><Shield size={20} /> Detected Anomalies</h3>
              <div className="flags-list">
                {timeline.flags.map((flag, idx) => (
                  <div key={idx} className={`flag-item flag-${flag.severity.toLowerCase()}`}>
                    <div className="flag-header">
                      <span className="flag-severity">{flag.severity}</span>
                      <span className="flag-type">{flag.type}</span>
                    </div>
                    <div className="flag-description">{flag.description}</div>
                    <div className="flag-impact">Impact: {flag.impact}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visual Timeline */}
          {timeline.timestamps.embedded && timeline.timestamps.embedded.length > 0 && (
            <div className="timeline-section">
              <h3><Calendar size={20} /> Visual Timeline</h3>
              <div className="visual-timeline">
                {renderVisualTimeline(timeline)}
              </div>
            </div>
          )}
        </>
      )}

      {/* MULTI-FILE VIEW */}
      {viewMode === 'multi' && multiTimeline && (
        <>
          <div className="timeline-banner">
            <Calendar size={32} />
            <div>
              <h2>Multi-File Timeline</h2>
              <p>{multiTimeline.totalEvents} events across {allFiles.length} files</p>
            </div>
          </div>

          <div className="timeline-section">
            <h3>Timeline Statistics</h3>
            <div className="analysis-grid">
              <div className="analysis-card">
                <div className="analysis-label">Total Events</div>
                <div className="analysis-value">{multiTimeline.totalEvents}</div>
              </div>
              <div className="analysis-card">
                <div className="analysis-label">Time Span</div>
                <div className="analysis-value">{multiTimeline.timeSpan}</div>
              </div>
              <div className="analysis-card">
                <div className="analysis-label">Oldest Event</div>
                <div className="analysis-value mono small">
                  {multiTimeline.oldestEvent?.timestamp.toLocaleDateString()}
                </div>
              </div>
              <div className="analysis-card">
                <div className="analysis-label">Newest Event</div>
                <div className="analysis-value mono small">
                  {multiTimeline.newestEvent?.timestamp.toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <div className="timeline-section">
            <h3>Chronological Events</h3>
            <div className="events-timeline">
              {multiTimeline.events.map((event, idx) => (
                <div key={idx} className="timeline-event">
                  <div className="event-marker"></div>
                  <div className="event-content">
                    <div className="event-time">{event.timestamp.toLocaleString()}</div>
                    <div className="event-file">{event.file}</div>
                    <div className="event-type">{event.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper function to format relative time
function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (diff < 0) return 'In the future ⚠️';
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}

// Render visual timeline
function renderVisualTimeline(timeline) {
  const allTimestamps = [
    { ...timeline.timestamps.modified, label: 'File Modified' }
  ];

  if (timeline.timestamps.embedded) {
    timeline.timestamps.embedded.forEach(ts => {
      allTimestamps.push({
        timestamp: ts.timestamp,
        label: ts.type
      });
    });
  }

  allTimestamps.sort((a, b) => a.timestamp - b.timestamp);

  const oldest = allTimestamps[0].timestamp.getTime();
  const newest = allTimestamps[allTimestamps.length - 1].timestamp.getTime();
  const range = newest - oldest || 1;

  return (
    <div className="timeline-bar">
      {allTimestamps.map((ts, idx) => {
        const position = ((ts.timestamp.getTime() - oldest) / range) * 100;
        return (
          <div
            key={idx}
            className="timeline-marker"
            style={{ left: `${position}%` }}
            title={`${ts.label}: ${ts.timestamp.toLocaleString()}`}
          >
            <div className="marker-dot"></div>
            <div className="marker-label">{ts.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default TimelineTab;