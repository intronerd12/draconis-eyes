import React from 'react';
import { Server, Activity, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ApiMonitoring = () => {
  const apiStats = [
    { title: 'Total Requests', value: '1.2M', change: '+12%', icon: <Server size={24} color="#3b82f6" /> },
    { title: 'Avg Latency', value: '45ms', change: '-5%', icon: <Clock size={24} color="#10b981" /> },
    { title: 'Error Rate', value: '0.02%', change: '0%', icon: <AlertTriangle size={24} color="#ef4444" /> },
    { title: 'Uptime', value: '99.99%', change: '0%', icon: <Activity size={24} color="#8b5cf6" /> },
  ];

  const latencyData = [
    { time: '10:00', ms: 45 },
    { time: '10:05', ms: 48 },
    { time: '10:10', ms: 42 },
    { time: '10:15', ms: 55 },
    { time: '10:20', ms: 50 },
    { time: '10:25', ms: 46 },
    { time: '10:30', ms: 44 },
    { time: '10:35', ms: 45 },
    { time: '10:40', ms: 47 },
    { time: '10:45', ms: 43 },
    { time: '10:50', ms: 49 },
    { time: '10:55', ms: 45 },
  ];

  const endpoints = [
    { method: 'GET', path: '/api/v1/scans', status: 'Operational', latency: '42ms' },
    { method: 'POST', path: '/api/v1/scans', status: 'Operational', latency: '65ms' },
    { method: 'GET', path: '/api/v1/users', status: 'Operational', latency: '35ms' },
    { method: 'POST', path: '/api/v1/auth/login', status: 'Operational', latency: '55ms' },
    { method: 'GET', path: '/api/v1/stats', status: 'Operational', latency: '120ms' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '25px', color: 'var(--gray-800)' }}>API Monitoring</h1>

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
            {endpoints.map((ep, index) => (
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
                  <CheckCircle size={16} color="#10b981" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ApiMonitoring;
