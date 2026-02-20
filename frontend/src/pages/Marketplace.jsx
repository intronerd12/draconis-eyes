import React, { useState } from 'react'
import { BRAND_NAME } from '../config/brand'
import './Landing.css'

const PRODUCTS = [
  { id: 1, name: 'Premium Red Dragon Fruit', grade: 'A', price: 450, image: '🔴', ripeness: 'Perfect', region: 'Northern District' },
  { id: 2, name: 'Pink White Dragon Fruit', grade: 'A', price: 380, image: '🟣', ripeness: 'Ripe', region: 'Central Valley' },
  { id: 3, name: 'Standard White Fruit', grade: 'B', price: 280, image: '⚪', ripeness: 'Good', region: 'South Region' },
  { id: 4, name: 'Mixed Variety Batch', grade: 'B', price: 320, image: '🟢', ripeness: 'Ready', region: 'Multi-source' },
  { id: 5, name: 'Under-ripe Red Selection', grade: 'C', price: 180, image: '🟠', ripeness: 'Developing', region: 'East Valley' },
  { id: 6, name: 'Processing Grade', grade: 'C', price: 150, image: '🟡', ripeness: 'Various', region: 'West Region' },
]

function Marketplace() {
  const [query, setQuery] = useState('')
  const filtered = PRODUCTS.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
  const formatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

  return (
    <div className="app-shell" style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #fff6fb 0%, #fff0f6 12%, #f3fbf8 46%, #eef8ff 100%)'
    }}>
      <header style={{
        backdropFilter: 'blur(14px)',
        background: 'rgba(255, 255, 255, 0.88)',
        borderBottom: '1px solid rgba(16, 25, 39, 0.08)',
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
      <main>
        <section className="lp-hero page-hero-pro" style={{
          background: 'linear-gradient(135deg, #D81B60, #E85D93)',
          padding: '76px 0 22px',
          color: '#fff'
        }}>
          <div className="container-pro lp-hero-grid">
            <div className="lp-hero-copy">
              <span className="lp-kicker" style={{
                color: 'rgba(255, 255, 255, 0.95)',
                background: 'rgba(255, 255, 255, 0.2)',
                borderColor: 'rgba(255, 255, 255, 0.3)'
              }}>Marketplace & Catalog</span>
              <h1 className="lp-title" style={{ color: '#fff' }}>
                Browse Quality
                <span style={{ color: 'rgba(255, 255, 255, 0.95)' }}> Sample Batches</span>
              </h1>
              <p className="lp-subtitle" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                Explore representative fruit lots from our database, graded by our AI system. Each batch shows quality grade, ripeness level, and market value estimates.
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '32px', marginBottom: '32px' }}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by batch name..."
                  style={{
                    flex: 1,
                    maxWidth: '400px',
                    padding: '12px 16px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    background: 'rgba(255, 255, 255, 0.95)',
                    color: '#333'
                  }}
                />
                <span style={{ alignSelf: 'center', fontSize: '1.2rem' }}>🔍</span>
              </div>
            </div>
            <div className="lp-hero-image">
              <div style={{
                fontSize: '100px',
                textAlign: 'center',
                lineHeight: '1',
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))'
              }}>🛒</div>
            </div>
          </div>
        </section>

        <section className="lp-section" style={{
          background: 'linear-gradient(180deg, #fff6fb 0%, #fff0f6 12%, #f3fbf8 46%, #eef8ff 100%)'
        }}>
          <div className="container-pro">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {filtered.map(p => (
                <div key={p.id} className="market-card-pro" style={{
                  border: '1px solid rgba(216, 27, 96, 0.12)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(253, 242, 248, 0.95))',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 14px 30px rgba(216, 27, 96, 0.08)'
                }}>
                  <div style={{ fontSize: '90px', textAlign: 'center', padding: '32px 16px', background: 'linear-gradient(135deg, rgba(216, 27, 96, 0.08), rgba(232, 93, 147, 0.05))' }}>{p.image}</div>
                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0', flex: 1 }}>{p.name}</h3>
                      <span style={{
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        borderRadius: '6px',
                        background: p.grade === 'A' ? '#dcfce7' : p.grade === 'B' ? '#fef3c7' : '#fee2e2',
                        color: p.grade === 'A' ? '#166534' : p.grade === 'B' ? '#92400e' : '#991b1b'
                      }}>Grade {p.grade}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: '0 0 12px 0' }}>📍 {p.region}</p>
                    <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: '0 0 12px 0' }}>🍎 Ripeness: {p.ripeness}</p>
                    <p style={{ fontSize: '1.3rem', fontWeight: '700', color: '#D81B60', margin: '12px 0 0 auto' }}>{formatter.format(p.price)}</p>
                  </div>
                </div>
              ))}
            </div>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: '#6b7280' }}>
                <p style={{ fontSize: '1.1rem' }}>No batches found matching your search.</p>
              </div>
            )}
          </div>
        </section>

        <section className="lp-section lp-section-alt" style={{
          background: 'linear-gradient(180deg, #fff6fb 0%, #fff0f6 12%, #f3fbf8 46%, #eef8ff 100%)'
        }}>
          <div className="container-pro" style={{ textAlign: 'center' }}>
            <h2 className="section-title">How Grades Work</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginTop: '32px' }}>
              {[
                { grade: 'A', color: '#dcfce7', desc: 'Premium quality, export-ready fruit with perfect ripeness and minimal defects' },
                { grade: 'B', color: '#fef3c7', desc: 'Good quality fruit suitable for fresh market sales with minor surface marks' },
                { grade: 'C', color: '#fee2e2', desc: 'Processing or local market grade with acceptable quality for non-premium channels' }
              ].map((item, i) => (
                <div key={i} className="grade-guide-card" style={{
                  padding: '24px',
                  background: item.color,
                  borderRadius: '12px',
                  border: '1px solid rgba(216, 27, 96, 0.12)',
                  boxShadow: '0 14px 30px rgba(216, 27, 96, 0.08)'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px', color: '#1f2937' }}>Grade {item.grade}</div>
                  <p style={{ fontSize: '0.95rem', color: '#6b7280', margin: '0' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer style={{
        background: 'linear-gradient(135deg, #D81B60, #B8105B)',
        padding: '32px 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: '48px'
      }}>
        <div className="container-pro" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '12px', color: '#fff' }}>🌴 {BRAND_NAME}</div>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', margin: '0 0 12px 0' }}>Intelligent Dragon Fruit Detection & Quality Control</p>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>© {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}

export default Marketplace
