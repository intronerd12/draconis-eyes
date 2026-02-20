import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, CloudSun, RefreshCw, Smartphone, Users } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const SOURCE_COLORS = {
  Mobile: '#dc2626',
  Web: '#f97316',
  Unknown: '#9ca3af',
  Other: '#64748b',
};

const GRADE_COLORS = {
  A: '#16a34a',
  B: '#65a30d',
  C: '#f59e0b',
  D: '#ea580c',
  E: '#dc2626',
  UNKNOWN: '#64748b',
};

const numberFmt = new Intl.NumberFormat('en-US');

const defaultAnalytics = {
  generatedAt: null,
  totals: {
    scans: 0,
    users: 0,
    activeUsers: 0,
    mobileScans: 0,
    webScans: 0,
    logins24h: 0,
  },
  scanTrend: [],
  loginTrend: [],
  gradeDistribution: [],
  sourceDistribution: [],
  diseaseSignals: [],
};

const fetchJsonWithTimeout = async (url, timeoutMs = 4500) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

const Analytics = () => {
  const [analytics, setAnalytics] = useState(defaultAnalytics);
  const [weather, setWeather] = useState(null);
  const [serviceHealth, setServiceHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAnalytics = useCallback(async (showInitialLoader = false) => {
    if (showInitialLoader) setLoading(true);
    else setRefreshing(true);

    const requests = await Promise.allSettled([
      fetchJsonWithTimeout(`${API_BASE_URL}/api/scan/analytics`),
      fetchJsonWithTimeout(`${API_BASE_URL}/api/weather?province=Metro%20Manila`, 5000),
      fetchJsonWithTimeout(`${API_BASE_URL}/status`, 5000),
    ]);

    const [analyticsResult, weatherResult, serviceResult] = requests;
    const hasAnalytics = analyticsResult.status === 'fulfilled';
    const hasWeather = weatherResult.status === 'fulfilled';
    const hasService = serviceResult.status === 'fulfilled';

    if (!hasAnalytics) {
      const reason = analyticsResult?.reason?.message || 'Analytics endpoint unavailable';
      setError(`Failed to refresh analytics: ${reason}`);
    } else {
      setError('');
      setAnalytics(analyticsResult.value || defaultAnalytics);
    }

    if (hasWeather) setWeather(weatherResult.value);
    if (hasService) setServiceHealth(serviceResult.value);
    if (hasAnalytics || hasWeather || hasService) setLastUpdated(new Date());

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async (initial = false) => {
      if (cancelled) return;
      await loadAnalytics(initial);
    };

    run(true);
    const intervalId = setInterval(() => run(false), 5000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [loadAnalytics]);

  const cards = useMemo(
    () => [
      {
        label: 'Total Scans',
        value: numberFmt.format(analytics.totals.scans),
        icon: <Activity size={20} color="#fff" />,
        color: '#1d4ed8',
      },
      {
        label: 'Mobile Scans',
        value: numberFmt.format(analytics.totals.mobileScans),
        icon: <Smartphone size={20} color="#fff" />,
        color: '#dc2626',
      },
      {
        label: 'Users',
        value: numberFmt.format(analytics.totals.users),
        sub: `${numberFmt.format(analytics.totals.activeUsers)} active`,
        icon: <Users size={20} color="#fff" />,
        color: '#0f766e',
      },
      {
        label: 'Logins (24h)',
        value: numberFmt.format(analytics.totals.logins24h),
        icon: <RefreshCw size={20} color="#fff" />,
        color: '#7c3aed',
      },
    ],
    [analytics]
  );

  const sourcePie = useMemo(
    () =>
      (analytics.sourceDistribution || []).map((row) => ({
        ...row,
        name: row.source,
        value: row.count,
      })),
    [analytics.sourceDistribution]
  );

  const gradeBars = useMemo(
    () =>
      (analytics.gradeDistribution || []).map((row) => ({
        ...row,
        color: GRADE_COLORS[row.grade] || GRADE_COLORS.UNKNOWN,
      })),
    [analytics.gradeDistribution]
  );

  const diseaseSignalBars = useMemo(
    () => (analytics.diseaseSignals || []).map((row) => ({ ...row, value: row.count })),
    [analytics.diseaseSignals]
  );

  const weatherForecast = useMemo(
    () =>
      Array.isArray(weather?.forecast)
        ? weather.forecast.map((day) => ({
            day: day.day,
            temp: day.temp,
          }))
        : [],
    [weather]
  );

  if (loading) {
    return (
      <div style={{ padding: '32px 24px', color: 'var(--gray-600)' }}>
        Loading analytics dashboard...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gray-800)', marginBottom: 8 }}>
            Analytics
          </h1>
          <p style={{ color: 'var(--gray-500)', margin: 0 }}>
            Live operations telemetry from mobile scans, user activity, and weather context.
          </p>
        </div>
        <div style={{ textAlign: 'right', minWidth: 170 }}>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Auto refresh every 5s</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)' }}>
            {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}
          </div>
          {refreshing ? (
            <div style={{ fontSize: 12, color: '#2563eb', marginTop: 4 }}>Refreshing...</div>
          ) : null}
        </div>
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 18,
            backgroundColor: '#fff7ed',
            border: '1px solid #fed7aa',
            color: '#9a3412',
            padding: '12px 14px',
            borderRadius: 10,
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 20 }}>
        {cards.map((card) => (
          <div
            key={card.label}
            style={{
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              padding: 16,
              boxShadow: '0 4px 14px rgba(15,23,42,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase', color: '#6b7280', fontWeight: 700 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 28, lineHeight: 1.1, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                {card.value}
              </div>
              {card.sub ? <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{card.sub}</div> : null}
            </div>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                display: 'grid',
                placeItems: 'center',
                background: card.color,
              }}
            >
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 18, marginBottom: 18 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 18, boxShadow: '0 4px 14px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, color: '#0f172a' }}>Scan Throughput (7 Days)</div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={analytics.scanTrend}>
                <defs>
                  <linearGradient id="totalScanFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="scans" stroke="#dc2626" fill="url(#totalScanFill)" name="Total Scans" />
                <Line type="monotone" dataKey="mobileScans" stroke="#be123c" strokeWidth={2} dot={false} name="Mobile" />
                <Line type="monotone" dataKey="webScans" stroke="#1d4ed8" strokeWidth={2} dot={false} name="Web" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 18, boxShadow: '0 4px 14px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, color: '#0f172a' }}>User Login Activity (7 Days)</div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={analytics.loginTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="logins" stroke="#7c3aed" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18, marginBottom: 18 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 18, boxShadow: '0 4px 14px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, color: '#0f172a' }}>Grade Distribution</div>
          <div style={{ width: '100%', height: 270 }}>
            <ResponsiveContainer>
              <BarChart data={gradeBars}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="grade" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {gradeBars.map((entry) => (
                    <Cell key={entry.grade} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 18, boxShadow: '0 4px 14px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, color: '#0f172a' }}>Scan Source Mix</div>
          <div style={{ width: '100%', height: 270 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={sourcePie} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3}>
                  {sourcePie.map((entry) => (
                    <Cell key={entry.name} fill={SOURCE_COLORS[entry.name] || SOURCE_COLORS.Other} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => numberFmt.format(v)} />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 18, boxShadow: '0 4px 14px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, color: '#0f172a' }}>Disease Signal Monitor</div>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={diseaseSignalBars}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#be123c" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 18, boxShadow: '0 4px 14px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CloudSun size={18} color="#0f766e" />
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Weather-Aware Monitoring</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 12 }}>
            <div style={{ padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Temperature</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{weather?.temperature ?? '--'}°C</div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Humidity</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{weather?.humidity ?? '--'}%</div>
            </div>
          </div>

          <div style={{ width: '100%', height: 150 }}>
            <ResponsiveContainer>
              <LineChart data={weatherForecast}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="temp" stroke="#0f766e" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ fontSize: 13, color: '#334155', marginTop: 10 }}>
            Condition: <strong>{weather?.condition || 'Unavailable'}</strong>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            {weather?.recommendation?.status
              ? `Growth status: ${weather.recommendation.status}`
              : 'Weather recommendation unavailable'}
          </div>
        </div>
      </div>

      {serviceHealth ? (
        <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: '#fff', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
            Service Health
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(serviceHealth).map(([service, status]) => {
              const online = String(status).toLowerCase().includes('connected');
              return (
                <div
                  key={service}
                  style={{
                    borderRadius: 999,
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    background: online ? '#dcfce7' : '#fee2e2',
                    color: online ? '#166534' : '#991b1b',
                  }}
                >
                  {service.replace(/_/g, ' ')}: {online ? 'Online' : 'Offline'}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Analytics;
