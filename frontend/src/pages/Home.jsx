import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import SystemStatus from '../components/SystemStatus'
import ParallaxDatasetSection from '../components/marketing/ParallaxDatasetSection'
import { BRAND_NAME } from '../config/brand'
import { API_BASE_URL } from '../config/api'
import '../App.css'

function Home() {
  const navigate = useNavigate()
  const [health, setHealth] = useState('checking...')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      navigate('/login')
      return
    }

    try {
      const userData = JSON.parse(userStr)
      if (userData.role === 'admin') {
        navigate('/admin')
      } else {
        setUser(userData)
      }
    } catch {
      localStorage.removeItem('user')
      navigate('/login')
    }
  }, [navigate])

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/status`)
        const data = await res.json()
        setHealth(data?.ai_service === 'connected' ? 'healthy' : 'offline')
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
    { id: 'analyze', title: 'AI Analysis', path: '/ai-analysis', icon: '02', desc: 'Upload and analyze fruit images' },
    { id: 'community', title: 'Community Forum', path: '/community', icon: '03', desc: 'Share and discuss scan results with other users' },
  ]
  const dashboardWallpapers = Array.from({ length: 6 }, () => ({
    src: '/wallpaper-dragon/wallpaper-10.jpg',
    label: 'Wallpaper Dragon 10',
  }))

  return (
    <div className="app-shell">
      <header>
        <div className="container-pro">
          <div className="logo-section">
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
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid #e5e7eb', paddingLeft: '24px' }}>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#111827' }}>{user.name || 'User'}</span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{user.email}</span>
                </div>
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                  />
                ) : (
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: '1.2rem' }}>👤</span>
                  </div>
                )}
              </div>
            )}
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
          style={{ '--df-bg-image': `url(${dashboardWallpapers[0]?.src || '/wallpaper-dragon/wallpaper-01.jpeg'})` }}
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
          kicker="Wallpaper Dragon Gallery"
          title="High-Resolution Dragonfruit Wallpaper Slider"
          description="Premium wallpaper visuals to keep the dashboard crisp and professional."
          images={dashboardWallpapers}
          primaryAction={{ label: 'Run AI Analysis', to: '/ai-analysis' }}
          secondaryAction={{ label: 'Open Community', to: '/community' }}
          height={760}
        />

        <section
          className="df-parallax-surface df-parallax-light"
          style={{ '--df-bg-image': `url(${dashboardWallpapers[1]?.src || '/wallpaper-dragon/wallpaper-02.jpg'})` }}
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

      <footer style={{ background: 'linear-gradient(180deg, #EC6565, #C84F4F)', color: '#fff', padding: '40px 0' }}>
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
