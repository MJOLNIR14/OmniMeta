import React from 'react';
import { Copy, Check } from 'lucide-react';
import './HashesTab.css';

function HashesTab({ hashes }) {
  const [copied, setCopied] = React.useState(null);

  if (!hashes) return <div className="tab-empty">No hash data available</div>;

  const copyToClipboard = (text, algorithm) => {
    navigator.clipboard.writeText(text);
    setCopied(algorithm);
    setTimeout(() => setCopied(null), 2000);
  };

  const hashList = [
    { algorithm: 'MD5', value: hashes.md5, color: '#F85149' },
    { algorithm: 'SHA-1', value: hashes.sha1, color: '#D29922' },
    { algorithm: 'SHA-256', value: hashes.sha256, color: '#58A6FF' },
    { algorithm: 'SHA-384', value: hashes.sha384, color: '#A371F7' },
    { algorithm: 'SHA-512', value: hashes.sha512, color: '#238636' }
  ];

  return (
    <div className="hashes-tab">
      <div className="hash-header">
        <h2>Cryptographic Hashes</h2>
        <div className="hash-meta">
          Processing Time: <span className="mono">{hashes.processingTime}ms</span>
        </div>
      </div>

      <div className="hash-list">
        {hashList.map(hash => (
          <div key={hash.algorithm} className="hash-item">
            <div className="hash-algo" style={{ borderLeftColor: hash.color }}>
              {hash.algorithm}
            </div>
            <div className="hash-value mono">{hash.value}</div>
            <button
              className="hash-copy"
              onClick={() => copyToClipboard(hash.value, hash.algorithm)}
              title="Copy to clipboard"
            >
              {copied === hash.algorithm ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HashesTab;