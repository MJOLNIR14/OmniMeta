import React, { useState } from 'react';
import UtilityBar from './UtilityBar';
import OverviewTab from './OverviewTab';
import HashesTab from './HashesTab';
import ArtifactsTab from './ArtifactsTab';
import HexViewTab from './HexViewTab';
import ComparisonTab from './ComparisonTab';
import OperationsTab from './OperationsTab';
import EXIFTab from './EXIFTab';
import EntropyGraphTab from './EntropyGraphTab';
import TimelineTab from './TimelineTab'; 
import ReportTab from './ReportTab';
import './AnalysisDashboard.css';
import QRCodeTab from './QRCodeTab'; 
import FileCarverTab from './FileCarverTab'; 
import DuplicateFinderTab from './DuplicateFinderTab'; 


function AnalysisDashboard({ file, analysis, processing, allFiles }) { 
  const [activeTab, setActiveTab] = useState('overview');

  if (!file) {
    return (
      <main className="dashboard">
        <div className="empty-state">
          <p>Select a file to begin analysis</p>
        </div>
      </main>
    );
  }

  if (processing) {
    return (
      <main className="dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing {file.name}...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="file-title">{file.name}</h1>
          <div className="file-subtitle">
            {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}
          </div>
        </div>
        <div className="header-credit">
          <span className="credit-text">Mjolnir 🌗</span>
        </div>
      </div>

      <UtilityBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="dashboard-content">
        {activeTab === 'overview' && <OverviewTab analysis={analysis} />}
        {activeTab === 'hashes' && <HashesTab hashes={analysis?.hashes} />}
        {activeTab === 'artifacts' && <ArtifactsTab strings={analysis?.strings} patterns={analysis?.patterns} />}
        {activeTab === 'hexview' && <HexViewTab buffer={analysis?.buffer} />}
        {activeTab === 'comparison' && <ComparisonTab currentFile={file} />}
        {activeTab === 'operations' && <OperationsTab currentFile={file} />}
        {activeTab === 'exif' && <EXIFTab file={file} />}
        {activeTab === 'entropy' && <EntropyGraphTab buffer={analysis?.buffer} />}
        {activeTab === 'timeline' && <TimelineTab file={file} allFiles={allFiles} />}
        {activeTab === 'report' && <ReportTab file={file} analysis={analysis} />}
        {activeTab === 'qrcode' && <QRCodeTab file={file} analysis={analysis} />}
        {activeTab === 'carver' && <FileCarverTab file={file} buffer={analysis?.buffer} />}
        {activeTab === 'duplicates' && <DuplicateFinderTab allFiles={allFiles} />}
      </div>
    </main>
  );
}

export default AnalysisDashboard;