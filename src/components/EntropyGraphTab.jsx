import React, { useState, useEffect } from 'react';
import { TrendingUp, Info } from 'lucide-react';
import { analyzeEntropyGraph } from '../utils/entropyAnalyzer';
import './EntropyGraphTab.css';

function EntropyGraphTab({ buffer }) {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (buffer) {
      generateGraph();
    }
  }, [buffer]);

  const generateGraph = async () => {
    setLoading(true);
    const data = analyzeEntropyGraph(buffer, 512);
    setGraphData(data);
    setLoading(false);
  };

  if (!buffer) {
    return <div className="tab-empty">No file data available</div>;
  }

  if (loading) {
    return (
      <div className="entropy-loading">
        <div className="spinner"></div>
        <p>Generating entropy graph...</p>
      </div>
    );
  }

  const getColorForEntropy = (entropy) => {
    if (entropy < 4) return '#238636';
    if (entropy < 6) return '#58A6FF';
    if (entropy < 7.5) return '#D29922';
    return '#F85149';
  };

  return (
    <div className="entropy-graph-tab">
      {/* Statistics */}
      <div className="entropy-stats">
        <div className="stat-card">
          <div className="stat-label">Average Entropy</div>
          <div className="stat-value">{graphData.averageEntropy}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Maximum</div>
          <div className="stat-value">{graphData.maxEntropy}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Minimum</div>
          <div className="stat-value">{graphData.minEntropy}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Blocks Analyzed</div>
          <div className="stat-value">{graphData.totalBlocks}</div>
        </div>
      </div>

      {/* Graph */}
      <div className="entropy-graph-container">
        <h3><TrendingUp size={20} /> Entropy Distribution</h3>
        <div className="entropy-graph">
          <svg viewBox={`0 0 ${graphData.dataPoints.length * 2} 160`} className="graph-svg">
            {/* Grid lines */}
            {[0, 2, 4, 6, 8].map((y) => (
              <line
                key={y}
                x1="0"
                y1={160 - (y / 8) * 140}
                x2={graphData.dataPoints.length * 2}
                y2={160 - (y / 8) * 140}
                stroke="var(--border-subtle)"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
            ))}
            
            {/* Y-axis labels */}
            {[0, 2, 4, 6, 8].map((y) => (
              <text
                key={y}
                x="-5"
                y={165 - (y / 8) * 140}
                fill="var(--text-tertiary)"
                fontSize="8"
                textAnchor="end"
              >
                {y}
              </text>
            ))}

            {/* Entropy line */}
            <polyline
              points={graphData.dataPoints
                .map((p, idx) => `${idx * 2},${160 - (p.entropy / 8) * 140}`)
                .join(' ')}
              fill="none"
              stroke="var(--action-blue)"
              strokeWidth="2"
            />

            {/* Area fill */}
            <polygon
              points={
                `0,160 ` +
                graphData.dataPoints
                  .map((p, idx) => `${idx * 2},${160 - (p.entropy / 8) * 140}`)
                  .join(' ') +
                ` ${graphData.dataPoints.length * 2},160`
              }
              fill="var(--action-blue)"
              opacity="0.2"
            />
          </svg>
        </div>
        
        {/* Legend */}
        <div className="entropy-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#238636' }}></div>
            <span>Low (0-4): Plain text, repetitive</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#58A6FF' }}></div>
            <span>Medium (4-6): Mixed data</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#D29922' }}></div>
            <span>High (6-7.5): Compressed</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#F85149' }}></div>
            <span>Very High (7.5-8): Encrypted/Random</span>
          </div>
        </div>
      </div>

      {/* Regions Analysis */}
      <div className="entropy-regions">
        <h3><Info size={20} /> Detected Regions</h3>
        <div className="regions-list">
          {graphData.analysis.regions.map((region, idx) => (
            <div key={idx} className={`region-item region-${region.type}`}>
              <div className="region-header">
                <span className="region-type">{region.type.toUpperCase()}</span>
                <span className="region-range">
                  {region.startPercent.toFixed(1)}% - {region.endPercent?.toFixed(1) || '100'}%
                </span>
              </div>
              <div className="region-entropy">Entropy: {region.entropy.toFixed(4)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      {graphData.analysis.insights.length > 0 && (
        <div className="entropy-insights">
          <h3>💡 Insights</h3>
          {graphData.analysis.insights.map((insight, idx) => (
            <div key={idx} className="insight-item">
              {insight}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EntropyGraphTab;