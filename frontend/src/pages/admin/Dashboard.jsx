import React, { useEffect, useMemo, useState } from 'react';
import { Users, ScanLine, AlertCircle, CheckCircle, TrendingUp, Activity, Database, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { API_BASE_URL } from '../../config/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  const [healthPct, setHealthPct] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [weekly, setWeekly] = useState([]);
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [systemHealth, setSystemHealth] = useState({});

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

  const GRADE_COLORS = useMemo(
    () => ({
      A: '#10b981',
      B: '#f59e0b',
      C: '#ef4444',
      Reject: '#64748b',
    }),
    []
  );

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
        const healthObj = {};
        if (healthRes.ok && healthBody) {
            const services = Object.entries(healthBody);
            const connectedServices = services.filter(([, status]) => 
              typeof status === 'string' && status.includes('connected')
            ).length;
            const totalServices = services.length;
            
            pct = totalServices > 0 ? Math.round((connectedServices / totalServices) * 100) : 0;
            alerts = totalServices - connectedServices;
            
            // Store health details
            services.forEach(([key, value]) => {
              healthObj[key] = typeof value === 'string' ? value : 'unknown';
            });
        } else {
            pct = 0;
            alerts = 1;
        }
        setHealthPct(pct);
        setActiveAlerts(alerts);
        setSystemHealth(healthObj);

        // Process Weekly Data
        if (scansData.last7Days) {
          const scanMap = {};
          scansData.last7Days.forEach(item => {
            scanMap[item._id] = item.count;
          });

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

        // Process Grade Distribution
        if (scansData.gradeDistribution) {
          const grades = Object.entries(scansData.gradeDistribution).map(([grade, count]) => ({
            name: grade,
            value: count,
            fill: GRADE_COLORS[grade] || '#6b7280'
          }));
          setGradeDistribution(grades);
        } else {
          setGradeDistribution([
            { name: 'A', value: 45, fill: GRADE_COLORS['A'] },
            { name: 'B', value: 35, fill: GRADE_COLORS['B'] },
            { name: 'C', value: 15, fill: GRADE_COLORS['C'] },
            { name: 'Reject', value: 5, fill: GRADE_COLORS['Reject'] }
          ]);
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
  }, [weekBuckets, GRADE_COLORS]);

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

  if (loading) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: 'var(--gray-600)' }}>Loading dashboard...</div>
      </div>
    );
  }

  const healthStatus = healthPct >= 80 ? 'healthy' : healthPct >= 50 ? 'warning' : 'critical';
  const healthColor = healthStatus === 'healthy' ? '#10b981' : healthStatus === 'warning' ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--gray-900)', marginBottom: '8px' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--gray-600)', fontSize: '15px' }}>
          System overview, AI model health, and real-time scan metrics
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: '20px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '14px 16px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <AlertCircle size={20} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>{error}</div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {stats.map((stat) => (
          <div
            key={stat.title}
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid var(--gray-200)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                {stat.title}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--gray-900)' }}>
                {stat.value}
              </div>
            </div>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '10px',
                backgroundColor: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Weekly Scans Chart */}
        <div style={{
          padding: '24px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '1px solid var(--gray-200)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: 'var(--gray-900)' }}>
            Weekly Scan Activity
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Bar dataKey="scans" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Distribution */}
        {gradeDistribution.length > 0 && (
          <div style={{
            padding: '24px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid var(--gray-200)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: 'var(--gray-900)' }}>
              Quality Grade Distribution
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* System Services Health */}
      <div style={{
        padding: '24px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '1px solid var(--gray-200)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '32px'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: 'var(--gray-900)' }}>
          🔧 Service Status
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {Object.entries(systemHealth).length > 0 ? (
            Object.entries(systemHealth).map(([service, status]) => (
              <div key={service} style={{ padding: '14px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--gray-900)', textTransform: 'capitalize' }}>
                    {service.replace(/_/g, ' ')}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: status.includes('connected') ? '#d1fae5' : '#fee2e2',
                    color: status.includes('connected') ? '#065f46' : '#991b1b'
                  }}>
                    {status.includes('connected') ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                  {status}
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', padding: '16px', color: 'var(--gray-500)', textAlign: 'center' }}>
              Loading service information...
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{
        padding: '24px',
        backgroundColor: '#f0f9ff',
        borderRadius: '12px',
        border: '1px solid #bfdbfe'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1e40af' }}>
          📊 Quick Stats & KPIs
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#1e3a8a', fontWeight: '600', marginBottom: '4px' }}>
              Avg. Scans/Day
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>
              {weekly.length > 0 ? Math.round(weekly.reduce((a, b) => a + b.scans, 0) / 7) : 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#1e3a8a', fontWeight: '600', marginBottom: '4px' }}>
              Top Grade %
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
              {gradeDistribution.length > 0
                ? Math.round((gradeDistribution[0]?.value || 0) / gradeDistribution.reduce((a, b) => a + b.value, 1) * 100)
                : 0}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#1e3a8a', fontWeight: '600', marginBottom: '4px' }}>
              System Uptime
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: healthColor }}>
              {healthPct}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#1e3a8a', fontWeight: '600', marginBottom: '4px' }}>
              Avg Users/Day
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6' }}>
              {totalUsers > 0 ? Math.round(totalUsers / 30) : 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Dashboard;
