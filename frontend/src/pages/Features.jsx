import { createElement, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CloudSun,
  Cpu,
  DollarSign,
  Layers,
  ScanLine,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react'
import MarketingFooter from '../components/marketing/MarketingFooter'
import MarketingHeader from '../components/marketing/MarketingHeader'
import { getRandomWallpaperSet } from '../config/wallpaperDragon'
import './Landing.css'
import './MarketingPages.css'

const CORE_FEATURES = [
  {
    title: 'Segmentation Engine',
    description: 'Isolates fruit, skin, and defect zones for precise quality analysis.',
    icon: Layers,
  },
  {
    title: 'Quality Intelligence',
    description: 'Combines ripeness, defect, and shape signals into consistent grade outputs.',
    icon: ShieldCheck,
  },
  {
    title: 'Size and Weight Estimation',
    description: 'Predicts category and approximate weight to support sorting and packing decisions.',
    icon: Target,
  },
  {
    title: 'Market Value Prediction',
    description: 'Converts quality outcomes into transparent and explainable price guidance.',
    icon: DollarSign,
  },
  {
    title: 'Operational Analytics',
    description: 'Monitors pass rates, grade distribution, and trend shifts across time windows.',
    icon: BarChart3,
  },
  {
    title: 'Weather Context Layer',
    description: 'Connects environmental conditions with ripeness and yield pattern interpretation.',
    icon: CloudSun,
  },
]

const EXTENSIONS = [
  {
    title: 'Live Scan Workspace',
    description: 'Operator-focused interface for image intake, analysis, and immediate review.',
    icon: ScanLine,
  },
  {
    title: 'Model Learning Loop',
    description: 'Supports correction feedback and retraining from your operation data.',
    icon: Cpu,
  },
  {
    title: 'Team and Admin Controls',
    description: 'Role-based access and governance for secure operational ownership.',
    icon: Users,
  },
]

function Features() {
  const wallpapers = useMemo(() => getRandomWallpaperSet(4), [])

  return (
    <div className="pro-landing mk-page">
      <MarketingHeader />

      <main className="mk-main">
        <section
          className="mk-hero df-parallax-surface df-parallax-dark"
          style={{ '--df-bg-image': `url(${wallpapers[0].src})` }}
        >
          <div className="container-pro mk-hero-grid">
            <div>
              <span className="mk-kicker">Platform capabilities</span>
              <h1 className="mk-title">
                Feature set built for
                <span className="accent"> production-grade quality control</span>
              </h1>
              <p className="mk-subtitle">
                TropiScan combines model intelligence and operator workflows in one platform so your team can grade,
                route, and report with confidence.
              </p>
              <div className="mk-actions">
                <Link to="/home" className="lp-btn-primary">
                  Open workspace
                  <ArrowRight size={16} />
                </Link>
                <Link to="/how-it-works" className="lp-btn-secondary">
                  See the process
                </Link>
              </div>
            </div>

            <aside className="mk-card">
              <div className="mk-card-head">
                <Cpu size={16} />
                Feature architecture
              </div>
              <h3>Modular by design</h3>
              <p>
                Core modules handle detection and scoring while extension modules support deployment, governance, and
                continuous model refinement.
              </p>
              <div className="mk-metric-strip">
                <div className="mk-metric">
                  <span className="value">6 core</span>
                  <span className="label">Intelligence modules</span>
                </div>
                <div className="mk-metric">
                  <span className="value">3 extension</span>
                  <span className="label">Operations layers</span>
                </div>
                <div className="mk-metric">
                  <span className="value">Single flow</span>
                  <span className="label">Unified UX</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section
          className="mk-section df-parallax-surface df-parallax-light"
          style={{ '--df-bg-image': `url(${wallpapers[1].src})` }}
        >
          <div className="container-pro">
            <div className="mk-section-head">
              <h2>Core intelligence modules</h2>
              <p>These modules directly drive grading accuracy, consistency, and market-readiness.</p>
            </div>

            <div className="mk-grid-3">
              {CORE_FEATURES.map(({ title, description, icon }) => (
                <article key={title} className="mk-info-card">
                  <div className="mk-info-icon">{createElement(icon, { size: 18 })}</div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="mk-section df-parallax-surface df-parallax-dark"
          style={{ '--df-bg-image': `url(${wallpapers[2].src})` }}
        >
          <div className="container-pro">
            <div className="mk-section-head">
              <h2>Extension layers</h2>
              <p>Capabilities that make the core engine usable at scale across teams and environments.</p>
            </div>

            <div className="mk-grid-3">
              {EXTENSIONS.map(({ title, description, icon }) => (
                <article key={title} className="mk-info-card">
                  <div className="mk-info-icon">{createElement(icon, { size: 18 })}</div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="mk-section df-parallax-surface df-parallax-light"
          style={{ '--df-bg-image': `url(${wallpapers[3].src})` }}
        >
          <div className="container-pro">
            <div className="mk-cta">
              <div>
                <h3>See all features in action from the operator side.</h3>
                <p>Go to the workspace and run a real scan to explore the complete capability stack.</p>
              </div>
              <Link to="/home" className="lp-btn-primary">
                Go to Home
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}

export default Features
