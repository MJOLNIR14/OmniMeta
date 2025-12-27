// MACB Timeline Analysis (Modified, Accessed, Changed, Birth)

export async function analyzeTimestamps(file) {
  console.log('⏰ Analyzing timestamps for:', file.name);
  
  const timeline = {
    file: {
      name: file.name,
      size: file.size
    },
    timestamps: {},
    analysis: {},
    flags: []
  };

  // JavaScript File API only gives us lastModified
  // But we can extract more from the file itself
  const fileModified = new Date(file.lastModified);
  
  timeline.timestamps.modified = {
    timestamp: fileModified,
    unix: Math.floor(fileModified.getTime() / 1000),
    iso: fileModified.toISOString(),
    local: fileModified.toLocaleString(),
    readable: formatRelativeTime(fileModified)
  };

  // Try to extract embedded timestamps from file content
  const buffer = await file.arrayBuffer();
  const embeddedTimestamps = extractEmbeddedTimestamps(buffer, file.type);
  
  if (embeddedTimestamps.length > 0) {
    timeline.timestamps.embedded = embeddedTimestamps;
  }

  // Analysis
  timeline.analysis = performTimelineAnalysis(timeline.timestamps, fileModified);
  
  // Flags for suspicious patterns
  timeline.flags = detectTimestampAnomalies(timeline.timestamps, timeline.analysis);

  return timeline;
}

function extractEmbeddedTimestamps(buffer, mimeType) {
  const timestamps = [];
  const bytes = new Uint8Array(buffer);
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  
  // Look for ISO 8601 timestamps
  const isoRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?/g;
  const matches = text.match(isoRegex);
  
  if (matches) {
    matches.forEach(match => {
      try {
        const date = new Date(match);
        if (!isNaN(date.getTime())) {
          timestamps.push({
            type: 'ISO-8601',
            timestamp: date,
            string: match,
            location: 'Embedded in file content'
          });
        }
      } catch (e) {}
    });
  }

  // Look for Unix timestamps (10-digit numbers that could be timestamps)
  const unixRegex = /\b1[0-9]{9}\b/g;
  const unixMatches = text.match(unixRegex);
  
  if (unixMatches) {
    unixMatches.slice(0, 10).forEach(match => { // Limit to first 10
      const unix = parseInt(match);
      const date = new Date(unix * 1000);
      
      // Only accept if it's between 2010 and 2030
      if (date.getFullYear() >= 2010 && date.getFullYear() <= 2030) {
        timestamps.push({
          type: 'Unix Timestamp',
          timestamp: date,
          string: match,
          location: 'Embedded in file content'
        });
      }
    });
  }

  // PDF-specific date format
  if (mimeType === 'application/pdf') {
    const pdfDateRegex = /D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/g;
    let match;
    while ((match = pdfDateRegex.exec(text)) !== null) {
      try {
        const date = new Date(
          parseInt(match[1]), // year
          parseInt(match[2]) - 1, // month (0-indexed)
          parseInt(match[3]), // day
          parseInt(match[4]), // hour
          parseInt(match[5]), // minute
          parseInt(match[6])  // second
        );
        timestamps.push({
          type: 'PDF DateTime',
          timestamp: date,
          string: match[0],
          location: 'PDF metadata'
        });
      } catch (e) {}
    }
  }

  return timestamps;
}

function performTimelineAnalysis(timestamps, fileModified) {
  const analysis = {
    totalTimestamps: 1 + (timestamps.embedded?.length || 0),
    oldestTimestamp: fileModified,
    newestTimestamp: fileModified,
    timeSpan: null,
    suspiciousGaps: []
  };

  // Find oldest and newest
  if (timestamps.embedded) {
    timestamps.embedded.forEach(ts => {
      if (ts.timestamp < analysis.oldestTimestamp) {
        analysis.oldestTimestamp = ts.timestamp;
      }
      if (ts.timestamp > analysis.newestTimestamp) {
        analysis.newestTimestamp = ts.timestamp;
      }
    });
  }

  // Calculate time span
  const spanMs = analysis.newestTimestamp - analysis.oldestTimestamp;
  analysis.timeSpan = formatDuration(spanMs);

  // Detect suspicious gaps
  if (timestamps.embedded && timestamps.embedded.length > 1) {
    const sorted = [...timestamps.embedded].sort((a, b) => a.timestamp - b.timestamp);
    
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i].timestamp - sorted[i-1].timestamp;
      const gapDays = gap / (1000 * 60 * 60 * 24);
      
      // Flag gaps larger than 365 days
      if (gapDays > 365) {
        analysis.suspiciousGaps.push({
          from: sorted[i-1].timestamp,
          to: sorted[i].timestamp,
          gap: formatDuration(gap)
        });
      }
    }
  }

  // Check if file modified is suspiciously newer than content
  if (timestamps.embedded && timestamps.embedded.length > 0) {
    const latestEmbedded = Math.max(...timestamps.embedded.map(t => t.timestamp.getTime()));
    const modifiedTime = fileModified.getTime();
    
    if (modifiedTime > latestEmbedded + (1000 * 60 * 60 * 24 * 365)) {
      analysis.suspiciousModification = {
        warning: 'File modified date is more than 1 year newer than embedded timestamps',
        suggestion: 'File may have been modified or touched recently'
      };
    }
  }

  return analysis;
}

function detectTimestampAnomalies(timestamps, analysis) {
  const flags = [];

  // Flag: Future timestamps
  const now = new Date();
  if (timestamps.modified.timestamp > now) {
    flags.push({
      severity: 'HIGH',
      type: 'Future Timestamp',
      description: 'File modification time is in the future',
      impact: 'System clock may be wrong or timestamp was manipulated'
    });
  }

  if (timestamps.embedded) {
    timestamps.embedded.forEach(ts => {
      if (ts.timestamp > now) {
        flags.push({
          severity: 'MEDIUM',
          type: 'Future Embedded Timestamp',
          description: `Embedded timestamp is in the future: ${ts.string}`,
          impact: 'Content may have been created with incorrect system time'
        });
      }
    });
  }

  // Flag: Very old files
  const fileAge = now - timestamps.modified.timestamp;
  const ageYears = fileAge / (1000 * 60 * 60 * 24 * 365);
  
  if (ageYears > 10) {
    flags.push({
      severity: 'LOW',
      type: 'Old File',
      description: `File is ${Math.floor(ageYears)} years old`,
      impact: 'Consider archival or migration'
    });
  }

  // Flag: Suspicious time span
  if (analysis.suspiciousGaps.length > 0) {
    flags.push({
      severity: 'MEDIUM',
      type: 'Suspicious Time Gap',
      description: `Found ${analysis.suspiciousGaps.length} large gaps in timestamps`,
      impact: 'File may have been edited across long time periods'
    });
  }

  // Flag: Timestamp mismatch
  if (analysis.suspiciousModification) {
    flags.push({
      severity: 'MEDIUM',
      type: 'Timestamp Mismatch',
      description: analysis.suspiciousModification.warning,
      impact: analysis.suspiciousModification.suggestion
    });
  }

  return flags;
}

function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (diff < 0) return 'In the future';
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

function formatDuration(ms) {
  if (ms < 0) return 'Negative duration';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${seconds} second${seconds > 1 ? 's' : ''}`;
}

// Compare multiple files to build a timeline
export async function buildMultiFileTimeline(files) {
  console.log('📅 Building timeline for', files.length, 'files');
  
  const events = [];

  for (const file of files) {
    const analysis = await analyzeTimestamps(file);
    
    events.push({
      file: file.name,
      timestamp: analysis.timestamps.modified.timestamp,
      type: 'File Modified',
      details: analysis
    });

    if (analysis.timestamps.embedded) {
      analysis.timestamps.embedded.forEach(ts => {
        events.push({
          file: file.name,
          timestamp: ts.timestamp,
          type: ts.type,
          details: ts
        });
      });
    }
  }

  // Sort chronologically
  events.sort((a, b) => a.timestamp - b.timestamp);

  return {
    events,
    totalEvents: events.length,
    timeSpan: events.length > 0 ? 
      formatDuration(events[events.length - 1].timestamp - events[0].timestamp) : '0',
    oldestEvent: events[0],
    newestEvent: events[events.length - 1]
  };
}