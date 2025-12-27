import React, { useState } from 'react';
import { QrCode, ScanLine, Download, Upload, CheckCircle, XCircle, Shield } from 'lucide-react';
import { generateQRFromHash, generateQRFromText, scanQRFromImage, verifyEvidence } from '../utils/qrCodeHandler';
import './QRCodeTab.css';

function QRCodeTab({ file, analysis }) {
  const [qrResult, setQrResult] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [customText, setCustomText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeMode, setActiveMode] = useState('generate'); // 'generate' or 'scan'

  const handleGenerateFromHash = async () => {
    if (!analysis?.hashes) {
      alert('File must be analyzed first to generate hash-based QR code');
      return;
    }
    
    setProcessing(true);
    const result = await generateQRFromHash(file, analysis.hashes);
    setQrResult(result);
    setProcessing(false);
  };

  const handleGenerateFromText = async () => {
    if (!customText.trim()) {
      alert('Please enter text to encode');
      return;
    }
    
    setProcessing(true);
    const result = await generateQRFromText(customText);
    setQrResult(result);
    setProcessing(false);
  };

  const handleScanQR = async (e) => {
    const imageFile = e.target.files[0];
    if (!imageFile) return;
    
    setProcessing(true);
    const result = await scanQRFromImage(imageFile);
    
    // If QR contains evidence data, verify against current file
    if (result.found && result.parsed && analysis?.hashes) {
      const verification = verifyEvidence(result, file, analysis.hashes);
      result.verification = verification;
    }
    
    setScanResult(result);
    setProcessing(false);
  };

  const downloadQR = () => {
    if (!qrResult?.qrCode) return;
    
    const link = document.createElement('a');
    link.download = `qr_${file.name}_${Date.now()}.png`;
    link.href = qrResult.qrCode;
    link.click();
  };

  if (!file) {
    return <div className="tab-empty">No file selected</div>;
  }

  return (
    <div className="qr-tab">
      {/* Mode Switcher */}
      <div className="qr-mode-switcher">
        <button
          className={`mode-btn ${activeMode === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveMode('generate')}
        >
          <QrCode size={16} />
          Generate QR Code
        </button>
        <button
          className={`mode-btn ${activeMode === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveMode('scan')}
        >
          <ScanLine size={16} />
          Scan QR Code
        </button>
      </div>

      {/* GENERATE MODE */}
      {activeMode === 'generate' && (
        <div className="qr-section">
          <div className="qr-banner">
            <QrCode size={32} />
            <div>
              <h2>QR Code Generator</h2>
              <p>Generate QR codes for evidence tracking and chain of custody</p>
            </div>
          </div>

          {/* Generate from Hash */}
          <div className="qr-option-card">
            <h3><Shield size={20} /> Evidence Tracking QR</h3>
            <p>Generate QR code containing file hash and metadata for forensic chain of custody</p>
            <button
              className="qr-action-btn primary"
              onClick={handleGenerateFromHash}
              disabled={processing || !analysis?.hashes}
            >
              {processing ? 'Generating...' : 'Generate from File Hash'}
            </button>
            {!analysis?.hashes && (
              <p className="qr-warning">⚠️ File must be analyzed first (check Hashes tab)</p>
            )}
          </div>

          {/* Generate from Custom Text */}
          <div className="qr-option-card">
            <h3><QrCode size={20} /> Custom Text QR</h3>
            <p>Generate QR code from any custom text or URL</p>
            <textarea
              className="qr-text-input"
              placeholder="Enter text, URL, or data to encode..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows="4"
            />
            <button
              className="qr-action-btn secondary"
              onClick={handleGenerateFromText}
              disabled={processing}
            >
              {processing ? 'Generating...' : 'Generate from Text'}
            </button>
          </div>

          {/* QR Result Display */}
          {qrResult && qrResult.success && (
            <div className="qr-result-card">
              <h3>✅ QR Code Generated</h3>
              <div className="qr-display">
                <img src={qrResult.qrCode} alt="Generated QR Code" className="qr-image" />
              </div>
              <button className="qr-download-btn" onClick={downloadQR}>
                <Download size={16} />
                Download QR Code
              </button>
              
              {qrResult.data && (
                <div className="qr-data-preview">
                  <h4>Embedded Data:</h4>
                  <pre>{JSON.stringify(qrResult.data, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SCAN MODE */}
      {activeMode === 'scan' && (
        <div className="qr-section">
          <div className="qr-banner">
            <ScanLine size={32} />
            <div>
              <h2>QR Code Scanner</h2>
              <p>Scan QR codes from images and verify evidence integrity</p>
            </div>
          </div>

          <div className="qr-upload-card">
            <label className="qr-upload-zone">
              <Upload size={48} />
              <p>Upload image containing QR code</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleScanQR}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {processing && (
            <div className="qr-scanning">
              <div className="spinner"></div>
              <p>Scanning QR code...</p>
            </div>
          )}

          {scanResult && !processing && (
            <div className="qr-scan-result">
              {scanResult.found ? (
                <>
                  <div className="scan-status success">
                    <CheckCircle size={32} />
                    <h3>QR Code Detected!</h3>
                  </div>

                  <div className="scan-data-card">
                    <h4>Decoded Data:</h4>
                    <div className="scan-data-content">
                      {scanResult.parsed ? (
                        <pre>{JSON.stringify(scanResult.parsed, null, 2)}</pre>
                      ) : (
                        <p className="scan-text">{scanResult.data}</p>
                      )}
                    </div>
                  </div>

                  {/* Evidence Verification */}
                  {scanResult.verification && (
                    <div className="verification-card">
                      <h3><Shield size={20} /> Evidence Integrity Verification</h3>
                      
                      <div className={`verification-status ${scanResult.verification.verified ? 'verified' : 'failed'}`}>
                        {scanResult.verification.verified ? (
                          <>
                            <CheckCircle size={24} />
                            <span>Evidence Verified - Integrity Intact</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={24} />
                            <span>Verification Failed - File Modified</span>
                          </>
                        )}
                      </div>

                      <div className="verification-checks">
                        <h4>Verification Checks:</h4>
                        {Object.entries(scanResult.verification.checks).map(([check, passed]) => (
                          <div key={check} className={`check-item ${passed ? 'pass' : 'fail'}`}>
                            {passed ? <CheckCircle size={16} /> : <XCircle size={16} />}
                            <span>{check.replace(/([A-Z])/g, ' $1').trim()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="verification-meta">
                        <div className="meta-item">
                          <span className="label">Case ID:</span>
                          <span className="value">{scanResult.verification.caseID}</span>
                        </div>
                        <div className="meta-item">
                          <span className="label">Original Timestamp:</span>
                          <span className="value">{new Date(scanResult.verification.originalTimestamp).toLocaleString()}</span>
                        </div>
                      </div>

                      {!scanResult.verification.verified && (
                        <div className="verification-issues">
                          <h4>⚠️ Issues Detected:</h4>
                          <ul>
                            {scanResult.verification.issues.map((issue, idx) => (
                              <li key={idx}>{issue.replace(/([A-Z])/g, ' $1').trim()}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="scan-status error">
                  <XCircle size={32} />
                  <h3>No QR Code Found</h3>
                  <p>{scanResult.message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QRCodeTab;