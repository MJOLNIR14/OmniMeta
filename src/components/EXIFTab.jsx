import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Clock, Settings, AlertTriangle, CheckCircle, ExternalLink, Shield, Info, Code } from 'lucide-react';
import { extractEXIF, parseGPSCoordinates } from '../utils/exifExtractor';
import './EXIFTab.css';

function EXIFTab({ file }) {
  const [exifData, setExifData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (file) {
      loadEXIF();
    }
  }, [file]);

  const loadEXIF = async () => {
    setLoading(true);
    try {
      const data = await extractEXIF(file);
      setExifData(data);
    } catch (error) {
      setExifData({ 
        error: 'Failed to extract EXIF data',
        available: false 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!file) {
    return <div className="tab-empty">No file selected</div>;
  }

  if (!file.type.startsWith('image/')) {
    return <div className="tab-empty">EXIF data only available for images</div>;
  }

  if (loading) {
    return (
      <div className="exif-loading">
        <div className="spinner"></div>
        <p>Extracting EXIF data...</p>
      </div>
    );
  }

  if (!exifData || exifData.error) {
    return <div className="tab-empty">{exifData?.error || 'No EXIF data available'}</div>;
  }

  const { 
    available, 
    reason, 
    fileAnalysis, 
    camera, 
    gps, 
    software, 
    forensicAnalysis 
  } = exifData;

  return (
    <div className="exif-tab">
      {/* Status Banner */}
      <div className={`exif-status ${available ? 'has-exif' : 'no-exif'}`}>
        {available ? (
          <>
            <CheckCircle size={24} />
            <div>
              <h3>EXIF Data Found</h3>
              <p>This image contains metadata</p>
            </div>
          </>
        ) : (
          <>
            <AlertTriangle size={24} />
            <div>
              <h3>No EXIF Data</h3>
              <p>{reason || 'This image does not contain EXIF metadata'}</p>
            </div>
          </>
        )}
      </div>

      {/* File Analysis (Always Available) */}
      {fileAnalysis && (
        <>
          {fileAnalysis.dimensions && (
            <div className="exif-section">
              <h3><Camera size={20} /> Image Analysis</h3>
              <div className="exif-grid">
                <div className="exif-item">
                  <span className="exif-label">Dimensions</span>
                  <span className="exif-value">
                    {fileAnalysis.dimensions.width} × {fileAnalysis.dimensions.height} px
                  </span>
                </div>
                <div className="exif-item">
                  <span className="exif-label">Aspect Ratio</span>
                  <span className="exif-value">{fileAnalysis.dimensions.aspectRatio}</span>
                </div>
                <div className="exif-item">
                  <span className="exif-label">Megapixels</span>
                  <span className="exif-value">{fileAnalysis.dimensions.megapixels} MP</span>
                </div>
              </div>
            </div>
          )}

          {fileAnalysis.compression && (
            <div className="exif-section">
              <h3><Settings size={20} /> Technical Analysis</h3>
              <div className="exif-grid">
                <div className="exif-item">
                  <span className="exif-label">Compression Quality</span>
                  <span className="exif-value">{fileAnalysis.compression.quality}</span>
                </div>
                {fileAnalysis.compression.estimatedJPEGQuality && (
                  <div className="exif-item">
                    <span className="exif-label">Est. JPEG Quality</span>
                    <span className="exif-value">{fileAnalysis.compression.estimatedJPEGQuality}%</span>
                  </div>
                )}
                {fileAnalysis.patterns && (
                  <div className="exif-item">
                    <span className="exif-label">Likely Screenshot</span>
                    <span className={`exif-badge ${fileAnalysis.patterns.likelyScreenshot ? 'yes' : 'no'}`}>
                      {fileAnalysis.patterns.likelyScreenshot ? 'YES' : 'NO'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {fileAnalysis.likelySource && fileAnalysis.likelySource.length > 0 && (
            <div className="exif-section">
              <h3><Shield size={20} /> Source Detection</h3>
              <div className="source-list">
                {fileAnalysis.likelySource.map((source, idx) => (
                  <div key={idx} className="source-item">
                    {source}
                  </div>
                ))}
              </div>
            </div>
          )}

          {fileAnalysis.colorAnalysis && (
            <div className="exif-section">
              <h3>🎨 Color Analysis</h3>
              <div className="color-analysis">
                <div className="color-bar">
                  <div
                    className="color-segment"
                    style={{
                      width: '33.33%',
                      background: `rgb(${fileAnalysis.colorAnalysis.averageRed || 0}, 0, 0)`
                    }}
                  >
                    <span>R: {fileAnalysis.colorAnalysis.averageRed || 0}</span>
                  </div>
                  <div
                    className="color-segment"
                    style={{
                      width: '33.33%',
                      background: `rgb(0, ${fileAnalysis.colorAnalysis.averageGreen || 0}, 0)`
                    }}
                  >
                    <span>G: {fileAnalysis.colorAnalysis.averageGreen || 0}</span>
                  </div>
                  <div
                    className="color-segment"
                    style={{
                      width: '33.33%',
                      background: `rgb(0, 0, ${fileAnalysis.colorAnalysis.averageBlue || 0})`
                    }}
                  >
                    <span>B: {fileAnalysis.colorAnalysis.averageBlue || 0}</span>
                  </div>
                </div>
                {fileAnalysis.colorAnalysis.dominantColor && (
                  <p className="dominant-color">
                    Dominant: {fileAnalysis.colorAnalysis.dominantColor}
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Camera Data (If Available) */}
{exifData.available && exifData.camera && Object.keys(exifData.camera).length > 0 && (
  <div className="exif-section">
    <h3><Camera size={20} /> Camera Information</h3>
    <div className="exif-grid">
      {exifData.camera.make && (
        <div className="exif-item">
          <span className="exif-label">Make</span>
          <span className="exif-value">{exifData.camera.make}</span>
        </div>
      )}
      {exifData.camera.model && (
        <div className="exif-item">
          <span className="exif-label">Model</span>
          <span className="exif-value">{exifData.camera.model}</span>
        </div>
      )}
      {exifData.camera.lens && (
        <div className="exif-item">
          <span className="exif-label">Lens</span>
          <span className="exif-value">{exifData.camera.lens}</span>
        </div>
      )}
      {exifData.camera.serialNumber && (
        <div className="exif-item">
          <span className="exif-label">Serial Number</span>
          <span className="exif-value mono">{exifData.camera.serialNumber}</span>
        </div>
      )}
    </div>
  </div>
)}

{/* Camera Settings (If Available) */}
{exifData.available && exifData.settings && Object.keys(exifData.settings).length > 0 && (
  <div className="exif-section">
    <h3><Settings size={20} /> Camera Settings</h3>
    <div className="exif-grid">
      {exifData.settings.iso && (
        <div className="exif-item">
          <span className="exif-label">ISO</span>
          <span className="exif-value">{exifData.settings.iso}</span>
        </div>
      )}
      {exifData.settings.aperture && (
        <div className="exif-item">
          <span className="exif-label">Aperture</span>
          <span className="exif-value">{exifData.settings.aperture}</span>
        </div>
      )}
      {exifData.settings.shutterSpeed && (
        <div className="exif-item">
          <span className="exif-label">Shutter Speed</span>
          <span className="exif-value">{exifData.settings.shutterSpeed}</span>
        </div>
      )}
      {exifData.settings.focalLength && (
        <div className="exif-item">
          <span className="exif-label">Focal Length</span>
          <span className="exif-value">{exifData.settings.focalLength}</span>
        </div>
      )}
      {exifData.settings.flash !== undefined && (
        <div className="exif-item">
          <span className="exif-label">Flash</span>
          <span className="exif-value">{exifData.settings.flash ? 'Fired' : 'Not Fired'}</span>
        </div>
      )}
      {exifData.settings.whiteBalance && (
        <div className="exif-item">
          <span className="exif-label">White Balance</span>
          <span className="exif-value">{exifData.settings.whiteBalance}</span>
        </div>
      )}
    </div>
  </div>
)}

{/* Timestamps (If Available) */}
{exifData.available && exifData.timestamps && Object.keys(exifData.timestamps).length > 0 && (
  <div className="exif-section">
    <h3><Clock size={20} /> Timestamps</h3>
    <div className="exif-grid">
      {exifData.timestamps.taken && (
        <div className="exif-item">
          <span className="exif-label">Date Taken</span>
          <span className="exif-value mono">{new Date(exifData.timestamps.taken).toLocaleString()}</span>
        </div>
      )}
      {exifData.timestamps.created && (
        <div className="exif-item">
          <span className="exif-label">Date Created</span>
          <span className="exif-value mono">{new Date(exifData.timestamps.created).toLocaleString()}</span>
        </div>
      )}
      {exifData.timestamps.modified && (
        <div className="exif-item">
          <span className="exif-label">Date Modified</span>
          <span className="exif-value mono">{new Date(exifData.timestamps.modified).toLocaleString()}</span>
        </div>
      )}
    </div>
  </div>
)}

{/* Advanced Technical Data */}
{exifData.available && exifData.advanced && Object.keys(exifData.advanced).length > 0 && (
  <div className="exif-section">
    <h3><Info size={20} /> Advanced Technical Data</h3>
    <div className="exif-grid">
      {exifData.advanced.width && (
        <div className="exif-item">
          <span className="exif-label">Image Width</span>
          <span className="exif-value">{exifData.advanced.width} px</span>
        </div>
      )}
      {exifData.advanced.height && (
        <div className="exif-item">
          <span className="exif-label">Image Height</span>
          <span className="exif-value">{exifData.advanced.height} px</span>
        </div>
      )}
      {exifData.advanced.orientation && (
        <div className="exif-item">
          <span className="exif-label">Orientation</span>
          <span className="exif-value">{exifData.advanced.orientation}</span>
        </div>
      )}
      {exifData.advanced.colorSpace && (
        <div className="exif-item">
          <span className="exif-label">Color Space</span>
          <span className="exif-value">{exifData.advanced.colorSpace}</span>
        </div>
      )}
      {exifData.advanced.dpi && (
        <div className="exif-item">
          <span className="exif-label">DPI</span>
          <span className="exif-value">{exifData.advanced.dpi}</span>
        </div>
      )}
    </div>
  </div>
)}

{/* RAW EXIF Data Dump (Debug) */}
{exifData.available && exifData.raw && (
  <div className="exif-section">
    <h3><Code size={20} /> Raw EXIF Data (All Fields)</h3>
    <details>
      <summary style={{ cursor: 'pointer', marginBottom: '10px', color: 'var(--action-blue)' }}>
        Click to expand ({Object.keys(exifData.raw).length} fields)
      </summary>
      <div style={{ 
        background: 'var(--midnight-base)', 
        padding: 'var(--space-md)', 
        borderRadius: '8px',
        maxHeight: '400px',
        overflow: 'auto'
      }}>
        <pre style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '0.8rem',
          color: 'var(--text-primary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {JSON.stringify(exifData.raw, null, 2)}
        </pre>
      </div>
    </details>
  </div>
)}

      {/* GPS Data (If Available) */}
      {gps?.found && gps.coordinates && (
        <div className="exif-section highlight">
          <h3><MapPin size={20} /> Location Data (HIGH PRIVACY RISK)</h3>
          <div className="gps-data">
            <p className="gps-coords mono">{gps.coordinates}</p>
            {(() => {
              const parsedCoords = parseGPSCoordinates(gps.coordinates);
              return parsedCoords?.googleMapsUrl ? (
                <a
                  href={parsedCoords.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gps-link"
                >
                  <MapPin size={16} />
                  View on Google Maps
                  <ExternalLink size={14} />
                </a>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* Software/Editing */}
      {software?.editor && (
        <div className="exif-section">
          <h3><Settings size={20} /> Software & Editing</h3>
          <div className="exif-grid">
            <div className="exif-item">
              <span className="exif-label">Editor Detected</span>
              <span className="exif-value">{software.editor}</span>
            </div>
          </div>
        </div>
      )}

      {/* Forensic Analysis */}
      {forensicAnalysis && (
        <>
          {forensicAnalysis.suspiciousPatterns && forensicAnalysis.suspiciousPatterns.length > 0 && (
            <div className="exif-section">
              <h3>🔍 Forensic Analysis</h3>
              <div className="forensic-list">
                <h4>Suspicious Patterns:</h4>
                {forensicAnalysis.suspiciousPatterns.map((pattern, idx) => (
                  <div key={idx} className="forensic-item">• {pattern}</div>
                ))}
              </div>
            </div>
          )}

          {forensicAnalysis.privacyRisks && forensicAnalysis.privacyRisks.length > 0 && (
            <div className="exif-section">
              <h3><Shield size={20} /> Privacy Risk Assessment</h3>
              <div className="privacy-risks">
                {forensicAnalysis.privacyRisks.map((risk, idx) => (
                  <div key={idx} className={`risk-item risk-${risk.level?.toLowerCase() || 'medium'}`}>
                    <div className="risk-header">
                      <span className="risk-level">{risk.level || 'UNKNOWN'}</span>
                      <span className="risk-type">{risk.type || 'Risk'}</span>
                    </div>
                    <p className="risk-description">{risk.description || 'No description available'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {forensicAnalysis.recommendations && forensicAnalysis.recommendations.length > 0 && (
            <div className="exif-section">
              <h3>💡 Recommendations</h3>
              <div className="recommendations">
                {forensicAnalysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="recommendation-item">{rec}</div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default EXIFTab;