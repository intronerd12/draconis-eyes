import { createElement } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Gauge, Layers, ShieldCheck, Sprout, TrendingUp } from 'lucide-react'
import MarketingFooter from '../components/marketing/MarketingFooter'
import MarketingHeader from '../components/marketing/MarketingHeader'
import './Landing.css'
import './MarketingPages.css'

const PILLARS = [
  {
    title: 'Transparent Decisions',
    description: 'Every grade and value estimate is backed by measurable indicators and visible score drivers.',
    icon: ShieldCheck,
  },
  {
    title: 'Operational Speed',
    description: 'Built for real packing line flow, with analysis that is fast enough for daily throughput.',
    icon: Gauge,
  },
  {
    title: 'Model Evolution',
    description: 'Your scans continuously improve detection quality through structured retraining cycles.',
    icon: TrendingUp,
  },
  {
    title: 'Farm Impact',
    description: 'Better grading consistency reduces waste and helps route fruit to the best-fit market.',
    icon: Sprout,
  },
]

const PIPELINE = [
  {
    id: 'Step 01',
    title: 'Capture & label',
    description: 'Teams upload fruit images with batch and quality context from field or packing line.',
  },
  {
    id: 'Step 02',
    title: 'Train & validate',
    description: 'YOLO-based models are refined with historical and newly contributed operation data.',
  },
  {
    id: 'Step 03',
    title: 'Deploy safely',
    description: 'Versioned models are released with confidence checks and regression validation.',
  },
  {
    id: 'Step 04',
    title: 'Measure outcomes',
    description: 'Accuracy, pass rates, and defect trends are tracked to guide the next model cycle.',
  },
]

function About() {
  return (
    <div className="pro-landing mk-page">
      <MarketingHeader />

      <main className="mk-main">
        <section className="mk-hero">
          <div className="container-pro mk-hero-grid">
            <div>
              <span className="mk-kicker">About our platform</span>
              <h1 className="mk-title">
                Practical AI for
                <span className="accent"> professional grading operations</span>
              </h1>
              <p className="mk-subtitle">
                TropiScan was designed for teams that need fast, consistent, and explainable quality outcomes.
                We combine computer vision and operation-focused UX so decisions are clear from intake to shipment.
              </p>
              <div className="mk-actions">
                <Link to="/how-it-works" className="lp-btn-primary">
                  See the workflow
                  <ArrowRight size={16} />
                </Link>
                <Link to="/features" className="lp-btn-secondary">
                  Explore features
                </Link>
              </div>
            </div>

            <aside className="mk-card">
              <div className="mk-card-head">
                <Layers size={16} />
                Platform focus
              </div>
              <h3>Built for daily use at scale</h3>
              <p>
                We focus on reliable grading, operator clarity, and measurable quality improvement across batches,
                not one-off demos.
              </p>
              <ul className="mk-feature-list" style={{ marginTop: '12px' }}>
                <li><CheckCircle2 size={16} /> Consistent A/B/C scoring framework</li>
                <li><CheckCircle2 size={16} /> Size and defect-informed value prediction</li>
                <li><CheckCircle2 size={16} /> Traceable records for continuous improvement</li>
              </ul>
              <div className="mk-metric-strip">
                <div className="mk-metric">
                  <span className="value">YOLOv8/11</span>
                  <span className="label">Detection backbone</span>
                </div>
                <div className="mk-metric">
                  <span className="value">Batch-first</span>
                  <span className="label">Workflow design</span>
                </div>
                <div className="mk-metric">
                  <span className="value">Explainable</span>
                  <span className="label">Scoring outputs</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="mk-section">
          <div className="container-pro">
            <div className="mk-section-head">
              <h2>What defines our approach</h2>
              <p>
                The platform is centered on clarity, reliability, and measurable operational value across the full
                grading lifecycle.
              </p>
            </div>
            <div className="mk-grid-4">
              {PILLARS.map(({ title, description, icon }) => (
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
            <div className="mk-section-head">
              <h2>Model lifecycle and governance</h2>
              <p>
                We run a structured loop that keeps model performance aligned with real farm and packhouse conditions.
              </p>
            </div>
            <div className="mk-timeline">
              <div className="mk-timeline-track">
                {PIPELINE.map((item) => (
                  <article key={item.id} className="mk-step">
                    <span className="mk-step-id">{item.id}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mk-section">
          <div className="container-pro">
            <div className="mk-cta">
              <div>
                <h3>Want to see the end-to-end process?</h3>
                <p>Review the complete flow from capture to grading, pricing, and reporting.</p>
              </div>
              <Link to="/how-it-works" className="lp-btn-primary">
                Open How It Works
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

export default About
