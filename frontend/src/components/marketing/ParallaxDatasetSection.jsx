import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './ParallaxDatasetSection.css'

function ActionButton({ action, primary }) {
  if (!action) return null
  const className = `dv-btn${primary ? ' dv-btn-primary' : ' dv-btn-secondary'}`
  if (action.to) {
    return (
      <Link to={action.to} className={className}>
        {action.label}
      </Link>
    )
  }
  return (
    <a href={action.href || '#'} className={className}>
      {action.label}
    </a>
  )
}

function ParallaxDatasetSection({
  sectionId = 'comp-mfd0xl6u',
  kicker,
  title,
  description,
  images = [],
  primaryAction,
  secondaryAction,
  height = 780,
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [parallaxOffset, setParallaxOffset] = useState(0)
  const sectionRef = useRef(null)

  const hasImages = images.length > 0
  const safeImages = useMemo(() => (hasImages ? images : []), [hasImages, images])

  useEffect(() => {
    if (safeImages.length <= 1) return undefined
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % safeImages.length)
    }, 5200)
    return () => window.clearInterval(timer)
  }, [safeImages.length])

  useEffect(() => {
    let rafId = 0
    const updateOffset = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight || 1
      const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height)
      const clamped = Math.max(0, Math.min(1, progress))
      const offset = (clamped - 0.5) * 82
      setParallaxOffset(offset)
    }

    const onScroll = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(() => {
        updateOffset()
        rafId = 0
      })
    }

    updateOffset()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id={sectionId}
      tabIndex="-1"
      className={`Oqnisf ${sectionId} wixui-section dv-parallax-section`}
      data-block-level-container="ClassicSection"
      style={{ '--motion-comp-height': `${height}px` }}
    >
      <div
        id={`bgLayers_${sectionId}`}
        data-hook="bgLayers"
        data-motion-part={`BG_LAYER ${sectionId}`}
        className="MW5IWV"
      >
        <div data-testid="colorUnderlay" className="LWbAav Kv1aVt"></div>
        <div
          id={`bgMedia_${sectionId}`}
          data-motion-part={`BG_MEDIA ${sectionId}`}
          className="VgO9Yg"
          style={{ transform: `translate3d(0, ${parallaxOffset}px, 0)` }}
        >
          {safeImages.map((image, index) => (
            <div key={image.src} className={`dv-bg-media-frame${index === activeIndex ? ' is-active' : ''}`}>
              <img
                src={image.src}
                alt={image.label}
                className="dv-bg-image"
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
              />
            </div>
          ))}
        </div>
      </div>

      <div data-mesh-id={`${sectionId}inlineContent`} data-testid="inline-content" className="dv-inline-content">
        <div data-mesh-id={`${sectionId}inlineContent-gridContainer`} data-testid="mesh-container-content" className="dv-grid-container">
          <div className="dv-content-card">
            {kicker && <span className="dv-kicker">{kicker}</span>}
            {title && <h2 className="dv-title">{title}</h2>}
            {description && <p className="dv-description">{description}</p>}

            {(primaryAction || secondaryAction) && (
              <div className="dv-actions">
                <ActionButton action={primaryAction} primary />
                <ActionButton action={secondaryAction} />
              </div>
            )}

            {safeImages.length > 1 && (
              <div className="dv-dots" role="tablist" aria-label="Dataset image selector">
                {safeImages.map((image, index) => (
                  <button
                    key={`${image.src}-dot`}
                    type="button"
                    role="tab"
                    aria-selected={index === activeIndex}
                    aria-label={`Show image ${index + 1}`}
                    className={`dv-dot${index === activeIndex ? ' active' : ''}`}
                    onClick={() => setActiveIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ParallaxDatasetSection
