import { createElement, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Camera,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Cpu,
  Layers,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'
import MarketingFooter from '../components/marketing/MarketingFooter'
import MarketingHeader from '../components/marketing/MarketingHeader'
import './Landing.css'

const SLIDES = [
  { src: '/landing/slider/slide-01.jpg', alt: 'Dragon fruit harvest display', label: 'Field-to-market visibility' },
  { src: '/landing/slider/slide-02.jpg', alt: 'Dragon fruit close-up sample', label: 'Consistent quality scoring' },
  { src: '/landing/slider/slide-03.jpg', alt: 'Red dragon fruit quality sample', label: 'Real-time grade confidence' },
  { src: '/landing/slider/slide-04.jpg', alt: 'Dragon fruit farm image', label: 'Operator-friendly workflows' },
  { src: '/landing/slider/slide-05.jpg', alt: 'White dragon fruit sample', label: 'Transparent price signals' },
  { src: '/landing/slider/slide-06.jpg', alt: 'Fresh white dragon fruit', label: 'Export-ready decisions' },
]

const QUICK_LINKS = [
  {
    to: '/about',
    title: 'About Us',
    description: 'How we built a practical AI grading system for real farm and packing workflows.',
    icon: ShieldCheck,
  },
  {
    to: '/how-it-works',
    title: 'How It Works',
    description: 'A clear, step-by-step pipeline from capture to grade, value estimate, and report.',
    icon: Layers,
  },
  {
    to: '/features',
    title: 'Features',
    description: 'Explore segmentation, grading intelligence, trend analytics, and admin controls.',
    icon: Sparkles,
  },
  {
    to: '/home',
    title: 'Live Workspace',
    description: 'Go straight to the operator interface to upload images and analyze fruit quality.',
    icon: ScanLine,
  },
]

const WORKFLOW = [
  {
    title: 'Capture',
    description: 'Take a clear fruit image in consistent lighting from your mobile workflow.',
    icon: Camera,
  },
  {
    title: 'Analyze',
    description: 'AI detects fruit regions, color signals, and defect markers in seconds.',
    icon: Cpu,
  },
  {
    title: 'Grade',
    description: 'Receive class, quality score, and approximate weight for every sample.',
    icon: BarChart3,
  },
  {
    title: 'Decide',
    description: 'Use predicted value and trends to route lots for packing, export, or local market.',
    icon: Wallet,
  },
]

const MODULES = [
  {
    title: 'Quality Scoring',
    description: 'Standardize grading with color, defect, and shape-driven confidence metrics.',
    icon: ShieldCheck,
  },
  {
    title: 'Market Intelligence',
    description: 'Translate quality outcomes into price guidance and actionable batch value ranges.',
    icon: Wallet,
  },
  {
    title: 'Trend Analytics',
    description: 'Track pass rate, defect distribution, and seasonal performance across operations.',
    icon: BarChart3,
  },
  {
    title: 'Weather Context',
    description: 'Connect environmental conditions with ripeness, growth windows, and handling strategy.',
    icon: CloudSun,
  },
]

function Landing() {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length)
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [])

  const goToSlide = (index) => {
    const nextIndex = (index + SLIDES.length) % SLIDES.length
    setActiveSlide(nextIndex)
  }

  return (
    <div className="pro-landing">
      <MarketingHeader />

      <main>
        <section id="overview" className="lp-hero">
          <div className="container-pro lp-hero-grid">
            <div className="lp-hero-copy">
              <span className="lp-kicker">AI grading platform for dragon fruit operations</span>
              <h1 className="lp-title">
                Elegant quality control for
                <span> modern produce teams</span>
              </h1>
              <p className="lp-subtitle">
                Move from subjective checks to consistent, explainable grading with segmentation, sizing,
                quality scores, and value prediction in one streamlined workflow.
              </p>
              <div className="lp-hero-cta">
                <Link to="/login" className="lp-btn-primary">
                  Start scanning
                  <ArrowRight size={16} />
                </Link>
                <Link to="/how-it-works" className="lp-btn-secondary">
                  View full workflow
                </Link>
              </div>
              <div className="lp-trust-strip">
                <div className="lp-trust-card">
                  <span className="lp-trust-value">A/B/C</span>
                  <span className="lp-trust-label">Grade classes</span>
                </div>
                <div className="lp-trust-card">
                  <span className="lp-trust-value">S/M/L</span>
                  <span className="lp-trust-label">Size categories</span>
                </div>
                <div className="lp-trust-card">
                  <span className="lp-trust-value">Real-time</span>
                  <span className="lp-trust-label">Price insights</span>
                </div>
              </div>
            </div>

            <aside className="lp-hero-panel" aria-label="Quality snapshot">
              <div className="lp-panel-top">
                <span className="lp-panel-badge">Sample output</span>
                <h2>Batch quality snapshot</h2>
                <p>Designed for fast, reliable team decisions from intake through shipment.</p>
              </div>
              <div className="lp-metric-grid">
                <div className="lp-metric">
                  <span>Grade</span>
                  <strong>A</strong>
                  <small>Premium class</small>
                </div>
                <div className="lp-metric">
                  <span>Size</span>
                  <strong>Large</strong>
                  <small>High demand</small>
                </div>
                <div className="lp-metric">
                  <span>Weight</span>
                  <strong>420g</strong>
                  <small>Estimated</small>
                </div>
                <div className="lp-metric">
                  <span>Price</span>
                  <strong>PHP 4.30</strong>
                  <small>Predicted</small>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="lp-slider-section" aria-label="Dragon fruit showcase">
          <div className="container-pro">
            <div className="lp-slider-shell">
              <div className="lp-slider-track">
                {SLIDES.map((slide, index) => (
                  <figure
                    key={slide.src}
                    className={`lp-slide ${activeSlide === index ? 'active' : ''}`}
                    aria-hidden={activeSlide === index ? 'false' : 'true'}
                  >
                    <img src={slide.src} alt={slide.alt} />
                    <figcaption>{slide.label}</figcaption>
                  </figure>
                ))}
              </div>

              <div className="lp-slider-controls">
                <button
                  type="button"
                  className="lp-slider-btn"
                  onClick={() => goToSlide(activeSlide - 1)}
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className="lp-slider-btn"
                  onClick={() => goToSlide(activeSlide + 1)}
                  aria-label="Next slide"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="lp-slider-dots" role="tablist" aria-label="Choose slide">
                {SLIDES.map((slide, index) => (
                  <button
                    key={slide.src}
                    type="button"
                    className={`lp-dot ${activeSlide === index ? 'active' : ''}`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-pressed={activeSlide === index ? 'true' : 'false'}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section">
          <div className="container-pro">
            <div className="lp-section-head">
              <h2>Explore the platform</h2>
              <p>Jump to the pages your team uses most often, with clear purpose and faster onboarding.</p>
            </div>

            <div className="lp-link-grid">
              {QUICK_LINKS.map(({ to, title, description, icon }) => (
                <Link to={to} key={title} className="lp-link-card">
                  <span className="lp-link-icon">
                    {createElement(icon, { size: 18 })}
                  </span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span className="lp-link-cta">
                    Open page
                    <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="lp-section lp-section-alt">
          <div className="container-pro">
            <div className="lp-section-head">
              <h2>How operations flow</h2>
              <p>
                Built for real-world usage: scan quickly, standardize decisions, and keep historical quality data
                organized.
              </p>
            </div>

            <div className="lp-workflow-grid">
              {WORKFLOW.map(({ title, description, icon }, index) => (
                <article key={title} className="lp-flow-card">
                  <span className="lp-flow-step">0{index + 1}</span>
                  <div className="lp-flow-icon">
                    {createElement(icon, { size: 18 })}
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="modules" className="lp-section">
          <div className="container-pro">
            <div className="lp-section-head">
              <h2>Core intelligence modules</h2>
              <p>Each module is purpose-built to reduce guesswork and increase consistency across your team.</p>
            </div>

            <div className="lp-module-grid">
              {MODULES.map(({ title, description, icon }) => (
                <article key={title} className="lp-module-card">
                  <div className="lp-module-icon">
                    {createElement(icon, { size: 20 })}
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-cta-band">
          <div className="container-pro lp-cta-content">
            <div>
              <span className="lp-kicker">Ready to deploy?</span>
              <h2>Give your grading process a professional standard.</h2>
              <p>Sign in to start scanning, benchmarking, and improving every batch.</p>
            </div>
            <Link to="/login" className="lp-btn-primary">
              Go to login
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}

export default Landing

