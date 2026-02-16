import React from 'react'
import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import { BRAND_NAME } from '../config/brand'

function Technology() {
  return (
    <div className="landing-shell">
      <header>
        <div className="container-pro">
          <Link to="/" className="logo-section" aria-label={`${BRAND_NAME} home`}>
            <BrandMark size={36} />
            <span className="logo-text">{BRAND_NAME}</span>
          </Link>

          <nav className="landing-nav" aria-label="Primary">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/about" className="nav-link">About Us</Link>
            <Link to="/how-it-works" className="nav-link">How It Works</Link>
            <Link to="/features" className="nav-link">Features</Link>
            <Link to="/resources" className="nav-link">Resources</Link>
            <Link to="/technology" className="nav-link">Technology</Link>
          </nav>

          <div className="header-right">
            <Link to="/login" className="btn-primary landing-login">Login</Link>
          </div>
        </div>
      </header>

      <main style={{ padding: '40px 0' }}>
        <section className="landing-section">
          <div className="container-pro">
            <div className="landing-section-head">
              <h2 className="landing-section-title">Technology Stack</h2>
              <p className="landing-section-subtitle">Built with modern, open-source, and enterprise-grade technology for reliability and scalability.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div style={{ padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Backend
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ fontSize: '13px', color: '#374151', padding: '4px 0' }}>Node.js &amp; Express</li>
                  <li style={{ fontSize: '13px', color: '#374151', padding: '4px 0' }}>MongoDB (production)</li>
                  <li style={{ fontSize: '13px', color: '#374151', padding: '4px 0' }}>FastAPI (Python AI)</li>
                  <li style={{ fontSize: '13px', color: '#374151', padding: '4px 0' }}>JWT Authentication</li>
                </ul>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Frontend
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ fontSize: '13px', color: '#374151', padding: '4px 0' }}>React 18+</li>
                  <li style={{ fontSize: '13px', color: '#374151', padding: '4px 0' }}>Vite (fast bundling)</li>
                  <li style={{ fontSize: '13px', color: '#374151', padding: '4px 0' }}>Recharts &amp; Lucide</li>
                  <li style={{ fontSize: '13px', color: '#374151', padding: '4px 0' }}>React Router</li>
                </ul>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  AI &amp; ML
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ fontSize: '13px', color: '#374151', padding: '4px 0' }}>YOLOv8 &amp; YOLOv11</li>
                  <li style={{ fontSize: '13px', color: '#374151', padding: '4px 0' }}>NumPy &amp; PIL</li>
                  <li style={{ fontSize: '13px', color: '#374151', padding: '4px 0' }}>Ridge Regression</li>
                  <li style={{ fontSize: '13px', color: '#374151', padding: '4px 0' }}>Image Segmentation</li>
                </ul>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Data &amp; Services
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ fontSize: '13px', color: '#374151', padding: '4px 0' }}>Cloudinary (CDN)</li>
                  <li style={{ fontSize: '13px', color: '#374151', padding: '4px 0' }}>Open-Meteo API</li>
                  <li style={{ fontSize: '13px', color: '#374151', padding: '4px 0' }}>JSONL data format</li>
                  <li style={{ fontSize: '13px', color: '#374151', padding: '4px 0' }}>Mailtrap (email)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="container-pro">
          <div className="landing-footer-bottom">
            <div>© {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</div>
            <Link to="/login" className="landing-footer-login">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Technology
