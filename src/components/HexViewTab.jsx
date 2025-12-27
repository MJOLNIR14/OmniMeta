import React from 'react';
import './HexViewTab.css';

function HexViewTab({ buffer }) {
  if (!buffer) {
    return <div className="tab-empty">No binary data available</div>;
  }

  const bytes = new Uint8Array(buffer.slice(0, 4096)); // First 4KB
  const rows = [];

  for (let i = 0; i < bytes.length; i += 16) {
    const rowBytes = bytes.slice(i, i + 16);
    rows.push({
      offset: i,
      hex: Array.from(rowBytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()),
      ascii: Array.from(rowBytes).map(b => 
        b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'
      )
    });
  }

  return (
    <div className="hexview-tab">
      <div className="hexview-header">
        <span className="hex-col-label">Offset</span>
        <span className="hex-col-label">Hex Dump</span>
        <span className="hex-col-label">ASCII</span>
      </div>

      <div className="hexview-body">
        {rows.map((row, idx) => (
          <div key={idx} className="hex-row">
            <span className="hex-offset mono">
              {row.offset.toString(16).padStart(8, '0').toUpperCase()}
            </span>

            <div className="hex-bytes mono">
              {row.hex.map((byte, i) => (
                <span key={i} className="hex-byte">{byte}</span>
              ))}
            </div>

            <span className="hex-ascii mono">
              {row.ascii.join('')}
            </span>
          </div>
        ))}
      </div>

      {bytes.length >= 4096 && (
        <div className="hexview-footer">
          Showing first 4096 bytes
        </div>
      )}
    </div>
  );
}

export default HexViewTab;