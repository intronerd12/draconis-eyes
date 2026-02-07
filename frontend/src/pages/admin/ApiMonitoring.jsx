import React, { useEffect, useMemo, useState } from 'react';
import { Server, Activity, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../../config/api';

const ApiMonitoring = () => {
  const [error, setError] = useState('');
  const [latencyData, setLatencyData] = useState([]);
  const [checks, setChecks] = useState({ total: 0, failures: 0 });
  const [components, setComponents] = useState({});

  const avgLatency = useMemo(() => {
    if (!latencyData.length) return null;
    const sum = latencyData.reduce((a, b) => a + (b.ms || 0), 0);
    return Math.round(sum / latencyData.length);
  }, [latencyData]);

  const errorRate = useMemo(() => {
    if (!checks.total) return null;
    return (checks.failures / checks.total) * 100;
  }, [checks]);

  const uptime = useMemo(() => {
    if (!checks.total) return null;
    return ((checks.total - checks.failures) / checks.total) * 100;
  }, [checks]);

  useEffect(() => {
    let cancelled = false;

    // Fetch API status from our backend
    const tick = async () => {
      setError('');
      const start = performance.now();
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`);
        const latencyMs = Math.round(performance.now() - start);
        const body = await res.json().catch(() => null);

        const ok = res.ok && body?.status === 'ok';
        const time = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

        if (!cancelled) {
          setLatencyData((prev) => {
            const next = [...prev, { time, ms: latencyMs, ok }];
            return next.length > 60 ? next.slice(next.length - 60) : next;
          });
          setChecks((prev) => ({ total: prev.total + 1, failures: prev.failures + (ok ? 0 : 1) }));
          setComponents(body?.components || {});
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Status check failed');
          const time = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
          setLatencyData((prev) => {
            const next = [...prev, { time, ms: 0, ok: false }];
            return next.length > 60 ? next.slice(next.length - 60) : next;
          });
          setChecks((prev) => ({ total: prev.total + 1, failures: prev.failures + 1 }));
        }
      }
    };

    tick();
    const interval = setInterval(tick, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const apiStats = [
    { title: 'Checks (Session)', value: checks.total.toLocaleString(), change: 'live', icon: <Server size={24} color="#3b82f6" /> },
    { title: 'Avg Latency', value: avgLatency === null ? '—' : `${avgLatency}ms`, change: 'live', icon: <Clock size={24} color="#10b981" /> },
    { title: 'Error Rate', value: errorRate === null ? '—' : `${errorRate.toFixed(2)}%`, change: 'live', icon: <AlertTriangle size={24} color="#ef4444" /> },
    { title: 'Uptime', value: uptime === null ? '—' : `${uptime.toFixed(2)}%`, change: 'live', icon: <Activity size={24} color="#8b5cf6" /> },
  ];

  const endpoints = Object.entries(components).map(([name, ok]) => ({
    method: 'CHECK',
    path: name,
    status: ok ? 'Operational' : 'Down',
    latency: ok ? '—' : '—',
    ok,
  }));

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '25px', color: 'var(--gray-800)' }}>API Monitoring</h1>

      {error ? (
        <div style={{ marginBottom: '20px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', padding: '14px 16px', borderRadius: '12px' }}>
          {error}
        </div>
      ) : null}

      <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ color: 'var(--gray-600)', fontWeight: 600 }}>
          Polling <span style={{ color: 'var(--gray-900)' }}>{API_BASE_URL}</span>/status every 30s
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {apiStats.map((stat, index) => (
          <div key={index} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--gray-50)', borderRadius: '8px' }}>
                {stat.icon}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '500', color: stat.change.startsWith('+') ? '#10b981' : stat.change.startsWith('-') ? '#10b981' : '#6b7280' }}>
                {stat.change}
              </span>
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--gray-900)' }}>{stat.value}</h3>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>{stat.title}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px' }}>
        
        {/* Latency Chart */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px', color: 'var(--gray-800)' }}>API Latency (Last Hour)</h2>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <Tooltip />
                <Line type="monotone" dataKey="ms" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Endpoint Status */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px', color: 'var(--gray-800)' }}>Endpoint Status</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {endpoints.length ? endpoints.map((ep, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: index < endpoints.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold', 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      backgroundColor: ep.method === 'GET' ? '#dbeafe' : '#dcfce7', 
                      color: ep.method === 'GET' ? '#1e40af' : '#166534' 
                    }}>
                      {ep.method}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--gray-700)' }}>{ep.path}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{ep.latency}</span>
                  {ep.ok ? <CheckCircle size={16} color="#10b981" /> : <AlertTriangle size={16} color="#ef4444" />}
                </div>
              </div>
            )) : (
              <div style={{ color: 'var(--gray-500)' }}>No component data yet.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ApiMonitoring;
