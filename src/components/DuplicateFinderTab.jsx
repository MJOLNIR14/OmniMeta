import React, { useState } from 'react';
import { Copy, Trash2, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { findDuplicates, findSimilarBySize, findSimilarByName } from '../utils/duplicateFinder';
import './DuplicateFinderTab.css';

function DuplicateFinderTab({ allFiles }) {
  const [results, setResults] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState('hash'); // 'hash', 'size', 'name'

  const handleScan = async () => {
    if (!allFiles || allFiles.length < 2) {
      alert('Need at least 2 files to find duplicates');
      return;
    }
    
    setScanning(true);
    
    let scanResults;
    if (scanType === 'hash') {
      scanResults = await findDuplicates(allFiles);
    } else if (scanType === 'size') {
      scanResults = findSimilarBySize(allFiles);
    } else if (scanType === 'name') {
      scanResults = findSimilarByName(allFiles);
    }
    
    setResults(scanResults);
    setScanning(false);
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  if (!allFiles || allFiles.length === 0) {
    return (
      <div className="tab-empty">
        <AlertCircle size={48} />
        <h3>No Files Uploaded</h3>
        <p>Upload multiple files to find duplicates</p>
      </div>
    );
  }

  return (
    <div className="duplicate-tab">
      <div className="duplicate-banner">
        <Copy size={32} />
        <div>
          <h2>Duplicate File Finder</h2>
          <p>Find exact duplicates and similar files in your uploads</p>
        </div>
      </div>

      {/* Scan Type Selection */}
      <div className="scan-type-selector">
        <h3>Select Scan Type</h3>
        <div className="scan-types">
          <button
            className={`scan-type-btn ${scanType === 'hash' ? 'active' : ''}`}
            onClick={() => setScanType('hash')}
          >
            <CheckCircle size={20} />
            <div>
              <strong>Hash Comparison</strong>
              <p>Find exact duplicates (100% identical)</p>
            </div>
          </button>
          
          <button
            className={`scan-type-btn ${scanType === 'size' ? 'active' : ''}`}
            onClick={() => setScanType('size')}
          >
            <Search size={20} />
            <div>
              <strong>Size Matching</strong>
              <p>Find files with identical file sizes</p>
            </div>
          </button>
          
          <button
            className={`scan-type-btn ${scanType === 'name' ? 'active' : ''}`}
            onClick={() => setScanType('name')}
          >
            <Copy size={20} />
            <div>
              <strong>Name Similarity</strong>
              <p>Find files with similar names</p>
            </div>
          </button>
        </div>
      </div>

      {/* Scan Button */}
      <div className="scan-action">
        <button
          className="scan-btn"
          onClick={handleScan}
          disabled={scanning}
        >
          {scanning ? 'Scanning...' : `Scan ${allFiles.length} Files`}
        </button>
      </div>

      {/* Results */}
      {results && !scanning && (
        <div className="duplicate-results">
          {/* Hash Scan Results */}
          {scanType === 'hash' && (
            <>
              <div className="results-summary">
                <div className="summary-card">
                  <div className="summary-label">Total Files</div>
                  <div className="summary-value">{results.totalFiles}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Unique Files</div>
                  <div className="summary-value green">{results.uniqueFiles}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Duplicate Files</div>
                  <div className="summary-value red">{results.totalDuplicates}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Wasted Space</div>
                  <div className="summary-value orange">{formatBytes(results.wastedSpace)}</div>
                </div>
              </div>

              {results.duplicateGroups === 0 ? (
                <div className="no-duplicates">
                  <CheckCircle size={48} />
                  <h3>No Duplicates Found!</h3>
                  <p>All {results.totalFiles} files are unique</p>
                </div>
              ) : (
                <div className="duplicate-groups">
                  <h3>🔍 Duplicate Groups ({results.duplicateGroups})</h3>
                  {results.groups.map((group, idx) => (
                    <div key={idx} className="duplicate-group">
                      <div className="group-header">
                        <span className="group-label">
                          Group {idx + 1} • {group.length} identical files
                        </span>
                        <span className="group-size">{formatBytes(group[0].size)}</span>
                      </div>
                      <div className="group-hash">
                        <span className="hash-label">SHA-256:</span>
                        <span className="hash-value mono">{group[0].hash}</span>
                      </div>
                      <div className="group-files">
                        {group.map((item, fileIdx) => (
                          <div key={fileIdx} className="duplicate-file-item">
                            <span className="file-number">{fileIdx + 1}</span>
                            <span className="file-name">{item.name}</span>
                            {fileIdx > 0 && (
                              <span className="duplicate-badge">DUPLICATE</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="group-savings">
                        💾 Can save {formatBytes(group[0].size * (group.length - 1))} by removing duplicates
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Size Scan Results */}
          {scanType === 'size' && (
            <>
              {results.totalGroups === 0 ? (
                <div className="no-duplicates">
                  <CheckCircle size={48} />
                  <h3>No Files with Matching Sizes</h3>
                  <p>All files have unique sizes</p>
                </div>
              ) : (
                <div className="duplicate-groups">
                  <h3>📏 Files with Matching Sizes ({results.totalGroups} groups)</h3>
                  {results.groups.map((group, idx) => (
                    <div key={idx} className="duplicate-group">
                      <div className="group-header">
                        <span className="group-label">
                          {group.count} files with size: {formatBytes(group.size)}
                        </span>
                      </div>
                      <div className="group-files">
                        {group.files.map((file, fileIdx) => (
                          <div key={fileIdx} className="duplicate-file-item">
                            <span className="file-number">{fileIdx + 1}</span>
                            <span className="file-name">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Name Scan Results */}
          {scanType === 'name' && (
            <>
              {results.totalGroups === 0 ? (
                <div className="no-duplicates">
                  <CheckCircle size={48} />
                  <h3>No Similar Names Found</h3>
                  <p>All files have unique naming patterns</p>
                </div>
              ) : (
                <div className="duplicate-groups">
                  <h3>📝 Files with Similar Names ({results.totalGroups} groups)</h3>
                  {results.groups.map((group, idx) => (
                    <div key={idx} className="duplicate-group">
                      <div className="group-header">
                        <span className="group-label">
                          Base name: "{group.baseName}" • {group.count} files
                        </span>
                      </div>
                      <div className="group-files">
                        {group.files.map((file, fileIdx) => (
                          <div key={fileIdx} className="duplicate-file-item">
                            <span className="file-number">{fileIdx + 1}</span>
                            <span className="file-name">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default DuplicateFinderTab;