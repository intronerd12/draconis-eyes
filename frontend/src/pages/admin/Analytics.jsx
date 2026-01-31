import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const Analytics = () => {
  const scanData = [
    { name: 'Jan', scans: 400, errors: 24 },
    { name: 'Feb', scans: 300, errors: 13 },
    { name: 'Mar', scans: 200, errors: 98 },
    { name: 'Apr', scans: 278, errors: 39 },
    { name: 'May', scans: 189, errors: 48 },
    { name: 'Jun', scans: 239, errors: 38 },
    { name: 'Jul', scans: 349, errors: 43 },
  ];

  const qualityData = [
    { name: 'Grade A', value: 400, color: '#00b34d' },
    { name: 'Grade B', value: 300, color: '#ffeb3b' },
    { name: 'Grade C', value: 300, color: '#f59e0b' },
    { name: 'Rejected', value: 200, color: '#ef4444' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '25px', color: 'var(--gray-800)' }}>Analytics & Reports</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px' }}>
        
        {/* Scan Volume Chart */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px', color: 'var(--gray-800)' }}>Scan Volume Trends</h2>
          <div style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scanData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--dragon-primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--dragon-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip />
                <Area type="monotone" dataKey="scans" stroke="var(--dragon-primary)" fillOpacity={1} fill="url(#colorScans)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Distribution */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px', color: 'var(--gray-800)' }}>Quality Distribution</h2>
          <div style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={qualityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {qualityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
