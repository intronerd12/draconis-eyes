import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Cloud, Droplets, MapPin, Thermometer, Wind, AlertTriangle, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const normalizeKey = (s) => (s || '').toString().trim().toLowerCase();

const provinceCenters = {
  'metro manila': { lat: 14.5995, lng: 120.9842, zoom: 10 },
  manila: { lat: 14.5995, lng: 120.9842, zoom: 10 },
  cebu: { lat: 10.3157, lng: 123.8854, zoom: 10 },
  davao: { lat: 7.1907, lng: 125.4553, zoom: 10 },
  baguio: { lat: 16.4023, lng: 120.596, zoom: 11 },
};

const getMapCenter = (provinceName) => {
  const key = normalizeKey(provinceName);
  if (provinceCenters[key]) return { ...provinceCenters[key], label: provinceName };
  const fallback = { lat: 12.8797, lng: 121.774, zoom: 6 };
  return { ...fallback, label: provinceName || 'Philippines' };
};

const badgeFor = (color) => {
  if (color === 'green') return { bg: '#dcfce7', fg: '#166534', border: '#bbf7d0' };
  if (color === 'orange') return { bg: '#fef9c3', fg: '#92400e', border: '#fde68a' };
  return { bg: '#fee2e2', fg: '#991b1b', border: '#fecaca' };
};

const EnvironmentalData = () => {
  const [provinces, setProvinces] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('Metro Manila');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [mapProvider, setMapProvider] = useState('google');
  const [mapError, setMapError] = useState(false);

  const feelsLike = useMemo(() => {
    if (!weather?.temperature) return null;
    const base = Number(weather.temperature);
    const humidity = Number(weather.humidity ?? 50);
    return Math.round(base + clamp((humidity - 50) / 25, 0, 2));
  }, [weather]);

  useEffect(() => {
    let cancelled = false;

    const loadProvinces = async () => {
      setLoadingList(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/weather/provinces`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to fetch provinces');
        if (!cancelled) setProvinces(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          setProvinces(['Metro Manila', 'Cebu', 'Davao']);
          toast.error(e?.message || 'Failed to load provinces');
        }
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    };

    loadProvinces();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadWeather = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/weather?province=${encodeURIComponent(selectedProvince)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Failed to fetch weather');
        if (!cancelled) setWeather(data);
      } catch (e) {
        if (!cancelled) {
          setWeather(null);
          toast.error(e?.message || `Could not load data for ${selectedProvince}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (selectedProvince) loadWeather();
    return () => {
      cancelled = true;
    };
  }, [selectedProvince]);

  const status = weather?.recommendation?.status || '—';
  const recColor = weather?.recommendation?.color || 'orange';
  const badge = badgeFor(recColor);
  const mapKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const mapCenter = useMemo(() => getMapCenter(selectedProvince), [selectedProvince]);
  const googleEmbedSrc = useMemo(() => {
    const { lat, lng, zoom } = mapCenter;
    if (mapKey) {
      const params = new URLSearchParams({
        key: mapKey,
        center: `${lat},${lng}`,
        zoom: String(zoom || 10),
        maptype: 'roadmap',
      });
      return `https://www.google.com/maps/embed/v1/view?${params.toString()}`;
    }
    return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&z=${encodeURIComponent(String(zoom || 10))}&output=embed`;
  }, [mapCenter, mapKey]);

  const osmEmbedSrc = useMemo(() => {
    const { lat, lng } = mapCenter;
    const d = 0.35;
    const left = lng - d;
    const bottom = lat - d;
    const right = lng + d;
    const top = lat + d;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
      `${left},${bottom},${right},${top}`
    )}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
  }, [mapCenter]);

  const embedSrc = mapProvider === 'osm' ? osmEmbedSrc : googleEmbedSrc;
  const googleOpenUrl = useMemo(() => {
    const { lat, lng, label } = mapCenter;
    const params = new URLSearchParams({ api: '1', query: `${lat},${lng}(${label})` });
    return `https://www.google.com/maps/search/?${params.toString()}`;
  }, [mapCenter]);
  const osmOpenUrl = useMemo(() => {
    const { lat, lng, zoom } = mapCenter;
    return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lng)}#map=${encodeURIComponent(
      zoom || 10
    )}/${encodeURIComponent(lat)}/${encodeURIComponent(lng)}`;
  }, [mapCenter]);

  return (
    <div>
      <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--gray-800)', marginBottom: 6 }}>Environmental Monitoring</div>
      <div style={{ color: 'var(--gray-500)', marginBottom: 18 }}>Weather and growth suitability across regions.</div>

      <div className="env-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18 }}>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: 14,
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--gray-200)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: 16, borderBottom: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'var(--dragon-flesh)', display: 'grid', placeItems: 'center' }}>
              <MapPin size={18} color="var(--dragon-primary)" />
            </div>
            <div>
              <div style={{ fontWeight: 900, color: 'var(--gray-900)' }}>Regions</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{loadingList ? 'Loading…' : `${provinces.length} available`}</div>
            </div>
          </div>

          <div style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto', padding: 10 }}>
            {(provinces.length ? provinces : ['Metro Manila']).map((prov) => {
              const active = selectedProvince === prov;
              return (
                <button
                  key={prov}
                  type="button"
                  onClick={() => setSelectedProvince(prov)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 12px',
                    borderRadius: 12,
                    border: active ? '1px solid rgba(230,0,92,0.22)' : '1px solid transparent',
                    backgroundColor: active ? 'rgba(230,0,92,0.08)' : 'transparent',
                    color: active ? 'var(--gray-900)' : 'var(--gray-700)',
                    fontWeight: active ? 900 : 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <span>{prov}</span>
                  {active ? (
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--dragon-primary)' }}>Selected</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 14,
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--gray-200)',
              padding: 18,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--gray-900)' }}>{selectedProvince}</div>
                <div style={{ color: 'var(--gray-500)', marginTop: 6 }}>
                  {loading ? 'Loading…' : `${weather?.condition || '—'} • ${new Date().toLocaleDateString()}`}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2.6rem', fontWeight: 900, color: 'var(--gray-900)' }}>
                  {loading ? '—' : `${weather?.temperature ?? '—'}°C`}
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 8,
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: `1px solid ${badge.border}`,
                    backgroundColor: badge.bg,
                    color: badge.fg,
                    fontWeight: 900,
                    fontSize: '0.85rem',
                  }}
                >
                  {recColor === 'green' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                  {status}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 18 }}>
              <div style={{ border: '1px solid var(--gray-200)', borderRadius: 14, padding: 14, backgroundColor: 'var(--gray-50)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--gray-700)', fontWeight: 900 }}>
                  <Droplets size={16} />
                  Humidity
                </div>
                <div style={{ marginTop: 8, fontSize: '1.6rem', fontWeight: 900, color: 'var(--gray-900)' }}>
                  {loading ? '—' : `${weather?.humidity ?? '—'}%`}
                </div>
              </div>

              <div style={{ border: '1px solid var(--gray-200)', borderRadius: 14, padding: 14, backgroundColor: 'var(--gray-50)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--gray-700)', fontWeight: 900 }}>
                  <Wind size={16} />
                  Wind
                </div>
                <div style={{ marginTop: 8, fontSize: '1.6rem', fontWeight: 900, color: 'var(--gray-900)' }}>
                  {loading ? '—' : `${weather?.windSpeed ?? '—'} km/h`}
                </div>
              </div>

              <div style={{ border: '1px solid var(--gray-200)', borderRadius: 14, padding: 14, backgroundColor: 'var(--gray-50)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--gray-700)', fontWeight: 900 }}>
                  <Thermometer size={16} />
                  Feels Like
                </div>
                <div style={{ marginTop: 8, fontSize: '1.6rem', fontWeight: 900, color: 'var(--gray-900)' }}>
                  {loading ? '—' : `${feelsLike ?? '—'}°C`}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 14,
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--gray-200)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: 16, borderBottom: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--gray-900)' }}>Map</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 800 }}>
                  {mapCenter.label}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMapError(false);
                    setMapProvider('google');
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: mapProvider === 'google' ? '1px solid rgba(230,0,92,0.35)' : '1px solid var(--gray-200)',
                    backgroundColor: mapProvider === 'google' ? 'rgba(230,0,92,0.08)' : 'white',
                    color: 'var(--gray-800)',
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMapError(false);
                    setMapProvider('osm');
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: mapProvider === 'osm' ? '1px solid rgba(230,0,92,0.35)' : '1px solid var(--gray-200)',
                    backgroundColor: mapProvider === 'osm' ? 'rgba(230,0,92,0.08)' : 'white',
                    color: 'var(--gray-800)',
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  OpenStreetMap
                </button>
                <a
                  href={mapProvider === 'osm' ? osmOpenUrl : googleOpenUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid var(--gray-200)',
                    backgroundColor: 'white',
                    color: 'var(--gray-800)',
                    fontWeight: 900,
                    textDecoration: 'none',
                  }}
                >
                  Open
                </a>
              </div>
            </div>
            <div style={{ position: 'relative', width: '100%', height: 340, backgroundColor: 'var(--gray-50)' }}>
              <iframe
                title="Region map"
                key={`${mapProvider}-${mapCenter.lat}-${mapCenter.lng}-${mapKey ? 'k' : 'nok'}`}
                src={embedSrc}
                style={{ border: 0, width: '100%', height: '100%' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onError={() => {
                  if (!mapError && mapProvider === 'google') {
                    setMapError(true);
                    setMapProvider('osm');
                    toast.error('Google Maps failed to load. Switched to OpenStreetMap.');
                  }
                }}
              />
            </div>
            <div style={{ padding: 12, borderTop: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ color: 'var(--gray-500)', fontWeight: 800, fontSize: '0.85rem' }}>
                {mapKey ? 'Google Maps Embed API' : 'Google Maps (no key) / OpenStreetMap fallback'}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a href={googleOpenUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--dragon-primary)', fontWeight: 900, textDecoration: 'none' }}>
                  Google link
                </a>
                <a href={osmOpenUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--dragon-primary)', fontWeight: 900, textDecoration: 'none' }}>
                  OSM link
                </a>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 14,
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--gray-200)',
              padding: 18,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--gray-900)' }}>Growth Recommendation</div>
              <div style={{ color: 'var(--gray-500)', fontWeight: 800, fontSize: '0.9rem' }}>{loading ? 'Updating…' : 'Live analysis'}</div>
            </div>

            <div style={{ marginTop: 12, color: 'var(--gray-700)', fontWeight: 700 }}>
              {loading ? 'Loading recommendation…' : weather?.recommendation?.message || '—'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, marginTop: 14 }}>
              {(weather?.recommendation?.details || []).map((detail, idx) => (
                <div
                  key={`${detail}-${idx}`}
                  style={{
                    borderRadius: 14,
                    border: '1px solid var(--gray-200)',
                    padding: 12,
                    backgroundColor: 'var(--gray-50)',
                    color: 'var(--gray-700)',
                    fontWeight: 700,
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: badge.fg, marginTop: 5, opacity: 0.8 }} />
                  <div style={{ flex: 1 }}>{detail}</div>
                </div>
              ))}
              {!loading && (!weather?.recommendation?.details || weather.recommendation.details.length === 0) ? (
                <div style={{ color: 'var(--gray-500)' }}>No recommendation details.</div>
              ) : null}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 14,
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--gray-200)',
              padding: 18,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--gray-900)' }}>3-Day Forecast</div>
              <div style={{ color: 'var(--gray-500)', fontWeight: 800, fontSize: '0.9rem' }}>{selectedProvince}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 14 }}>
              {(weather?.forecast || []).map((day) => (
                <div
                  key={`${day.day}-${day.temp}-${day.condition}`}
                  style={{
                    border: '1px solid var(--gray-200)',
                    borderRadius: 14,
                    padding: 14,
                    backgroundColor: 'var(--gray-50)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                    <div style={{ fontWeight: 900, color: 'var(--gray-900)' }}>{day.day}</div>
                    <div style={{ fontWeight: 900, color: 'var(--gray-900)' }}>{day.temp}°C</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray-700)', fontWeight: 700 }}>
                    <Cloud size={16} />
                    {day.condition}
                  </div>
                </div>
              ))}
              {!loading && (!weather?.forecast || weather.forecast.length === 0) ? (
                <div style={{ color: 'var(--gray-500)' }}>No forecast available.</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, color: 'var(--gray-400)', fontSize: '0.8rem', fontWeight: 700 }}>
        Data source: Open-Meteo (via backend proxy)
      </div>

      <style>
        {`
          @media (max-width: 980px) {
            .env-grid { grid-template-columns: 1fr !important; }
          }
        `}
      </style>
    </div>
  );
};

export default EnvironmentalData;
