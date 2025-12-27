// Advanced file comparison for forensics

export async function compareFiles(file1, file2) {
  console.log('🔍 Comparing:', file1.name, 'vs', file2.name);
  
  const [buffer1, buffer2] = await Promise.all([
    file1.arrayBuffer(),
    file2.arrayBuffer()
  ]);
  
  const bytes1 = new Uint8Array(buffer1);
  const bytes2 = new Uint8Array(buffer2);
  
  // Basic comparison
  const identical = buffer1.byteLength === buffer2.byteLength && 
                    bytes1.every((byte, index) => byte === bytes2[index]);
  
  // Calculate similarity
  const similarity = calculateSimilarity(bytes1, bytes2);
  
  // Find byte-level differences
  const differences = findDifferences(bytes1, bytes2);
  
  // Compare metadata
  const metadataComparison = {
    sizeMatch: file1.size === file2.size,
    typeMatch: file1.type === file2.type,
    nameMatch: file1.name === file2.name,
    sizeDelta: file2.size - file1.size,
    timeDelta: file2.lastModified - file1.lastModified
  };
  
  return {
    identical,
    similarity,
    differences: differences.slice(0, 1000), // First 1000 diffs
    totalDifferences: differences.length,
    metadata: metadataComparison,
    file1: { name: file1.name, size: file1.size },
    file2: { name: file2.name, size: file2.size }
  };
}

function calculateSimilarity(bytes1, bytes2) {
  const maxLength = Math.max(bytes1.length, bytes2.length);
  const minLength = Math.min(bytes1.length, bytes2.length);
  
  let matchingBytes = 0;
  
  for (let i = 0; i < minLength; i++) {
    if (bytes1[i] === bytes2[i]) {
      matchingBytes++;
    }
  }
  
  return ((matchingBytes / maxLength) * 100).toFixed(2);
}

function findDifferences(bytes1, bytes2) {
  const differences = [];
  const maxLength = Math.max(bytes1.length, bytes2.length);
  
  for (let i = 0; i < maxLength; i++) {
    const byte1 = i < bytes1.length ? bytes1[i] : null;
    const byte2 = i < bytes2.length ? bytes2[i] : null;
    
    if (byte1 !== byte2) {
      differences.push({
        offset: i,
        byte1: byte1 !== null ? byte1.toString(16).padStart(2, '0').toUpperCase() : 'EOF',
        byte2: byte2 !== null ? byte2.toString(16).padStart(2, '0').toUpperCase() : 'EOF',
        context: getContext(bytes1, bytes2, i)
      });
    }
  }
  
  return differences;
}

function getContext(bytes1, bytes2, offset) {
  const start = Math.max(0, offset - 2);
  const end = Math.min(Math.max(bytes1.length, bytes2.length), offset + 3);
  
  const context1 = Array.from(bytes1.slice(start, end))
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
  
  const context2 = Array.from(bytes2.slice(start, end))
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
  
  return { context1, context2 };
}

// Fuzzy hash for similarity detection (simulated ssdeep)
export function calculateFuzzyHash(buffer) {
  const bytes = new Uint8Array(buffer);
  const blockSize = 64;
  const chunks = [];
  
  for (let i = 0; i < bytes.length; i += blockSize) {
    const chunk = bytes.slice(i, i + blockSize);
    let hash = 0;
    
    for (let j = 0; j < chunk.length; j++) {
      hash = ((hash << 5) - hash) + chunk[j];
      hash = hash & hash;
    }
    
    chunks.push(Math.abs(hash % 64));
  }
  
  return `${blockSize}:${chunks.join('')}`;
}