import { Link } from 'react-router-dom'
import BrandMark from '../BrandMark'
import { BRAND_NAME, BRAND_TAGLINE } from '../../config/brand'

const PLATFORM_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/features', label: 'Features' },
]

const ACCESS_LINKS = [
  { to: '/', label: 'Landing' },
  { to: '/home', label: 'Workspace' },
  { to: '/login', label: 'Login' },
]

function MarketingFooter() {
  return (
    <footer className="lp-footer">
      <div className="container-pro lp-footer-grid">
        <div className="lp-footer-brand">
          <div className="lp-brand">
            <BrandMark size={34} variant="tropiscan" />
            <div className="lp-brand-copy">
              <span className="lp-brand-name">{BRAND_NAME}</span>
              <span className="lp-brand-tag">{BRAND_TAGLINE}</span>
            </div>
          </div>
          <p className="lp-footer-copy">
            Intelligent dragon fruit quality detection for grading, sorting, and value decisions you can defend.
          </p>
          <div className="lp-footer-meta">
            <span>Precision grading</span>
            <span>Fast workflows</span>
            <span>Reliable outputs</span>
          </div>
        </div>

        <div className="lp-footer-links">
          <h3>Platform</h3>
          {PLATFORM_LINKS.map((item) => (
            <Link key={item.to} to={item.to}>{item.label}</Link>
          ))}
        </div>

        <div className="lp-footer-links">
          <h3>Access</h3>
          {ACCESS_LINKS.map((item) => (
            <Link key={item.to} to={item.to}>{item.label}</Link>
          ))}
        </div>
      </div>

      <div className="container-pro lp-footer-bottom">
        <span>Copyright {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</span>
        <div className="lp-footer-legal">
          <Link to="/about">About</Link>
          <Link to="/features">Capabilities</Link>
        </div>
      </div>
    </footer>
  )
}

export default MarketingFooter
