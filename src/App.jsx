import React, { useState, useEffect } from 'react';
import CommandCenter from './components/CommandCenter';
import Sidebar from './components/Sidebar';
import AnalysisDashboard from './components/AnalysisDashboard';
import StatusPulse from './components/StatusPulse';
import { extractMetadata } from './utils/metadataExtractor';
import { calculateAllHashes } from './utils/hashCalculator';
import { extractStrings, findPatterns } from './utils/stringExtractor';
import './styles/theme.css';
import './App.css';

function App() {
  const [phase, setPhase] = useState('clean-slate');
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('System Ready');

  const handleFileSelect = async (newFiles) => {
    setPhase('active-case');
    setFiles(prev => [...prev, ...newFiles]);
    
    if (newFiles.length > 0) {
      analyzeFile(newFiles[0]);
    }
  };

  const analyzeFile = async (file) => {
    setSelectedFile(file);
    setProcessing(true);
    setStatusMessage('Analyzing bitstream...');

    try {
      const [metadata, hashes, buffer] = await Promise.all([
        extractMetadata(file),
        calculateAllHashes(file),
        file.arrayBuffer()
      ]);

      const strings = extractStrings(buffer);
      const patterns = findPatterns(strings);

      setAnalysis({
        metadata,
        hashes,
        strings: strings.slice(0, 500),
        patterns,
        buffer
      });

      setStatusMessage('Analysis complete');
    } catch (error) {
      console.error('Analysis failed:', error);
      setStatusMessage('Analysis failed');
    }

    setProcessing(false);
  };

  const handleRemoveFile = (fileToRemove) => {
    const newFiles = files.filter(f => f !== fileToRemove);
    setFiles(newFiles);

    // If removed file was selected, select another or go back to clean slate
    if (selectedFile === fileToRemove) {
      if (newFiles.length > 0) {
        analyzeFile(newFiles[0]);
      } else {
        setPhase('clean-slate');
        setSelectedFile(null);
        setAnalysis(null);
      }
    }
  };

  return (
    <div className="app">
      {phase === 'clean-slate' && (
        <CommandCenter onFileSelect={handleFileSelect} />
      )}

      {phase === 'active-case' && (
        <>
          <Sidebar 
            files={files}
            selectedFile={selectedFile}
            onFileSelect={analyzeFile}
            onNewFiles={handleFileSelect}
            onRemoveFile={handleRemoveFile}
          />
          <AnalysisDashboard 
            file={selectedFile}
            analysis={analysis}
            processing={processing}
            allFiles={files}
          />
        </>
      )}

      <StatusPulse 
        status={processing ? 'processing' : 'ready'}
        message={statusMessage}
      />
    </div>
  );
}

export default App;