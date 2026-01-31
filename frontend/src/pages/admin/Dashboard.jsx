import React from 'react';
import { Users, ScanLine, AlertCircle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const stats = [
    { title: 'Total Users', value: '1,234', icon: <Users size={24} color="white" />, color: '#3b82f6' },
    { title: 'Total Scans', value: '8,543', icon: <ScanLine size={24} color="white" />, color: '#e6005c' },
    { title: 'System Health', value: '98%', icon: <CheckCircle size={24} color="white" />, color: '#10b981' },
    { title: 'Active Alerts', value: '3', icon: <AlertCircle size={24} color="white" />, color: '#f59e0b' },
  ];

  const data = [
    { name: 'Mon', scans: 400 },
    { name: 'Tue', scans: 300 },
    { name: 'Wed', scans: 550 },
    { name: 'Thu', scans: 450 },
    { name: 'Fri', scans: 700 },
    { name: 'Sat', scans: 900 },
    { name: 'Sun', scans: 850 },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '25px', color: 'var(--gray-800)' }}>Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {stats.map((stat, index) => (
          <div key={index} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', fontWeight: '500' }}>{stat.title}</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--gray-900)', marginTop: '5px' }}>{stat.value}</p>
            </div>
            <div style={{ backgroundColor: stat.color, padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px', color: 'var(--gray-800)' }}>Weekly Scan Activity</h2>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
              <Bar dataKey="scans" fill="var(--dragon-primary)" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
