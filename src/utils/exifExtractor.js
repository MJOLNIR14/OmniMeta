// Real EXIF extraction using exifr library
import * as exifr from 'exifr';

export async function extractEXIF(file) {
  console.log('📸 Extracting EXIF from:', file.name);
  
  if (!file.type.startsWith('image/')) {
    return { error: 'Not an image file', available: false };
  }

  try {
    // Try to parse EXIF data
    const exifData = await exifr.parse(file, {
      tiff: true,
      xmp: true,
      icc: true,
      iptc: true,
      jfif: true,
      ihdr: true,
      gps: true,
      exif: true,
      makerNote: false // Skip proprietary maker notes
    });

    if (!exifData || Object.keys(exifData).length === 0) {
      // No EXIF found
      const fileAnalysis = await analyzeImageWithoutEXIF(file);
      return {
        available: false,
        stripped: true,
        reason: 'No EXIF data found. Likely stripped by social media, screenshot, or image editor.',
        fileAnalysis
      };
    }

    // EXIF data found!
    const organized = organizeEXIFData(exifData);
    const fileAnalysis = await analyzeImageWithoutEXIF(file);
    const forensicAnalysis = await performForensicAnalysis(file, exifData, organized);

    return {
      available: true,
      stripped: false,
      raw: exifData,
      ...organized,
      fileAnalysis,
      forensicAnalysis
    };

  } catch (error) {
    console.error('EXIF parsing error:', error);
    const fileAnalysis = await analyzeImageWithoutEXIF(file);
    return {
      available: false,
      stripped: true,
      error: error.message,
      reason: 'Could not parse EXIF data from this image.',
      fileAnalysis
    };
  }
}

function organizeEXIFData(raw) {
  const organized = {
    camera: {},
    settings: {},
    gps: {},
    timestamps: {},
    software: {},
    advanced: {}
  };

  // Camera Info
  if (raw.Make) organized.camera.make = raw.Make;
  if (raw.Model) organized.camera.model = raw.Model;
  if (raw.LensModel) organized.camera.lens = raw.LensModel;
  if (raw.SerialNumber) organized.camera.serialNumber = raw.SerialNumber;

  // Camera Settings
  if (raw.ISO) organized.settings.iso = raw.ISO;
  if (raw.FNumber) organized.settings.aperture = `f/${raw.FNumber}`;
  if (raw.ExposureTime) organized.settings.shutterSpeed = `${raw.ExposureTime}s`;
  if (raw.FocalLength) organized.settings.focalLength = `${raw.FocalLength}mm`;
  if (raw.Flash) organized.settings.flash = raw.Flash;
  if (raw.WhiteBalance) organized.settings.whiteBalance = raw.WhiteBalance;

  // GPS
  if (raw.latitude && raw.longitude) {
    organized.gps.found = true;
    organized.gps.latitude = raw.latitude;
    organized.gps.longitude = raw.longitude;
    organized.gps.coordinates = `${raw.latitude}, ${raw.longitude}`;
    organized.gps.altitude = raw.GPSAltitude || null;
    organized.gps.googleMapsUrl = `https://www.google.com/maps?q=${raw.latitude},${raw.longitude}`;
  } else {
    organized.gps.found = false;
  }

  // Timestamps
  if (raw.DateTimeOriginal) organized.timestamps.taken = raw.DateTimeOriginal;
  if (raw.CreateDate) organized.timestamps.created = raw.CreateDate;
  if (raw.ModifyDate) organized.timestamps.modified = raw.ModifyDate;

  // Software
  if (raw.Software) organized.software.software = raw.Software;
  if (raw.ProcessingSoftware) organized.software.processor = raw.ProcessingSoftware;
  if (raw.CreatorTool) organized.software.creator = raw.CreatorTool;

  // Advanced
  if (raw.ImageWidth) organized.advanced.width = raw.ImageWidth;
  if (raw.ImageHeight) organized.advanced.height = raw.ImageHeight;
  if (raw.Orientation) organized.advanced.orientation = raw.Orientation;
  if (raw.ColorSpace) organized.advanced.colorSpace = raw.ColorSpace;
  if (raw.XResolution) organized.advanced.dpi = raw.XResolution;

  return organized;
}

async function analyzeImageWithoutEXIF(file) {
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
          dimensions: {
            width: img.width,
            height: img.height,
            aspectRatio: (img.width / img.height).toFixed(3),
            megapixels: ((img.width * img.height) / 1000000).toFixed(2)
          },
          colorAnalysis: analyzeColors(imageData),
          patterns: detectPatterns(imageData, img.width, img.height),
          likelySource: guessSource(file, img.width, img.height)
        });
      };
      
      img.onerror = () => resolve({ error: 'Failed to analyze image' });
      img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
  });
}

function analyzeColors(imageData) {
  const data = imageData.data;
  let r = 0, g = 0, b = 0;
  const pixelCount = data.length / 4;
  
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  
  return {
    averageRed: Math.round(r / pixelCount),
    averageGreen: Math.round(g / pixelCount),
    averageBlue: Math.round(b / pixelCount),
    dominantColor: getDominantColor(r / pixelCount, g / pixelCount, b / pixelCount)
  };
}

function getDominantColor(r, g, b) {
  const max = Math.max(r, g, b);
  if (max === r) return 'Red-dominant';
  if (max === g) return 'Green-dominant';
  return 'Blue-dominant';
}

function detectPatterns(imageData, width, height) {
  const data = imageData.data;
  
  // Check for uniform top border (status bar indicator)
  let topUniform = true;
  const firstPixel = [data[0], data[1], data[2]];
  
  for (let i = 0; i < Math.min(width * 4, 400); i += 4) {
    if (Math.abs(data[i] - firstPixel[0]) > 5 ||
        Math.abs(data[i + 1] - firstPixel[1]) > 5 ||
        Math.abs(data[i + 2] - firstPixel[2]) > 5) {
      topUniform = false;
      break;
    }
  }
  
  return {
    hasUniformBorder: topUniform,
    likelyScreenshot: topUniform && (width % 10 === 0 || height % 10 === 0)
  };
}

function guessSource(file, width, height) {
  const sources = [];
  
  // iPhone resolutions
  const iPhoneResolutions = {
    '1170x2532': 'iPhone 13/14 Pro',
    '1284x2778': 'iPhone 14 Pro Max',
    '1125x2436': 'iPhone X/11 Pro',
    '828x1792': 'iPhone 11',
    '1242x2688': 'iPhone XS Max',
  };
  
  const res = `${width}x${height}`;
  if (iPhoneResolutions[res]) sources.push(iPhoneResolutions[res]);
  
  // Android common
  if (width === 1080 && height === 2400) sources.push('Common Android (FHD+)');
  if (width === 1440 && height === 3200) sources.push('High-end Android (QHD+)');
  
  // Desktop screenshots
  if (width === 1920 && height === 1080) sources.push('Desktop Screenshot (1080p)');
  if (width === 2560 && height === 1440) sources.push('Desktop Screenshot (1440p)');
  if (width === 3840 && height === 2160) sources.push('Desktop Screenshot (4K)');
  
  // Social media
  if (width === 1080 && height === 1080) sources.push('Instagram Square Post');
  if (width === 1080 && height === 1920) sources.push('Instagram Story/TikTok');
  
  // File naming patterns
  if (file.name.match(/IMG_\d{4}/)) sources.push('iPhone Camera');
  if (file.name.match(/DSC\d+/)) sources.push('Digital Camera');
  if (file.name.match(/Screenshot/i)) sources.push('Screenshot');
  if (file.name.match(/PXL_\d+/)) sources.push('Google Pixel');
  if (file.name.match(/IMG-\d{8}-WA\d+/)) sources.push('WhatsApp (EXIF Stripped)');
  
  return sources.length > 0 ? sources : ['Unknown source'];
}

async function performForensicAnalysis(file, raw, organized) {
  const analysis = {
    privacyRisks: [],
    suspiciousPatterns: [],
    recommendations: []
  };

  // Privacy risks
  if (organized.gps?.found) {
    analysis.privacyRisks.push({
      level: 'HIGH',
      type: 'Location Data',
      description: `GPS coordinates expose exact location: ${organized.gps.coordinates}`
    });
  }

  if (organized.camera?.make || organized.camera?.model) {
    analysis.privacyRisks.push({
      level: 'MEDIUM',
      type: 'Device Information',
      description: `Camera/phone model exposed: ${organized.camera.make} ${organized.camera.model}`
    });
  }

  if (organized.camera?.serialNumber) {
    analysis.privacyRisks.push({
      level: 'HIGH',
      type: 'Serial Number',
      description: 'Device serial number can uniquely identify your camera/phone'
    });
  }

  if (organized.timestamps?.taken) {
    analysis.privacyRisks.push({
      level: 'LOW',
      type: 'Timestamp Data',
      description: `Photo taken at: ${organized.timestamps.taken}`
    });
  }

  // Suspicious patterns
  if (organized.software?.software) {
    analysis.suspiciousPatterns.push(`Image edited with: ${organized.software.software}`);
  }

  // Recommendations
  if (organized.gps?.found) {
    analysis.recommendations.push('⚠️ CRITICAL: Remove GPS data before sharing online!');
  }

  if (organized.camera?.serialNumber) {
    analysis.recommendations.push('🔒 Remove serial number to prevent device tracking');
  }

  if (analysis.privacyRisks.length === 0) {
    analysis.privacyRisks.push({
      level: 'LOW',
      type: 'Minimal Risk',
      description: 'Limited metadata present - relatively safe to share'
    });
  }

  analysis.recommendations.push('💡 Use metadata scrubber in Operations tab to remove all EXIF');
  
  return analysis;
}

// GPS Coordinate Parser (MISSING EXPORT - ADD THIS!)
export function parseGPSCoordinates(gpsString) {
  if (!gpsString) return null;
  
  const match = gpsString.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
  if (!match) return null;
  
  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);
  
  return {
    latitude: lat,
    longitude: lon,
    googleMapsUrl: `https://www.google.com/maps?q=${lat},${lon}`,
    coordinates: `${lat}, ${lon}`
  };
}