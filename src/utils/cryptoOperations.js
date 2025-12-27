// File encryption, signing, and cryptographic operations

// ============================================
// FILE ENCRYPTION (AES-GCM)
// ============================================

export async function encryptFile(file, password) {
  console.log('🔐 Encrypting file:', file.name);
  
  // Derive encryption key from password
  const key = await deriveKey(password);
  
  // Generate random IV (Initialization Vector)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Read file data
  const fileData = await file.arrayBuffer();
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    fileData
  );
  
  // Combine IV + encrypted data
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);
  
  // Create encrypted file
  const encryptedBlob = new Blob([result], { type: 'application/octet-stream' });
  const encryptedFile = new File([encryptedBlob], file.name + '.encrypted', {
    type: 'application/octet-stream'
  });
  
  return {
    file: encryptedFile,
    originalName: file.name,
    originalSize: file.size,
    encryptedSize: encryptedFile.size,
    algorithm: 'AES-256-GCM',
    ivLength: iv.length
  };
}

export async function decryptFile(file, password) {
  console.log('🔓 Decrypting file:', file.name);
  
  try {
    // Derive decryption key
    const key = await deriveKey(password);
    
    // Read encrypted data
    const encryptedData = await file.arrayBuffer();
    const data = new Uint8Array(encryptedData);
    
    // Extract IV (first 12 bytes)
    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );
    
    // Create decrypted file (remove .encrypted extension)
    const originalName = file.name.replace('.encrypted', '');
    const decryptedBlob = new Blob([decrypted]);
    const decryptedFile = new File([decryptedBlob], originalName);
    
    return {
      file: decryptedFile,
      originalSize: file.size,
      decryptedSize: decryptedFile.size,
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: 'Decryption failed. Wrong password or corrupted file.'
    };
  }
}

async function deriveKey(password) {
  // Convert password to key material
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Derive actual encryption key
  const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// METADATA SCRUBBER - Remove all EXIF/metadata from images
export async function stripMetadata(file) {
  console.log('🧹 Stripping metadata from:', file.name);
  
  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      error: 'Can only strip metadata from images'
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Draw image to canvas (this removes all EXIF)
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Convert back to file
        canvas.toBlob((blob) => {
          const cleanFile = new File([blob], 'clean_' + file.name, {
            type: 'image/png'
          });
          
          resolve({
            success: true,
            file: cleanFile,
            originalSize: file.size,
            cleanSize: cleanFile.size,
            removed: ['EXIF', 'GPS', 'Camera Info', 'Timestamps', 'All Metadata'],
            method: 'Canvas Rerendering (100% metadata removal)'
          });
        }, 'image/png');
      };
      
      img.onerror = () => resolve({
        success: false,
        error: 'Failed to load image'
      });
      
      img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
  });
}

// ============================================
// DIGITAL SIGNATURES (RSA-PSS)
// ============================================

export async function generateKeyPair() {
  console.log('🔑 Generating RSA key pair...');
  
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-PSS',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['sign', 'verify']
  );
  
  // Export keys
  const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  
  return {
    publicKey: arrayBufferToBase64(publicKey),
    privateKey: arrayBufferToBase64(privateKey),
    algorithm: 'RSA-PSS-2048',
    hash: 'SHA-256'
  };
}

export async function signFile(file, privateKeyBase64) {
  console.log('✍️ Signing file:', file.name);
  
  try {
    // Import private key
    const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      { name: 'RSA-PSS', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Read file data
    const fileData = await file.arrayBuffer();
    
    // Sign
    const signature = await crypto.subtle.sign(
      { name: 'RSA-PSS', saltLength: 32 },
      privateKey,
      fileData
    );
    
    return {
      signature: arrayBufferToBase64(signature),
      fileName: file.name,
      fileSize: file.size,
      algorithm: 'RSA-PSS',
      timestamp: new Date().toISOString(),
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: 'Signing failed. Invalid private key.'
    };
  }
}

export async function verifySignature(file, signatureBase64, publicKeyBase64) {
  console.log('✅ Verifying signature for:', file.name);
  
  try {
    // Import public key
    const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      { name: 'RSA-PSS', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    // Read file data
    const fileData = await file.arrayBuffer();
    
    // Convert signature
    const signatureBuffer = base64ToArrayBuffer(signatureBase64);
    
    // Verify
    const valid = await crypto.subtle.verify(
      { name: 'RSA-PSS', saltLength: 32 },
      publicKey,
      signatureBuffer,
      fileData
    );
    
    return {
      valid,
      fileName: file.name,
      algorithm: 'RSA-PSS',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Verification failed. Invalid key or signature.'
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ============================================
// FILE COMPRESSION
// ============================================

export async function compressFile(file) {
  console.log('🗜️ Compressing file:', file.name);
  
  const fileData = await file.arrayBuffer();
  const stream = new Response(fileData).body;
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
  const compressedData = await new Response(compressedStream).arrayBuffer();
  
  const compressedBlob = new Blob([compressedData], { type: 'application/gzip' });
  const compressedFile = new File([compressedBlob], file.name + '.gz', {
    type: 'application/gzip'
  });
  
  const ratio = ((1 - compressedFile.size / file.size) * 100).toFixed(2);
  
  return {
    file: compressedFile,
    originalSize: file.size,
    compressedSize: compressedFile.size,
    ratio: ratio + '%',
    algorithm: 'GZIP'
  };
}

export async function decompressFile(file) {
  console.log('📂 Decompressing file:', file.name);
  
  try {
    const compressedData = await file.arrayBuffer();
    const stream = new Response(compressedData).body;
    const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
    const decompressedData = await new Response(decompressedStream).arrayBuffer();
    
    const originalName = file.name.replace('.gz', '');
    const decompressedBlob = new Blob([decompressedData]);
    const decompressedFile = new File([decompressedBlob], originalName);
    
    return {
      file: decompressedFile,
      compressedSize: file.size,
      decompressedSize: decompressedFile.size,
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: 'Decompression failed. Not a valid GZIP file.'
    };
  }
}