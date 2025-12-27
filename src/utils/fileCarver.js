// File carving - extract embedded files from binary data

export async function carveFiles(buffer) {
  console.log('🔪 Carving files from binary data...');
  
  const bytes = new Uint8Array(buffer);
  const carvedFiles = [];
  
  // Define file signatures to look for
  const signatures = [
    { 
      name: 'JPEG',
      header: [0xFF, 0xD8, 0xFF],
      footer: [0xFF, 0xD9],
      extension: 'jpg'
    },
    {
      name: 'PNG',
      header: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      footer: [0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82],
      extension: 'png'
    },
    {
      name: 'GIF',
      header: [0x47, 0x49, 0x46, 0x38],
      footer: [0x00, 0x3B],
      extension: 'gif'
    },
    {
      name: 'PDF',
      header: [0x25, 0x50, 0x44, 0x46],
      footer: [0x25, 0x25, 0x45, 0x4F, 0x46],
      extension: 'pdf'
    },
    {
      name: 'ZIP',
      header: [0x50, 0x4B, 0x03, 0x04],
      footer: [0x50, 0x4B, 0x05, 0x06],
      extension: 'zip'
    }
  ];
  
  // Search for each signature
  for (const sig of signatures) {
    const found = findFilesBySignature(bytes, sig);
    carvedFiles.push(...found);
  }
  
  return {
    totalFound: carvedFiles.length,
    files: carvedFiles,
    types: [...new Set(carvedFiles.map(f => f.type))]
  };
}

function findFilesBySignature(bytes, signature) {
  const files = [];
  let searchStart = 0;
  
  while (searchStart < bytes.length) {
    // Find header
    const headerIndex = findPattern(bytes, signature.header, searchStart);
    
    if (headerIndex === -1) break;
    
    // Find footer
    const footerIndex = findPattern(bytes, signature.footer, headerIndex + signature.header.length);
    
    if (footerIndex === -1) {
      searchStart = headerIndex + signature.header.length;
      continue;
    }
    
    // Extract file data
    const endIndex = footerIndex + signature.footer.length;
    const fileData = bytes.slice(headerIndex, endIndex);
    
    files.push({
      type: signature.name,
      extension: signature.extension,
      offset: headerIndex,
      size: fileData.length,
      data: fileData,
      hexOffset: '0x' + headerIndex.toString(16).toUpperCase(),
      blob: new Blob([fileData], { type: getMimeType(signature.extension) })
    });
    
    searchStart = endIndex;
  }
  
  return files;
}

function findPattern(bytes, pattern, startIndex = 0) {
  for (let i = startIndex; i <= bytes.length - pattern.length; i++) {
    let match = true;
    for (let j = 0; j < pattern.length; j++) {
      if (bytes[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}

function getMimeType(extension) {
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'zip': 'application/zip'
  };
  return mimeTypes[extension] || 'application/octet-stream';
}

// Extract text strings and patterns
export function extractPatterns(buffer) {
  const bytes = new Uint8Array(buffer);
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  
  const patterns = {
    emails: [],
    urls: [],
    ipAddresses: [],
    creditCards: [],
    phoneNumbers: []
  };
  
  // Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  patterns.emails = [...new Set((text.match(emailRegex) || []))];
  
  // URLs
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
  patterns.urls = [...new Set((text.match(urlRegex) || []))];
  
  // IP Addresses
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  patterns.ipAddresses = [...new Set((text.match(ipRegex) || []))].filter(ip => {
    const parts = ip.split('.').map(Number);
    return parts.every(p => p >= 0 && p <= 255);
  });
  
  // Credit card numbers (simple pattern)
  const ccRegex = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
  patterns.creditCards = [...new Set((text.match(ccRegex) || []))];
  
  // Phone numbers
  const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
  patterns.phoneNumbers = [...new Set((text.match(phoneRegex) || []))];
  
  return patterns;
}