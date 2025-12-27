// Hide and extract data from images (LSB Steganography)

export async function hideDataInImage(imageFile, secretText) {
  console.log('🎭 Hiding data in image:', imageFile.name);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Convert secret text to binary
        const binary = textToBinary(secretText);
        
        // Check if image can hold the data
        const maxBits = data.length;
        if (binary.length > maxBits) {
          reject(new Error('Image too small to hide this much data'));
          return;
        }
        
        // Hide data in LSB of RGB channels
        for (let i = 0; i < binary.length; i++) {
          data[i] = (data[i] & 0xFE) | parseInt(binary[i]);
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Convert canvas to file
        canvas.toBlob((blob) => {
          const stegoFile = new File([blob], 'stego_' + imageFile.name, {
            type: 'image/png'
          });
          
          resolve({
            file: stegoFile,
            originalSize: imageFile.size,
            stegoSize: stegoFile.size,
            hiddenBytes: secretText.length,
            hiddenChars: secretText.length,
            capacity: Math.floor(maxBits / 8),
            method: 'LSB (Least Significant Bit)'
          });
        }, 'image/png');
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
}

export async function extractDataFromImage(imageFile, dataLength) {
  console.log('🔍 Extracting hidden data from:', imageFile.name);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Extract LSBs
        let binary = '';
        const bitsToExtract = dataLength * 8;
        
        for (let i = 0; i < bitsToExtract && i < data.length; i++) {
          binary += (data[i] & 1).toString();
        }
        
        // Convert binary to text
        const text = binaryToText(binary);
        
        resolve({
          extractedText: text,
          extractedBytes: text.length,
          method: 'LSB (Least Significant Bit)',
          success: true
        });
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
}

function textToBinary(text) {
  return text.split('').map(char => {
    return char.charCodeAt(0).toString(2).padStart(8, '0');
  }).join('');
}

function binaryToText(binary) {
  const chars = binary.match(/.{1,8}/g);
  if (!chars) return '';
  
  return chars.map(byte => {
    return String.fromCharCode(parseInt(byte, 2));
  }).join('');
}

// Detect if image might contain hidden data
export async function analyzeImageForSteganography(imageFile) {
  console.log('🔬 Analyzing image for steganography:', imageFile.name);
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Analyze LSB distribution
        let onesCount = 0;
        const sampleSize = Math.min(10000, data.length);
        
        for (let i = 0; i < sampleSize; i++) {
          if (data[i] & 1) onesCount++;
        }
        
        const ratio = onesCount / sampleSize;
        const suspicious = Math.abs(ratio - 0.5) > 0.1; // Natural images should be ~50/50
        
        resolve({
          capacity: Math.floor(data.length / 8),
          lsbRatio: (ratio * 100).toFixed(2) + '%',
          suspicious: suspicious,
          suspicionReason: suspicious ? 'LSB distribution is abnormal' : 'LSB distribution appears natural',
          dimensions: { width: canvas.width, height: canvas.height }
        });
      };
      
      img.src = e.target.result;
    };
    
    reader.readAsDataURL(imageFile);
  });
}