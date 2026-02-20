import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';

const AUTO_REFRESH_MS = 5000;

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const getOperatorIdentity = (scan) => {
  const id = scan?.user?._id || scan?.user?.id || scan?.operatorEmail || scan?.operatorName || null;
  return id ? String(id) : null;
};

const getGradePill = (gradeRaw) => {
  const grade = String(gradeRaw || '').toUpperCase();
  if (grade === 'A') return { grade, bg: '#dcfce7', fg: '#166534' };
  if (grade === 'B') return { grade, bg: '#dbeafe', fg: '#1e40af' };
  if (grade === 'C') return { grade, bg: '#fef9c3', fg: '#92400e' };
  if (grade === 'UNKNOWN' || !grade) return { grade: 'N/A', bg: '#f1f5f9', fg: '#334155' };
  return { grade, bg: '#fee2e2', fg: '#991b1b' };
};

const ScannedItems = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchScans = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [scansRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/scan`, { cache: 'no-store' }),
        fetch(`${API_BASE_URL}/api/scan/stats`, { cache: 'no-store' }),
      ]);

      if (!scansRes.ok) {
        throw new Error('Failed to fetch scans');
      }

      const scansData = await scansRes.json();
      setScans(Array.isArray(scansData) ? scansData : []);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        setStats(null);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching scans:', error);
      if (!silent) {
        toast.error(error?.message || 'Error fetching scans');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchScans();
    const intervalId = setInterval(() => {
      fetchScans({ silent: true });
    }, AUTO_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, [fetchScans]);

  const uniqueOperators = useMemo(
    () => new Set(scans.map((scan) => getOperatorIdentity(scan)).filter(Boolean)).size,
    [scans]
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gray-800)', marginBottom: 6 }}>Scanned Items</div>
          <div style={{ color: 'var(--gray-500)' }}>Unified scan feed from all mobile users and operators.</div>
          <div style={{ color: 'var(--gray-400)', fontSize: '0.82rem', marginTop: 6 }}>
            Auto-refresh every {Math.floor(AUTO_REFRESH_MS / 1000)}s {lastUpdated ? `| Last updated: ${lastUpdated.toLocaleTimeString()}` : ''}
          </div>
        </div>
        <button
          type="button"
          onClick={() => fetchScans()}
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
          {refreshing ? 'Refreshing...' : 'Refresh now'}
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
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gray-800)' }}>{stats?.total || scans.length}</div>
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
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gray-800)' }}>{uniqueOperators}</div>
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
              {formatDateTime(scans[0]?.timestamp || scans[0]?.createdAt)}
            </div>
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
              Best grade
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gray-800)' }}>
              {(stats?.best || '-').toString().toUpperCase()}
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
          Loading scans...
        </div>
      ) : scans.length === 0 ? (
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: 14,
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--gray-100)',
            padding: '32px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--gray-800)' }}>No scans recorded yet</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--gray-500)', textAlign: 'center', maxWidth: 520 }}>
            Once users scan dragon fruit in the mobile app, records will appear here with grade, operator, and source details.
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: 14, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', border: '1px solid var(--gray-100)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                <th style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--gray-600)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Date</th>
                <th style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--gray-600)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Grade</th>
                <th style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--gray-600)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Fruit and notes</th>
                <th style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--gray-600)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Operator</th>
                <th style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--gray-600)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Location</th>
                <th style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--gray-600)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Source</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => {
                const pill = getGradePill(scan.grade);
                const operatorName = scan?.user?.name || scan?.operatorName || 'Unknown operator';
                const operatorEmail = scan?.user?.email || scan?.operatorEmail || '-';
                const fruitNotes = [scan?.fruitType, scan?.details].filter(Boolean).join(' | ') || '-';

                return (
                  <tr key={scan._id || scan.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '14px 16px', color: 'var(--gray-600)', fontSize: '0.9rem' }}>
                      {formatDateTime(scan.timestamp || scan.createdAt)}
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
                        {pill.grade}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--gray-600)', fontSize: '0.9rem' }}>{fruitNotes}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--gray-600)', fontSize: '0.9rem' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{operatorName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{operatorEmail}</div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--gray-600)', fontSize: '0.9rem' }}>{scan.location || '-'}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--gray-600)', fontSize: '0.9rem' }}>
                      {scan.source || 'unspecified'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ScannedItems;
