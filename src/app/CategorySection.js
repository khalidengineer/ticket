"use client";

import React, { useRef, useState, useMemo } from 'react';

export default function CategorySection({ category, categoryData, oldIssuesCount, tabs }) {
  const sectionRef = useRef(null);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'ID', direction: 'desc' });
  const [activeTab, setActiveTab] = useState(0);

  const currentCategory = tabs ? tabs[activeTab].category : category;
  const currentCategoryData = tabs ? tabs[activeTab].categoryData : categoryData;
  const currentOldIssuesCount = tabs ? tabs[activeTab].oldIssuesCount : oldIssuesCount;

  const handleFilterChange = (column, value) => {
    setFilters(prev => ({ ...prev, [column]: value }));
  };

  const handleSort = (column) => {
    let direction = 'desc';
    if (sortConfig.key === column && sortConfig.direction === 'desc') {
      direction = 'asc';
    } else if (sortConfig.key === column && sortConfig.direction === 'asc') {
      direction = null;
    }
    setSortConfig(direction ? { key: column, direction } : { key: null, direction: null });
  };

  const criticalCount = useMemo(() => {
    return currentCategoryData.filter(row => {
      const severity = (row['Severity'] || '').toLowerCase();
      return severity.includes('critical');
    }).length;
  }, [currentCategoryData]);

  const filteredData = useMemo(() => {
    let result = currentCategoryData.filter(row => {
      return Object.entries(filters).every(([col, val]) => {
        if (!val) return true;
        return row[col] === val;
      });
    });

    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        if (valA == null && valB == null) return 0;
        if (valA == null) return sortConfig.direction === 'asc' ? 1 : -1;
        if (valB == null) return sortConfig.direction === 'asc' ? -1 : 1;

        const parseDuration = (str) => {
          if (!str) return null;
          const s = String(str).toLowerCase().trim();
          const unitRegex = /(y(?:ear|ears)?|mo(?:nth|nths)?|d(?:ay|ays)?|h(?:our|ours)?|m(?:in|ins|inute|inutes)?|s(?:ec|ecs|econd|econds)?)/;
          const fullRegex = new RegExp(`^(\\s*\\d+(?:\\.\\d+)?\\s*${unitRegex.source}\\s*)+$`);
          
          if (!fullRegex.test(s)) return null;

          const extractRegex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${unitRegex.source}`, 'g');
          let total = 0;
          let match;
          while ((match = extractRegex.exec(s)) !== null) {
            const val = parseFloat(match[1]);
            const unit = match[2];
            if (unit.startsWith('y')) total += val * 365 * 24 * 60;
            else if (unit.startsWith('mo')) total += val * 30 * 24 * 60;
            else if (unit.startsWith('d')) total += val * 24 * 60;
            else if (unit.startsWith('h')) total += val * 60;
            else if (unit.startsWith('m')) total += val;
            else if (unit.startsWith('s')) total += val / 60;
          }
          return total;
        };

        const durationA = parseDuration(valA);
        const durationB = parseDuration(valB);

        if (durationA !== null && durationB !== null) {
          return sortConfig.direction === 'asc' ? durationA - durationB : durationB - durationA;
        }

        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        const isNumA = !isNaN(numA) && /^[0-9.-]/.test(String(valA).trim());
        const isNumB = !isNaN(numB) && /^[0-9.-]/.test(String(valB).trim());

        // Avoid parsing dates like "10/12/2024" as simply "10"
        const isDateLikeA = /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(String(valA).trim());
        const isDateLikeB = /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(String(valB).trim());

        if (isDateLikeA && isDateLikeB) {
          const dateA = new Date(valA);
          const dateB = new Date(valB);
          if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
            return sortConfig.direction === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
          }
        }

        if (isNumA && isNumB && !isDateLikeA && !isDateLikeB) {
           return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [currentCategoryData, filters, sortConfig]);

  const handleScreenshot = async (e) => {
    if (!sectionRef.current) return;
    
    const button = e.currentTarget; // The screenshot button
    const tableWrapper = sectionRef.current.querySelector('.table-wrapper');
    const headers = sectionRef.current.querySelectorAll('.data-table th');
    const tabButtons = sectionRef.current.querySelector('.tab-buttons');
    
    // Cache original styles
    const originalMaxHeight = tableWrapper.style.maxHeight;
    const originalOverflow = tableWrapper.style.overflow;
    
    try {
      // 1. Hide the screenshot button and tabs from the final image
      button.style.display = 'none';
      if (tabButtons) tabButtons.style.display = 'none';

      // 2. Remove max-height and overflow to expose the FULL table data
      tableWrapper.style.maxHeight = 'none';
      tableWrapper.style.overflow = 'visible';
      tableWrapper.style.border = 'none'; // Remove scroll wrapper border for clean look
      tableWrapper.style.boxShadow = 'none';
      
      // 3. Remove sticky positioning from headers temporarily
      headers.forEach(th => th.style.position = 'static');

      // Wait a tiny bit for the DOM layout to completely update
      await new Promise(resolve => setTimeout(resolve, 150));

      // Dynamically import to avoid SSR issues
      const domtoimage = (await import('dom-to-image-more')).default;

      const scale = 2;
      const dataUrl = await domtoimage.toPng(sectionRef.current, {
        bgcolor: '#ffffff',
        width: sectionRef.current.scrollWidth * scale,
        height: sectionRef.current.scrollHeight * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          margin: '0'
        }
      });

      // RESTORE STYLES IMMEDIATELY
      button.style.display = '';
      if (tabButtons) tabButtons.style.display = 'flex';
      tableWrapper.style.maxHeight = originalMaxHeight;
      tableWrapper.style.overflow = originalOverflow;
      tableWrapper.style.border = '';
      tableWrapper.style.boxShadow = '';
      headers.forEach(th => th.style.position = '');

      // Download
      const link = document.createElement('a');
      link.download = `${currentCategory.replace(/[^a-zA-Z0-9-_\s]/g, '')}-issues.png`; // Sanitize filename just in case
      link.href = dataUrl;
      document.body.appendChild(link); // Append to DOM for Firefox/Chrome security
      link.click();
      document.body.removeChild(link); // Cleanup
    } catch (error) {
      // Ensure styles are restored even if it fails
      button.style.display = '';
      if (tabButtons) tabButtons.style.display = 'flex';
      tableWrapper.style.maxHeight = originalMaxHeight;
      tableWrapper.style.overflow = originalOverflow;
      tableWrapper.style.border = '';
      tableWrapper.style.boxShadow = '';
      headers.forEach(th => th.style.position = '');

      console.error('Failed to take screenshot', error);
      alert(`Failed to capture screenshot: ${error.message || 'Unknown error'}`);
    }
  };

  function getSeverityClass(severity) {
    if (!severity) return '';
    const s = severity.toLowerCase();
    if (s.includes('critical')) return 'critical';
    if (s.includes('high')) return 'high';
    if (s.includes('medium')) return 'medium';
    if (s.includes('low')) return 'low';
    return '';
  }
  
  function getStatusClass(status) {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s.includes('open')) return 'open';
    if (s.includes('closed') || s.includes('resolved')) return 'closed';
    return '';
  }

  return (
    <section ref={sectionRef} className="category-section">
      <div className="category-header-wrap">
        <h2 className="category-title">{currentCategory}</h2>
        <div className="header-actions">
          {tabs && (
            <div className="tab-buttons" style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
              {tabs.map((tab, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.4)',
                    backgroundColor: activeTab === idx ? '#fff' : 'rgba(255, 255, 255, 0.2)',
                    color: activeTab === idx ? '#1e293b' : '#fff',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
          <div className="total-issues-badge">
            Total Issues: <strong>{currentCategoryData.length}</strong>
          </div>
          {currentOldIssuesCount > 0 && (
            <div className="old-issues-badge">
              Open Issues Older Than 5 Days: <strong>{currentOldIssuesCount}</strong>
            </div>
          )}
          <div className={`critical-issues-badge ${criticalCount === 0 ? 'zero' : ''}`}>
            Critical: <strong>{criticalCount}</strong>
          </div>
          <button onClick={handleScreenshot} className="screenshot-btn" title="Download Screenshot">
            📸 Screenshot
          </button>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {['ID', 'Title', 'Issue Location', 'Reported by', 'Status', 'Severity', 'Created On', 'Ageing'].map(col => (
                <th key={col}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <div 
                      style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', flex: 1 }}
                      onClick={() => handleSort(col)}
                      title={`Sort by ${col}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{col}</span>
                        {sortConfig.key === col && (
                          <span style={{ fontSize: '0.8rem', lineHeight: 1 }}>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                      {filters[col] && (
                        <span style={{ fontSize: '0.65rem', color: '#fef08a', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={filters[col]}>
                          {filters[col]}
                        </span>
                      )}
                    </div>
                    <div 
                      style={{ 
                        position: 'relative', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '24px', 
                        height: '24px',
                        backgroundColor: filters[col] ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                      title="Filter"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                      </svg>
                      <select 
                        value={filters[col] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'SORT_ASC') {
                            setSortConfig(prev => (prev.key === col && prev.direction === 'asc' ? { key: null, direction: null } : { key: col, direction: 'asc' }));
                          } else if (val === 'SORT_DESC') {
                            setSortConfig(prev => (prev.key === col && prev.direction === 'desc' ? { key: null, direction: null } : { key: col, direction: 'desc' }));
                          } else {
                            handleFilterChange(col, val);
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer'
                        }}
                      >
                        <option value="" style={{ color: '#000', fontWeight: 'bold' }}>All</option>
                        <option value="SORT_ASC" style={{ color: '#000', fontWeight: 'bold' }}>
                          {sortConfig.key === col && sortConfig.direction === 'asc' ? '✓ ' : ''}Sort Ascending ↑
                        </option>
                        <option value="SORT_DESC" style={{ color: '#000', fontWeight: 'bold' }}>
                          {sortConfig.key === col && sortConfig.direction === 'desc' ? '✓ ' : ''}Sort Descending ↓
                        </option>
                        <option disabled style={{ color: '#ccc' }}>──────────</option>
                        {[...new Set(categoryData.map(r => r[col]))].filter(Boolean).sort().map(val => (
                          <option key={val} value={val} style={{ color: '#000' }}>
                            {val.length > 25 ? val.substring(0, 25) + '...' : val}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, idx) => (
              <tr key={idx}>
                <td>{row['ID']}</td>
                <td className="title-cell" title={row['Title']}>{row['Title']}</td>
                <td>{row['Issue Location']}</td>
                <td>{row['Reported by']}</td>
                <td>
                  <span className={`badge ${getStatusClass(row['Status'])}`}>
                    {row['Status'] || '-'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${getSeverityClass(row['Severity'])}`}>
                    {row['Severity'] || '-'}
                  </span>
                </td>
                <td>{row['Created On']}</td>
                <td>{row['Ageing']}</td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
