import React, { useState } from 'react';
import { Scissors, Download, Search, AlertCircle, FileText, Image as ImageIcon } from 'lucide-react';
import { carveFiles, extractPatterns } from '../utils/fileCarver';
import './FileCarverTab.css';

function FileCarverTab({ file, buffer }) {
  const [carveResults, setCarveResults] = useState(null);
  const [patternResults, setPatternResults] = useState(null);
  const [carving, setCarving] = useState(false);
  const [activeMode, setActiveMode] = useState('carve'); // 'carve' or 'patterns'

  const handleCarveFiles = async () => {
    if (!buffer) {
      alert('File must be analyzed first');
      return;
    }
    
    setCarving(true);
    const results = await carveFiles(buffer);
    setCarveResults(results);
    setCarving(false);
  };

  const handleExtractPatterns = async () => {
    if (!buffer) {
      alert('File must be analyzed first');
      return;
    }
    
    setCarving(true);
    const results = extractPatterns(buffer);
    setPatternResults(results);
    setCarving(false);
  };

  const downloadCarvedFile = (carvedFile, index) => {
    const url = URL.createObjectURL(carvedFile.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carved_${index + 1}_${file.name}.${carvedFile.extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllCarvedFiles = () => {
    carveResults.files.forEach((carvedFile, index) => {
      setTimeout(() => downloadCarvedFile(carvedFile, index), index * 100);
    });
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  if (!file) {
    return <div className="tab-empty">No file selected</div>;
  }

  return (
    <div className="carver-tab">
      {/* Mode Switcher */}
      <div className="carver-mode-switcher">
        <button
          className={`mode-btn ${activeMode === 'carve' ? 'active' : ''}`}
          onClick={() => setActiveMode('carve')}
        >
          <Scissors size={16} />
          File Carving
        </button>
        <button
          className={`mode-btn ${activeMode === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveMode('patterns')}
        >
          <Search size={16} />
          Pattern Extraction
        </button>
      </div>

      {/* FILE CARVING MODE */}
      {activeMode === 'carve' && (
        <div className="carver-section">
          <div className="carver-banner">
            <Scissors size={32} />
            <div>
              <h2>File Carving</h2>
              <p>Extract embedded files from binary data using signature analysis</p>
            </div>
          </div>

          <div className="carver-info-card">
            <h3><AlertCircle size={20} /> What is File Carving?</h3>
            <p>
              File carving is a forensic technique that extracts files from unallocated space or 
              containers by searching for file signatures (magic numbers). This is useful for:
            </p>
            <ul>
              <li>Recovering deleted files</li>
              <li>Extracting embedded images from documents</li>
              <li>Finding hidden data in archives</li>
              <li>Analyzing memory dumps and disk images</li>
            </ul>
          </div>

          <div className="carver-action-card">
            <h3>Supported File Types</h3>
            <div className="supported-types">
              <span className="type-badge">JPEG</span>
              <span className="type-badge">PNG</span>
              <span className="type-badge">GIF</span>
              <span className="type-badge">PDF</span>
              <span className="type-badge">ZIP</span>
            </div>
            <button
              className="carver-btn primary"
              onClick={handleCarveFiles}
              disabled={carving || !buffer}
            >
              {carving ? 'Carving Files...' : 'Start File Carving'}
            </button>
          </div>

          {/* Carving Results */}
          {carveResults && (
            <div className="carver-results">
              <div className="results-header">
                <h3>✂️ Carving Results</h3>
                {carveResults.totalFound > 0 && (
                  <button className="download-all-btn" onClick={downloadAllCarvedFiles}>
                    <Download size={16} />
                    Download All ({carveResults.totalFound})
                  </button>
                )}
              </div>

              {carveResults.totalFound === 0 ? (
                <div className="no-results">
                  <AlertCircle size={48} />
                  <h4>No Embedded Files Found</h4>
                  <p>The file does not contain any detectable embedded files</p>
                </div>
              ) : (
                <>
                  <div className="results-summary">
                    <div className="summary-item">
                      <span className="summary-label">Total Files Found</span>
                      <span className="summary-value">{carveResults.totalFound}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">File Types</span>
                      <span className="summary-value">{carveResults.types.join(', ')}</span>
                    </div>
                  </div>

                  <div className="carved-files-grid">
                    {carveResults.files.map((carved, index) => (
                      <div key={index} className="carved-file-card">
                        <div className="carved-file-header">
                          {carved.type === 'JPEG' || carved.type === 'PNG' || carved.type === 'GIF' ? (
                            <ImageIcon size={24} />
                          ) : (
                            <FileText size={24} />
                          )}
                          <span className="file-type">{carved.type}</span>
                        </div>
                        
                        <div className="carved-file-details">
                          <div className="detail-item">
                            <span className="detail-label">Offset:</span>
                            <span className="detail-value mono">{carved.hexOffset}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Size:</span>
                            <span className="detail-value">{formatBytes(carved.size)}</span>
                          </div>
                        </div>

                        {/* Preview for images */}
                        {(carved.type === 'JPEG' || carved.type === 'PNG' || carved.type === 'GIF') && (
                          <div className="carved-preview">
                            <img
                              src={URL.createObjectURL(carved.blob)}
                              alt={`Carved ${carved.type}`}
                              onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                            />
                          </div>
                        )}

                        <button
                          className="download-carved-btn"
                          onClick={() => downloadCarvedFile(carved, index)}
                        >
                          <Download size={14} />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* PATTERN EXTRACTION MODE */}
      {activeMode === 'patterns' && (
        <div className="carver-section">
          <div className="carver-banner">
            <Search size={32} />
            <div>
              <h2>Pattern Extraction</h2>
              <p>Extract sensitive data patterns like emails, URLs, IPs, credit cards</p>
            </div>
          </div>

          <div className="carver-action-card">
            <h3>Extract Sensitive Patterns</h3>
            <p>Scan the file for common data patterns including:</p>
            <ul>
              <li>📧 Email addresses</li>
              <li>🌐 URLs and web links</li>
              <li>🌍 IP addresses</li>
              <li>💳 Credit card numbers</li>
              <li>📱 Phone numbers</li>
            </ul>
            <button
              className="carver-btn primary"
              onClick={handleExtractPatterns}
              disabled={carving || !buffer}
            >
              {carving ? 'Extracting...' : 'Extract Patterns'}
            </button>
          </div>

          {/* Pattern Results */}
          {patternResults && (
            <div className="pattern-results">
              <h3>🔍 Extracted Patterns</h3>

              {/* Emails */}
              <div className="pattern-category">
                <h4>📧 Email Addresses ({patternResults.emails.length})</h4>
                {patternResults.emails.length > 0 ? (
                  <div className="pattern-list">
                    {patternResults.emails.map((email, idx) => (
                      <div key={idx} className="pattern-item">{email}</div>
                    ))}
                  </div>
                ) : (
                  <p className="no-patterns">No email addresses found</p>
                )}
              </div>

              {/* URLs */}
              <div className="pattern-category">
                <h4>🌐 URLs ({patternResults.urls.length})</h4>
                {patternResults.urls.length > 0 ? (
                  <div className="pattern-list">
                    {patternResults.urls.map((url, idx) => (
                      <div key={idx} className="pattern-item">
                        <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-patterns">No URLs found</p>
                )}
              </div>

              {/* IP Addresses */}
              <div className="pattern-category">
                <h4>🌍 IP Addresses ({patternResults.ipAddresses.length})</h4>
                {patternResults.ipAddresses.length > 0 ? (
                  <div className="pattern-list">
                    {patternResults.ipAddresses.map((ip, idx) => (
                      <div key={idx} className="pattern-item mono">{ip}</div>
                    ))}
                  </div>
                ) : (
                  <p className="no-patterns">No IP addresses found</p>
                )}
              </div>

              {/* Credit Cards */}
              {patternResults.creditCards.length > 0 && (
                <div className="pattern-category sensitive">
                  <h4>💳 Potential Credit Card Numbers ({patternResults.creditCards.length})</h4>
                  <div className="sensitive-warning">
                    ⚠️ Sensitive data detected - handle with care
                  </div>
                  <div className="pattern-list">
                    {patternResults.creditCards.map((cc, idx) => (
                      <div key={idx} className="pattern-item mono">{cc}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phone Numbers */}
              <div className="pattern-category">
                <h4>📱 Phone Numbers ({patternResults.phoneNumbers.length})</h4>
                {patternResults.phoneNumbers.length > 0 ? (
                  <div className="pattern-list">
                    {patternResults.phoneNumbers.map((phone, idx) => (
                      <div key={idx} className="pattern-item mono">{phone}</div>
                    ))}
                  </div>
                ) : (
                  <p className="no-patterns">No phone numbers found</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FileCarverTab;