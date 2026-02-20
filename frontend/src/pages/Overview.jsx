import React from 'react'
import { BRAND_NAME } from '../config/brand'
import './Landing.css'

function Overview() {
  return (
    <div className="app-shell">
      {/* HEADER */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '16px 0',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div className="container-pro" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '32px'
        }}>
          <a href="/home" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>🌴 {BRAND_NAME}</div>
          </a>
          <nav style={{ display: 'flex', gap: '32px', flex: 1, alignItems: 'center' }}>
            {[
              { path: '/overview', label: 'Overview', icon: '🏠' },
              { path: '/user-features', label: 'Features', icon: '✨' },
              { path: '/ai-analysis', label: 'AI Analysis', icon: '🧪' },
              { path: '/marketplace', label: 'Marketplace', icon: '🛒' },
              { path: '/user-admin', label: 'Admin', icon: '⚙️' }
            ].map(item => {
              const isActive = window.location.pathname === item.path
              return (
                <a key={item.path} href={item.path} style={{
                  textDecoration: 'none',
                  color: isActive ? '#D81B60' : '#6b7280',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.95rem',
                  paddingBottom: '4px',
                  borderBottom: isActive ? '2px solid #D81B60' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>{item.icon}</span>
                  {item.label}
                </a>
              )
            })}
          </nav>
          <a href="/home" style={{
            padding: '8px 16px',
            background: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500',
            textDecoration: 'none',
            color: '#000',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}>← Dashboard</a>
        </div>
      </header>

      {/* HERO */}
      <main>
        <section className="lp-hero page-hero-pro" style={{
          background: 'linear-gradient(135deg, #D81B60, #e85d93)',
          padding: '80px 0',
          color: '#fff',
          borderRadius: '16px',
          margin: '24px 0'
        }}>
          <div className="container-pro lp-hero-grid" style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
            <div className="lp-hero-copy" style={{ flex: '1', minWidth: '280px' }}>
              <span className="lp-kicker" style={{
                background: 'rgba(255,255,255,0.3)',
                padding: '4px 12px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.8rem',
                display: 'inline-block',
                marginBottom: '16px'
              }}>{BRAND_NAME} Overview</span>
              <h1 className="lp-title" style={{ fontSize: '2.8rem', fontWeight: '700', marginBottom: '24px', lineHeight: '1.2' }}>
                Intelligent Dragon Fruit
                <span style={{ display: 'block', fontWeight: '500', fontSize: '1.5rem' }}> Quality Detection</span>
              </h1>
              <p className="lp-subtitle" style={{ fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '32px', color: 'rgba(255,255,255,0.9)' }}>
                Our AI-powered system revolutionizes fruit grading with real-time ripeness detection, quality scoring, and market value prediction. Designed for packing houses, exporters, and agricultural operations.
              </p>
              <div className="lp-hero-cta" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <a href="/ai-analysis" style={{
                  padding: '12px 24px',
                  background: '#fff',
                  color: '#D81B60',
                  borderRadius: '8px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#f8f0f5'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#fff'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  Start Analysis →
                </a>
                <a href="/user-features" style={{
                  padding: '12px 24px',
                  border: '2px solid #fff',
                  color: '#fff',
                  borderRadius: '8px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#fff'
                    e.currentTarget.style.color = '#D81B60'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#fff'
                  }}
                >
                  Learn Features
                </a>
              </div>
            </div>
            <div className="lp-hero-image" style={{ flex: '1', textAlign: 'center', minWidth: '200px' }}>
              <div style={{
                fontSize: '120px',
                lineHeight: '1',
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))'
              }}>🐲</div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="lp-section">
          <div className="container-pro">
            <h2 className="section-title">How It Works</h2>
            <div className="lp-workflow" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '24px' }}>
              {[
                { num: '1', title: 'Capture', desc: 'Take a photo of your dragon fruit in natural lighting' },
                { num: '2', title: 'Analyze', desc: 'AI scans color, texture, size, and surface defects' },
                { num: '3', title: 'Grade', desc: 'Get instant quality score and ripeness classification' },
                { num: '4', title: 'Decide', desc: 'Route fruit to market based on predicted value' }
              ].map((step, i) => (
                <div key={i} className="guide-step-card" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '12px'
                }}>
                  <div className="guide-step-number" style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #D81B60, #e85d93)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: '700'
                  }}>{step.num}</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0' }}>{step.title}</h3>
                  <p style={{ fontSize: '0.95rem', color: '#6b7280', margin: '0', maxWidth: '180px' }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* KEY CAPABILITIES */}
        <section className="lp-section lp-section-alt" style={{ background: '#fdf2f7' }}>
          <div className="container-pro">
            <h2 className="section-title">Key Capabilities</h2>
            <div className="lp-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              {[
                { icon: '🔍', title: 'Computer Vision', desc: 'Advanced fruit detection and segmentation using deep learning models' },
                { icon: '📊', title: 'Quality Scoring', desc: 'Standardized grading with confidence metrics and ripeness levels' },
                { icon: '💰', title: 'Value Prediction', desc: 'Market intelligence and price guidance based on quality outcomes' },
                { icon: '📈', title: 'Analytics Dashboard', desc: 'Real-time performance tracking and trend insights' },
                { icon: '🌍', title: 'Weather Integration', desc: 'Connect environmental data with crop performance' },
                { icon: '⚡', title: 'Fast Processing', desc: 'Instant results in 2-3 seconds per image' }
              ].map((item, i) => (
                <div key={i} className="guide-card-pro" style={{
                  padding: '32px',
                  background: '#fff',
                  borderRadius: '12px',
                  border: '1px solid #f0f0f0',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>{item.icon}</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 8px 0', color: '#D81B60' }}>{item.title}</h3>
                  <p style={{ fontSize: '0.95rem', color: '#6b7280', margin: '0', lineHeight: '1.6' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GET STARTED */}
        <section className="lp-section">
          <div className="container-pro" style={{ textAlign: 'center' }}>
            <h2 className="section-title">Ready to Get Started?</h2>
            <p style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto 32px' }}>
              Upload an image of your dragon fruit and get instant analysis results. Try it now with our AI system.
            </p>
            <a href="/ai-analysis" style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #D81B60, #e85d93)',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(216,27,96,0.3)'
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Upload & Analyze →
            </a>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={{
        background: 'linear-gradient(135deg, #D81B60, #B8105B)',
        padding: '32px 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: '48px'
      }}>
        <div className="container-pro" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '12px', color: '#fff' }}>🌴 {BRAND_NAME}</div>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', margin: '0 0 12px 0' }}>
            Intelligent Dragon Fruit Detection & Quality Control
          </p>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
            © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Overview
