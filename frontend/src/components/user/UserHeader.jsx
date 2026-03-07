import { Link, NavLink } from 'react-router-dom'
import BrandMark from '../BrandMark'
import { BRAND_NAME } from '../../config/brand'
import './UserHeader.css'

const USER_NAV_ITEMS = [
  { path: '/overview', label: 'Overview' },
  { path: '/ai-analysis', label: 'AI Analysis' },
  { path: '/sorting-grading', label: 'Sorting & Grading' },
  { path: '/environment', label: 'Environment' },
  { path: '/community', label: 'Community' },
]

function UserHeader({ showDashboardLink = true, dashboardTo = '/home', rightSlot = null }) {
  return (
    <header className="user-header-shell">
      <div className="container-pro user-header-inner">
        <Link to="/home" className="user-header-brand" aria-label={`${BRAND_NAME} dashboard`}>
          <BrandMark size={38} variant="dragonfruit" />
          <div className="user-header-brand-copy">
            <span className="user-header-brand-name">{BRAND_NAME}</span>
            <span className="user-header-brand-tag">Dragonfruit workspace</span>
          </div>
        </Link>

        <nav className="user-header-nav" aria-label="User navigation">
          {USER_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `user-header-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="user-header-actions">
          {rightSlot}
          {showDashboardLink ? (
            <Link to={dashboardTo} className="user-header-dashboard-link">
              Dashboard
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export default UserHeader
