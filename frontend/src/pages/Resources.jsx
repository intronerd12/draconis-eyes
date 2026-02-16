import React from 'react'
import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import { BRAND_NAME } from '../config/brand'

function Resources() {
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
              <h2 className="landing-section-title">Resources</h2>
              <p className="landing-section-subtitle">Operational materials to keep your team aligned on sorting, grading, and decision-making.</p>
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

export default Resources
