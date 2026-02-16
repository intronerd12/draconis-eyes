import { Link } from 'react-router-dom'
import BrandMark from '../BrandMark'
import { BRAND_NAME, BRAND_TAGLINE } from '../../config/brand'

function MarketingFooter() {
  return (
    <footer className="lp-footer">
      <div className="container-pro lp-footer-grid">
        <div className="lp-footer-brand">
          <div className="lp-brand">
            <BrandMark size={34} />
            <div className="lp-brand-copy">
              <span className="lp-brand-name">{BRAND_NAME}</span>
              <span className="lp-brand-tag">{BRAND_TAGLINE}</span>
            </div>
          </div>
          <p>
            Intelligent dragon fruit quality detection for grading, sorting, and value decisions you can defend.
          </p>
        </div>

        <div className="lp-footer-links">
          <h3>Navigate</h3>
          <Link to="/about">About</Link>
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/features">Features</Link>
        </div>

        <div className="lp-footer-links">
          <h3>Access</h3>
          <Link to="/home">Home</Link>
          <Link to="/login">Login</Link>
          <Link to="/">Landing</Link>
        </div>
      </div>

      <div className="container-pro lp-footer-bottom">
        <span>Copyright {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</span>
      </div>
    </footer>
  )
}

export default MarketingFooter
