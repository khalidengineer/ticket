"use client";

import React from 'react';
import { Filter, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function ReportFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentCity = searchParams.get('city') || 'All Cities';
  const currentCategory = searchParams.get('category') || 'All Categories';
  const currentPriority = searchParams.get('priority') || 'All Priorities';
  const currentStatus = searchParams.get('status') || 'All Status';

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && !value.startsWith('All ')) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    router.refresh(); // Force bypass Next.js aggressive client-side router cache
  };

  const resetAll = () => {
    router.push(pathname, { scroll: false });
    router.refresh();
  };

  return (
    <div className="filters-bar">
      <div className="filter-group">
        <Filter size={16} color="#0284c7" /> CONTROLS
      </div>
      <select 
        className={`filter-select ${currentCity !== 'All Cities' ? 'active' : ''}`}
        value={currentCity} 
        onChange={(e) => updateParam('city', e.target.value)}
      >
        <option>All Cities</option>
        <option>Delhi NCR</option>
        <option>Bangalore</option>
        <option>Hyderabad</option>
        <option>Chennai</option>
        <option>Others</option>
      </select>

      <select 
        className={`filter-select ${currentCategory !== 'All Categories' ? 'active' : ''}`}
        value={currentCategory}
        onChange={(e) => updateParam('category', e.target.value)}
      >
        <option>All Categories</option>
        <option>IT</option>
        <option>Maintenance</option>
        <option>Marketing</option>
      </select>

      <select 
        className={`filter-select ${currentPriority !== 'All Priorities' ? 'active' : ''}`}
        value={currentPriority}
        onChange={(e) => updateParam('priority', e.target.value)}
      >
        <option>All Priorities</option>
        <option>Critical</option>
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>

      <select 
        className={`filter-select ${currentStatus !== 'All Status' ? 'active' : ''}`}
        value={currentStatus}
        onChange={(e) => updateParam('status', e.target.value)}
      >
        <option>All Status</option>
        <option>Open</option>
        <option>Closed/Resolved</option>
      </select>

      <button onClick={resetAll} className="btn-premium" style={{border: 'none', background: 'transparent'}}>
        <X size={14} style={{display:'inline', verticalAlign:'middle'}}/> Reset All
      </button>
    </div>
  );
}
