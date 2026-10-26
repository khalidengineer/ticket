import React from 'react';
import Papa from 'papaparse';
import CategorySection from '../CategorySection';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NCR_LOCATIONS = [
  'Sohna Road', 'Sushant Lok', 'Sector 56', 'Gurgaon Central Warehouse', 'Kitchen Gurgaon', 
  'Udyog Vihar Phase V', 'Raheja Square Mall', 'Sector 67', 'Sector 90', 'Sector- 73 Noida', 'Sector-73 Noida', 'Sector 73 Noida', 
  'Sector- 4 Noida', 'Sector-4 Noida', 'Sector 4 Noida', 'Raj Nagar', 'Crossing Republic', 'Indirapuram', 'Sector 10 Gurugram', 
  'Dwarka', 'Ashok Vihar', 'Rohini', 'Malviya Nagar', 'Janak Puri', 'Laxmi Nagar', 
  'Vasant Kunj', 'East Patel Nagar', 'Defence Colony', 'Faridabad SEC16', 'Sector 141', 
  'Sarita Vihar', 'Corporate Sale NCR', 'Alpha 2 Greater Noida', 'Dilshad Garden', 
  'Sector 4 Gurgaon', 'Gandhi Vihar', 'Uttam Nagar', 'Gaur City- Noida Extension', 
  'Training NCR', 'NCR - DN - Advant Tech Park',  'NCR - DN - Sector 120 Market', 'NCR - DN - Sector 120 Central Market', 'Tech NCR', 
  'NCR - DN- Janakpuri', 'NCR - DN - Star Tower', 'NCR - CK - Palam Vihar', 
  'NCR - CK - Sector 65', 'NCR - DN - Shalimar Bagh','NCR - DN- Shalimar Bag', 'NCR - DN - Golf Course Road', 
  'NCR - DN - Pacific Mall(Dwarka 21)','Central Warehouse Gurgaon','Central Kitchen Gurgaon','NCR-DN-Gaur city mall(Sector-4)', 'NCR - DN - Gaur City Mall(Sector 4)',
  'Training centre NCR', 'Udyog Vihar, Phase V'
];

const HYD_LOCATIONS = [
  'Hyderabad Central Warehouse', 'Pragathi Nagar Kukatpally', 'Pragathi Nagar', 'Dilshukh Nagar', 
  'AS Rao Nagar', 'Manikonda', 'Nacharam', 'Ameerpet', 'Madhapur', 'Kitchen Hyderabad', 
  'Aparna Mall', 'Kondapur', 'Mehdipatnam', 'Hyd - CK - Padmarao Nagar', 
  'HYD - DN - Sun City','Kukatpally', 'Tech HYD'
];

const CHENNAI_LOCATIONS = [
  'Chennai Central Warehouse', 'TN - DN - Guduvancherry', 'TN - CK - Karapakkam'
];

const BLR_LOCATIONS = [
  'Koramangala','BLR - DN - Bagmane Virgo FC', 'Jeevan Bhima Nagar','HQ','Training centre Blr','Central Kitchen Bangalore','Central Warehouse Bangalore', 'HSR Layout', 'JP Nagar', 'Kalyan Nagar', 
  'Marathalli', 'Kitchen Bangalore', 'Whitefield', 'CBD', 'Bellandur', 
  'Sahakar Nagar', 'Bangalore Central Warehouse', 'Rajaji Nagar', 'Electronic City', 
  'Old Madras Road', 'Dommasandra', 'Nagarbhavi', 'RR Nagar', 'RT Nagar', 
  'Mahadevpura', 'Dasarahalli', 'Indiranagar 12B', 'Forum Mall', 'Technostar (AECS)', 
  'Bannerghatta', 'HSR Layout Sector 3', 'Murgeshpalya', 'Training', 'Varthur', 
  'ETV', 'Corporate Sales BLR', 'Hennur', 'Sarjapur', 'Yelahanka', 'Chandapura', 
  'Kanakpura Road', 'Begur', 'Royasandra', 'BLR - CK - Manyta Tech Park', 
  'Bagmane', 'Nexus Koramangala', 'Eco Space', 'Nexus Shantiniketan', 'EGL', 
  'Bagmane (CV Raman Nagar)', 'Kasavanahalli', 'TC Palya', 'Singasandra', 
  'New BEL Rd', 'Channasandra', 'Kanakapura Dine-In', 'Airport Road', 
  'Banashankari', 'Ananth Nagar', 'BLR - CK - Panathur', 
  'BLR - DN - Park Square Mall (ITPL)', 'BLR - DN - Kengeri', 'BLR - DN - Haralur', 
  'BLR - DN - Ayyappa Nagar', 'BLR - DN - Budigere', 'BLR - DN - Kaggadasapura', 
  'Tech BLR', 'BLR - DN - Bagalur', 'BLR - DN - Channapatna', 'BLR - DN - Airport T-1', 
  'BLR - DN - Ecoworld', 'BLR - DN - Galleria Mall', 'BLR - DN - Neo Town', 
  'BLR - DN - Royal Meenakshi Mall', 'Lift Maintenance', 'Chennai Central Warehouse', 'TN - DN - Guduvancherry', 'TN - CK - Karapakkam'
];

function getState(location) {
  if (!location) return 'Other';
  const loc = location.trim().toLowerCase();
  
  if (NCR_LOCATIONS.some(l => l.toLowerCase() === loc)) return 'NCR';
  if (HYD_LOCATIONS.some(l => l.toLowerCase() === loc)) return 'HYD';
  if (CHENNAI_LOCATIONS.some(l => l.toLowerCase() === loc)) return 'CHENNAI';
  if (BLR_LOCATIONS.some(l => l.toLowerCase() === loc)) return 'BLR';
  return 'Other';
}

// Fetch data on the server component
async function getSheetData() {
  const url = 'https://docs.google.com/spreadsheets/d/1lA4SCfrmV_ZlN4MWjElnfF8RrA1lFMogl1i5o1j6JCE/export?format=csv';
  
  const response = await fetch(url, { cache: 'no-store' });
  
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }

  const csvText = await response.text();
  
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data;
}

export default async function StateWiseDashboard() {
  let rawData = [];
  try {
    rawData = await getSheetData();
  } catch (e) {
    return <div className="loading">Failed to load data.</div>;
  }

  const targetCategories = ['IT', 'Repair and Maintenance', 'Marketing', 'Personnel'];
  
  const groupedData = rawData.reduce((acc, row) => {
    let rawCategory = (row['Category'] || '').trim();
    let categoryLower = rawCategory.toLowerCase();
    
    let category;
    if (categoryLower === 'it') category = 'IT';
    else if (categoryLower === 'repair and maintenance' || categoryLower === 'maintenance') category = 'Maintenance';
    else if (categoryLower === 'marketing') category = 'Marketing';
    else if (categoryLower === 'personnel') category = 'Personnel';
    else category = 'Other_Category';

    const state = getState(row['Issue Location']);
    
    let groupKey;
    if (category === 'Other_Category' || state === 'Other') {
      groupKey = 'Other';
    } else if (state === 'CHENNAI') {
      groupKey = 'BLR - Maintenance';
    } else if (category === 'Marketing') {
      groupKey = 'Marketing';
    } else if (category === 'Maintenance' && (state === 'NCR' || state === 'HYD')) {
      groupKey = 'Maintenance_NCR_HYD';
    } else if (state === 'HYD' && category === 'IT') {
      groupKey = 'NCR - IT';
    } else {
      groupKey = `${state} - ${category}`;
    }
    
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(row);
    return acc;
  }, {});

  // Sort groups: explicit priority first, then alphabetical
  const explicitOrder = [
    'BLR - Maintenance',
    'Maintenance_NCR_HYD',
    'BLR - IT',
    'NCR - IT',
    'Marketing'
  ];

  const groups = Object.keys(groupedData).sort((a, b) => {
    if (a === 'Other') return 1; // Always push 'Other' to the very bottom
    if (b === 'Other') return -1;

    const indexA = explicitOrder.indexOf(a);
    const indexB = explicitOrder.indexOf(b);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return a.localeCompare(b);
  });

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
        <h1 className="title">State-Wise Operations Dashboard</h1>
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
        {groups.length === 0 && <div style={{padding: '2rem', textAlign: 'center'}}>No data found for the selected states and categories.</div>}
        {groups.map((group) => {
          const groupData = groupedData[group];

          if (group === 'Maintenance_NCR_HYD') {
            const ncrData = groupData.filter(r => getState(r['Issue Location']) === 'NCR');
            const hydData = groupData.filter(r => getState(r['Issue Location']) === 'HYD');

            const tabs = [
              { label: 'All', category: 'NCR & HYD', categoryData: groupData, oldIssuesCount: groupData.filter(isOpenAndOlderThan5Days).length },
              { label: 'NCR', category: 'NCR - Maintenance', categoryData: ncrData, oldIssuesCount: ncrData.filter(isOpenAndOlderThan5Days).length },
              { label: 'HYD', category: 'HYD - Maintenance', categoryData: hydData, oldIssuesCount: hydData.filter(isOpenAndOlderThan5Days).length }
            ];

            return (
              <CategorySection 
                key={group} 
                category="NCR & HYD" 
                categoryData={groupData} 
                oldIssuesCount={tabs[0].oldIssuesCount} 
                tabs={tabs}
              />
            );
          }

          const oldIssuesCount = groupData.filter(isOpenAndOlderThan5Days).length;
          return (
            <CategorySection 
              key={group} 
              category={group} 
              categoryData={groupData} 
              oldIssuesCount={oldIssuesCount} 
            />
          );
        })}
      </main>
    </div>
  );
}
