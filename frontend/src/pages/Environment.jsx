import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { CheckCircle2, CloudSun, Droplets, Leaf, MapPin, Thermometer, Wind } from 'lucide-react'
import UserHeader from '../components/user/UserHeader'
import { API_BASE_URL } from '../config/api'
import { BRAND_NAME } from '../config/brand'
import './Landing.css'

const DRAGONFRUIT_HUBS = [
  {
    id: 'davao-del-norte',
    province: 'Davao del Norte',
    region: 'Davao Region',
    cityFocus: 'Tagum and Sto. Tomas plantations',
    lat: 7.3153,
    lng: 125.684,
    zoom: 9,
    abundance: 'Very High',
    abundanceScore: 95,
    harvestWindow: 'May to October',
    plantationScale: 'Large commercial farms and contract growers',
    weatherProvince: 'Davao',
    notes: [
      'Strong year-round production with high volume of export-grade fruit.',
      'Large clusters of red-flesh dragonfruit plantations.',
      'Best suited for bulk harvesting and grading operations.',
    ],
  },
  {
    id: 'davao-de-oro',
    province: 'Davao de Oro',
    region: 'Davao Region',
    cityFocus: 'Compostela Valley growing belt',
    lat: 7.6079,
    lng: 125.9615,
    zoom: 9,
    abundance: 'High',
    abundanceScore: 89,
    harvestWindow: 'May to September',
    plantationScale: 'Mixed medium to large plantations',
    weatherProvince: 'Davao',
    notes: [
      'Rapidly expanding plantation footprint for fresh market supply.',
      'Good balance of quality and output for regional distribution.',
      'Supports both fresh fruit and processed product channels.',
    ],
  },
  {
    id: 'cebu',
    province: 'Cebu',
    region: 'Central Visayas',
    cityFocus: 'Northern Cebu farm clusters',
    lat: 10.3157,
    lng: 123.8854,
    zoom: 9,
    abundance: 'High',
    abundanceScore: 86,
    harvestWindow: 'June to November',
    plantationScale: 'Commercial farms and cooperative fields',
    weatherProvince: 'Cebu',
    notes: [
      'Strong island distribution and tourism-linked demand.',
      'Stable production from irrigated and upland areas.',
      'Ideal for supplying high-frequency local market deliveries.',
    ],
  },
  {
    id: 'bukidnon',
    province: 'Bukidnon',
    region: 'Northern Mindanao',
    cityFocus: 'Malaybalay and Valencia plantation corridors',
    lat: 8.1532,
    lng: 125.1278,
    zoom: 9,
    abundance: 'Medium',
    abundanceScore: 78,
    harvestWindow: 'June to October',
    plantationScale: 'Medium plantations with expansion capacity',
    weatherProvince: 'Davao',
    notes: [
      'Cooler upland microclimate can support fruit quality consistency.',
      'Growing production base with room for scaled planting.',
      'Suitable for planned expansion and future contract farming.',
    ],
  },
  {
    id: 'ilocos-norte',
    province: 'Ilocos Norte',
    region: 'Ilocos Region',
    cityFocus: 'Laoag and nearby coastal municipalities',
    lat: 18.1647,
    lng: 120.7116,
    zoom: 9,
    abundance: 'Medium',
    abundanceScore: 73,
    harvestWindow: 'June to October',
    plantationScale: 'Small to medium plantation blocks',
    weatherProvince: 'Baguio',
    notes: [
      'Dry-season management is important for stable fruit sizing.',
      'Strong potential for branded regional produce programs.',
      'Useful secondary source for Luzon supply balancing.',
    ],
  },
  {
    id: 'batangas',
    province: 'Batangas',
    region: 'CALABARZON',
    cityFocus: 'Lipa and neighboring agricultural zones',
    lat: 13.7565,
    lng: 121.0583,
    zoom: 9,
    abundance: 'Medium',
    abundanceScore: 70,
    harvestWindow: 'May to September',
    plantationScale: 'Smallholder and clustered plantations',
    weatherProvince: 'Metro Manila',
    notes: [
      'Strategic location for Metro Manila market access.',
      'Good area for pilot precision irrigation and fertigation plans.',
      'Supports high-turnover fresh fruit channels.',
    ],
  },
]

const abundanceTone = (value) => {
  if (value === 'Very High') return { bg: '#dcfce7', fg: '#166534', border: '#86efac' }
  if (value === 'High') return { bg: '#dbeafe', fg: '#1d4ed8', border: '#93c5fd' }
  return { bg: '#fff7ed', fg: '#9a3412', border: '#fdba74' }
}

const clamp = (n, min, max) => Math.max(min, Math.min(max, n))

const metricValue = (value, suffix = '') => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '--'
  return `${value}${suffix}`
}

function Environment() {
  const [selectedHubId, setSelectedHubId] = useState(DRAGONFRUIT_HUBS[0].id)
  const [mapProvider, setMapProvider] = useState('google')
  const [mapError, setMapError] = useState(false)
  const [weather, setWeather] = useState(null)
  const [loadingWeather, setLoadingWeather] = useState(true)

  const selectedHub = useMemo(
    () => DRAGONFRUIT_HUBS.find((hub) => hub.id === selectedHubId) || DRAGONFRUIT_HUBS[0],
    [selectedHubId]
  )

  useEffect(() => {
    let cancelled = false

    const loadWeather = async () => {
      setLoadingWeather(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/weather?province=${encodeURIComponent(selectedHub.weatherProvince)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.message || 'Failed to load weather')
        if (!cancelled) setWeather(data)
      } catch (error) {
        if (!cancelled) {
          setWeather(null)
          toast.error(error?.message || `Could not load weather for ${selectedHub.province}`)
        }
      } finally {
        if (!cancelled) setLoadingWeather(false)
      }
    }

    loadWeather()
    return () => {
      cancelled = true
    }
  }, [selectedHub.province, selectedHub.weatherProvince])

  const mapKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  const zoom = clamp(Number(selectedHub.zoom || 9), 4, 18)

  const googleEmbedSrc = useMemo(() => {
    if (mapKey) {
      const params = new URLSearchParams({
        key: mapKey,
        center: `${selectedHub.lat},${selectedHub.lng}`,
        zoom: String(zoom),
        maptype: 'roadmap',
      })
      return `https://www.google.com/maps/embed/v1/view?${params.toString()}`
    }
    return `https://www.google.com/maps?q=${encodeURIComponent(`${selectedHub.lat},${selectedHub.lng}`)}&z=${encodeURIComponent(String(zoom))}&output=embed`
  }, [mapKey, selectedHub.lat, selectedHub.lng, zoom])

  const osmEmbedSrc = useMemo(() => {
    const delta = clamp(1.7 / zoom, 0.06, 0.35)
    const left = selectedHub.lng - delta
    const bottom = selectedHub.lat - delta
    const right = selectedHub.lng + delta
    const top = selectedHub.lat + delta
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
      `${left},${bottom},${right},${top}`
    )}&layer=mapnik&marker=${encodeURIComponent(`${selectedHub.lat},${selectedHub.lng}`)}`
  }, [selectedHub.lat, selectedHub.lng, zoom])

  const googleOpenUrl = useMemo(() => {
    const query = `${selectedHub.lat},${selectedHub.lng} (${selectedHub.province})`
    return `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query }).toString()}`
  }, [selectedHub.lat, selectedHub.lng, selectedHub.province])

  const osmOpenUrl = useMemo(
    () =>
      `https://www.openstreetmap.org/?mlat=${encodeURIComponent(selectedHub.lat)}&mlon=${encodeURIComponent(
        selectedHub.lng
      )}#map=${encodeURIComponent(zoom)}/${encodeURIComponent(selectedHub.lat)}/${encodeURIComponent(selectedHub.lng)}`,
    [selectedHub.lat, selectedHub.lng, zoom]
  )

  const embedSrc = mapProvider === 'osm' ? osmEmbedSrc : googleEmbedSrc
  const abundanceBadge = abundanceTone(selectedHub.abundance)

  return (
    <div className="app-shell" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fff6fb 0%, #f6fbff 55%, #f3fff7 100%)' }}>
      <UserHeader />

      <main>
        <section className="lp-section" style={{ paddingTop: '24px' }}>
          <div className="container-pro" style={{ display: 'grid', gap: '18px' }}>
            <div
              style={{
                borderRadius: 18,
                border: '1px solid rgba(15, 23, 42, 0.08)',
                background: 'linear-gradient(120deg, rgba(236, 72, 153, 0.12), rgba(16, 185, 129, 0.1))',
                padding: '20px 22px',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#be185d' }}>
                Philippine Plantation Intelligence
              </div>
              <h1 style={{ margin: '8px 0 8px', fontSize: '2rem', color: '#0f172a', lineHeight: 1.15 }}>
                Dragonfruit Abundance and Plantation Locations
              </h1>
              <p style={{ margin: 0, color: '#475569', maxWidth: 920 }}>
                This workspace tracks major dragonfruit-growing areas in the Philippines so your {BRAND_NAME} team can plan sourcing, field checks, and harvest routing with location context.
              </p>
            </div>

            <div className="user-env-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '18px' }}>
              <aside
                style={{
                  borderRadius: 16,
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  background: '#ffffff',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: 16, borderBottom: '1px solid rgba(15, 23, 42, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(219, 39, 119, 0.1)' }}>
                      <MapPin size={17} color="#be185d" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, color: '#0f172a' }}>Plantation Hubs</div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{DRAGONFRUIT_HUBS.length} mapped locations</div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: 10, display: 'grid', gap: 8 }}>
                  {DRAGONFRUIT_HUBS.map((hub) => {
                    const isActive = hub.id === selectedHubId
                    const tone = abundanceTone(hub.abundance)
                    return (
                      <button
                        key={hub.id}
                        type="button"
                        onClick={() => setSelectedHubId(hub.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          borderRadius: 12,
                          border: isActive ? '1px solid rgba(190, 24, 93, 0.3)' : '1px solid rgba(15, 23, 42, 0.07)',
                          background: isActive ? 'rgba(253, 242, 248, 0.85)' : '#fff',
                          padding: '10px 11px',
                          display: 'grid',
                          gap: 6,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>{hub.province}</div>
                          <span
                            style={{
                              borderRadius: 999,
                              border: `1px solid ${tone.border}`,
                              background: tone.bg,
                              color: tone.fg,
                              fontSize: '0.7rem',
                              fontWeight: 900,
                              padding: '2px 8px',
                            }}
                          >
                            {hub.abundance}
                          </span>
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700 }}>{hub.region}</div>
                      </button>
                    )
                  })}
                </div>
              </aside>

              <div style={{ display: 'grid', gap: 16 }}>
                <div
                  style={{
                    borderRadius: 16,
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    background: '#ffffff',
                    boxShadow: 'var(--shadow-sm)',
                    padding: 18,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '1.45rem', color: '#0f172a', fontWeight: 900 }}>{selectedHub.province}</div>
                      <div style={{ marginTop: 4, color: '#64748b', fontWeight: 700 }}>{selectedHub.region} - {selectedHub.cityFocus}</div>
                    </div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        border: `1px solid ${abundanceBadge.border}`,
                        borderRadius: 999,
                        background: abundanceBadge.bg,
                        color: abundanceBadge.fg,
                        fontWeight: 900,
                        padding: '6px 12px',
                        fontSize: '0.82rem',
                      }}
                    >
                      <CheckCircle2 size={15} />
                      Abundance Score {selectedHub.abundanceScore}/100
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginTop: 14 }}>
                    <div style={{ borderRadius: 12, border: '1px solid rgba(15, 23, 42, 0.08)', padding: 12, background: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontWeight: 800 }}>
                        <Leaf size={16} />
                        Plantation Scale
                      </div>
                      <div style={{ marginTop: 7, color: '#0f172a', fontWeight: 700 }}>{selectedHub.plantationScale}</div>
                    </div>
                    <div style={{ borderRadius: 12, border: '1px solid rgba(15, 23, 42, 0.08)', padding: 12, background: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontWeight: 800 }}>
                        <CloudSun size={16} />
                        Peak Harvest Window
                      </div>
                      <div style={{ marginTop: 7, color: '#0f172a', fontWeight: 700 }}>{selectedHub.harvestWindow}</div>
                    </div>
                    <div style={{ borderRadius: 12, border: '1px solid rgba(15, 23, 42, 0.08)', padding: 12, background: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontWeight: 800 }}>
                        <MapPin size={16} />
                        Coordinates
                      </div>
                      <div style={{ marginTop: 7, color: '#0f172a', fontWeight: 700 }}>
                        {selectedHub.lat.toFixed(4)}, {selectedHub.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 12 }}>
                    <div style={{ borderRadius: 10, border: '1px solid rgba(15, 23, 42, 0.08)', padding: 10, background: '#ffffff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#64748b', fontSize: '0.8rem', fontWeight: 800 }}>
                        <Thermometer size={14} />
                        Temperature
                      </div>
                      <div style={{ marginTop: 6, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                        {loadingWeather ? '--' : metricValue(weather?.temperature, 'C')}
                      </div>
                    </div>
                    <div style={{ borderRadius: 10, border: '1px solid rgba(15, 23, 42, 0.08)', padding: 10, background: '#ffffff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#64748b', fontSize: '0.8rem', fontWeight: 800 }}>
                        <Droplets size={14} />
                        Humidity
                      </div>
                      <div style={{ marginTop: 6, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                        {loadingWeather ? '--' : metricValue(weather?.humidity, '%')}
                      </div>
                    </div>
                    <div style={{ borderRadius: 10, border: '1px solid rgba(15, 23, 42, 0.08)', padding: 10, background: '#ffffff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#64748b', fontSize: '0.8rem', fontWeight: 800 }}>
                        <Wind size={14} />
                        Wind Speed
                      </div>
                      <div style={{ marginTop: 6, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
                        {loadingWeather ? '--' : metricValue(weather?.windSpeed, ' km/h')}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 16,
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    background: '#ffffff',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: 14, borderBottom: '1px solid rgba(15, 23, 42, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ fontWeight: 900, color: '#0f172a' }}>Plantation Location Map</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setMapError(false)
                          setMapProvider('google')
                        }}
                        style={{
                          borderRadius: 9,
                          border: mapProvider === 'google' ? '1px solid rgba(190, 24, 93, 0.35)' : '1px solid rgba(15, 23, 42, 0.12)',
                          background: mapProvider === 'google' ? 'rgba(253, 242, 248, 0.8)' : '#ffffff',
                          color: '#0f172a',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          padding: '6px 10px',
                        }}
                      >
                        Google
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMapError(false)
                          setMapProvider('osm')
                        }}
                        style={{
                          borderRadius: 9,
                          border: mapProvider === 'osm' ? '1px solid rgba(190, 24, 93, 0.35)' : '1px solid rgba(15, 23, 42, 0.12)',
                          background: mapProvider === 'osm' ? 'rgba(253, 242, 248, 0.8)' : '#ffffff',
                          color: '#0f172a',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          padding: '6px 10px',
                        }}
                      >
                        OpenStreetMap
                      </button>
                      <a
                        href={mapProvider === 'osm' ? osmOpenUrl : googleOpenUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          borderRadius: 9,
                          border: '1px solid rgba(15, 23, 42, 0.12)',
                          background: '#ffffff',
                          color: '#0f172a',
                          textDecoration: 'none',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          padding: '6px 10px',
                        }}
                      >
                        Open full map
                      </a>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: 330, background: '#f8fafc' }}>
                    <iframe
                      title={`${selectedHub.province} dragonfruit plantation map`}
                      key={`${mapProvider}-${selectedHub.id}-${zoom}-${mapKey ? 'key' : 'nokey'}`}
                      src={embedSrc}
                      style={{ width: '100%', height: '100%', border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      onError={() => {
                        if (!mapError && mapProvider === 'google') {
                          setMapError(true)
                          setMapProvider('osm')
                          toast.error('Google map failed to load. Switched to OpenStreetMap.')
                        }
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 16,
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    background: '#ffffff',
                    boxShadow: 'var(--shadow-sm)',
                    padding: 16,
                  }}
                >
                  <div style={{ fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>
                    Field Notes for {selectedHub.province}
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {selectedHub.notes.map((note) => (
                      <div
                        key={note}
                        style={{
                          borderRadius: 10,
                          border: '1px solid rgba(15, 23, 42, 0.08)',
                          background: '#f8fafc',
                          padding: '9px 11px',
                          color: '#334155',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                        }}
                      >
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ background: 'linear-gradient(135deg, #D81B60, #B8105B)', padding: '28px 0' }}>
        <div className="container-pro" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.92)' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{BRAND_NAME}</div>
          <div style={{ fontSize: '0.9rem' }}>Philippine dragonfruit plantation and abundance monitoring</div>
        </div>
      </footer>

      <style>
        {`
          @media (max-width: 1060px) {
            .user-env-grid { grid-template-columns: 1fr !important; }
          }
        `}
      </style>
    </div>
  )
}

export default Environment
