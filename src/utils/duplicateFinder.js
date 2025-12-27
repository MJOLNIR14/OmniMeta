// Duplicate file detection using hash comparison

export async function findDuplicates(files) {
  console.log('🔍 Scanning for duplicates among', files.length, 'files...');
  
  const fileData = [];
  
  // Calculate hashes for all files
  for (const file of files) {
    const buffer = await file.arrayBuffer();
    const hash = await calculateSHA256(buffer);
    
    fileData.push({
      file,
      hash,
      size: file.size,
      name: file.name
    });
  }
  
  // Group by hash
  const hashGroups = {};
  fileData.forEach(data => {
    if (!hashGroups[data.hash]) {
      hashGroups[data.hash] = [];
    }
    hashGroups[data.hash].push(data);
  });
  
  // Find duplicates
  const duplicateGroups = Object.values(hashGroups).filter(group => group.length > 1);
  const uniqueFiles = Object.values(hashGroups).filter(group => group.length === 1).flat();
  
  // Calculate stats
  const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + (group.length - 1), 0);
  const wastedSpace = duplicateGroups.reduce((sum, group) => {
    return sum + (group[0].size * (group.length - 1));
  }, 0);
  
  return {
    totalFiles: files.length,
    uniqueFiles: uniqueFiles.length,
    duplicateGroups: duplicateGroups.length,
    totalDuplicates,
    wastedSpace,
    groups: duplicateGroups,
    unique: uniqueFiles
  };
}

async function calculateSHA256(buffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Find similar files by size
export function findSimilarBySize(files) {
  const sizeGroups = {};
  
  files.forEach(file => {
    const size = file.size;
    if (!sizeGroups[size]) {
      sizeGroups[size] = [];
    }
    sizeGroups[size].push(file);
  });
  
  // Return groups with more than one file
  const similarGroups = Object.entries(sizeGroups)
    .filter(([size, group]) => group.length > 1)
    .map(([size, group]) => ({
      size: parseInt(size),
      count: group.length,
      files: group
    }));
  
  return {
    totalGroups: similarGroups.length,
    groups: similarGroups
  };
}

// Find files with similar names
export function findSimilarByName(files) {
  const nameGroups = {};
  
  files.forEach(file => {
    // Extract base name without extension and numbers
    const baseName = file.name
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/\d+/g, '') // Remove numbers
      .replace(/[_\-\s]+/g, ' ') // Normalize separators
      .trim()
      .toLowerCase();
    
    if (baseName.length > 0) {
      if (!nameGroups[baseName]) {
        nameGroups[baseName] = [];
      }
      nameGroups[baseName].push(file);
    }
  });
  
  const similarGroups = Object.entries(nameGroups)
    .filter(([name, group]) => group.length > 1)
    .map(([name, group]) => ({
      baseName: name,
      count: group.length,
      files: group
    }));
  
  return {
    totalGroups: similarGroups.length,
    groups: similarGroups
  };
}

// Compare two images for visual similarity (simplified)
export async function compareImages(file1, file2) {
  if (!file1.type.startsWith('image/') || !file2.type.startsWith('image/')) {
    return { error: 'Both files must be images' };
  }
  
  const [data1, data2] = await Promise.all([
    getImageData(file1),
    getImageData(file2)
  ]);
  
  if (!data1 || !data2) {
    return { error: 'Failed to process images' };
  }
  
  // Simple comparison: check if dimensions match
  const dimensionsMatch = data1.width === data2.width && data1.height === data2.height;
  
  // Calculate color similarity
  const colorSimilarity = calculateColorSimilarity(data1, data2);
  
  return {
    dimensionsMatch,
    colorSimilarity,
    similarity: dimensionsMatch ? colorSimilarity : 0,
    verdict: colorSimilarity > 90 ? 'Very Similar' : 
             colorSimilarity > 70 ? 'Similar' : 
             colorSimilarity > 50 ? 'Somewhat Similar' : 'Different'
  };
}

async function getImageData(file) {
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
        resolve({
          width: img.width,
          height: img.height,
          data: imageData.data
        });
      };
      img.onerror = () => resolve(null);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function calculateColorSimilarity(img1, img2) {
  if (img1.width !== img2.width || img1.height !== img2.height) {
    return 0;
  }
  
  const data1 = img1.data;
  const data2 = img2.data;
  let totalDiff = 0;
  const pixels = data1.length / 4;
  
  for (let i = 0; i < data1.length; i += 4) {
    const rDiff = Math.abs(data1[i] - data2[i]);
    const gDiff = Math.abs(data1[i + 1] - data2[i + 1]);
    const bDiff = Math.abs(data1[i + 2] - data2[i + 2]);
    totalDiff += (rDiff + gDiff + bDiff) / 3;
  }
  
  const avgDiff = totalDiff / pixels;
  const similarity = 100 - (avgDiff / 255 * 100);
  
  return similarity.toFixed(2);
}