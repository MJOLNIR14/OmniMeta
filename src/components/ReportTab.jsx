import React, { useState } from 'react';
import { FileText, Download, FileJson, Printer, Mail, Share2 } from 'lucide-react';
import { generateJSONReport, generateHTMLReport } from '../utils/reportGenerator';
import './ReportTab.css';

function ReportTab({ file, analysis, exifData, comparisonData }) {
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState(null);

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateReport = async (format) => {
    setGenerating(true);
    setReportType(format);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800));

    const timestamp = new Date().toISOString().slice(0, 10);
    const baseName = file.name.replace(/\.[^/.]+$/, '');

    if (format === 'json') {
      const jsonReport = generateJSONReport(file, analysis, exifData, comparisonData);
      downloadFile(jsonReport, `${baseName}_report_${timestamp}.json`, 'application/json');
    } else if (format === 'html') {
      const htmlReport = generateHTMLReport(file, analysis, exifData);
      downloadFile(htmlReport, `${baseName}_report_${timestamp}.html`, 'text/html');
    } else if (format === 'pdf') {
      // Generate HTML first, then convert to PDF using print dialog
      const htmlReport = generateHTMLReport(file, analysis, exifData);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlReport);
      printWindow.document.close();
      
      // Trigger print dialog after content loads
      printWindow.onload = () => {
        printWindow.print();
      };
    }

    setGenerating(false);
  };

  const exportChainOfCustody = () => {
    const custody = {
      caseID: `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      fileName: file.name,
      analyst: 'Mjolnir14',
      timestamp: new Date().toISOString(),
      actions: [
        {
          action: 'File Uploaded',
          timestamp: new Date(file.lastModified).toISOString(),
          hash: analysis?.hashes?.sha256 || 'N/A'
        },
        {
          action: 'Analysis Performed',
          timestamp: new Date().toISOString(),
          tool: 'OmniMeta v1.0.0'
        }
      ],
      integrityVerification: {
        sha256: analysis?.hashes?.sha256,
        md5: analysis?.hashes?.md5
      }
    };

    downloadFile(
      JSON.stringify(custody, null, 2),
      `chain_of_custody_${custody.caseID}.json`,
      'application/json'
    );
  };

  if (!file) {
    return <div className="tab-empty">No file selected for report generation</div>;
  }

  const reportFormats = [
    {
      id: 'json',
      name: 'JSON Report',
      description: 'Machine-readable format for automation and integration',
      icon: FileJson,
      color: '#58A6FF'
    },
    {
      id: 'html',
      name: 'HTML Report',
      description: 'Interactive web report with styling (can be saved as PDF)',
      icon: FileText,
      color: '#F97316'
    },
    {
      id: 'pdf',
      name: 'PDF Report',
      description: 'Professional document format for archival and presentation',
      icon: Printer,
      color: '#EC4899'
    }
  ];

  return (
    <div className="report-tab">
      {/* Report Info Banner */}
      <div className="report-banner">
        <FileText size={32} />
        <div>
          <h2>Forensic Report Generator</h2>
          <p>Generate comprehensive analysis reports for {file.name}</p>
        </div>
      </div>

      {/* Report Formats */}
      <div className="report-section">
        <h3>📄 Select Report Format</h3>
        <div className="report-formats">
          {reportFormats.map(format => {
            const Icon = format.icon;
            return (
              <button
                key={format.id}
                className="format-card"
                onClick={() => generateReport(format.id)}
                disabled={generating}
                style={{ '--format-color': format.color }}
              >
                <Icon size={32} />
                <h4>{format.name}</h4>
                <p>{format.description}</p>
                <div className="format-action">
                  <Download size={16} />
                  <span>{generating && reportType === format.id ? 'Generating...' : 'Generate'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Additional Export Options */}
      <div className="report-section">
        <h3>🔒 Evidence & Chain of Custody</h3>
        <div className="export-options">
          <button className="export-button" onClick={exportChainOfCustody}>
            <Share2 size={20} />
            <div>
              <strong>Chain of Custody Log</strong>
              <p>Export evidence handling timeline (JSON)</p>
            </div>
          </button>

          <button
            className="export-button"
            onClick={() => {
              const evidence = {
                file: file.name,
                size: file.size,
                hashes: analysis?.hashes,
                timestamp: new Date().toISOString(),
                analyst: 'Mjolnir14'
              };
              downloadFile(
                JSON.stringify(evidence, null, 2),
                `evidence_package_${Date.now()}.json`,
                'application/json'
              );
            }}
          >
            <Download size={20} />
            <div>
              <strong>Evidence Package</strong>
              <p>Bundle file metadata for court submission</p>
            </div>
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="report-section">
        <h3>📋 Report Contents</h3>
        <div className="report-contents">
          <div className="content-category">
            <h4>✅ File Information</h4>
            <ul>
              <li>File name, size, type, timestamps</li>
              <li>Extension and MIME type analysis</li>
            </ul>
          </div>

          <div className="content-category">
            <h4>✅ Forensic Analysis</h4>
            <ul>
              <li>File signature and magic numbers</li>
              <li>Entropy analysis and randomness</li>
              <li>Compression/encryption detection</li>
            </ul>
          </div>

          {analysis?.hashes && (
            <div className="content-category">
              <h4>✅ Cryptographic Hashes</h4>
              <ul>
                <li>MD5, SHA-1, SHA-256, SHA-384, SHA-512</li>
                <li>Hash computation performance metrics</li>
              </ul>
            </div>
          )}

          {analysis?.patterns && (
            <div className="content-category">
              <h4>✅ Extracted Artifacts</h4>
              <ul>
                <li>Strings extraction (up to 500)</li>
                <li>URLs, emails, IP addresses, file paths</li>
              </ul>
            </div>
          )}

          {exifData && (
            <div className="content-category">
              <h4>✅ EXIF & Metadata</h4>
              <ul>
                <li>Camera/device information</li>
                <li>GPS coordinates and privacy risks</li>
                <li>Image analysis and source detection</li>
              </ul>
            </div>
          )}

          {comparisonData && (
            <div className="content-category">
              <h4>✅ File Comparison</h4>
              <ul>
                <li>Similarity percentage</li>
                <li>Byte-level differences</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Report Metadata */}
      <div className="report-metadata">
        <div className="metadata-grid">
          <div className="metadata-item">
            <span className="metadata-label">Report Generator:</span>
            <span className="metadata-value">OmniMeta v1.0.0</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Analyst:</span>
            <span className="metadata-value">Mjolnir14 🌗</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Timestamp:</span>
            <span className="metadata-value">{new Date().toLocaleString()}</span>
          </div>
          <div className="metadata-item">
            <span className="metadata-label">Case ID:</span>
            <span className="metadata-value">
              CASE-{Date.now()}-{Math.random().toString(36).substr(2, 5).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportTab;