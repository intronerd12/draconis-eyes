import React, { useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { API_BASE_URL } from '../../config/api';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanData, setScanData] = useState([]);
  const [qualityData, setQualityData] = useState([]);

  const monthBuckets = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d);
    }
    return months;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        // Fetch Scan Stats
        const res = await fetch(`${API_BASE_URL}/api/scan/stats`);
        const data = await res.json();
        
        if (cancelled) return;

        // Process Quality Data (Pie Chart)
        if (data.gradeStats) {
            const gradeMap = {
                'A': { name: 'Grade A', color: '#00b34d' },
                'B': { name: 'Grade B', color: '#ffeb3b' },
                'C': { name: 'Grade C', color: '#f59e0b' },
                'D': { name: 'Rejected', color: '#ef4444' }, // Assuming D/F is rejected
                'F': { name: 'Rejected', color: '#ef4444' }
            };

            const qData = data.gradeStats.map(item => {
                const config = gradeMap[item._id] || { name: `Grade ${item._id}`, color: '#6b7280' };
                return {
                    name: config.name,
                    value: item.count,
                    color: config.color
                };
            });
            
            setQualityData(qData.length ? qData : [{ name: 'No data', value: 1, color: 'var(--gray-200)' }]);
        }

        // Process Time Series Data (Last 6 Months)
        if (data.last6Months) {
          const scanMap = {};
          data.last6Months.forEach(item => {
             scanMap[item._id] = item.count;
          });

          const scansChart = monthBuckets.map((m) => {
             // Format date to YYYY-MM
             const year = m.getFullYear();
             const month = String(m.getMonth() + 1).padStart(2, '0');
             const key = `${year}-${month}`;
             
             return {
                name: m.toLocaleDateString(undefined, { month: 'short' }),
                scans: scanMap[key] || 0,
                errors: 0, // Errors not yet tracked in stats
             };
          });
          setScanData(scansChart);
        } else {
            // Fallback
            const scansChart = monthBuckets.map((m) => {
              return {
                name: m.toLocaleDateString(undefined, { month: 'short' }),
                scans: 0,
                errors: 0,
              };
            });
            setScanData(scansChart);
        }

      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [monthBuckets]);

  return (
    <div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gray-800)', marginBottom: 10 }}>Analytics</div>
      <div style={{ color: 'var(--gray-500)', marginBottom: 22 }}>
        Real-time insights and quality breakdowns from the latest scans.
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 20,
            backgroundColor: '#fff7ed',
            border: '1px solid #fed7aa',
            color: '#9a3412',
            padding: '14px 16px',
            borderRadius: 12,
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
        <div style={{ backgroundColor: 'white', padding: 22, borderRadius: 14, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--gray-800)', marginBottom: 14 }}>
            Scan Volume Trends
          </div>
          <div style={{ height: 320, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scanData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--dragon-primary)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--dragon-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="scans"
                  stroke="var(--dragon-primary)"
                  fillOpacity={1}
                  fill="url(#colorScans)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {loading ? <div style={{ marginTop: 10, color: 'var(--gray-500)', fontSize: '0.9rem' }}>Loading…</div> : null}
        </div>

        <div style={{ backgroundColor: 'white', padding: 22, borderRadius: 14, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--gray-800)', marginBottom: 14 }}>
            Quality Distribution
          </div>
          <div style={{ height: 320, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={qualityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={105}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {qualityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
