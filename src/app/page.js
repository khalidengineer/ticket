import React from 'react';
import Papa from 'papaparse';
import CategorySection from './CategorySection';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Fetch data on the server component
async function getSheetData() {
  const url = 'https://docs.google.com/spreadsheets/d/1lA4SCfrmV_ZlN4MWjElnfF8RrA1lFMogl1i5o1j6JCE/export?format=csv';
  
  // Disable cache to always fetch live data
  const response = await fetch(url, { cache: 'no-store' });
  
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }

  const csvText = await response.text();
  
  // Parse CSV
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data;
}

export default async function Dashboard() {
  let rawData = [];
  try {
    rawData = await getSheetData();
  } catch (e) {
    return <div className="loading">Failed to load data.</div>;
  }

  // Group data by Category
  const groupedData = rawData.reduce((acc, row) => {
    let category = row['Category']?.trim() || 'Uncategorized';
    
    if (category === 'Repair and Maintenance') {
      category = 'Maintenance';
    }
    
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(row);
    return acc;
  }, {});

  // Sort categories alphabetically
  const categories = Object.keys(groupedData).sort();

  // Helper to check if issue is open and older than 5 days
  const isOpenAndOlderThan5Days = (row) => {
    const status = (row['Status'] || '').toLowerCase();
    if (!status.includes('open')) return false;

    const ageing = row['Ageing'] || '';
    const daysMatch = ageing.match(/(\d+)d/i);
    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10);
      return days >= 5;
    }
    return false;
  };

  const totalIssuesCount = Object.values(groupedData).reduce((total, group) => total + group.length, 0);

  const totalITCount = Object.values(groupedData).flat().filter(row => {
    let c = (row['Category'] || '').trim().toLowerCase();
    return c === 'it';
  }).length;
  
  const totalMaintenanceCount = Object.values(groupedData).flat().filter(row => {
    let c = (row['Category'] || '').trim().toLowerCase();
    return c === 'repair and maintenance' || c === 'maintenance';
  }).length;

  const totalMarketingCount = Object.values(groupedData).flat().filter(row => {
    let c = (row['Category'] || '').trim().toLowerCase();
    return c === 'marketing';
  }).length;

  const pillStyle = {
    display: 'inline-block', 
    marginLeft: '12px', 
    marginTop: '8px',
    background: 'rgba(255, 255, 255, 0.2)', 
    border: '1px solid rgba(255, 255, 255, 0.4)',
    color: '#1e293b', 
    padding: '4px 12px', 
    borderRadius: '20px', 
    fontWeight: '700',
    fontSize: '0.85rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    whiteSpace: 'nowrap'
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">Operations Dashboard</h1>
        <p className="subtitle">
          Live Issue Tracking
          <span style={pillStyle}>
            Total Issues: {totalIssuesCount}
          </span>
          <span style={pillStyle}>
            Total IT: {totalITCount}
          </span>
          <span style={pillStyle}>
            Total Repair & Maintenance: {totalMaintenanceCount}
          </span>
          <span style={pillStyle}>
            Total Marketing: {totalMarketingCount}
          </span>
        </p>
      </header>

      <main>
        {categories.map((category) => {
          const categoryData = groupedData[category];
          const oldIssuesCount = categoryData.filter(isOpenAndOlderThan5Days).length;

          return (
            <CategorySection 
              key={category} 
              category={category} 
              categoryData={categoryData} 
              oldIssuesCount={oldIssuesCount} 
            />
          );
        })}
      </main>
    </div>
  );
}
