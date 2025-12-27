import React from 'react';

function HexViewer({ data, maxBytes = 512 }) {
  if (!data) return null;
  
  const bytes = new Uint8Array(data.slice(0, maxBytes));
  const rows = [];
  
  // Create rows of 16 bytes each
  for (let i = 0; i < bytes.length; i += 16) {
    const rowBytes = bytes.slice(i, i + 16);
    rows.push({
      offset: i,
      hex: Array.from(rowBytes).map(b => b.toString(16).padStart(2, '0')),
      ascii: Array.from(rowBytes).map(b => 
        b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'
      )
    });
  }
  
  return (
    <div className="hex-viewer">
      <div className="hex-header">
        <span className="hex-column">Offset</span>
        <span className="hex-column">Hex Dump</span>
        <span className="hex-column">ASCII</span>
      </div>
      
      {rows.map((row, idx) => (
        <div key={idx} className="hex-row">
          <span className="hex-offset">
            {row.offset.toString(16).padStart(8, '0').toUpperCase()}
          </span>
          
          <span className="hex-bytes">
            {row.hex.map((byte, i) => (
              <span key={i} className="hex-byte">{byte}</span>
            ))}
          </span>
          
          <span className="hex-ascii">
            {row.ascii.join('')}
          </span>
        </div>
      ))}
      
      {bytes.length >= maxBytes && (
        <div className="hex-more">
          ... showing first {maxBytes} bytes
        </div>
      )}
    </div>
  );
}

export default HexViewer;