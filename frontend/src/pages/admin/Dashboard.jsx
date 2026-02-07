import React, { useEffect, useMemo, useState } from 'react';
import { Users, ScanLine, AlertCircle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../../config/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  const [healthPct, setHealthPct] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [weekly, setWeekly] = useState([]);

  const weekBuckets = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }
    return days;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        // 1. Fetch Users Count
        const usersRes = await fetch(`${API_BASE_URL}/api/users?limit=1`);
        const usersData = await usersRes.json();
        
        // 2. Fetch Scan Stats
        const scansRes = await fetch(`${API_BASE_URL}/api/scan/stats`);
        const scansData = await scansRes.json();

        // 3. Fetch Health
        const healthRes = await fetch(`${API_BASE_URL}/status`);
        const healthBody = await healthRes.json().catch(() => null);
        
        if (cancelled) return;

        // Process Users
        setTotalUsers(usersData.totalUsers || 0);

        // Process Scans
        setTotalScans(scansData.total || 0);
        
        // Process Health
        let pct = null;
        let alerts = 0;
        if (healthRes.ok && healthBody) {
            // Assume healthBody returns { database: 'connected', ... }
            const services = Object.values(healthBody);
            const connectedServices = services.filter(s => s.includes('connected')).length;
            const totalServices = services.length;
            
            pct = totalServices > 0 ? Math.round((connectedServices / totalServices) * 100) : 0;
            alerts = totalServices - connectedServices;
        } else {
            pct = 0;
            alerts = 1;
        }
        setHealthPct(pct);
        setActiveAlerts(alerts);

        // Process Weekly Data
        if (scansData.last7Days) {
          // Create a map for quick lookup: "YYYY-MM-DD" -> count
          const scanMap = {};
          scansData.last7Days.forEach(item => {
            scanMap[item._id] = item.count;
          });

          // Map weekBuckets to data
          const weeklyData = weekBuckets.map(d => {
            const dateStr = d.toISOString().split('T')[0];
            return {
              name: d.toLocaleDateString(undefined, { weekday: 'short' }),
              scans: scanMap[dateStr] || 0,
            };
          });
          setWeekly(weeklyData);
        } else {
           const mockWeekly = weekBuckets.map(d => ({
            name: d.toLocaleDateString(undefined, { weekday: 'short' }),
            scans: 0, 
          }));
          setWeekly(mockWeekly);
        }

      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [weekBuckets]);

  const stats = [
    { title: 'Total Users', value: totalUsers.toLocaleString(), icon: <Users size={24} color="white" />, color: '#3b82f6' },
    { title: 'Total Scans', value: totalScans.toLocaleString(), icon: <ScanLine size={24} color="white" />, color: 'var(--dragon-primary)' },
    {
      title: 'System Health',
      value: healthPct === null ? '—' : `${healthPct}%`,
      icon: <CheckCircle size={24} color="white" />,
      color: healthPct === null ? '#6b7280' : healthPct >= 90 ? '#10b981' : '#f59e0b',
    },
    { title: 'Active Alerts', value: String(activeAlerts), icon: <AlertCircle size={24} color="white" />, color: '#f59e0b' },
  ];

  return (
    <div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gray-800)', marginBottom: 10 }}>Dashboard</div>
      <div style={{ color: 'var(--gray-500)', marginBottom: 22 }}>
        A live overview of users, scans, and system health.
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 18,
          marginBottom: 22,
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.title}
            style={{
              backgroundColor: 'white',
              padding: 18,
              borderRadius: 14,
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              border: '1px solid var(--gray-100)',
            }}
          >
            <div>
              <div style={{ color: 'var(--gray-500)', fontSize: '0.85rem', fontWeight: 700 }}>{stat.title}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--gray-900)', marginTop: 6 }}>
                {stat.value}
              </div>
            </div>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                backgroundColor: stat.color,
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
              }}
            >
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: 'white', padding: 22, borderRadius: 14, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--gray-800)' }}>Weekly Scan Activity</div>
            <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginTop: 4 }}>Last 7 days</div>
          </div>
          {loading ? <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Loading…</div> : null}
        </div>
        <div style={{ height: 320, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
              <Tooltip
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 8px 18px rgba(0,0,0,0.12)',
                }}
              />
              <Bar dataKey="scans" fill="var(--dragon-primary)" radius={[6, 6, 0, 0]} barSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};


export default Dashboard;
