// QR Code generation and scanning for forensic evidence tracking

import QRCode from 'qrcode';

// Generate QR code from file hash (for evidence tracking)
export async function generateQRFromHash(file, hashes) {
  console.log('📱 Generating QR code for:', file.name);
  
  const evidenceData = {
    fileName: file.name,
    fileSize: file.size,
    sha256: hashes.sha256,
    md5: hashes.md5,
    timestamp: new Date().toISOString(),
    caseID: `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
  };
  
  const jsonData = JSON.stringify(evidenceData);
  
  try {
    // Generate QR code as data URL
    const qrDataURL = await QRCode.toDataURL(jsonData, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // High error correction for forensic reliability
    });
    
    return {
      success: true,
      qrCode: qrDataURL,
      data: evidenceData,
      format: 'PNG',
      size: '512x512'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Generate QR from custom text
export async function generateQRFromText(text) {
  try {
    const qrDataURL = await QRCode.toDataURL(text, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M'
    });
    
    return {
      success: true,
      qrCode: qrDataURL,
      text: text
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Scan QR code from image file
export async function scanQRFromImage(file) {
  console.log('🔍 Scanning QR code from:', file.name);
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const img = new Image();
        
        img.onload = async () => {
          // Create canvas to read image data
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Use jsQR to scan (we'll import dynamically)
          const jsQR = await import('jsqr');
          const code = jsQR.default(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            // Try to parse as JSON (evidence data)
            let parsedData = null;
            try {
              parsedData = JSON.parse(code.data);
            } catch (e) {
              // Not JSON, just plain text
            }
            
            resolve({
              success: true,
              found: true,
              data: code.data,
              parsed: parsedData,
              location: {
                topLeft: code.location.topLeftCorner,
                topRight: code.location.topRightCorner,
                bottomLeft: code.location.bottomLeftCorner,
                bottomRight: code.location.bottomRightCorner
              }
            });
          } else {
            resolve({
              success: true,
              found: false,
              message: 'No QR code detected in image'
            });
          }
        };
        
        img.onerror = () => {
          resolve({
            success: false,
            error: 'Failed to load image'
          });
        };
        
        img.src = e.target.result;
      } catch (error) {
        resolve({
          success: false,
          error: error.message
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read file'
      });
    };
    
    reader.readAsDataURL(file);
  });
}

// Verify evidence integrity using QR code data
export function verifyEvidence(qrData, currentFile, currentHashes) {
  if (!qrData.parsed) {
    return {
      verified: false,
      reason: 'QR code does not contain evidence data'
    };
  }
  
  const checks = {
    fileNameMatch: qrData.parsed.fileName === currentFile.name,
    fileSizeMatch: qrData.parsed.fileSize === currentFile.size,
    sha256Match: qrData.parsed.sha256 === currentHashes.sha256,
    md5Match: qrData.parsed.md5 === currentHashes.md5
  };
  
  const allPassed = Object.values(checks).every(check => check);
  
  return {
    verified: allPassed,
    checks,
    originalTimestamp: qrData.parsed.timestamp,
    caseID: qrData.parsed.caseID,
    issues: Object.entries(checks)
      .filter(([key, value]) => !value)
      .map(([key]) => key)
  };
}