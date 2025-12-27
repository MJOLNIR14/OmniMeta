// Visual entropy analysis across file

export function analyzeEntropyGraph(buffer, blockSize = 256) {
  console.log('📊 Generating entropy graph...');
  
  const bytes = new Uint8Array(buffer);
  const dataPoints = [];
  
  // Calculate entropy for each block
  for (let i = 0; i < bytes.length; i += blockSize) {
    const block = bytes.slice(i, Math.min(i + blockSize, bytes.length));
    const entropy = calculateBlockEntropy(block);
    
    dataPoints.push({
      offset: i,
      entropy: entropy,
      percentage: (i / bytes.length) * 100
    });
  }
  
  return {
    dataPoints,
    blockSize,
    totalBlocks: dataPoints.length,
    averageEntropy: (dataPoints.reduce((sum, p) => sum + p.entropy, 0) / dataPoints.length).toFixed(4),
    maxEntropy: Math.max(...dataPoints.map(p => p.entropy)).toFixed(4),
    minEntropy: Math.min(...dataPoints.map(p => p.entropy)).toFixed(4),
    analysis: analyzeEntropyPattern(dataPoints)
  };
}

function calculateBlockEntropy(block) {
  const frequency = {};
  
  for (let i = 0; i < block.length; i++) {
    const byte = block[i];
    frequency[byte] = (frequency[byte] || 0) + 1;
  }
  
  let entropy = 0;
  const length = block.length;
  
  for (let byte in frequency) {
    const probability = frequency[byte] / length;
    entropy -= probability * Math.log2(probability);
  }
  
  return entropy;
}

function analyzeEntropyPattern(dataPoints) {
  const analysis = {
    regions: [],
    insights: []
  };
  
  let currentRegion = null;
  
  dataPoints.forEach((point, idx) => {
    const type = getEntropyType(point.entropy);
    
    if (!currentRegion || currentRegion.type !== type) {
      if (currentRegion) {
        analysis.regions.push(currentRegion);
      }
      currentRegion = {
        type,
        start: point.offset,
        startPercent: point.percentage,
        entropy: point.entropy
      };
    }
    
    if (idx === dataPoints.length - 1 && currentRegion) {
      currentRegion.end = point.offset;
      currentRegion.endPercent = point.percentage;
      analysis.regions.push(currentRegion);
    }
  });
  
  // Generate insights
  const highEntropyRegions = analysis.regions.filter(r => r.type === 'high').length;
  const lowEntropyRegions = analysis.regions.filter(r => r.type === 'low').length;
  
  if (highEntropyRegions > lowEntropyRegions * 2) {
    analysis.insights.push('File appears to be compressed or encrypted');
  }
  
  if (lowEntropyRegions > highEntropyRegions * 2) {
    analysis.insights.push('File contains significant repetitive data');
  }
  
  const transitions = analysis.regions.length;
  if (transitions > 10) {
    analysis.insights.push('Multiple data types detected - possible container or archive');
  }
  
  return analysis;
}

function getEntropyType(entropy) {
  if (entropy < 4) return 'low';
  if (entropy < 6) return 'medium';
  if (entropy < 7.5) return 'high';
  return 'very-high';
}

export function generateEntropyHeatmap(buffer, width = 64) {
  const bytes = new Uint8Array(buffer);
  const height = Math.ceil(bytes.length / width);
  const heatmap = [];
  
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (idx < bytes.length) {
        row.push(bytes[idx]);
      } else {
        row.push(0);
      }
    }
    heatmap.push(row);
  }
  
  return { heatmap, width, height };
}