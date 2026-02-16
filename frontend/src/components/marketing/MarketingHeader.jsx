import { Link, NavLink } from 'react-router-dom'
import BrandMark from '../BrandMark'
import { BRAND_NAME, BRAND_TAGLINE } from '../../config/brand'

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/features', label: 'Features' },
  { to: '/login', label: 'Login' },
]

function MarketingHeader() {
  return (
    <div className="lp-header-wrap">
      <div className="container-pro lp-header lp-header-marketing">
        <Link to="/" className="lp-brand" aria-label={`${BRAND_NAME} home`}>
          <BrandMark size={38} />
          <div className="lp-brand-copy">
            <span className="lp-brand-name">{BRAND_NAME}</span>
            <span className="lp-brand-tag">{BRAND_TAGLINE}</span>
          </div>
        </Link>

        <nav className="lp-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `lp-nav-link${item.to === '/login' ? ' lp-nav-link-cta' : ''}${isActive ? ' active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default MarketingHeader
