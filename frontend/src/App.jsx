import { useEffect, useMemo, useState } from 'react'
import './App.css'

function App() {
  const [health, setHealth] = useState('checking...')
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [query, setQuery] = useState('')

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

  return (
    <div className="app-shell">
      <header>
        <div className="container-pro">
          <div className="logo-section">
            <span className="logo-icon">🐲</span>
            <span className="logo-text">
              Intelligent Dragon Fruit
            </span>
          </div>
          <nav>
            <a href="#overview" className="nav-link">Overview</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#analyze" className="nav-link">AI Analysis</a>
            <a href="#shop" className="nav-link">Marketplace</a>
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
                  Intelligent Dragon Fruit Ripeness &amp; Quality Detection System
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
                      <span className="product-price">${p.price}</span>
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
                      onSubmit={async (e) => {
                        e.preventDefault()
                        if (!file) return
                        
                        setUploading(true)
                        try {
                          const formData = new FormData()
                          formData.append('file', file)
                          
                          const res = await fetch('http://localhost:8000/detect', {
                            method: 'POST',
                            body: formData
                          })
                          
                          if (!res.ok) throw new Error('Analysis failed')
                          
                          const data = await res.json()
                          setAnalysisResult(data)
                        } catch (err) {
                          console.error(err)
                          alert('Analysis failed. Please try again.')
                        } finally {
                          setUploading(false)
                        }
                      }}
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
                        <div className="result-title">Sample Analysis</div>
                        <div className="result-id">ID: #8392-A</div>
                      </div>
                      <div className="result-badge">PASSED</div>
                    </div>

                    <div className="result-metrics">
                      <div className="metric">
                        <div className="metric-header">
                          <span className="metric-label">Ripeness score</span>
                          <span className="metric-value">94%</span>
                        </div>
                        <div className="metric-bar">
                          <div className="metric-fill" style={{ width: '94%' }} />
                        </div>
                      </div>
                      <div className="metric">
                        <div className="metric-header">
                          <span className="metric-label">Sweetness estimate</span>
                          <span className="metric-value">High</span>
                        </div>
                        <div className="metric-bar">
                          <div className="metric-fill secondary" style={{ width: '80%' }} />
                        </div>
                      </div>
                    </div>

                    <div className="result-footer">
                      <div className="result-stat">
                        <div className="result-stat-value">A+</div>
                        <div className="result-stat-label">Quality grade</div>
                      </div>
                      <div className="result-stat">
                        <div className="result-stat-value">2d</div>
                        <div className="result-stat-label">Estimated shelf life</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container-pro">
          <div className="footer-logo">🐲 Dragon Vision</div>
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
            © {new Date().getFullYear()} Dragon Vision. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
