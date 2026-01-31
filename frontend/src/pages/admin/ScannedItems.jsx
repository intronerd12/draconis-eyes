import React from 'react';
import { Eye, Download } from 'lucide-react';

const ScannedItems = () => {
  const scans = [
    { id: 'SC001', date: '2023-10-25 10:30 AM', user: 'Alice Johnson', grade: 'A', weight: '450g', defects: 'None', image: 'https://via.placeholder.com/50' },
    { id: 'SC002', date: '2023-10-25 11:15 AM', user: 'Bob Smith', grade: 'B', weight: '380g', defects: 'Minor Blemish', image: 'https://via.placeholder.com/50' },
    { id: 'SC003', date: '2023-10-25 11:45 AM', user: 'Alice Johnson', grade: 'A', weight: '460g', defects: 'None', image: 'https://via.placeholder.com/50' },
    { id: 'SC004', date: '2023-10-25 01:20 PM', user: 'Charlie Brown', grade: 'C', weight: '320g', defects: 'Shape', image: 'https://via.placeholder.com/50' },
    { id: 'SC005', date: '2023-10-25 02:10 PM', user: 'Bob Smith', grade: 'A', weight: '445g', defects: 'None', image: 'https://via.placeholder.com/50' },
  ];

  const getGradeColor = (grade) => {
    switch(grade) {
      case 'A': return '#10b981';
      case 'B': return '#f59e0b';
      case 'C': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--gray-800)' }}>Scanned Dragonfruit</h1>
        <button style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '10px 15px', 
          backgroundColor: 'white', 
          border: '1px solid var(--gray-300)', 
          borderRadius: '8px',
          fontWeight: '500',
          color: 'var(--gray-700)'
        }}>
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {scans.map((scan) => (
          <div key={scan.id} style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s' }}>
            <div style={{ height: '150px', backgroundColor: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <span style={{ color: 'var(--gray-400)' }}>Dragonfruit Image</span>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--gray-900)' }}>{scan.id}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{scan.date}</p>
                </div>
                <span style={{ 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  backgroundColor: getGradeColor(scan.grade), 
                  color: 'white', 
                  fontWeight: 'bold',
                  fontSize: '0.85rem'
                }}>
                  Grade {scan.grade}
                </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '2px' }}>Scanned By</span>
                  {scan.user}
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '2px' }}>Weight</span>
                  {scan.weight}
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '2px' }}>Defects Detected</span>
                  {scan.defects}
                </div>
              </div>

              <button style={{ 
                width: '100%', 
                marginTop: '20px', 
                padding: '10px', 
                backgroundColor: 'var(--gray-50)', 
                border: '1px solid var(--gray-200)', 
                borderRadius: '8px', 
                color: 'var(--dragon-primary)', 
                fontWeight: '600',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '8px'
              }}>
                <Eye size={18} /> View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScannedItems;
