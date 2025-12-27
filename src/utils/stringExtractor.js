// Extract readable strings from binary files

export function extractStrings(buffer, minLength = 4) {
  const bytes = new Uint8Array(buffer);
  const strings = [];
  let currentString = '';
  let startOffset = 0;
  
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    
    // Check if byte is printable ASCII
    if (byte >= 32 && byte <= 126) {
      if (currentString.length === 0) {
        startOffset = i;
      }
      currentString += String.fromCharCode(byte);
    } else {
      // End of string
      if (currentString.length >= minLength) {
        strings.push({
          offset: startOffset,
          value: currentString,
          length: currentString.length
        });
      }
      currentString = '';
    }
  }
  
  // Don't forget the last string
  if (currentString.length >= minLength) {
    strings.push({
      offset: startOffset,
      value: currentString,
      length: currentString.length
    });
  }
  
  return strings;
}

// Find specific patterns (URLs, emails, IPs, etc.)
export function findPatterns(strings) {
  const patterns = {
    urls: [],
    emails: [],
    ipAddresses: [],
    paths: []
  };
  
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const pathRegex = /[A-Z]:\\[^\\/:*?"<>|\r\n]+/gi;
  
  strings.forEach(str => {
    const value = str.value;
    
    const urls = value.match(urlRegex);
    if (urls) patterns.urls.push(...urls.map(u => ({ ...str, match: u })));
    
    const emails = value.match(emailRegex);
    if (emails) patterns.emails.push(...emails.map(e => ({ ...str, match: e })));
    
    const ips = value.match(ipRegex);
    if (ips) patterns.ipAddresses.push(...ips.map(ip => ({ ...str, match: ip })));
    
    const paths = value.match(pathRegex);
    if (paths) patterns.paths.push(...paths.map(p => ({ ...str, match: p })));
  });
  
  return patterns;
}