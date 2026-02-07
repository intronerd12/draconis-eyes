import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';

const ScannedItems = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scan`);
      if (response.ok) {
        const data = await response.json();
        setScans(data);
      } else {
        toast.error('Failed to fetch scans');
      }
    } catch (error) {
      console.error('Error fetching scans:', error);
      toast.error('Error fetching scans');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gray-800)', marginBottom: 10 }}>Scanned Items</div>
      <div style={{ color: 'var(--gray-500)', marginBottom: 22 }}>Recent scans recorded by the system.</div>

      {loading ? (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: 14,
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--gray-100)',
            height: 240,
            display: 'grid',
            placeItems: 'center',
            color: 'var(--gray-500)',
            fontWeight: 700,
          }}
        >
          Loading…
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: 14, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', border: '1px solid var(--gray-100)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                <th style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--gray-600)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Date</th>
                <th style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--gray-600)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Grade</th>
                <th style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--gray-600)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Details</th>
                <th style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--gray-600)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Location</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => {
                const grade = (scan.grade || '').toUpperCase();
                const pill =
                  grade === 'A'
                    ? { bg: '#dcfce7', fg: '#166534' }
                    : grade === 'B'
                      ? { bg: '#dbeafe', fg: '#1e40af' }
                      : grade === 'C'
                        ? { bg: '#fef9c3', fg: '#92400e' }
                        : { bg: '#fee2e2', fg: '#991b1b' };

                return (
                  <tr key={scan._id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '14px 16px', color: 'var(--gray-600)', fontSize: '0.9rem' }}>
                      {scan.timestamp ? new Date(scan.timestamp).toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 10px',
                          borderRadius: 999,
                          backgroundColor: pill.bg,
                          color: pill.fg,
                          fontSize: '0.8rem',
                          fontWeight: 900,
                        }}
                      >
                        {grade || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--gray-600)', fontSize: '0.9rem' }}>{scan.details || '—'}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--gray-600)', fontSize: '0.9rem' }}>{scan.location || '—'}</td>
                  </tr>
                );
              })}

              {scans.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '18px 16px', textAlign: 'center', color: 'var(--gray-500)' }}>
                    No scans found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ScannedItems;
