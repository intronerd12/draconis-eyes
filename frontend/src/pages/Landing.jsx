import React, { createElement, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Camera,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Cpu,
  Layers,
  Play,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'
import MarketingFooter from '../components/marketing/MarketingFooter'
import MarketingHeader from '../components/marketing/MarketingHeader'
import { getRandomWallpaperSet } from '../config/wallpaperDragon'
import './Landing.css'

// Interactive showcase carousel data - dragon fruit content with smooth animations
const VIDEO_SLIDES = [
  {
    type: 'video',
    title: 'Field-to-Market Dragon Fruit',
    description: 'High-resolution showcase from harvest to packing',
    video: 'https://res.cloudinary.com/dkqnaqbvg/video/upload/v1771299048/11760105-uhd_2160_4096_30fps_qltlyx.mp4',
    link: '/how-it-works',
    buttonText: 'Learn Our Process',
    icon: '🎯'
  },
  {
    type: 'video',
    title: 'Inspection Workflow in Action',
    description: 'Timelapse of inspection and grading operations',
    video: 'https://res.cloudinary.com/dkqnaqbvg/video/upload/v1771296731/4443533-hd_720_1280_20fps_kerrjc.mp4',
    link: '/features',
    buttonText: 'Explore Features',
    icon: '✨'
  },
  {
    type: 'video',
    title: 'Export Quality Assurance',
    description: 'Packing and export-ready checks for premium batches',
    video: 'https://res.cloudinary.com/dkqnaqbvg/video/upload/v1771296730/4443529-hd_1920_1080_25fps_up7btg.mp4',
    link: '/about',
    buttonText: 'About Us',
    icon: '📦'
  },
]

const SLIDES = [
  { src: '/landing/slider/slide-01.jpg', alt: 'Dragon fruit harvest display', label: 'Field-to-market visibility', link: '/features' },
  { src: '/landing/slider/slide-02.jpg', alt: 'Dragon fruit close-up sample', label: 'Consistent quality scoring', link: '/how-it-works' },
  { src: '/landing/slider/slide-03.jpg', alt: 'Red dragon fruit quality sample', label: 'Real-time grade confidence', link: '/features' },
  { src: '/landing/slider/slide-04.jpg', alt: 'Dragon fruit farm image', label: 'Operator-friendly workflows', link: '/how-it-works' },
  { src: '/landing/slider/slide-05.jpg', alt: 'White dragon fruit sample', label: 'Transparent price signals', link: '/about' },
  { src: '/landing/slider/slide-06.jpg', alt: 'Fresh white dragon fruit', label: 'Export-ready decisions', link: '/features' },
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
    stats: '2.5s avg',
  },
  {
    title: 'Analyze',
    description: 'AI detects fruit regions, color signals, and defect markers in seconds.',
    icon: Cpu,
    stats: '98.2% accurate',
  },
  {
    title: 'Grade',
    description: 'Receive class, quality score, and approximate weight for every sample.',
    icon: BarChart3,
    stats: 'A/B/C grades',
  },
  {
    title: 'Decide',
    description: 'Use predicted value and trends to route lots for packing, export, or local market.',
    icon: Wallet,
    stats: '3x ROI',
  },
]

const MODULES = [
  {
    title: 'Quality Scoring',
    description: 'Standardize grading with color, defect, and shape-driven confidence metrics.',
    icon: ShieldCheck,
    badge: 'Core',
  },
  {
    title: 'Market Intelligence',
    description: 'Translate quality outcomes into price guidance and actionable batch value ranges.',
    icon: Wallet,
    badge: 'Analytics',
  },
  {
    title: 'Trend Analytics',
    description: 'Track pass rate, defect distribution, and seasonal performance across operations.',
    icon: BarChart3,
    badge: 'Reports',
  },
  {
    title: 'Weather Context',
    description: 'Connect environmental conditions with ripeness, growth windows, and handling strategy.',
    icon: CloudSun,
    badge: 'Integration',
  },
]

function Landing() {
  const navigate = useNavigate()
  const [activeVideoSlide, setActiveVideoSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [activeSlide, setActiveSlide] = useState(0)
  const videoRefs = useRef([])
  const wallpapers = useMemo(() => getRandomWallpaperSet(6), [])

  // Auto-advance video slider when playing
  useEffect(() => {
    if (!isPlaying) return undefined
    const intervalId = window.setInterval(() => {
      setActiveVideoSlide((prev) => (prev + 1) % VIDEO_SLIDES.length)
    }, 6000)
    return () => window.clearInterval(intervalId)
  }, [isPlaying])

  const goToSlide = (index) => {
    const nextIndex = (index + SLIDES.length) % SLIDES.length
    setActiveSlide(nextIndex)
  }

  const goToVideoSlide = (index) => {
    const nextIndex = (index + VIDEO_SLIDES.length) % VIDEO_SLIDES.length
    setActiveVideoSlide(nextIndex)
    setIsPlaying(true)
  }

  const handleSlideClick = (link) => {
    navigate(link)
  }

  const toggleVideoPlay = () => {
    setIsPlaying(!isPlaying)
  }

  // control play/pause of video elements
  useEffect(() => {
    VIDEO_SLIDES.forEach((_, idx) => {
      const v = videoRefs.current[idx]
      if (!v) return
      try {
        if (idx === activeVideoSlide && isPlaying) {
          v.play().catch(() => {})
        } else {
          v.pause()
        }
      } catch (e) {
        // ignore play/pause errors from browser autoplay policies
      }
    })
  }, [activeVideoSlide, isPlaying])

  return (
    <div className="pro-landing">
      <MarketingHeader />

      <main style={{ background: 'linear-gradient(180deg, #fdf2f8 0%, #fff 50%)' }}>
        {/* Video slider section */}
        <section
          className="lp-video-hero df-parallax-surface df-parallax-dark"
          aria-label="Dragon fruit showcase"
          style={{ '--df-bg-image': `url(${wallpapers[0].src})` }}
        >
          <div className="lp-video-container">
            <div className="lp-video-wrapper">
              {VIDEO_SLIDES.map((slide, index) => (
                <video
                  key={slide.video}
                  ref={(el) => (videoRefs.current[index] = el)}
                  className={`lp-video-element ${activeVideoSlide === index ? 'active' : ''}`}
                  src={slide.video}
                  playsInline
                  muted
                  loop
                  preload="auto"
                  aria-hidden={activeVideoSlide === index ? 'false' : 'true'}
                />
              ))}

              {/* Play button overlay */}
              <button
                type="button"
                className={`lp-video-play-btn ${isPlaying ? 'playing' : ''}`}
                onClick={toggleVideoPlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {!isPlaying && <Play size={32} fill="white" />}
                {isPlaying && <span style={{ fontSize: '24px' }}>▶️</span>}
              </button>

              {/* Video content overlay with navigation */}
              <div className="lp-video-content">
                <span className="lp-slide-icon">{VIDEO_SLIDES[activeVideoSlide].icon}</span>
                <h2>{VIDEO_SLIDES[activeVideoSlide].title}</h2>
                <p>{VIDEO_SLIDES[activeVideoSlide].description}</p>
                <Link 
                  to={VIDEO_SLIDES[activeVideoSlide].link}
                  className="lp-video-nav-btn"
                >
                  {VIDEO_SLIDES[activeVideoSlide].buttonText}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Slider controls */}
            <div className="lp-video-controls">
              <button
                type="button"
                className="lp-video-btn"
                onClick={() => goToVideoSlide(activeVideoSlide - 1)}
                aria-label="Previous slide"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="lp-video-dots">
                {VIDEO_SLIDES.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`lp-video-dot ${activeVideoSlide === index ? 'active' : ''}`}
                    onClick={() => goToVideoSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-pressed={activeVideoSlide === index ? 'true' : 'false'}
                  />
                ))}
              </div>
              <button
                type="button"
                className="lp-video-btn"
                onClick={() => goToVideoSlide(activeVideoSlide + 1)}
                aria-label="Next slide"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </section>

        <section
          id="overview"
          className="lp-hero df-parallax-surface df-parallax-dark"
          style={{ '--df-bg-image': `url(${wallpapers[1].src})`, color: '#fff' }}
        >
          <div className="container-pro lp-hero-grid">
            <div className="lp-hero-copy">
              <span className="lp-kicker" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>AI grading platform for dragon fruit operations</span>
              <h1 className="lp-title" style={{ color: '#fff' }}>
                Elegant quality control for
                <span style={{ color: '#fff' }}> modern produce teams</span>
              </h1>
              <p className="lp-subtitle" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                Move from subjective checks to consistent, explainable grading with segmentation, sizing,
                quality scores, and value prediction in one streamlined workflow.
              </p>
              <div className="lp-hero-cta">
                <Link to="/login" className="lp-btn-primary">
                  Start scanning
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/how-it-works"
                  className="lp-btn-secondary"
                  style={{
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    color: '#fff',
                  }}
                >
                  View full workflow
                </Link>
              </div>
              <div className="lp-trust-strip">
                <div className="lp-trust-card" style={{ background: 'rgba(255, 255, 255, 0.12)', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#fff' }}>
                  <span className="lp-trust-value">A/B/C</span>
                  <span className="lp-trust-label">Grade classes</span>
                </div>
                <div className="lp-trust-card" style={{ background: 'rgba(255, 255, 255, 0.12)', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#fff' }}>
                  <span className="lp-trust-value">S/M/L</span>
                  <span className="lp-trust-label">Size categories</span>
                </div>
                <div className="lp-trust-card" style={{ background: 'rgba(255, 255, 255, 0.12)', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#fff' }}>
                  <span className="lp-trust-value">Real-time</span>
                  <span className="lp-trust-label">Price insights</span>
                </div>
              </div>
            </div>

            <aside className="lp-hero-panel" aria-label="Quality snapshot" style={{ background: 'rgba(255, 255, 255, 0.95)', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
              <div className="lp-panel-top">
                <span className="lp-panel-badge" style={{ background: '#D81B60', color: '#fff' }}>Sample output</span>
                <h2 style={{ color: '#0f1728' }}>Batch quality snapshot</h2>
                <p style={{ color: '#6b7280' }}>Designed for fast, reliable team decisions from intake through shipment.</p>
              </div>
              <div className="lp-metric-grid">
                <div className="lp-metric">
                  <span style={{ color: '#6b7280' }}>Grade</span>
                  <strong style={{ color: '#D81B60' }}>A</strong>
                  <small style={{ color: '#9ca3af' }}>Premium class</small>
                </div>
                <div className="lp-metric">
                  <span style={{ color: '#6b7280' }}>Size</span>
                  <strong style={{ color: '#D81B60' }}>Large</strong>
                  <small style={{ color: '#9ca3af' }}>High demand</small>
                </div>
                <div className="lp-metric">
                  <span style={{ color: '#6b7280' }}>Weight</span>
                  <strong style={{ color: '#D81B60' }}>420g</strong>
                  <small style={{ color: '#9ca3af' }}>Estimated</small>
                </div>
                <div className="lp-metric">
                  <span style={{ color: '#6b7280' }}>Price</span>
                  <strong style={{ color: '#D81B60' }}>PHP 4.30</strong>
                  <small style={{ color: '#9ca3af' }}>Predicted</small>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Removed old image slider - replaced by video hero above */}

        <section
          className="lp-section df-parallax-surface df-parallax-light"
          style={{ '--df-bg-image': `url(${wallpapers[2].src})` }}
        >
          <div className="container-pro">
            <div className="lp-section-head">
              <h2 style={{ color: '#0f1728' }}>Explore the platform</h2>
              <p style={{ color: '#6b7280' }}>Jump to the pages your team uses most often, with clear purpose and faster onboarding.</p>
            </div>

            <div className="lp-link-grid">
              {QUICK_LINKS.map(({ to, title, description, icon }) => (
                <Link to={to} key={title} className="lp-link-card" style={{ background: '#fff', boxShadow: '0 4px 12px rgba(216, 27, 96, 0.1)' }}>
                  <span className="lp-link-icon" style={{ color: '#D81B60' }}>
                    {createElement(icon, { size: 18 })}
                  </span>
                  <h3 style={{ color: '#0f1728' }}>{title}</h3>
                  <p style={{ color: '#6b7280' }}>{description}</p>
                  <span className="lp-link-cta" style={{ color: '#D81B60' }}>
                    Open page
                    <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="lp-section lp-section-alt df-parallax-surface df-parallax-dark"
          style={{ '--df-bg-image': `url(${wallpapers[3].src})`, color: '#fff' }}
        >
          <div className="container-pro">
            <div className="lp-section-head">
              <h2 style={{ color: '#fff' }}>How operations flow</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                Built for real-world usage: scan quickly, standardize decisions, and keep historical quality data
                organized.
              </p>
            </div>

            <div className="lp-workflow-grid">
              {WORKFLOW.map(({ title, description, icon, stats }, index) => (
                <article key={title} className="lp-flow-card" style={{ background: 'rgba(255, 255, 255, 0.12)', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#fff' }}>
                  <span className="lp-flow-step" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>0{index + 1}</span>
                  <div className="lp-flow-icon" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#fff' }}>
                    {createElement(icon, { size: 18 })}
                  </div>
                  <h3 style={{ color: '#fff' }}>{title}</h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{description}</p>
                  {stats && <span className="lp-flow-stat" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{stats}</span>}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="modules"
          className="lp-section df-parallax-surface df-parallax-light"
          style={{ '--df-bg-image': `url(${wallpapers[4].src})` }}
        >
          <div className="container-pro">
            <div className="lp-section-head">
              <h2 style={{ color: '#0f1728' }}>Core intelligence modules</h2>
              <p style={{ color: '#6b7280' }}>Each module is purpose-built to reduce guesswork and increase consistency across your team.</p>
            </div>

            <div className="lp-module-grid">
              {MODULES.map(({ title, description, icon, badge }) => (
                <article key={title} className="lp-module-card" style={{ background: '#fff', boxShadow: '0 4px 12px rgba(216, 27, 96, 0.1)' }}>
                  {badge && <span className="lp-module-badge" style={{ background: '#D81B60', color: '#fff' }}>{badge}</span>}
                  <div className="lp-module-icon" style={{ color: '#D81B60' }}>
                    {createElement(icon, { size: 20 })}
                  </div>
                  <h3 style={{ color: '#0f1728' }}>{title}</h3>
                  <p style={{ color: '#6b7280' }}>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="lp-cta-band df-parallax-surface df-parallax-dark"
          style={{ '--df-bg-image': `url(${wallpapers[5].src})`, color: '#fff' }}
        >
          <div className="container-pro lp-cta-content">
            <div>
              <span className="lp-kicker" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Ready to deploy?</span>
              <h2 style={{ color: '#fff' }}>Give your grading process a professional standard.</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Sign in to start scanning, benchmarking, and improving every batch.</p>
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

