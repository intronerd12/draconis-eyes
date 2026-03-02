import { createElement, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Crown, Gauge, Layers, ShieldCheck, Sprout, TrendingUp } from 'lucide-react'
import MarketingFooter from '../components/marketing/MarketingFooter'
import MarketingHeader from '../components/marketing/MarketingHeader'
import ParallaxDatasetSection from '../components/marketing/ParallaxDatasetSection'
import { getRandomWallpaperSet } from '../config/wallpaperDragon'
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

const TEAM_MEMBERS = [
  {
   name: 'Adora, Joenabelle',
    role: 'Member',
    description: 'Supports dataset preparation and quality checks to keep training inputs consistent and reliable.',
    imgSrc: '/About%20us/adora,%20joanabel.jpg',
    fbLink: 'https://www.facebook.com/aeri.elle.0#',
  },
  {
    name: 'Bumatay, Axel Jillian',
    role: 'Leader',
    description: 'Leads project direction, coordinates delivery priorities, and aligns technical work across the group.',
    isLeader: true,
    imgSrc: '/About%20us/axel%20bumatay.jpg',
    fbLink: 'https://www.facebook.com/axeljilian.bumatay.5#',
  },
  {
    name: 'Danque, John Michael',
    role: 'Member',
    description: 'Contributes to model workflow execution and helps validate behavior across key grading scenarios.',
    imgSrc: '/About%20us/john%20michael%20danque.jpg',
    fbLink: 'https://www.facebook.com/john.michael.danque.2024',
  },
  {
    name: 'Landas, Davimher',
    role: 'Member',
    description: 'Supports implementation and testing to maintain a dependable and professional user experience.',
    imgSrc: '/About%20us/landas,%20davimher.jpg',
    fbLink: 'https://www.facebook.com/davimher.landas#',
  },
]

const MARKETING_BOX_BACKGROUNDS = [
  '/landing/slider/slide-01.jpg',
  '/landing/slider/slide-02.jpg',
  '/landing/slider/slide-03.jpg',
  '/landing/slider/slide-04.jpg',
  '/landing/slider/slide-05.jpg',
  '/landing/slider/slide-06.jpg',
]

function TeamPhoto({ src, alt, className }) {
  const candidates = useMemo(() => {
    const decoded = decodeURI(src)
    const encodeComma = (s) => s.replace(/,/g, '%2C')
    const withSpaces = decoded.replace(/%20/g, ' ')
    const withEncodedSpaces = src.replace(/ /g, '%20')
    return [
      withEncodedSpaces,
      encodeComma(withEncodedSpaces),
      withSpaces,
      encodeComma(withSpaces),
    ]
  }, [src])
  const [idx, setIdx] = useState(0)
  const handleError = () => {
    if (idx < candidates.length - 1) setIdx(idx + 1)
  }
  return (
    <img
      src={candidates[idx]}
      alt={alt}
      className={className}
      loading="lazy"
      onError={handleError}
    />
  )
}

function About() {
  const wallpapers = useMemo(() => getRandomWallpaperSet(6), [])
  const [selectedMember, setSelectedMember] = useState(null)

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

        <section
          className="mk-section df-parallax-surface df-parallax-light"
          style={{ '--df-bg-image': `url(${wallpapers[1].src})` }}
        >
          <div className="container-pro">
            <div className="mk-section-head">
              <h2>What defines our approach</h2>
              <p>
                The platform is centered on clarity, reliability, and measurable operational value across the full
                grading lifecycle.
              </p>
            </div>
            <div className="mk-grid-4">
              {PILLARS.map(({ title, description, icon }, index) => (
                <article
                  key={title}
                  className="mk-info-card"
                  style={{ '--mk-box-bg-image': `url(${MARKETING_BOX_BACKGROUNDS[index % MARKETING_BOX_BACKGROUNDS.length]})` }}
                >
                  <div className="mk-box-bg" aria-hidden="true" />
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
              <h2>Model lifecycle and governance</h2>
              <p>
                We run a structured loop that keeps model performance aligned with real farm and packhouse conditions.
              </p>
            </div>
            <div className="mk-timeline">
              <div className="mk-timeline-track">
                {PIPELINE.map((item, index) => (
                  <article
                    key={item.id}
                    className="mk-step"
                    style={{ '--mk-box-bg-image': `url(${MARKETING_BOX_BACKGROUNDS[(index + 2) % MARKETING_BOX_BACKGROUNDS.length]})` }}
                  >
                    <div className="mk-box-bg" aria-hidden="true" />
                    <span className="mk-step-id">{item.id}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          className="mk-section mk-team-section df-parallax-surface df-parallax-light"
          style={{ '--df-bg-image': `url(${wallpapers[3].src})` }}
        >
          <div className="container-pro">
            <div className="mk-section-head">
              <h2>Our Team</h2>
              <p>
                A focused group building practical AI tools for real-world dragon fruit grading workflows.
              </p>
            </div>
            <div className="mk-team-grid">
              {TEAM_MEMBERS.map((member) => (
                <article
                  key={member.name}
                  className={`mk-team-card${member.isLeader ? ' is-leader' : ''}`}
                  onClick={() => setSelectedMember(member)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedMember(member) }}
                >
                  <TeamPhoto src={member.imgSrc} alt={member.name} className="mk-team-photo" />
                  <div className="mk-team-top">
                    <span className="mk-team-role">{member.role}</span>
                    {member.isLeader && (
                      <span className="mk-leader-badge">
                        <Crown size={14} />
                        Group Leader
                      </span>
                    )}
                  </div>
                  <h3>{member.name}</h3>
                  <p>{member.description}</p>
                </article>
              ))}
            </div>
            {selectedMember && (
              <div className="mk-modal-backdrop" onClick={() => setSelectedMember(null)}>
                <div className="mk-modal" onClick={(e) => e.stopPropagation()}>
                  <TeamPhoto src={selectedMember.imgSrc} alt={selectedMember.name} className="mk-modal-photo" />
                  <h3 className="mk-modal-title">{selectedMember.name}</h3>
                  <p className="mk-modal-desc">{selectedMember.description}</p>
                  <div className="mk-modal-actions">
                    <a href={selectedMember.fbLink} target="_blank" rel="noreferrer" className="lp-btn-primary">Open Facebook</a>
                    <button type="button" className="lp-btn-secondary" onClick={() => setSelectedMember(null)}>Close</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <ParallaxDatasetSection
          sectionId="comp-about-vignan-parallax"
          kicker="Wallpaper Dragon Collection"
          title="Randomized Dragon Fruit Image Wall"
          description="A large visual section that rotates through Wallpaper Dragon images with smooth parallax movement while scrolling."
          images={wallpapers}
          primaryAction={{ label: 'Explore Features', to: '/features' }}
          secondaryAction={{ label: 'See How It Works', to: '/how-it-works' }}
          height={730}
        />

        <section
          className="mk-section df-parallax-surface df-parallax-dark"
          style={{ '--df-bg-image': `url(${wallpapers[4].src})` }}
        >
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
