"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Papa from 'papaparse';
import ReportClient from './ReportClient';
import ReportFilters from './ReportFilters';
import { 
  Ticket, Laptop, Wrench, Megaphone, 
  AlertCircle, AlertTriangle, CheckCircle2, Activity,
  MoreVertical, FileText
} from 'lucide-react';

async function getSheetData() {
  const url = 'https://docs.google.com/spreadsheets/d/1lA4SCfrmV_ZlN4MWjElnfF8RrA1lFMogl1i5o1j6JCE/export?format=csv';
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch data');
  const csvText = await response.text();
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  return result.data;
}

function CorporateReportContent() {
  const searchParams = useSearchParams();
  const filterCity = searchParams.get('city') || 'All Cities';
  const filterCategory = searchParams.get('category') || 'All Categories';
  const filterPriority = searchParams.get('priority') || 'All Priorities';
  const filterStatus = searchParams.get('status') || 'All Status';

  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    try {
      const data = await getSheetData();
      setRawData(data || []);
      setError(false);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="loading">Loading live report...</div>;
  }

  if (error || !rawData.length) {
    return <div className="loading">Failed to load data.</div>;
  }

  // --- Apply Filters ---
  const filteredData = rawData.filter(row => {
    const status = (row['Status'] || '').toLowerCase();
    const severity = (row['Severity'] || '').toLowerCase();
    let category = row['Category']?.trim() || 'Uncategorized';
    if (category === 'Repair and Maintenance') category = 'Maintenance';
    const loc = (row['Issue Location'] || '').toUpperCase();

    let city = 'Others';
    if (loc.includes('NCR') || loc.includes('DELHI')) city = 'Delhi NCR';
    else if (loc.includes('BLR') || loc.includes('BANGALORE')) city = 'Bangalore';
    else if (loc.includes('HYD') || loc.includes('HYDERABAD')) city = 'Hyderabad';
    else if (loc.includes('MAA') || loc.includes('CHENNAI')) city = 'Chennai';

    if (filterCity !== 'All Cities' && city !== filterCity) return false;
    
    if (filterCategory !== 'All Categories') {
       if (filterCategory === 'IT' && category !== 'IT') return false;
       if (filterCategory === 'Maintenance' && category !== 'Maintenance') return false;
       if (filterCategory === 'Marketing' && category !== 'Marketing') return false;
    }

    if (filterPriority !== 'All Priorities') {
       if (!severity.includes(filterPriority.toLowerCase())) return false;
    }

    if (filterStatus !== 'All Status') {
       if (filterStatus === 'Open' && !status.includes('open')) return false;
       if (filterStatus === 'Closed/Resolved' && !(status.includes('closed') || status.includes('resolved'))) return false;
    }

    return true;
  });

  // --- Top Metrics Data ---
  let totalIssues = filteredData.length;
  let itOpen = 0;
  let mntOpen = 0;
  let mktOpen = 0;
  let criticalIssues = 0;
  let totalOpen = 0;
  let totalResolved = 0;
  let rate = 0; // arbitrary calculation later

  // --- City-Wise Data ---
  const cityData = {
    'Delhi NCR': { total: 0, it: 0, mnt: 0, mkt: 0, critical: 0, resolved: 0 },
    'Bangalore': { total: 0, it: 0, mnt: 0, mkt: 0, critical: 0, resolved: 0 },
    'Hyderabad': { total: 0, it: 0, mnt: 0, mkt: 0, critical: 0, resolved: 0 },
    'Chennai': { total: 0, it: 0, mnt: 0, mkt: 0, critical: 0, resolved: 0 },
    'Others': { total: 0, it: 0, mnt: 0, mkt: 0, critical: 0, resolved: 0 }
  };

  filteredData.forEach(row => {
    const status = (row['Status'] || '').toLowerCase();
    const severity = (row['Severity'] || '').toLowerCase();
    let category = row['Category']?.trim() || 'Uncategorized';
    if (category === 'Repair and Maintenance') category = 'Maintenance';
    const loc = (row['Issue Location'] || '').toUpperCase();

    // Determine City
    let city = 'Others';
    if (loc.includes('NCR') || loc.includes('DELHI')) city = 'Delhi NCR';
    else if (loc.includes('BLR') || loc.includes('BANGALORE')) city = 'Bangalore';
    else if (loc.includes('HYD') || loc.includes('HYDERABAD')) city = 'Hyderabad';
    else if (loc.includes('MAA') || loc.includes('CHENNAI')) city = 'Chennai';

    cityData[city].total += 1;

    const isOpen = status.includes('open');
    if (isOpen) totalOpen += 1;
    if (status.includes('closed') || status.includes('resolved')) {
      totalResolved += 1;
      cityData[city].resolved += 1;
    }

    if (category === 'IT') {
      if (isOpen) itOpen += 1;
      cityData[city].it += 1;
    } else if (category === 'Maintenance') {
      if (isOpen) mntOpen += 1;
      cityData[city].mnt += 1;
    } else if (category === 'Marketing') {
      if (isOpen) mktOpen += 1;
      cityData[city].mkt += 1;
    }

    if (severity.includes('critical')) {
      criticalIssues += 1;
      cityData[city].critical += 1;
    }
  });

  // Calculate global rate
  rate = totalIssues > 0 ? Math.round((totalResolved / totalIssues) * 100) : 0;

  const MetricCard = ({ title, value, icon: Icon, color, trendUp, trendVal }) => (
    <div className={`metric-card ${color}`}>
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        <div className="metric-icon-wrap"><Icon size={16} /></div>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-trend">
        <div className={`trend-line ${!trendUp ? 'down' : ''}`}></div>
        <div className={`trend-percent ${!trendUp ? 'down' : ''}`}>
          {trendUp ? '▲' : '▼'} {trendVal}
        </div>
      </div>
    </div>
  );

  return (
    <ReportClient>
      <div className="report-container">
        
        <Suspense fallback={<div style={{padding: '1rem', color: '#64748b'}}>Loading filters...</div>}>
          <ReportFilters />
        </Suspense>

        {/* Top 8 Metrics */}
        <div className="metrics-row">
          <MetricCard title="Total Issues" value={totalIssues} icon={Ticket} color="orange" trendUp={true} trendVal="12%" />
          <MetricCard title="IT Support" value={itOpen} icon={Laptop} color="blue" trendUp={true} trendVal="5%" />
          <MetricCard title="Maintenance" value={mntOpen} icon={Wrench} color="yellow" trendUp={false} trendVal="2%" />
          <MetricCard title="Marketing" value={mktOpen} icon={Megaphone} color="purple" trendUp={true} trendVal="15%" />
          <MetricCard title="Critical" value={criticalIssues} icon={AlertCircle} color="red" trendUp={true} trendVal="18%" />
          <MetricCard title="Open" value={totalOpen} icon={AlertTriangle} color="teal" trendUp={false} trendVal="5%" />
          <MetricCard title="Resolved" value={totalResolved} icon={CheckCircle2} color="green" trendUp={true} trendVal="24%" />
          <MetricCard title="Rate" value={`${rate}%`} icon={Activity} color="darkblue" trendUp={true} trendVal="8%" />
        </div>

        {/* Bottom City Analytics */}
        <div className="section-header">
          <div className="section-indicator"></div>
          <h2 className="section-title">City-Wise Performance Analytics</h2>
        </div>

        <div className="city-grid">
          {Object.entries(cityData).map(([city, data]) => {
            const cityRate = data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0;
            return (
              <div key={city} className="city-card">
                <div className="city-card-header">
                  <span className="city-name">{city}</span>
                  <MoreVertical size={16} className="city-dots" />
                </div>
                
                <div className="city-stats">
                  <div>
                    <div className="city-total-label">Total</div>
                    <div className="city-total-value">{data.total}</div>
                  </div>
                  <div className="city-breakdown">
                    <div className="breakdown-item"><div className="dot it"></div> IT: {data.it}</div>
                    <div className="breakdown-item"><div className="dot mnt"></div> MNT: {data.mnt}</div>
                    <div className="breakdown-item"><div className="dot mkt"></div> MKT: {data.mkt}</div>
                  </div>
                </div>

                <div className="city-footer">
                  <div className="city-footer-box">
                    <span className="footer-label">CRITICAL</span>
                    <span className={`footer-value ${data.critical > 0 ? 'red' : ''}`}>{data.critical}</span>
                  </div>
                  <div className="city-footer-box">
                    <span className="footer-label">RES RATE</span>
                    <span className="footer-value green">{cityRate}%</span>
                  </div>
                  <FileText size={18} color="#e2e8f0" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </ReportClient>
  );
}

export default function CorporateReport() {
  return (
    <Suspense fallback={<div className="loading">Loading report...</div>}>
      <CorporateReportContent />
    </Suspense>
  );
}

