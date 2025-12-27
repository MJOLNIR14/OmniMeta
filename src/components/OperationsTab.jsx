import React, { useState } from 'react';
import { Lock, Unlock, FileSignature, Check, Minimize2, Maximize2, Eye, EyeOff, Download, Eraser } from 'lucide-react';
import {
  encryptFile,
  decryptFile,
  generateKeyPair,
  signFile,
  verifySignature,
  compressFile,
  decompressFile
} from '../utils/cryptoOperations';
import {
  hideDataInImage,
  extractDataFromImage,
  analyzeImageForSteganography
} from '../utils/steganography';
import './OperationsTab.css';

function OperationsTab({ currentFile }) {
  const [activeOperation, setActiveOperation] = useState(null);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Form states
  const [password, setPassword] = useState('');
  const [keyPair, setKeyPair] = useState(null);
  const [signature, setSignature] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [secretText, setSecretText] = useState('');
  const [extractLength, setExtractLength] = useState(100);

  const downloadFile = (file, filename) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleScrubMetadata = async () => {
  setProcessing(true);
  const scrubbed = await stripMetadata(currentFile);
  setResult(scrubbed);
  setProcessing(false);
};

  const handleEncrypt = async () => {
    if (!password) {
      alert('Please enter a password');
      return;
    }
    
    setProcessing(true);
    const encrypted = await encryptFile(currentFile, password);
    setResult(encrypted);
    setProcessing(false);
  };

  const handleDecrypt = async () => {
    if (!password) {
      alert('Please enter a password');
      return;
    }
    
    setProcessing(true);
    const decrypted = await decryptFile(currentFile, password);
    setResult(decrypted);
    setProcessing(false);
  };

  const handleGenerateKeys = async () => {
    setProcessing(true);
    const keys = await generateKeyPair();
    setKeyPair(keys);
    setResult(keys);
    setProcessing(false);
  };

  const handleSign = async () => {
    if (!keyPair?.privateKey) {
      alert('Generate keys first');
      return;
    }
    
    setProcessing(true);
    const signed = await signFile(currentFile, keyPair.privateKey);
    setSignature(signed.signature);
    setResult(signed);
    setProcessing(false);
  };

  const handleVerify = async () => {
    if (!signature || !publicKey) {
      alert('Enter signature and public key');
      return;
    }
    
    setProcessing(true);
    const verified = await verifySignature(currentFile, signature, publicKey);
    setResult(verified);
    setProcessing(false);
  };

  const handleCompress = async () => {
    setProcessing(true);
    const compressed = await compressFile(currentFile);
    setResult(compressed);
    setProcessing(false);
  };

  const handleDecompress = async () => {
    setProcessing(true);
    const decompressed = await decompressFile(currentFile);
    setResult(decompressed);
    setProcessing(false);
  };

  const handleHideData = async () => {
    if (!secretText) {
      alert('Enter text to hide');
      return;
    }
    
    setProcessing(true);
    try {
      const stego = await hideDataInImage(currentFile, secretText);
      setResult(stego);
    } catch (error) {
      setResult({ error: error.message });
    }
    setProcessing(false);
  };

  const handleExtractData = async () => {
    setProcessing(true);
    try {
      const extracted = await extractDataFromImage(currentFile, extractLength);
      setResult(extracted);
    } catch (error) {
      setResult({ error: error.message });
    }
    setProcessing(false);
  };

  const handleAnalyzeStego = async () => {
    setProcessing(true);
    const analysis = await analyzeImageForSteganography(currentFile);
    setResult(analysis);
    setProcessing(false);
  };

  if (!currentFile) {
    return <div className="tab-empty">No file selected for operations</div>;
  }

  const operations = [
    { id: 'encrypt', label: 'Encrypt File', icon: Lock, color: '#58A6FF' },
    { id: 'decrypt', label: 'Decrypt File', icon: Unlock, color: '#238636' },
    { id: 'sign', label: 'Digital Signature', icon: FileSignature, color: '#A371F7' },
    { id: 'verify', label: 'Verify Signature', icon: Check, color: '#F59E0B' },
    { id: 'compress', label: 'Compress', icon: Minimize2, color: '#EC4899' },
    { id: 'decompress', label: 'Decompress', icon: Maximize2, color: '#10B981' },
    { id: 'hide', label: 'Hide Data (Stego)', icon: EyeOff, color: '#8B5CF6' },
    { id: 'extract', label: 'Extract Hidden Data', icon: Eye, color: '#F97316' },
    { id: 'scrub', label: 'Strip Metadata', icon: Eraser, color: '#DC2626' }
  ];

  return (
    <div className="operations-tab">
      <div className="operations-grid">
        {operations.map(op => {
          const Icon = op.icon;
          return (
            <button
              key={op.id}
              className={`operation-card ${activeOperation === op.id ? 'active' : ''}`}
              onClick={() => {
                setActiveOperation(op.id);
                setResult(null);
              }}
              style={{ '--op-color': op.color }}
            >
              <Icon size={24} />
              <span>{op.label}</span>
            </button>
          );
        })}
      </div>

      {activeOperation && (
        <div className="operation-panel">
          <h3>
            {operations.find(op => op.id === activeOperation)?.label}
          </h3>

          {/* ENCRYPTION */}
          {activeOperation === 'encrypt' && (
            <div className="operation-form">
              <input
                type="password"
                placeholder="Enter encryption password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
              <button onClick={handleEncrypt} className="action-button" disabled={processing}>
                {processing ? 'Encrypting...' : 'Encrypt File'}
              </button>
            </div>
          )}

          {/* DECRYPTION */}
          {activeOperation === 'decrypt' && (
            <div className="operation-form">
              <input
                type="password"
                placeholder="Enter decryption password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
              <button onClick={handleDecrypt} className="action-button" disabled={processing}>
                {processing ? 'Decrypting...' : 'Decrypt File'}
              </button>
            </div>
          )}

          {/* SIGNING */}
          {activeOperation === 'sign' && (
            <div className="operation-form">
              <button onClick={handleGenerateKeys} className="action-button secondary" disabled={processing}>
                {keyPair ? 'Keys Generated ✓' : 'Generate RSA Key Pair'}
              </button>
              {keyPair && (
                <button onClick={handleSign} className="action-button" disabled={processing}>
                  {processing ? 'Signing...' : 'Sign File'}
                </button>
              )}
            </div>
          )}

          {/* VERIFICATION */}
          {activeOperation === 'verify' && (
            <div className="operation-form">
              <textarea
                placeholder="Paste signature here"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="form-textarea"
                rows="4"
              />
              <textarea
                placeholder="Paste public key here"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                className="form-textarea"
                rows="4"
              />
              <button onClick={handleVerify} className="action-button" disabled={processing}>
                {processing ? 'Verifying...' : 'Verify Signature'}
              </button>
            </div>
          )}

          {/* COMPRESSION */}
          {activeOperation === 'compress' && (
            <div className="operation-form">
              <button onClick={handleCompress} className="action-button" disabled={processing}>
                {processing ? 'Compressing...' : 'Compress File (GZIP)'}
              </button>
            </div>
          )}

          {/* DECOMPRESSION */}
          {activeOperation === 'decompress' && (
            <div className="operation-form">
              <button onClick={handleDecompress} className="action-button" disabled={processing}>
                {processing ? 'Decompressing...' : 'Decompress File'}
              </button>
            </div>
          )}

          {/* STEGANOGRAPHY - HIDE */}
          {activeOperation === 'hide' && (
            <div className="operation-form">
              <textarea
                placeholder="Enter secret text to hide in image"
                value={secretText}
                onChange={(e) => setSecretText(e.target.value)}
                className="form-textarea"
                rows="4"
              />
              <button onClick={handleHideData} className="action-button" disabled={processing}>
                {processing ? 'Hiding...' : 'Hide Data in Image'}
              </button>
              <button onClick={handleAnalyzeStego} className="action-button secondary">
                Analyze Image for Steganography
              </button>
            </div>
          )}

          {/* STEGANOGRAPHY - EXTRACT */}
          {activeOperation === 'extract' && (
            <div className="operation-form">
              <input
                type="number"
                placeholder="Expected data length (characters)"
                value={extractLength}
                onChange={(e) => setExtractLength(parseInt(e.target.value))}
                className="form-input"
              />
              <button onClick={handleExtractData} className="action-button" disabled={processing}>
                {processing ? 'Extracting...' : 'Extract Hidden Data'}
              </button>
            </div>
          )}

          {activeOperation === 'scrub' && (
            <div className="operation-form">
                <div className="alert alert-warning">
                ⚠️ This will remove ALL metadata including EXIF, GPS, camera info, and timestamps.
                The output will be a clean PNG file.
                </div>
                <button onClick={handleScrubMetadata} className="action-button" disabled={processing}>
                {processing ? 'Scrubbing...' : 'Strip All Metadata'}
                </button>
            </div>
          )}

          {/* RESULTS */}
          {result && (
            <div className="operation-result">
              {result.error ? (
                <div className="result-error">
                  ❌ {result.error}
                </div>
              ) : (
                <>
                  <div className="result-success">
                    ✅ Operation completed successfully!
                  </div>
                  
                  {result.file && (
                    <button
                      className="download-button"
                      onClick={() => downloadFile(result.file, result.file.name)}
                    >
                      <Download size={16} />
                      Download {result.file.name}
                    </button>
                  )}

                  <div className="result-details">
                    {Object.entries(result).map(([key, value]) => {
                      if (key === 'file') return null;
                      return (
                        <div key={key} className="result-row">
                          <span className="result-label">{key}:</span>
                          <span className="result-value mono">
                            {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OperationsTab;