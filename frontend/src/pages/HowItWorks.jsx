import { createElement } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Camera, CheckCircle2, ClipboardList, Cpu, DollarSign, RefreshCw } from 'lucide-react'
import MarketingFooter from '../components/marketing/MarketingFooter'
import MarketingHeader from '../components/marketing/MarketingHeader'
import './Landing.css'
import './MarketingPages.css'

const WORKFLOW = [
  {
    id: 'Stage 01',
    title: 'Capture',
    description: 'Operators capture fruit images with clear framing and stable lighting in the scan workflow.',
    icon: Camera,
  },
  {
    id: 'Stage 02',
    title: 'Analyze',
    description: 'Computer vision identifies fruit boundaries, defects, and ripeness indicators in near real-time.',
    icon: Cpu,
  },
  {
    id: 'Stage 03',
    title: 'Grade',
    description: 'The engine returns class, score, size, and estimated weight using standardized grading logic.',
    icon: BarChart3,
  },
  {
    id: 'Stage 04',
    title: 'Value',
    description: 'Predicted market value supports routing decisions for export, local market, or processing.',
    icon: DollarSign,
  },
]

const DELIVERY = [
  {
    title: 'Operator Feedback Loop',
    description: 'Corrections from your team are stored for retraining and model tuning.',
    icon: RefreshCw,
  },
  {
    title: 'Batch Reporting',
    description: 'Summaries show pass rate, grade mix, and quality trends by date or lot.',
    icon: ClipboardList,
  },
  {
    title: 'Decision Transparency',
    description: 'Each output includes interpretable signals, not just a black-box grade.',
    icon: CheckCircle2,
  },
]

function HowItWorks() {
  return (
    <div className="pro-landing mk-page">
      <MarketingHeader />

      <main className="mk-main">
        <section className="mk-hero">
          <div className="container-pro mk-hero-grid">
            <div>
              <span className="mk-kicker">How the platform works</span>
              <h1 className="mk-title">
                A clear pipeline from
                <span className="accent"> image capture to business decision</span>
              </h1>
              <p className="mk-subtitle">
                TropiScan is designed to remove ambiguity from grading. Every stage in the pipeline is structured so
                teams can move faster without sacrificing consistency.
              </p>
              <div className="mk-actions">
                <Link to="/features" className="lp-btn-primary">
                  View all modules
                  <ArrowRight size={16} />
                </Link>
                <Link to="/about" className="lp-btn-secondary">
                  Learn about the model
                </Link>
              </div>
            </div>

            <aside className="mk-card">
              <div className="mk-card-head">
                <BarChart3 size={16} />
                Operational outcomes
              </div>
              <h3>Designed for repeatable quality</h3>
              <p>
                The workflow balances speed and control so each decision is traceable, comparable, and actionable.
              </p>
              <div className="mk-metric-strip">
                <div className="mk-metric">
                  <span className="value">4 steps</span>
                  <span className="label">Core pipeline</span>
                </div>
                <div className="mk-metric">
                  <span className="value">Batch-ready</span>
                  <span className="label">Reporting output</span>
                </div>
                <div className="mk-metric">
                  <span className="value">Feedback loop</span>
                  <span className="label">Model learning</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="mk-section">
          <div className="container-pro">
            <div className="mk-section-head">
              <h2>Core workflow stages</h2>
              <p>From intake to value prediction, each stage is optimized for production teams.</p>
            </div>

            <div className="mk-timeline">
              <div className="mk-timeline-track">
                {WORKFLOW.map(({ id, title, description, icon }) => (
                  <article key={id} className="mk-step">
                    <span className="mk-step-id">{id}</span>
                    <div className="mk-info-icon">{createElement(icon, { size: 18 })}</div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mk-section">
          <div className="container-pro">
            <div className="mk-section-head">
              <h2>What you get after each scan</h2>
              <p>Outputs are built to support immediate action and long-term performance improvement.</p>
            </div>
            <div className="mk-grid-3">
              {DELIVERY.map(({ title, description, icon }) => (
                <article key={title} className="mk-info-card">
                  <div className="mk-info-icon">{createElement(icon, { size: 18 })}</div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mk-section">
          <div className="container-pro">
            <div className="mk-cta">
              <div>
                <h3>Ready to apply this workflow in your operation?</h3>
                <p>Sign in and start analyzing real fruit images with production-ready reporting.</p>
              </div>
              <Link to="/login" className="lp-btn-primary">
                Go to Login
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

export default HowItWorks
