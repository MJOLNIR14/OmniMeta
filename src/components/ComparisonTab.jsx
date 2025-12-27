import React, { useState } from 'react';
import { Upload, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { compareFiles } from '../utils/fileComparator';
import './ComparisonTab.css';

function ComparisonTab({ currentFile }) {
  const [compareFile, setCompareFile] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [comparing, setComparing] = useState(false);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCompareFile(file);
    setComparing(true);

    try {
      const result = await compareFiles(currentFile, file);
      setComparison(result);
    } catch (error) {
      console.error('Comparison failed:', error);
    }

    setComparing(false);
  };

  if (!currentFile) {
    return <div className="tab-empty">No file selected for comparison</div>;
  }

  return (
    <div className="comparison-tab">
      {/* Upload Second File */}
      {!compareFile && (
        <div className="compare-upload-zone">
          <div className="current-file-card">
            <h3>Current File</h3>
            <div className="file-preview">
              <span className="file-name">{currentFile.name}</span>
              <span className="file-size">{(currentFile.size / 1024).toFixed(2)} KB</span>
            </div>
          </div>

          <div className="vs-divider">VS</div>

          <label className="compare-upload-card">
            <Upload size={32} />
            <p>Select file to compare</p>
            <input
              type="file"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}

      {/* Comparison Results */}
      {comparing && (
        <div className="comparing-state">
          <div className="spinner"></div>
          <p>Comparing files...</p>
        </div>
      )}

      {comparison && !comparing && (
        <div className="comparison-results">
          {/* Summary Cards */}
          <div className="comparison-header">
            <div className="comparison-summary">
              <div className={`summary-card ${comparison.identical ? 'identical' : 'different'}`}>
                {comparison.identical ? (
                  <CheckCircle size={24} />
                ) : (
                  <AlertTriangle size={24} />
                )}
                <div>
                  <div className="summary-label">Status</div>
                  <div className="summary-value">
                    {comparison.identical ? 'IDENTICAL' : 'DIFFERENT'}
                  </div>
                </div>
              </div>

              <div className="summary-card">
                <TrendingUp size={24} />
                <div>
                  <div className="summary-label">Similarity</div>
                  <div className="summary-value">{comparison.similarity}%</div>
                </div>
              </div>

              <div className="summary-card">
                <AlertTriangle size={24} />
                <div>
                  <div className="summary-label">Differences</div>
                  <div className="summary-value">{comparison.totalDifferences.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <button
              className="reset-button"
              onClick={() => {
                setCompareFile(null);
                setComparison(null);
              }}
            >
              Compare Different File
            </button>
          </div>

          {/* Metadata Comparison */}
          <div className="metadata-comparison">
            <h3>Metadata Comparison</h3>
            <div className="metadata-grid">
              <div className="metadata-row">
                <span className="meta-label">File Names</span>
                <span className="meta-value mono">{comparison.file1.name}</span>
                <span className="meta-value mono">{comparison.file2.name}</span>
              </div>
              <div className="metadata-row">
                <span className="meta-label">File Size</span>
                <span className="meta-value">{(comparison.file1.size / 1024).toFixed(2)} KB</span>
                <span className="meta-value">{(comparison.file2.size / 1024).toFixed(2)} KB</span>
              </div>
              <div className="metadata-row">
                <span className="meta-label">Size Delta</span>
                <span className="meta-value" style={{ gridColumn: '2 / 4' }}>
                  {comparison.metadata.sizeDelta > 0 ? '+' : ''}
                  {(comparison.metadata.sizeDelta / 1024).toFixed(2)} KB
                </span>
              </div>
            </div>
          </div>

          {/* Byte Differences */}
          {comparison.differences.length > 0 && (
            <div className="differences-section">
              <h3>Byte-Level Differences (First 100)</h3>
              <div className="differences-table">
                <div className="diff-header">
                  <span>Offset</span>
                  <span>File 1</span>
                  <span>File 2</span>
                  <span>Context</span>
                </div>
                {comparison.differences.slice(0, 100).map((diff, idx) => (
                  <div key={idx} className="diff-row">
                    <span className="mono">{diff.offset.toString(16).padStart(8, '0').toUpperCase()}</span>
                    <span className={`mono ${diff.byte1 === 'EOF' ? 'eof' : ''}`}>{diff.byte1}</span>
                    <span className={`mono ${diff.byte2 === 'EOF' ? 'eof' : ''}`}>{diff.byte2}</span>
                    <span className="mono context">{diff.context.context1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ComparisonTab;