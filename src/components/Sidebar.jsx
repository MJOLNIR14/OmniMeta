import React from 'react';
import { Upload, FileText, Image, Film, Music, Archive, X } from 'lucide-react';
import './Sidebar.css';

function Sidebar({ files, selectedFile, onFileSelect, onNewFiles, onRemoveFile, onClearAll }) {
  const getFileIcon = (file) => {
    const type = file.type;
    if (type.startsWith('image/')) return <Image size={18} />;
    if (type.startsWith('video/')) return <Film size={18} />;
    if (type.startsWith('audio/')) return <Music size={18} />;
    if (type.includes('zip') || type.includes('rar')) return <Archive size={18} />;
    return <FileText size={18} />;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  const handleFileInput = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length > 0) onNewFiles(newFiles);
  };

  const handleRemove = (e, file) => {
    e.stopPropagation(); // Prevent file selection
    onRemoveFile(file);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Investigation Targets</h2>
        <label className="mini-upload">
          <Upload size={16} />
          <input
            type="file"
            multiple
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <div className="file-inventory">
        {files.map((file, index) => (
          <button
            key={index}
            className={`inventory-item ${selectedFile === file ? 'selected' : ''}`}
            onClick={() => onFileSelect(file)}
          >
            <div className="item-icon">{getFileIcon(file)}</div>
            <div className="item-details">
              <div className="item-name">{file.name}</div>
              <div className="item-meta">{formatBytes(file.size)}</div>
            </div>
            <button
              className="remove-file-btn"
              onClick={(e) => handleRemove(e, file)}
              title="Remove file"
            >
              <X size={14} />
            </button>
          </button>
        ))}
      </div>
    </aside>
  );
}

export default Sidebar;