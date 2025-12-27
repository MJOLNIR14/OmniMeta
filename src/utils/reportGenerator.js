// Forensic report generation

export function generateJSONReport(file, analysis, exifData, comparisonData) {
  const report = {
    reportMetadata: {
      generatedAt: new Date().toISOString(),
      generator: 'OmniMeta Forensic Analysis Tool',
      version: '1.0.0',
      analyst: 'Mjolnir14'
    },
    fileInformation: {
      fileName: file.name,
      fileSize: file.size,
      fileSizeFormatted: formatBytes(file.size),
      mimeType: file.type,
      lastModified: new Date(file.lastModified).toISOString(),
      extension: file.name.split('.').pop().toUpperCase()
    },
    forensicAnalysis: {
      fileSignature: analysis?.metadata?.forensic?.signature,
      detectedType: analysis?.metadata?.forensic?.detectedType,
      entropy: analysis?.metadata?.forensic?.entropy,
      isCompressed: analysis?.metadata?.forensic?.isCompressed,
      isEncrypted: analysis?.metadata?.forensic?.isEncrypted,
      randomness: analysis?.metadata?.cryptographic?.randomness
    },
    cryptographicHashes: analysis?.hashes ? {
      md5: analysis.hashes.md5,
      sha1: analysis.hashes.sha1,
      sha256: analysis.hashes.sha256,
      sha384: analysis.hashes.sha384,
      sha512: analysis.hashes.sha512,
      processingTime: analysis.hashes.processingTime + 'ms'
    } : null,
    extractedArtifacts: {
      totalStrings: analysis?.strings?.length || 0,
      urlsFound: analysis?.patterns?.urls?.length || 0,
      emailsFound: analysis?.patterns?.emails?.length || 0,
      ipAddressesFound: analysis?.patterns?.ipAddresses?.length || 0,
      filePathsFound: analysis?.patterns?.paths?.length || 0,
      sampleStrings: analysis?.strings?.slice(0, 50).map(s => ({
        offset: '0x' + s.offset.toString(16).toUpperCase(),
        value: s.value,
        length: s.length
      })) || []
    },
    exifData: exifData ? {
      available: exifData.available,
      stripped: exifData.stripped,
      camera: exifData.camera || null,
      gps: exifData.gps || null,
      software: exifData.software || null,
      forensicAnalysis: exifData.forensicAnalysis || null,
      fileAnalysis: exifData.fileAnalysis || null
    } : null,
    imageMetadata: analysis?.metadata?.image ? {
      width: analysis.metadata.image.width,
      height: analysis.metadata.image.height,
      aspectRatio: analysis.metadata.image.aspectRatio,
      megapixels: analysis.metadata.image.megapixels
    } : null,
    comparisonData: comparisonData || null
  };

  return JSON.stringify(report, null, 2);
}

export function generateHTMLReport(file, analysis, exifData) {
  const timestamp = new Date().toLocaleString();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forensic Report - ${file.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 40px 20px;
            color: #333;
        }
        
        .report-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .report-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-bottom: 4px solid #58A6FF;
        }
        
        .report-header h1 {
            font-size: 2rem;
            margin-bottom: 10px;
        }
        
        .report-header .subtitle {
            opacity: 0.9;
            font-size: 1.1rem;
        }
        
        .report-meta {
            background: #f8f9fa;
            padding: 20px 40px;
            border-bottom: 1px solid #e0e0e0;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        
        .meta-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
        }
        
        .meta-label {
            font-weight: 600;
            color: #666;
        }
        
        .meta-value {
            font-family: 'Courier New', monospace;
            color: #333;
        }
        
        .report-section {
            padding: 30px 40px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .report-section h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.5rem;
            border-bottom: 2px solid #58A6FF;
            padding-bottom: 10px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 15px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 6px;
        }
        
        .info-label {
            font-weight: 600;
            color: #666;
        }
        
        .info-value {
            font-family: 'Courier New', monospace;
            color: #333;
        }
        
        .hash-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            margin-bottom: 10px;
            background: #f8f9fa;
            border-left: 4px solid #58A6FF;
            border-radius: 4px;
        }
        
        .hash-algorithm {
            font-weight: 700;
            color: #667eea;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
        }
        
        .hash-value {
            font-family: 'Courier New', monospace;
            font-size: 0.85rem;
            color: #666;
            word-break: break-all;
            margin-left: 20px;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 700;
        }
        
        .badge-success {
            background: #28a745;
            color: white;
        }
        
        .badge-warning {
            background: #ffc107;
            color: #333;
        }
        
        .badge-danger {
            background: #dc3545;
            color: white;
        }
        
        .badge-info {
            background: #17a2b8;
            color: white;
        }
        
        .alert {
            padding: 15px;
            margin: 15px 0;
            border-radius: 6px;
            border-left: 4px solid;
        }
        
        .alert-warning {
            background: #fff3cd;
            border-color: #ffc107;
            color: #856404;
        }
        
        .alert-success {
            background: #d4edda;
            border-color: #28a745;
            color: #155724;
        }
        
        .report-footer {
            background: #2c3e50;
            color: white;
            padding: 30px 40px;
            text-align: center;
        }
        
        .footer-credit {
            margin-top: 10px;
            opacity: 0.8;
            font-size: 0.9rem;
        }
        
        @media print {
            body {
                padding: 0;
                background: white;
            }
            
            .report-container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Header -->
        <div class="report-header">
            <h1>🔍 Digital Forensic Analysis Report</h1>
            <div class="subtitle">OmniMeta Professional Forensics</div>
        </div>
        
        <!-- Report Metadata -->
        <div class="report-meta">
            <div class="meta-item">
                <span class="meta-label">Report Generated:</span>
                <span class="meta-value">${timestamp}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Analyst:</span>
                <span class="meta-value">Mjolnir14 🌗</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Tool Version:</span>
                <span class="meta-value">OmniMeta v1.0.0</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Case ID:</span>
                <span class="meta-value">${generateCaseID()}</span>
            </div>
        </div>
        
        <!-- File Information -->
        <div class="report-section">
            <h2>📄 File Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">File Name:</span>
                    <span class="info-value">${file.name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">File Size:</span>
                    <span class="info-value">${formatBytes(file.size)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">MIME Type:</span>
                    <span class="info-value">${file.type || 'Unknown'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Extension:</span>
                    <span class="info-value">${file.name.split('.').pop().toUpperCase()}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Last Modified:</span>
                    <span class="info-value">${new Date(file.lastModified).toLocaleString()}</span>
                </div>
            </div>
        </div>
        
        <!-- Forensic Analysis -->
        <div class="report-section">
            <h2>🔍 Forensic Analysis</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">File Signature:</span>
                    <span class="info-value">${analysis?.metadata?.forensic?.signature || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Detected Type:</span>
                    <span class="info-value">${analysis?.metadata?.forensic?.detectedType || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Entropy:</span>
                    <span class="info-value">${analysis?.metadata?.forensic?.entropy || 'N/A'} bits</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Randomness:</span>
                    <span class="info-value">${analysis?.metadata?.cryptographic?.randomness || 'N/A'}</span>
                </div>
            </div>
            
            <div style="margin-top: 20px;">
                ${analysis?.metadata?.forensic?.isCompressed ? 
                    '<div class="alert alert-warning">⚠️ File appears to be compressed</div>' : ''}
                ${analysis?.metadata?.forensic?.isEncrypted ? 
                    '<div class="alert alert-warning">⚠️ File may be encrypted</div>' : ''}
            </div>
        </div>
        
        <!-- Cryptographic Hashes -->
        ${analysis?.hashes ? `
        <div class="report-section">
            <h2>🔐 Cryptographic Hashes</h2>
            <div class="hash-item">
                <span class="hash-algorithm">MD5:</span>
                <span class="hash-value">${analysis.hashes.md5}</span>
            </div>
            <div class="hash-item">
                <span class="hash-algorithm">SHA-1:</span>
                <span class="hash-value">${analysis.hashes.sha1}</span>
            </div>
            <div class="hash-item">
                <span class="hash-algorithm">SHA-256:</span>
                <span class="hash-value">${analysis.hashes.sha256}</span>
            </div>
            <div class="hash-item">
                <span class="hash-algorithm">SHA-384:</span>
                <span class="hash-value">${analysis.hashes.sha384}</span>
            </div>
            <div class="hash-item">
                <span class="hash-algorithm">SHA-512:</span>
                <span class="hash-value">${analysis.hashes.sha512}</span>
            </div>
            <p style="margin-top: 15px; color: #666; font-size: 0.9rem;">
                Processing time: ${analysis.hashes.processingTime}ms
            </p>
        </div>
        ` : ''}
        
        <!-- Extracted Artifacts -->
        ${analysis?.patterns ? `
        <div class="report-section">
            <h2>🔎 Extracted Artifacts</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Total Strings:</span>
                    <span class="info-value">${analysis.strings?.length || 0}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">URLs Found:</span>
                    <span class="info-value">${analysis.patterns.urls?.length || 0}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Emails Found:</span>
                    <span class="info-value">${analysis.patterns.emails?.length || 0}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">IP Addresses:</span>
                    <span class="info-value">${analysis.patterns.ipAddresses?.length || 0}</span>
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- EXIF Data -->
        ${exifData ? `
        <div class="report-section">
            <h2>📸 EXIF & Metadata Analysis</h2>
            ${exifData.available ? 
                '<div class="alert alert-success">✅ EXIF data is present</div>' :
                '<div class="alert alert-warning">⚠️ No EXIF data found (stripped or screenshot)</div>'}
            
            ${exifData.gps?.found ? `
                <div class="alert alert-warning">
                    <strong>⚠️ PRIVACY RISK:</strong> GPS coordinates found in image!<br>
                    Location: ${exifData.gps.coordinates}
                </div>
            ` : ''}
            
            ${exifData.fileAnalysis ? `
                <div class="info-grid" style="margin-top: 15px;">
                    <div class="info-item">
                        <span class="info-label">Dimensions:</span>
                        <span class="info-value">${exifData.fileAnalysis.dimensions.width} × ${exifData.fileAnalysis.dimensions.height} px</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Likely Source:</span>
                        <span class="info-value">${exifData.fileAnalysis.likelySource[0] || 'Unknown'}</span>
                    </div>
                </div>
            ` : ''}
        </div>
        ` : ''}
        
        <!-- Footer -->
        <div class="report-footer">
            <strong>OmniMeta - Professional Digital Forensics</strong>
            <div class="footer-credit">
                Built by Mjolnir14 🌗<br>
                Deep Bitstream Analysis • Chain of Custody • Evidence Integrity
            </div>
        </div>
    </div>
</body>
</html>`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

function generateCaseID() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `CASE-${timestamp}-${random}`;
}