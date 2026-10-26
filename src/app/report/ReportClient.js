"use client";

import React, { useRef } from 'react';

export default function ReportClient({ children }) {
  const reportRef = useRef(null);

  const handleScreenshot = async (e) => {
    if (!reportRef.current) return;
    
    const button = e.currentTarget;
    
    try {
      button.style.display = 'none'; // Hide button for clean report

      // Wait a tiny bit
      await new Promise(resolve => setTimeout(resolve, 150));
      const domtoimage = (await import('dom-to-image-more')).default;
      const scale = 2; 

      const dataUrl = await domtoimage.toPng(reportRef.current, {
        bgcolor: '#f8fafc', // match global background
        width: reportRef.current.scrollWidth * scale,
        height: reportRef.current.scrollHeight * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          margin: '0'
        }
      });

      button.style.display = '';

      const link = document.createElement('a');
      link.download = `Corporate-Executive-Report.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      button.style.display = '';
      console.error('Failed to take screenshot', error);
      alert('Failed to capture report. Please try again.');
    }
  };

  return (
    <div className="container" ref={reportRef} style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-3rem', position: 'relative', zIndex: 10 }}>
        <button onClick={handleScreenshot} className="screenshot-btn" title="Download Report">
          📸 Download Report
        </button>
      </div>
      {children}
    </div>
  );
}
