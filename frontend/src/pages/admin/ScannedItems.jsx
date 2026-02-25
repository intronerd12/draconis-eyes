import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  RefreshCcw,
  ScanLine,
  Users,
  Trophy,
  Clock3,
  CalendarClock,
  UserRound,
  MapPin,
  FileText,
  Smartphone,
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import './ScannedItems.css';

const AUTO_REFRESH_MS = 5000;

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};
const formatTimeOnly = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleTimeString();
};
const formatDateOnly = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString();
};

const getOperatorIdentity = (scan) => {
  const id = scan?.user?._id || scan?.user?.id || scan?.operatorEmail || scan?.operatorName || null;
  return id ? String(id) : null;
};

const getGradePill = (gradeRaw) => {
  const grade = String(gradeRaw || '').toUpperCase();
  if (grade === 'A') return { grade, className: 'si-grade si-grade-a' };
  if (grade === 'B') return { grade, className: 'si-grade si-grade-b' };
  if (grade === 'C') return { grade, className: 'si-grade si-grade-c' };
  if (grade === 'D') return { grade, className: 'si-grade si-grade-d' };
  if (grade === 'E') return { grade, className: 'si-grade si-grade-e' };
  if (grade === 'UNKNOWN' || !grade || grade === 'N/A') return { grade: 'N/A', className: 'si-grade si-grade-na' };
  return { grade, className: 'si-grade si-grade-na' };
};

const getSourceLabel = (sourceRaw) => {
  const source = String(sourceRaw || 'unspecified').trim().toLowerCase();
  if (source.includes('mobile')) return 'Mobile App';
  if (source.includes('web')) return 'Web';
  if (!source || source === 'unspecified') return 'Unspecified';
  return sourceRaw;
};

const getSafeLocation = (locationValue) => {
  if (!locationValue) return '-';
  if (typeof locationValue === 'string') return locationValue;
  if (typeof locationValue === 'object') {
    const lat = locationValue.lat ?? locationValue.latitude;
    const lng = locationValue.lng ?? locationValue.longitude;
    if (typeof lat === 'number' && typeof lng === 'number') {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }
  return '-';
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

  const gradeBreakdown = useMemo(() => {
    const seed = { A: 0, B: 0, C: 0, D: 0, E: 0, NA: 0 };
    scans.forEach((scan) => {
      const grade = String(scan?.grade || '').toUpperCase();
      if (grade === 'A' || grade === 'B' || grade === 'C' || grade === 'D' || grade === 'E') {
        seed[grade] += 1;
      } else {
        seed.NA += 1;
      }
    });
    return seed;
  }, [scans]);

  const sourceBreakdown = useMemo(() => {
    const bucket = {};
    scans.forEach((scan) => {
      const label = getSourceLabel(scan?.source || 'unspecified');
      bucket[label] = (bucket[label] || 0) + 1;
    });
    return Object.entries(bucket).sort((a, b) => b[1] - a[1]);
  }, [scans]);

  return (
    <div className="si-page">
      <section className="si-hero">
        <div className="si-hero-copy">
          <h1 className="si-title">Scanned Items</h1>
          <p className="si-subtitle">Unified scan feed from all mobile users and operators.</p>
          <p className="si-meta">
            Auto-refresh every {Math.floor(AUTO_REFRESH_MS / 1000)}s {lastUpdated ? `| Last updated: ${lastUpdated.toLocaleTimeString()}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchScans()}
          disabled={loading || refreshing}
          className="si-refresh-btn"
        >
          <RefreshCcw size={15} className={refreshing ? 'si-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh now'}
        </button>
      </section>

      {!loading && scans.length > 0 && (
        <section className="si-stats-grid">
          <article className="si-stat-card">
            <div className="si-stat-top">
              <span className="si-stat-label">Total scans</span>
              <span className="si-stat-icon">
                <ScanLine size={16} />
              </span>
            </div>
            <div className="si-stat-value">{stats?.total || scans.length}</div>
          </article>

          <article className="si-stat-card">
            <div className="si-stat-top">
              <span className="si-stat-label">Unique operators</span>
              <span className="si-stat-icon">
                <Users size={16} />
              </span>
            </div>
            <div className="si-stat-value">{uniqueOperators}</div>
          </article>

          <article className="si-stat-card">
            <div className="si-stat-top">
              <span className="si-stat-label">Last scan</span>
              <span className="si-stat-icon">
                <Clock3 size={16} />
              </span>
            </div>
            <div className="si-stat-value si-stat-value-sm">
              {formatDateTime(scans[0]?.timestamp || scans[0]?.createdAt)}
            </div>
          </article>

          <article className="si-stat-card">
            <div className="si-stat-top">
              <span className="si-stat-label">Best grade</span>
              <span className="si-stat-icon">
                <Trophy size={16} />
              </span>
            </div>
            <div className="si-stat-value">{(stats?.best || '-').toString().toUpperCase()}</div>
          </article>
        </section>
      )}

      {!loading && scans.length > 0 && (
        <section className="si-toolbar">
          <div className="si-toolbar-group">
            <span className="si-toolbar-label">Grade mix</span>
            <div className="si-chip-row">
              <span className="si-chip">A {gradeBreakdown.A}</span>
              <span className="si-chip">B {gradeBreakdown.B}</span>
              <span className="si-chip">C {gradeBreakdown.C}</span>
              <span className="si-chip">D {gradeBreakdown.D}</span>
              <span className="si-chip">E {gradeBreakdown.E}</span>
              <span className="si-chip">N/A {gradeBreakdown.NA}</span>
            </div>
          </div>
          <div className="si-toolbar-group">
            <span className="si-toolbar-label">Sources</span>
            <div className="si-chip-row">
              {sourceBreakdown.map(([label, count]) => (
                <span key={label} className="si-chip">
                  <Smartphone size={13} />
                  {label} {count}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {loading ? (
        <div className="si-empty-card">
          <div className="si-empty-title">Loading scans...</div>
        </div>
      ) : scans.length === 0 ? (
        <div className="si-empty-card">
          <div className="si-empty-title">No scans recorded yet</div>
          <div className="si-empty-desc">
            Once users scan dragon fruit in the mobile app, records will appear here with grade, operator, and source details.
          </div>
        </div>
      ) : (
        <div className="si-table-shell">
          <table className="si-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Grade</th>
                <th>Fruit and notes</th>
                <th>Operator</th>
                <th>Location</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => {
                const pill = getGradePill(scan.grade);
                const operatorName = scan?.user?.name || scan?.operatorName || 'Unknown operator';
                const operatorEmail = scan?.user?.email || scan?.operatorEmail || '-';
                const fruitName = scan?.fruitType || 'No fruit data';
                const scanNotes = scan?.details || 'No notes provided';
                const created = scan.timestamp || scan.createdAt;

                return (
                  <tr key={scan._id || scan.id || `${scan?.timestamp || ''}-${scan?.operatorEmail || ''}`}>
                    <td>
                      <div className="si-cell-stack">
                        <div className="si-cell-primary">
                          <CalendarClock size={14} />
                          {formatDateOnly(created)}
                        </div>
                        <div className="si-cell-secondary">{formatTimeOnly(created)}</div>
                      </div>
                    </td>
                    <td>
                      <span className={pill.className}>
                        {pill.grade}
                      </span>
                    </td>
                    <td>
                      <div className="si-cell-stack">
                        <div className="si-cell-primary">
                          <FileText size={14} />
                          {fruitName}
                        </div>
                        <div className="si-cell-secondary si-notes">{scanNotes}</div>
                      </div>
                    </td>
                    <td>
                      <div className="si-cell-stack">
                        <div className="si-cell-primary">
                          <UserRound size={14} />
                          {operatorName}
                        </div>
                        <div className="si-cell-secondary">{operatorEmail}</div>
                      </div>
                    </td>
                    <td>
                      <div className="si-cell-primary">
                        <MapPin size={14} />
                        {getSafeLocation(scan.location)}
                      </div>
                    </td>
                    <td>
                      <span className="si-source-pill">{getSourceLabel(scan.source)}</span>
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
