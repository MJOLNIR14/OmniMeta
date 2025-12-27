// This file is our "detective" - it investigates files!

// Function 1: Calculate SHA-256 hash (like a fingerprint)
export async function calculateHash(file) {
  // Read the file as raw bytes
  const buffer = await file.arrayBuffer();
  
  // Use the browser's built-in crypto to hash it
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  
  // Convert the hash to a readable hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

// Function 2: Calculate entropy (how random/compressed the file is)
export function calculateEntropy(bytes) {
  // Count how many times each byte value appears
  const frequency = {};
  
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    frequency[byte] = (frequency[byte] || 0) + 1;
  }
  
  // Calculate Shannon entropy
  let entropy = 0;
  const length = bytes.length;
  
  for (let byte in frequency) {
    const probability = frequency[byte] / length;
    entropy -= probability * Math.log2(probability);
  }
  
  return entropy.toFixed(4);
}

// Function 3: Get file signature (magic numbers)
export function getFileSignature(bytes) {
  // Read the first 8 bytes and convert to hex
  const signature = Array.from(bytes.slice(0, 8))
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ')
    .toUpperCase();
  
  return signature;
}

// Function 4: Detect file type from signature
export function detectFileType(signature) {
  const signatures = {
    'FF D8 FF': 'JPEG Image',
    '89 50 4E 47': 'PNG Image',
    '47 49 46 38': 'GIF Image',
    '25 50 44 46': 'PDF Document',
    '50 4B 03 04': 'ZIP Archive',
    '50 4B 05 06': 'ZIP Archive (empty)',
    '50 4B 07 08': 'ZIP Archive (spanned)',
    '52 61 72 21': 'RAR Archive',
    '37 7A BC AF': '7-Zip Archive',
    '1F 8B 08': 'GZIP Archive',
    'BM': 'BMP Image',
    '49 49 2A 00': 'TIFF Image (little-endian)',
    '4D 4D 00 2A': 'TIFF Image (big-endian)',
    '00 00 01 00': 'ICO/CUR Image',
    'ID 33': 'MP3 Audio',
    'FF FB': 'MP3 Audio (no ID3)',
    '66 74 79 70': 'MP4/MOV Video',
    '52 49 46 46': 'WAV/AVI/WebP',
  };
  
  // Check if signature matches any known type
  for (let [sig, type] of Object.entries(signatures)) {
    if (signature.startsWith(sig.replace(/ /g, ' '))) {
      return type;
    }
  }
  
  return 'Unknown';
}

// Function 5: Extract image dimensions (if it's an image)
export async function extractImageMetadata(file) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: (img.width / img.height).toFixed(2),
          megapixels: ((img.width * img.height) / 1000000).toFixed(2)
        });
      };
      
      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
  });
}

// MAIN FUNCTION: Extract ALL metadata
export async function extractMetadata(file) {
  console.log('🔍 Starting metadata extraction for:', file.name);
  
  // Read file bytes
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // Get first 8KB for analysis (faster than reading whole file)
  const sampleBytes = bytes.slice(0, Math.min(8192, bytes.length));
  
  // Run all our detective functions!
  const signature = getFileSignature(sampleBytes);
  const detectedType = detectFileType(signature);
  const entropy = calculateEntropy(sampleBytes);
  const hash = await calculateHash(file);
  const imageData = await extractImageMetadata(file);
  
  // Package everything into one object
  return {
    basic: {
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      lastModified: new Date(file.lastModified),
      extension: file.name.split('.').pop().toUpperCase()
    },
    forensic: {
      signature: signature,
      detectedType: detectedType,
      entropy: entropy,
      isCompressed: parseFloat(entropy) > 7.5,
      isEncrypted: parseFloat(entropy) > 7.9
    },
    cryptographic: {
      sha256: hash,
      randomness: (parseFloat(entropy) / 8 * 100).toFixed(1) + '%'
    },
    image: imageData
  };
}