import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import SystemStatus from '../components/SystemStatus'
import { BRAND_NAME } from '../config/brand'
import '../App.css'

function Home() {
  const navigate = useNavigate()
  
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      navigate('/login')
      return
    }
    
    try {
      const user = JSON.parse(userStr)
      if (user.role === 'admin') {
        navigate('/admin')
      }
    } catch {
      localStorage.removeItem('user')
      navigate('/login')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
    navigate('/')
  }
  const [health, setHealth] = useState('checking...')
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [file, setFile] = useState(null)
  const [query, setQuery] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [recentAnalyses, setRecentAnalyses] = useState([])
  const [historySummary, setHistorySummary] = useState({
    total: 0,
    average_quality: null,
    pass_rate: null,
    ripeness_distribution: { under: 0, ideal: 0, over: 0 },
    grade_distribution: { A: 0, B: 0, C: 0 },
    defect_level_distribution: { low: 0, medium: 0, high: 0 },
  })
  const [batchId, setBatchId] = useState('')
  const [batchSummary, setBatchSummary] = useState(null)
  const [geolocation, setGeolocation] = useState(null)
  const [offlineQueue, setOfflineQueue] = useState([])
  const [reportFrom, setReportFrom] = useState('')
  const [reportTo, setReportTo] = useState('')
  const [adminReport, setAdminReport] = useState(null)
  const [correctionGrade, setCorrectionGrade] = useState('')
  const pesoFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
      }),
    []
  )

  const PRODUCTS = useMemo(
    () => [
      { id: 1, name: 'Premium Dragon Fruit', grade: 'A', price: 3.99, image: '🐲', desc: 'Sweet and vibrant pink flesh' },
      { id: 2, name: 'Organic White Dragon', grade: 'A', price: 4.49, image: '🥚', desc: 'Classic white flesh with subtle sweetness' },
      { id: 3, name: 'Yellow Pitaya', grade: 'S', price: 6.99, image: '🌞', desc: 'The sweetest variety, golden skin' },
      { id: 4, name: 'Frozen Cubes', grade: 'A', price: 5.99, image: '🧊', desc: 'Perfect for smoothies and bowls' },
      { id: 5, name: 'Smoothie Pack', grade: 'A', price: 6.99, image: '🥤', desc: 'Ready-to-blend mix' },
      { id: 6, name: 'Dried Dragon Chips', grade: 'B', price: 7.99, image: '🥨', desc: 'Healthy crunchy snack' },
    ],
    []
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return PRODUCTS
    return PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || p.grade.toLowerCase().includes(q))
  }, [PRODUCTS, query])

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('http://localhost:8000/health')
        const data = await res.json()
        setHealth(data.status ?? 'unknown')
      } catch {
        setHealth('offline')
      }
    }
    checkHealth()
  }, [])

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        const res = await fetch('http://localhost:8000/history', { signal: controller.signal })
        clearTimeout(timeoutId)
        if (!res.ok) return
        const data = await res.json()
        setRecentAnalyses(data.items ?? [])
        setHistorySummary({
          total: data.total ?? 0,
          average_quality: data.average_quality ?? null,
          pass_rate: data.pass_rate ?? null,
          ripeness_distribution: data.ripeness_distribution ?? { under: 0, ideal: 0, over: 0 },
          grade_distribution: data.grade_distribution ?? { A: 0, B: 0, C: 0 },
          defect_level_distribution: data.defect_level_distribution ?? { low: 0, medium: 0, high: 0 },
        })
      } catch (err) {
        // AI service on port 8000 may not be running - this is OK during dev
        console.debug('AI history service unavailable (expected if main.py not running):', err.message)
      }
    }
    fetchHistory()
  }, [])

  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    try {
      let coords = geolocation
      if (navigator.geolocation && (!coords || coords.lat == null || coords.lon == null)) {
        try {
          coords = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
              () => resolve(null),
              { enableHighAccuracy: false, timeout: 5000 }
            )
          })
        } catch {
          coords = null
        }
      }

      if (coords) {
        setGeolocation(coords)
      }

      const formData = new FormData()
      formData.append('file', file)
      const trimmedBatchId = batchId.trim()
      if (trimmedBatchId) {
        formData.append('batch_id', trimmedBatchId)
      }
      if (coords && coords.lat != null && coords.lon != null) {
        formData.append('lat', String(coords.lat))
        formData.append('lon', String(coords.lon))
      }

      const res = await fetch('http://localhost:8000/detect', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Analysis failed')

      const data = await res.json()
      setAnalysisResult(data)
      setRecentAnalyses((prev) => {
        const next = [data, ...prev]
        return next.slice(0, 10)
      })

      if (trimmedBatchId) {
        try {
          const batchRes = await fetch(`http://localhost:8000/batches/${encodeURIComponent(trimmedBatchId)}`)
          if (batchRes.ok) {
            const batchData = await batchRes.json()
            setBatchSummary(batchData)
          }
        } catch (err) {
          console.error(err)
        }
      }
    } catch (err) {
      const message = err && typeof err === 'object' && 'message' in err ? err.message : ''
      if (typeof message === 'string' && message.includes('Failed to fetch')) {
        setOfflineQueue((prev) => [
          ...prev,
          {
            file,
            batchId: batchId.trim() || null,
            geolocation,
          },
        ])
      } else {
        console.error(err)
        alert('Analysis failed. Please try again.')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleRetryOffline = async () => {
    if (!offlineQueue.length) return
    const remaining = []
    for (const item of offlineQueue) {
      try {
        const formData = new FormData()
        formData.append('file', item.file)
        if (item.batchId) {
          formData.append('batch_id', item.batchId)
        }
        if (item.geolocation && item.geolocation.lat != null && item.geolocation.lon != null) {
          formData.append('lat', String(item.geolocation.lat))
          formData.append('lon', String(item.geolocation.lon))
        }
        const res = await fetch('http://localhost:8000/detect', {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) throw new Error('Analysis failed')
        const data = await res.json()
        setAnalysisResult(data)
        setRecentAnalyses((prev) => {
          const next = [data, ...prev]
          return next.slice(0, 10)
        })
      } catch {
        remaining.push(item)
      }
    }
    setOfflineQueue(remaining)
  }

  const handleSubmitCorrection = async () => {
    if (!analysisResult || !correctionGrade) return
    try {
      const res = await fetch('http://localhost:8000/admin/label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis_id: analysisResult.id,
          correct_grade: correctionGrade,
        }),
      })
      if (!res.ok) return

      const updated = { ...analysisResult, grade: correctionGrade, label_corrected: true }
      setAnalysisResult(updated)
      setRecentAnalyses((prev) =>
        prev.map((item) => (item.id === updated.id ? { ...item, grade: correctionGrade, label_corrected: true } : item))
      )

      const historyRes = await fetch('http://localhost:8000/history')
      if (historyRes.ok) {
        const data = await historyRes.json()
        setRecentAnalyses(data.items ?? [])
        setHistorySummary({
          total: data.total ?? 0,
          average_quality: data.average_quality ?? null,
          pass_rate: data.pass_rate ?? null,
          ripeness_distribution: data.ripeness_distribution ?? { under: 0, ideal: 0, over: 0 },
          grade_distribution: data.grade_distribution ?? { A: 0, B: 0, C: 0 },
          defect_level_distribution: data.defect_level_distribution ?? { low: 0, medium: 0, high: 0 },
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleGenerateReport = async () => {
    const params = new URLSearchParams()
    if (reportFrom) params.append('from_date', reportFrom)
    if (reportTo) params.append('to_date', reportTo)
    const queryString = params.toString()
    try {
      const res = await fetch(
        `http://localhost:8000/reports/summary${queryString ? `?${queryString}` : ''}`
      )
      if (!res.ok) return
      const data = await res.json()
      setAdminReport(data)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="app-shell">
      <header>
        <div className="container-pro">
          <div className="logo-section">
            <span className="logo-icon">🌴</span>
            <span className="logo-text">
              {BRAND_NAME}
            </span>
          </div>
          <nav>
            <a href="#overview" className="nav-link">Overview</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#analyze" className="nav-link">AI Analysis</a>
            <a href="#shop" className="nav-link">Marketplace</a>
            <a href="#admin" className="nav-link">Admin</a>
          </nav>
          <div className="header-right">
            <div className="status-info">
              <span className="status-label">System Status</span>
              <span className={`status-value ${health === 'healthy' ? '' : 'offline'}`}>
                {health === 'healthy' ? '● ONLINE' : '○ CONNECTING'}
              </span>
            </div>
            <button className="btn-primary">
              Open Console
            </button>

            <button 
              onClick={handleLogout}
              className="btn-outline"
              style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="overview">
          <div className="hero-bg-icons">
            <div className="hero-icon-top">🐲</div>
            <div className="hero-icon-bottom">🌵</div>
          </div>
          <div className="container-pro">
            <div className="hero-content">
              <div className="hero-left">
                <div className="hero-badge">
                  {BRAND_NAME} • Ripeness &amp; Quality Detection
                </div>
                <h1 className="hero-title">
                  AI-powered
                  <br />
                  <span className="hero-title-accent">Ripeness &amp; Quality</span> Analysis
                </h1>
                <p className="hero-desc">
                  A production-ready interface for monitoring, grading, and validating dragon fruit quality.
                  Upload single images or connect to live capture pipelines and keep every batch within
                  your target quality range.
                </p>
                <div className="hero-buttons">
                  <a href="#analyze" className="btn-primary">
                    Analyze Image
                  </a>
                  <a href="#shop" className="hero-button-secondary">
                    Browse Sample Batches
                  </a>
                </div>
              </div>
              <div className="hero-right">
                <div style={{ marginBottom: '24px' }}>
                  <SystemStatus />
                </div>
                <div className="hero-image-card">
                  <div className="hero-fruit-display">🐲</div>
                  <div className="hero-price-badge">
                    <div className="hero-price-label">Model Accuracy</div>
                    <div className="hero-price-value">98.3%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="features">
          <div className="container-pro">
            <h2 className="section-title">System Capabilities</h2>
            <div className="features-grid">
              <div className="feature-item pink">
                <div className="feature-icon">🤖</div>
                <h3>Computer Vision Engine</h3>
                <p>
                  Detects ripeness from color, texture, and surface patterns using trained models.
                </p>
              </div>
              <div className="feature-item green">
                <div className="feature-icon">📊</div>
                <h3>Quality Scoring</h3>
                <p>
                  Produces consistent grading scores to support packing, pricing, and export decisions.
                </p>
              </div>
              <div className="feature-item yellow">
                <div className="feature-icon">📡</div>
                <h3>Operations Dashboard</h3>
                <p>
                  Monitor system health, recent analyses, and performance metrics in real time.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="shop" className="shop">
          <div className="container-pro">
            <div className="shop-header">
              <div className="shop-title">
                <h2 className="section-title">Sample Batches</h2>
                <p>
                  Explore representative lots used to calibrate and validate the detection system.
                </p>
              </div>
              <div className="search-box">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by batch name or grade..."
                />
                <span className="search-icon">🔍</span>
              </div>
            </div>

            <div className="products-grid">
              {filtered.map(p => (
                <article key={p.id} className="product-card">
                  <div className="product-image">
                    {p.image}
                  </div>
                  <div className="product-info">
                    <div className="product-header">
                      <div>
                        <h3 className="product-title">{p.name}</h3>
                        <span className="product-grade">
                          Grade {p.grade}
                        </span>
                      </div>
                      <span className="product-price">{pesoFormatter.format(p.price)}</span>
                    </div>
                    <p className="product-desc">{p.desc}</p>
                    <button className="btn-outline product-button">
                      View batch details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="analyze" className="analyze">
          <div className="container-pro">
            <div className="analyze-card">
              <div className="analyze-bg-blur" />
              <div className="analyze-content">
                <div className="analyze-left">
                  <h2>Upload a fruit image for analysis 🧪</h2>
                  <p>
                    Use a single high-quality image of your dragon fruit and let the
                    system estimate ripeness, sweetness, and overall grade within seconds.
                  </p>
                  <div className="upload-form">
                    <form
                      onSubmit={handleAnalyze}
                    >
                      <label className="upload-zone">
                        <div className="upload-icon">📸</div>
                        <span className="upload-text">Click to upload image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            setFileName(f?.name ?? '')
                            setFile(f)
                          }}
                        />
                      </label>

                      {fileName && (
                        <div className="upload-filename">
                          <span>{fileName}</span>
                          <button
                            type="button"
                            onClick={() => setFileName('')}
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      <input
                        type="text"
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        placeholder="Batch ID (optional)"
                        className="batch-input"
                      />

                      <button
                        type="submit"
                        disabled={!fileName || uploading}
                        className="btn-primary analyze-button"
                      >
                        {uploading ? 'Analyzing...' : 'Analyze Now'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="analyze-right">
                  <div className="result-card">
                    <div className="result-header">
                      <div className="result-avatar">🐲</div>
                      <div className="result-info">
                        <div className="result-title">{analysisResult ? 'Latest Analysis' : 'Sample Analysis'}</div>
                        <div className="result-id">
                          ID: {analysisResult?.id ? analysisResult.id.slice(0, 8) : '#8392-A'}
                        </div>
                      </div>
                      <div className="result-badge">
                        {analysisResult ? (analysisResult.grade === 'C' ? 'REVIEW' : 'PASSED') : 'PASSED'}
                      </div>
                    </div>

                    <div className="result-metrics">
                      <div className="metric">
                        <div className="metric-header">
                          <span className="metric-label">Ripeness score</span>
                          <span className="metric-value">
                            {analysisResult ? `${Math.round(analysisResult.ripeness_score)}%` : '94%'}
                          </span>
                        </div>
                        <div className="metric-bar">
                          <div
                            className="metric-fill"
                            style={{ width: analysisResult ? `${analysisResult.ripeness_score}%` : '94%' }}
                          />
                        </div>
                      </div>
                      <div className="metric">
                        <div className="metric-header">
                          <span className="metric-label">Quality score</span>
                          <span className="metric-value">
                            {analysisResult ? `${Math.round(analysisResult.quality_score)}%` : '98%'}
                          </span>
                        </div>
                        <div className="metric-bar">
                          <div
                            className="metric-fill secondary"
                            style={{ width: analysisResult ? `${analysisResult.quality_score}%` : '80%' }}
                          />
                        </div>
                      </div>
                      {analysisResult && (
                        <div className="metric">
                          <div className="metric-header">
                            <span className="metric-label">Estimated shelf life</span>
                            <span className="metric-value">
                              {analysisResult.shelf_life_label ||
                                (analysisResult.shelf_life_days != null
                                  ? `${analysisResult.shelf_life_days} days`
                                  : '—')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="result-footer">
                      <div className="result-stat">
                        <div className="result-stat-value">
                          {analysisResult ? analysisResult.grade : 'A+'}
                        </div>
                        <div className="result-stat-label">Quality grade</div>
                      </div>
                      <div className="result-stat">
                        <div className="result-stat-value">
                          {analysisResult
                            ? analysisResult.size_category || analysisResult.size_classification || '—'
                            : 'Medium'}
                        </div>
                        <div className="result-stat-label">
                          Size category
                        </div>
                      </div>
                    </div>
                    {analysisResult && Array.isArray(analysisResult.defect_regions) && (
                      <div className="defect-hotspots">
                        <div className="defect-hotspots-title">Defect hotspots</div>
                        <ul className="defect-hotspots-list">
                          {analysisResult.defect_regions.map((region, index) => (
                            <li key={`${region.area}-${index}`} className="defect-hotspots-row">
                              <span className="defect-area">{region.area}</span>
                              <span className="defect-severity">
                                {region.severity != null
                                  ? `${Math.round(region.severity * 100)}% severity`
                                  : 'N/A'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="recent-analyses">
                    <h3>Recent analyses</h3>
                    <div className="recent-summary">
                      <div>
                        <div className="recent-label">Total analyzed</div>
                        <div className="recent-value">{historySummary.total}</div>
                      </div>
                      <div>
                        <div className="recent-label">Average quality</div>
                        <div className="recent-value">
                          {historySummary.average_quality != null
                            ? `${historySummary.average_quality.toFixed(1)}%`
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="recent-label">Pass rate</div>
                        <div className="recent-value">
                          {historySummary.pass_rate != null
                            ? `${historySummary.pass_rate.toFixed(1)}%`
                            : '—'}
                        </div>
                      </div>
                    </div>
                    <ul className="recent-list">
                      {recentAnalyses.map(item => (
                        <li key={item.id} className="recent-row">
                          <div className="recent-main">
                            <span className="recent-grade">{item.grade}</span>
                            <span className="recent-meta">
                              {item.ripeness_level}
                            </span>
                          </div>
                          <div className="recent-metrics">
                            <span>R {Math.round(item.ripeness_score)}%</span>
                            <span>Q {Math.round(item.quality_score)}%</span>
                          </div>
                        </li>
                      ))}
                      {recentAnalyses.length === 0 && (
                        <li className="recent-empty">
                          Run an analysis to see history here.
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className="quality-map">
                    <h3>Quality map (recent)</h3>
                    <ul className="quality-map-list">
                      {recentAnalyses.filter((item) => item.lat != null && item.lon != null).length === 0 && (
                        <li className="quality-map-empty">No geotagged scans yet.</li>
                      )}
                      {recentAnalyses
                        .filter((item) => item.lat != null && item.lon != null)
                        .map((item) => (
                          <li key={item.id} className="quality-map-row">
                            <span className="quality-map-grade">{item.grade}</span>
                            <span className="quality-map-coords">
                              {item.lat.toFixed(4)}, {item.lon.toFixed(4)}
                            </span>
                            <span className="quality-map-score">
                              {Math.round(item.quality_score)}%
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                  {offlineQueue.length > 0 && (
                    <div className="offline-queue">
                      <div className="offline-header">
                        <h3>Pending uploads (offline)</h3>
                        <button
                          type="button"
                          className="btn-secondary offline-retry"
                          onClick={handleRetryOffline}
                        >
                          Retry all
                        </button>
                      </div>
                      <ul className="offline-list">
                        {offlineQueue.map((item, index) => (
                          <li key={index} className="offline-row">
                            <span className="offline-name">{item.file?.name ?? 'Image'}</span>
                            <span className="offline-batch">
                              {item.batchId ? `Batch: ${item.batchId}` : 'No batch'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {batchSummary && (
                    <div className="batch-summary">
                      <h3>Batch summary</h3>
                      <div className="batch-summary-grid">
                        <div>
                          <div className="batch-label">Batch ID</div>
                          <div className="batch-value">{batchSummary.batch_id ?? batchId}</div>
                        </div>
                        <div>
                          <div className="batch-label">Total scanned</div>
                          <div className="batch-value">{batchSummary.total}</div>
                        </div>
                        <div>
                          <div className="batch-label">Average quality</div>
                          <div className="batch-value">
                            {batchSummary.average_quality != null
                              ? `${batchSummary.average_quality.toFixed(1)}%`
                              : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="batch-label">Pass rate</div>
                          <div className="batch-value">
                            {batchSummary.pass_rate != null
                              ? `${batchSummary.pass_rate.toFixed(1)}%`
                              : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="admin" className="admin">
          <div className="container-pro">
            <h2 className="section-title">Admin &amp; Analytics</h2>
            <div className="admin-grid">
              <div className="admin-card">
                <h3>Distributions</h3>
                <div className="admin-distributions">
                  <div className="admin-distribution">
                    <div className="admin-distribution-title">Grades</div>
                    <div className="admin-distribution-row">
                      <span>A</span>
                      <span>{historySummary.grade_distribution.A}</span>
                    </div>
                    <div className="admin-distribution-row">
                      <span>B</span>
                      <span>{historySummary.grade_distribution.B}</span>
                    </div>
                    <div className="admin-distribution-row">
                      <span>C</span>
                      <span>{historySummary.grade_distribution.C}</span>
                    </div>
                  </div>
                  <div className="admin-distribution">
                    <div className="admin-distribution-title">Ripeness</div>
                    <div className="admin-distribution-row">
                      <span>Under-ripe</span>
                      <span>{historySummary.ripeness_distribution.under}</span>
                    </div>
                    <div className="admin-distribution-row">
                      <span>Ideal</span>
                      <span>{historySummary.ripeness_distribution.ideal}</span>
                    </div>
                    <div className="admin-distribution-row">
                      <span>Over-ripe</span>
                      <span>{historySummary.ripeness_distribution.over}</span>
                    </div>
                  </div>
                  <div className="admin-distribution">
                    <div className="admin-distribution-title">Defect level</div>
                    <div className="admin-distribution-row">
                      <span>Low</span>
                      <span>{historySummary.defect_level_distribution.low}</span>
                    </div>
                    <div className="admin-distribution-row">
                      <span>Medium</span>
                      <span>{historySummary.defect_level_distribution.medium}</span>
                    </div>
                    <div className="admin-distribution-row">
                      <span>High</span>
                      <span>{historySummary.defect_level_distribution.high}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="admin-card">
                <h3>Label corrections</h3>
                <p className="admin-text">
                  Bind feedback to the latest scan and store it for retraining.
                </p>
                <div className="admin-field-group">
                  <label className="admin-label">Correct grade for latest scan</label>
                  <select
                    value={correctionGrade}
                    onChange={(e) => setCorrectionGrade(e.target.value)}
                    className="admin-select"
                  >
                    <option value="">Select grade</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
                <button
                  type="button"
                  className="btn-primary admin-button"
                  onClick={handleSubmitCorrection}
                  disabled={!analysisResult || !correctionGrade}
                >
                  Mark grade as incorrect
                </button>
              </div>
              <div className="admin-card">
                <h3>Generate report</h3>
                <p className="admin-text">
                  Request a summary report for a specific date window.
                </p>
                <div className="admin-field-group">
                  <label className="admin-label">From</label>
                  <input
                    type="date"
                    value={reportFrom}
                    onChange={(e) => setReportFrom(e.target.value)}
                    className="admin-input"
                  />
                </div>
                <div className="admin-field-group">
                  <label className="admin-label">To</label>
                  <input
                    type="date"
                    value={reportTo}
                    onChange={(e) => setReportTo(e.target.value)}
                    className="admin-input"
                  />
                </div>
                <button
                  type="button"
                  className="btn-secondary admin-button"
                  onClick={handleGenerateReport}
                >
                  Generate report
                </button>
                {adminReport && (
                  <div className="admin-report">
                    <div className="admin-report-row">
                      <span>Total scans</span>
                      <span>{adminReport.total}</span>
                    </div>
                    <div className="admin-report-row">
                      <span>Average quality</span>
                      <span>
                        {adminReport.average_quality != null
                          ? `${adminReport.average_quality.toFixed(1)}%`
                          : '—'}
                      </span>
                    </div>
                    <div className="admin-report-row">
                      <span>Pass rate</span>
                      <span>
                        {adminReport.pass_rate != null
                          ? `${adminReport.pass_rate.toFixed(1)}%`
                          : '—'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container-pro">
          <div className="footer-logo">🌴 {BRAND_NAME}</div>
          <p>
            Intelligent Dragon Fruit Ripeness &amp; Quality Detection System.
            Built for packing houses, exporters, and precision agriculture teams.
          </p>
          <div className="footer-links">
            <a href="#overview">Overview</a>
            <a href="#analyze">AI Analysis</a>
            <a href="#shop">Batches</a>
          </div>
          <div className="footer-copyright">
            © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
