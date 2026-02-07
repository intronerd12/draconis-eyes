import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import { BRAND_NAME, BRAND_TAGLINE } from '../config/brand'
import '../App.css'

function Landing() {
  const slides = useMemo(
    () => [
      { src: '/landing/slider/slide-01.jpg', alt: 'Dragon fruit harvest and market display' },
      { src: '/landing/slider/slide-02.jpg', alt: 'Dragon fruit close-up quality sample' },
      { src: '/landing/slider/slide-03.jpg', alt: 'Red dragon fruit product sample' },
      { src: '/landing/slider/slide-04.jpg', alt: 'Dragon fruit farm and cultivation sample' },
      { src: '/landing/slider/slide-05.jpg', alt: 'White dragon fruit product sample' },
      { src: '/landing/slider/slide-06.jpg', alt: 'Fresh dragon fruit white variety sample' },
    ],
    []
  )

  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => window.clearInterval(id)
  }, [slides.length])

  const goTo = (index) => {
    const safe = Math.max(0, Math.min(index, slides.length - 1))
    setActiveIndex(safe)
  }

  const goPrev = () => setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)
  const goNext = () => setActiveIndex((prev) => (prev + 1) % slides.length)

  return (
    <div className="landing-shell">
      <header>
        <div className="container-pro">
          <a href="/" className="logo-section" aria-label={`${BRAND_NAME} home`}>
            <BrandMark size={36} />
            <span className="logo-text">{BRAND_NAME}</span>
          </a>

          <nav className="landing-nav" aria-label="Primary">
            <a href="#home" className="nav-link">Home</a>
            <a href="#about" className="nav-link">About Us</a>
            <a href="#modules" className="nav-link">Modules</a>
            <a href="#resources" className="nav-link">Resources</a>
            <a href="#contact" className="nav-link">Contact</a>
          </nav>

          <div className="header-right">
            <Link to="/login" className="btn-primary landing-login">
              Login
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section id="home" className="landing-slider" aria-label="Dragon fruit image slider">
          <div className="landing-slider-viewport">
            <div className="landing-slider-track">
              {slides.map((s, idx) => (
                <div
                  key={s.src}
                  className={`landing-slide${idx === activeIndex ? ' active' : ''}`}
                  aria-hidden={idx === activeIndex ? 'false' : 'true'}
                >
                  <img src={s.src} alt={s.alt} />
                </div>
              ))}
            </div>

            <div className="landing-slider-controls">
              <button type="button" className="landing-slider-arrow" onClick={goPrev} aria-label="Previous image">
                ‹
              </button>
              <button type="button" className="landing-slider-arrow" onClick={goNext} aria-label="Next image">
                ›
              </button>
            </div>

            <div className="landing-slider-dots" role="tablist" aria-label="Choose slide">
              {slides.map((s, idx) => (
                <button
                  key={s.src}
                  type="button"
                  className={`landing-slider-dot${idx === activeIndex ? ' active' : ''}`}
                  onClick={() => goTo(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  aria-pressed={idx === activeIndex ? 'true' : 'false'}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="overview" className="landing-hero">
          <div className="landing-hero-bg" />
          <div className="container-pro">
            <div className="landing-hero-grid">
              <div className="landing-hero-left">
                <div className="landing-pill">
                  Dragon Fruit Sorting &amp; Grading • {BRAND_TAGLINE}
                </div>
                <h1 className="landing-title">
                  Professional quality control for
                  <br />
                  <span className="landing-title-accent">Dragon Fruit</span>
                </h1>
                <p className="landing-subtitle">
                  A modern system for segmentation, size categorization, color-based quality scoring,
                  approximate weight estimation, market value assessment, and price prediction.
                </p>
                <div className="landing-cta">
                  <Link to="/login" className="btn-primary">
                    Sign in
                  </Link>
                  <a href="#about" className="hero-button-secondary">
                    Learn more
                  </a>
                </div>
                <div className="landing-stats">
                  <div className="landing-stat">
                    <div className="landing-stat-value">Segmentation</div>
                    <div className="landing-stat-label">Fruit &amp; defect regions</div>
                  </div>
                  <div className="landing-stat">
                    <div className="landing-stat-value">S/M/L</div>
                    <div className="landing-stat-label">Size categories</div>
                  </div>
                  <div className="landing-stat">
                    <div className="landing-stat-value">Pricing</div>
                    <div className="landing-stat-label">Linear price prediction</div>
                  </div>
                </div>
              </div>

              <div className="landing-hero-right">
                <div className="landing-panel">
                  <div className="landing-panel-top">
                    <div className="landing-panel-badge">Quality Snapshot</div>
                    <div className="landing-panel-title">Market-ready grading</div>
                    <div className="landing-panel-desc">
                      Consistent grades and transparent scoring help teams align on sorting decisions.
                    </div>
                  </div>
                  <div className="landing-panel-grid">
                    <div className="landing-metric">
                      <div className="landing-metric-label">Grade</div>
                      <div className="landing-metric-value">A</div>
                      <div className="landing-metric-foot">Premium export</div>
                    </div>
                    <div className="landing-metric">
                      <div className="landing-metric-label">Size</div>
                      <div className="landing-metric-value">Large</div>
                      <div className="landing-metric-foot">High demand</div>
                    </div>
                    <div className="landing-metric">
                      <div className="landing-metric-label">Weight</div>
                      <div className="landing-metric-value">420g</div>
                      <div className="landing-metric-foot">Approximate</div>
                    </div>
                    <div className="landing-metric">
                      <div className="landing-metric-label">Price</div>
                      <div className="landing-metric-value">$4.30</div>
                      <div className="landing-metric-foot">Predicted</div>
                    </div>
                  </div>
                  <div className="landing-panel-bottom">
                    <div className="landing-chip">Color score</div>
                    <div className="landing-chip">Defect level</div>
                    <div className="landing-chip">Market value</div>
                    <div className="landing-chip">Batch tracking</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="landing-section">
          <div className="container-pro">
            <div className="landing-section-head">
              <h2 className="landing-section-title">About Us</h2>
              <p className="landing-section-subtitle">
                We build practical computer vision tools for farms, packhouses, and exporters—designed for speed,
                consistency, and real-world operations.
              </p>
            </div>
            <div className="landing-cards">
              <article className="landing-card">
                <div className="landing-card-icon">🧠</div>
                <h3 className="landing-card-title">AI-first workflow</h3>
                <p className="landing-card-desc">
                  From segmentation to grading, the pipeline is optimized for repeatable results that match business rules.
                </p>
              </article>
              <article className="landing-card">
                <div className="landing-card-icon">📦</div>
                <h3 className="landing-card-title">Sorting &amp; packing ready</h3>
                <p className="landing-card-desc">
                  Size categories (small/medium/large) and quality grades support packing standards and market routing.
                </p>
              </article>
              <article className="landing-card">
                <div className="landing-card-icon">📈</div>
                <h3 className="landing-card-title">Pricing insights</h3>
                <p className="landing-card-desc">
                  Market value assessment and linear price prediction translate quality to actionable commercial decisions.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="modules" className="landing-section landing-section-alt">
          <div className="container-pro">
            <div className="landing-section-head">
              <h2 className="landing-section-title">Core Modules</h2>
              <p className="landing-section-subtitle">
                Everything needed to capture, assess, and manage dragon fruit quality in one system.
              </p>
            </div>
            <div className="landing-grid-2">
              <div className="landing-feature">
                <div className="landing-feature-top">
                  <div className="landing-feature-icon">🧩</div>
                  <div>
                    <div className="landing-feature-title">Segmentation</div>
                    <div className="landing-feature-desc">Isolate fruit, skin, and defect regions for robust scoring.</div>
                  </div>
                </div>
                <ul className="landing-feature-list">
                  <li>Fruit boundary detection</li>
                  <li>Defect hotspot localization</li>
                  <li>Batch traceability ready</li>
                </ul>
              </div>

              <div className="landing-feature">
                <div className="landing-feature-top">
                  <div className="landing-feature-icon">📏</div>
                  <div>
                    <div className="landing-feature-title">Size &amp; Weight</div>
                    <div className="landing-feature-desc">Classify small/medium/large and estimate approximate weight.</div>
                  </div>
                </div>
                <ul className="landing-feature-list">
                  <li>Scale-aware size category</li>
                  <li>Approximate weight estimation</li>
                  <li>Export-grade consistency</li>
                </ul>
              </div>

              <div className="landing-feature">
                <div className="landing-feature-top">
                  <div className="landing-feature-icon">🎨</div>
                  <div>
                    <div className="landing-feature-title">Color &amp; Quality</div>
                    <div className="landing-feature-desc">Color scoring and quality assessment aligned with grading rules.</div>
                  </div>
                </div>
                <ul className="landing-feature-list">
                  <li>Color-based ripeness signals</li>
                  <li>Defect-level weighting</li>
                  <li>Transparent grade outputs</li>
                </ul>
              </div>

              <div className="landing-feature">
                <div className="landing-feature-top">
                  <div className="landing-feature-icon">💹</div>
                  <div>
                    <div className="landing-feature-title">Market Value</div>
                    <div className="landing-feature-desc">Predict prices using a linear progression model from quality.</div>
                  </div>
                </div>
                <ul className="landing-feature-list">
                  <li>Quality → value mapping</li>
                  <li>Pricing tiers by size/grade</li>
                  <li>Explainable price drivers</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="resources" className="landing-section">
          <div className="container-pro">
            <div className="landing-section-head">
              <h2 className="landing-section-title">Resources</h2>
              <p className="landing-section-subtitle">
                Operational materials to keep your team aligned on sorting, grading, and decision-making.
              </p>
            </div>
            <div className="landing-cards">
              <article className="landing-card landing-card-link">
                <div className="landing-card-icon">🧾</div>
                <h3 className="landing-card-title">Grading rubric</h3>
                <p className="landing-card-desc">Define what A/B/C means for your market and supplier standards.</p>
              </article>
              <article className="landing-card landing-card-link">
                <div className="landing-card-icon">🧪</div>
                <h3 className="landing-card-title">Capture guidelines</h3>
                <p className="landing-card-desc">Recommended lighting and angles to maximize model accuracy.</p>
              </article>
              <article className="landing-card landing-card-link">
                <div className="landing-card-icon">📊</div>
                <h3 className="landing-card-title">Batch reporting</h3>
                <p className="landing-card-desc">Track pass rate, defect distribution, and quality trends over time.</p>
              </article>
              <article className="landing-card landing-card-link">
                <div className="landing-card-icon">🔐</div>
                <h3 className="landing-card-title">Access &amp; roles</h3>
                <p className="landing-card-desc">Separate admin workflows from operator scanning for safe operations.</p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="landing-footer">
        <div className="container-pro">
          <div className="landing-footer-grid">
            <div className="landing-footer-brand">
              <div className="landing-footer-logo">
                <BrandMark size={40} />
                <div>
                  <div className="landing-footer-name">{BRAND_NAME}</div>
                  <div className="landing-footer-tag">{BRAND_TAGLINE}</div>
                </div>
              </div>
              <p className="landing-footer-desc">
                Intelligent dragon fruit quality detection built for practical grading, pricing, and sorting decisions.
              </p>
            </div>

            <div className="landing-footer-col">
              <div className="landing-footer-title">Links</div>
              <a href="#home">Home</a>
              <a href="#about">About Us</a>
              <a href="#modules">Modules</a>
              <a href="#resources">Resources</a>
            </div>

            <div className="landing-footer-col">
              <div className="landing-footer-title">Contact</div>
              <div className="landing-footer-text">Business inquiries</div>
              <div className="landing-footer-text">support@tropiscan.local</div>
              <div className="landing-footer-text">Mon–Sat • 8:00 AM – 6:00 PM</div>
            </div>
          </div>

          <div className="landing-footer-bottom">
            <div>© {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</div>
            <Link to="/login" className="landing-footer-login">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
