import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';

const ScannedItems = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScans = useCallback(async () => {
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
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gray-800)', marginBottom: 6 }}>Scanned Items</div>
          <div style={{ color: 'var(--gray-500)' }}>Recent fruit scans coming from mobile operators.</div>
        </div>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            fetchScans();
          }}
          disabled={loading || refreshing}
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            border: '1px solid var(--gray-200)',
            backgroundColor: 'white',
            color: 'var(--gray-700)',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            cursor: loading || refreshing ? 'default' : 'pointer',
            opacity: loading || refreshing ? 0.6 : 1,
          }}
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {!loading && scans.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div
            style={{
              flex: '0 0 180px',
              backgroundColor: 'white',
              borderRadius: 14,
              border: '1px solid var(--gray-100)',
              boxShadow: 'var(--shadow-sm)',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 700, marginBottom: 4 }}>
              Total scans
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gray-800)' }}>{scans.length}</div>
          </div>
          <div
            style={{
              flex: '0 0 220px',
              backgroundColor: 'white',
              borderRadius: 14,
              border: '1px solid var(--gray-100)',
              boxShadow: 'var(--shadow-sm)',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 700, marginBottom: 4 }}>
              Unique operators
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gray-800)' }}>
              {Array.from(new Set(scans.map((s) => (s.user && s.user._id ? s.user._id : null)).filter(Boolean))).length}
            </div>
          </div>
          <div
            style={{
              flex: '0 0 260px',
              backgroundColor: 'white',
              borderRadius: 14,
              border: '1px solid var(--gray-100)',
              boxShadow: 'var(--shadow-sm)',
              padding: '14px 16px',
            }}
          >
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 700, marginBottom: 4 }}>
              Last scan
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--gray-700)' }}>
              {scans[0] && scans[0].timestamp ? new Date(scans[0].timestamp).toLocaleString() : '—'}
            </div>
          </div>
        </div>
      )}

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
                <th style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--gray-600)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Fruit & notes</th>
                <th style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--gray-600)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Owner</th>
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
                    <td style={{ padding: '14px 16px', color: 'var(--gray-600)', fontSize: '0.9rem' }}>
                      {scan.details || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--gray-600)', fontSize: '0.9rem' }}>
                      {scan.user ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{scan.user.name || 'User'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{scan.user.email || '—'}</div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
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
