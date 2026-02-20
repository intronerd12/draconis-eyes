import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import SystemStatus from '../components/SystemStatus'
import ParallaxDatasetSection from '../components/marketing/ParallaxDatasetSection'
import { BRAND_NAME } from '../config/brand'
import { DRAGON_VIGNAN_IMAGES } from '../config/datasetShowcase'
import '../App.css'

function Home() {
  const navigate = useNavigate()
  const [health, setHealth] = useState('checking...')

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      navigate('/login')
      return
    }

    try {
      const user = JSON.parse(userStr)
      if (user.role === 'admin') navigate('/admin')
    } catch {
      localStorage.removeItem('user')
      navigate('/login')
    }
  }, [navigate])

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

  const handleLogout = () => {
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
    navigate('/')
  }

  const sections = [
    { id: 'overview', title: 'Overview', path: '/overview', icon: '01', desc: 'System overview and introduction' },
    { id: 'features', title: 'Features', path: '/user-features', icon: '02', desc: 'Explore system capabilities' },
    { id: 'analyze', title: 'AI Analysis', path: '/ai-analysis', icon: '03', desc: 'Upload and analyze fruit images' },
    { id: 'marketplace', title: 'Marketplace', path: '/marketplace', icon: '04', desc: 'Browse sample batches' },
    { id: 'admin', title: 'Admin Panel', path: '/user-admin', icon: '05', desc: 'Analytics and management tools' },
  ]

  return (
    <div className="app-shell">
      <header>
        <div className="container-pro">
          <div className="logo-section">
            <span className="logo-icon">DF</span>
            <span className="logo-text">{BRAND_NAME}</span>
          </div>
          <nav>
            {sections.map((section) => (
              <a key={section.id} href={section.path} className="nav-link">{section.title}</a>
            ))}
          </nav>
          <div className="header-right">
            <div className="status-info">
              <span className="status-label">System Status</span>
              <span className={`status-value ${health === 'healthy' ? '' : 'offline'}`}>
                {health === 'healthy' ? 'ONLINE' : 'CONNECTING'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="btn-outline"
              style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #f5f0ff 100%)' }}>
        <section
          className="df-parallax-surface df-parallax-dark"
          style={{ '--df-bg-image': `url(${DRAGON_VIGNAN_IMAGES[5].src})` }}
        >
          <div
            style={{
              padding: '60px 0',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-50px',
                right: '-100px',
                width: '400px',
                height: '400px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '50%',
              }}
            ></div>
            <div
              style={{
                position: 'absolute',
                bottom: '-100px',
                left: '10%',
                width: '300px',
                height: '300px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '50%',
              }}
            ></div>
            <div className="container-pro" style={{ position: 'relative', zIndex: 1 }}>
              <div className="hero-content">
                <div className="hero-left">
                  <div
                    className="hero-badge"
                    style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#fff', borderColor: 'rgba(255, 255, 255, 0.4)' }}
                  >
                    {BRAND_NAME} User Dashboard
                  </div>
                  <h1 className="hero-title" style={{ color: '#fff' }}>
                    Welcome to your
                    <br />
                    <span className="hero-title-accent" style={{ color: '#fff' }}>Command Center</span>
                  </h1>
                  <p className="lp-subtitle" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Access AI-powered fruit analysis, quality scoring, and comprehensive analytics.
                    Manage your operation with real-time insights and detailed reports.
                  </p>
                </div>
                <div className="hero-right">
                  <div style={{ marginBottom: '24px' }}>
                    <SystemStatus />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ParallaxDatasetSection
          sectionId="comp-home-vignan-parallax"
          kicker="Dragon Fruit Vignan.v2i.yolov8"
          title="Large Dataset Visual Showcase"
          description="A full-background section powered by your own dragon fruit dataset with smooth parallax while scrolling."
          images={DRAGON_VIGNAN_IMAGES}
          primaryAction={{ label: 'Run AI Analysis', to: '/ai-analysis' }}
          secondaryAction={{ label: 'View Marketplace', to: '/marketplace' }}
          height={760}
        />

        <section
          className="df-parallax-surface df-parallax-light"
          style={{ '--df-bg-image': `url(${DRAGON_VIGNAN_IMAGES[3].src})` }}
        >
          <div style={{ padding: '60px 0', background: 'transparent' }}>
            <div className="container-pro">
              <h2 style={{ fontSize: '2rem', marginBottom: '32px', textAlign: 'center', fontWeight: '800', color: '#0f1728' }}>
                Quick Access
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                {sections.map((section, idx) => (
                  <a
                    key={section.id}
                    href={section.path}
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      padding: '24px',
                      borderRadius: '16px',
                      border: 'none',
                      background:
                        idx === 0
                          ? 'linear-gradient(135deg, #fde4ec 0%, #f3e5f5 100%)'
                          : idx === 1
                            ? 'linear-gradient(135deg, #fce4ec 0%, #ede7f6 100%)'
                            : '#f8f9fc',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(216, 27, 96, 0.08)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)'
                      e.currentTarget.style.boxShadow = '0 16px 32px rgba(216, 27, 96, 0.16)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(216, 27, 96, 0.08)'
                    }}
                  >
                    <div style={{ fontSize: '2.4rem' }}>{section.icon}</div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0', color: '#0f1728' }}>{section.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: '0', lineHeight: '1.5' }}>{section.desc}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ background: 'linear-gradient(135deg, #D81B60, #B8105B)', color: '#fff', padding: '40px 0' }}>
        <div className="container-pro">
          <div style={{ color: '#fff', fontSize: '1.3rem', fontWeight: '700', marginBottom: '12px' }}>DF {BRAND_NAME}</div>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '16px' }}>
            Intelligent Dragon Fruit Ripeness and Quality Detection System.
          </p>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
            Copyright {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
