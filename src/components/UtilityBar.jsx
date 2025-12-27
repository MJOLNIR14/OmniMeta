import React from 'react';
import { LayoutGrid, Hash, Search, Binary, GitCompare, Wrench, Camera, TrendingUp, FileText, Clock } from 'lucide-react';
import './UtilityBar.css';

function UtilityBar({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'hashes', label: 'Hashes', icon: Hash },
    { id: 'artifacts', label: 'Artifacts', icon: Search },
    { id: 'hexview', label: 'Hex Dump', icon: Binary },
    { id: 'comparison', label: 'Compare', icon: GitCompare },
    { id: 'operations', label: 'Operations', icon: Wrench },
    { id: 'exif', label: 'EXIF', icon: Camera },
    { id: 'entropy', label: 'Entropy', icon: TrendingUp },
    { id: 'timeline', label: 'Timeline', icon: Clock }, // NEW
    { id: 'report', label: 'Report', icon: FileText }
  ];

  return (
    <nav className="utility-bar">
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            className={`utility-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default UtilityBar;