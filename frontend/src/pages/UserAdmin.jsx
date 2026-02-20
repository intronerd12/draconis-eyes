import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BRAND_NAME } from '../config/brand'
import './Landing.css'

function UserAdmin() {
  const navigate = useNavigate()
  const [historySummary, setHistorySummary] = useState({
    total: 0,
    average_quality: null,
    pass_rate: null,
    ripeness_distribution: { under: 0, ideal: 0, over: 0 },
    grade_distribution: { A: 0, B: 0, C: 0 },
    defect_level_distribution: { low: 0, medium: 0, high: 0 },
  })
  const [correctionGrade, setCorrectionGrade] = useState('')
  const [reportFrom, setReportFrom] = useState('')
  const [reportTo, setReportTo] = useState('')
  const [adminReport, setAdminReport] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)

  const handleLogout = () => {
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
    navigate('/')
  }

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('http://localhost:8000/history')
        if (!res.ok) return
        const data = await res.json()
        setHistorySummary({
          total: data.total ?? 0,
          average_quality: data.average_quality ?? null,
          pass_rate: data.pass_rate ?? 0,
          ripeness_distribution: data.ripeness_distribution ?? { under: 0, ideal: 0, over: 0 },
          grade_distribution: data.grade_distribution ?? { A: 0, B: 0, C: 0 },
          defect_level_distribution: data.defect_level_distribution ?? { low: 0, medium: 0, high: 0 },
        })
      } catch (err) {
        console.error('Failed to fetch history:', err)
      }
    }
    fetchHistory()
  }, [])

  const handleSubmitCorrection = async () => {
    if (!analysisResult || !correctionGrade) return
    try {
      const res = await fetch('http://localhost:8000/admin/label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: analysisResult.id,
          correct_grade: correctionGrade,
        }),
      })
      if (!res.ok) return
      toast.success('Grade correction submitted!')
      setCorrectionGrade('')
    } catch (err) {
      toast.error('Failed to submit correction')
    }
  }

  const handleGenerateReport = async () => {
    const params = new URLSearchParams()
    if (reportFrom) params.append('from_date', reportFrom)
    if (reportTo) params.append('to_date', reportTo)
    try {
      const res = await fetch(
        `http://localhost:8000/reports/summary${params.toString() ? `?${params.toString()}` : ''}`
      )
      if (!res.ok) return
      const data = await res.json()
      setAdminReport(data)
      toast.success('Report generated!')
    } catch (err) {
      toast.error('Failed to generate report')
    }
  }

  return (
    <div className="app-shell" style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #fff6fb 0%, #fff0f6 12%, #f3fbf8 46%, #eef8ff 100%)'
    }}>
      <header style={{
        backdropFilter: 'blur(14px)',
        background: 'rgba(255, 255, 255, 0.88)',
        borderBottom: '1px solid rgba(16, 25, 39, 0.08)',
        padding: '16px 0',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div className="container-pro" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '32px'
        }}>
          <a href="/home" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>🌴 {BRAND_NAME}</div>
          </a>
          <nav style={{ display: 'flex', gap: '32px', flex: 1, alignItems: 'center' }}>
            {[
              { path: '/overview', label: 'Overview', icon: '🏠' },
              { path: '/user-features', label: 'Features', icon: '✨' },
              { path: '/ai-analysis', label: 'AI Analysis', icon: '🧪' },
              { path: '/marketplace', label: 'Marketplace', icon: '🛒' },
              { path: '/user-admin', label: 'Admin', icon: '⚙️' }
            ].map(item => {
              const isActive = window.location.pathname === item.path
              return (
                <a key={item.path} href={item.path} style={{
                  textDecoration: 'none',
                  color: isActive ? '#D81B60' : '#6b7280',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.95rem',
                  paddingBottom: '4px',
                  borderBottom: isActive ? '2px solid #D81B60' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>{item.icon}</span>
                  {item.label}
                </a>
              )
            })}
          </nav>
          <a href="/home" style={{
            padding: '8px 16px',
            background: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500',
            textDecoration: 'none',
            color: '#000',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}>← Dashboard</a>
        </div>
      </header>

      <main>
        <section className="lp-hero page-hero-pro" style={{
          background: 'linear-gradient(135deg, #D81B60, #E85D93)',
          padding: '76px 0 22px',
          color: '#fff'
        }}>
          <div className="container-pro lp-hero-grid">
            <div className="lp-hero-copy">
              <span className="lp-kicker" style={{
                color: 'rgba(255, 255, 255, 0.95)',
                background: 'rgba(255, 255, 255, 0.2)',
                borderColor: 'rgba(255, 255, 255, 0.3)'
              }}>Admin Panel & Analytics</span>
              <h1 className="lp-title" style={{ color: '#fff' }}>
                System Management &amp;
                <span style={{ color: 'rgba(255, 255, 255, 0.95)' }}> Analytics Tools</span>
              </h1>
              <p className="lp-subtitle" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                Monitor system performance, manage quality corrections, track distributions, and generate detailed reports. Get full visibility into your operation's grading and performance metrics.
              </p>
            </div>
            <div className="lp-hero-image">
              <div style={{
                fontSize: '100px',
                textAlign: 'center',
                lineHeight: '1',
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))'
              }}>⚙️</div>
            </div>
          </div>
        </section>

        <section className="admin lp-section" id="admin" style={{
          background: 'linear-gradient(180deg, #fff6fb 0%, #fff0f6 12%, #f3fbf8 46%, #eef8ff 100%)'
        }}>
          <div className="container-pro">
            <h2 className="section-title">Admin & Analytics</h2>
            <div className="admin-grid">
              <div className="admin-card">
                <h3>Distributions</h3>
                <div className="admin-distributions">
                  <div className="admin-distribution">
                    <div className="admin-distribution-title">Grades</div>
                    <div className="admin-distribution-row">
                      <span>A</span>
                      <span>{historySummary.grade_distribution.A}</span>
                    </div>
                    <div className="admin-distribution-row">
                      <span>B</span>
                      <span>{historySummary.grade_distribution.B}</span>
                    </div>
                    <div className="admin-distribution-row">
                      <span>C</span>
                      <span>{historySummary.grade_distribution.C}</span>
                    </div>
                  </div>
                  <div className="admin-distribution">
                    <div className="admin-distribution-title">Ripeness</div>
                    <div className="admin-distribution-row">
                      <span>Under-ripe</span>
                      <span>{historySummary.ripeness_distribution.under}</span>
                    </div>
                    <div className="admin-distribution-row">
                      <span>Ideal</span>
                      <span>{historySummary.ripeness_distribution.ideal}</span>
                    </div>
                    <div className="admin-distribution-row">
                      <span>Over-ripe</span>
                      <span>{historySummary.ripeness_distribution.over}</span>
                    </div>
                  </div>
                  <div className="admin-distribution">
                    <div className="admin-distribution-title">Defect level</div>
                    <div className="admin-distribution-row">
                      <span>Low</span>
                      <span>{historySummary.defect_level_distribution.low}</span>
                    </div>
                    <div className="admin-distribution-row">
                      <span>Medium</span>
                      <span>{historySummary.defect_level_distribution.medium}</span>
                    </div>
                    <div className="admin-distribution-row">
                      <span>High</span>
                      <span>{historySummary.defect_level_distribution.high}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <h3>Label corrections</h3>
                <p className="admin-text">Bind feedback to the latest scan and store it for retraining.</p>
                <div className="admin-field-group">
                  <label className="admin-label">Correct grade for latest scan</label>
                  <select
                    value={correctionGrade}
                    onChange={(e) => setCorrectionGrade(e.target.value)}
                    className="admin-select"
                  >
                    <option value="">Select grade</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
                <button
                  type="button"
                  className="btn-primary admin-button"
                  onClick={handleSubmitCorrection}
                  disabled={!analysisResult || !correctionGrade}
                >
                  Mark grade as incorrect
                </button>
              </div>

              <div className="admin-card">
                <h3>Generate report</h3>
                <p className="admin-text">Request a summary report for a specific date window.</p>
                <div className="admin-field-group">
                  <label className="admin-label">From</label>
                  <input
                    type="date"
                    value={reportFrom}
                    onChange={(e) => setReportFrom(e.target.value)}
                    className="admin-input"
                  />
                </div>
                <div className="admin-field-group">
                  <label className="admin-label">To</label>
                  <input
                    type="date"
                    value={reportTo}
                    onChange={(e) => setReportTo(e.target.value)}
                    className="admin-input"
                  />
                </div>
                <button
                  type="button"
                  className="btn-secondary admin-button"
                  onClick={handleGenerateReport}
                >
                  Generate report
                </button>
                {adminReport && (
                  <div className="admin-report">
                    <div className="admin-report-row">
                      <span>Total scans</span>
                      <span>{adminReport.total}</span>
                    </div>
                    <div className="admin-report-row">
                      <span>Average quality</span>
                      <span>
                        {adminReport.average_quality != null
                          ? `${adminReport.average_quality.toFixed(1)}%`
                          : '—'}
                      </span>
                    </div>
                    <div className="admin-report-row">
                      <span>Pass rate</span>
                      <span>
                        {adminReport.pass_rate != null
                          ? `${adminReport.pass_rate.toFixed(1)}%`
                          : '—'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer style={{
        background: 'linear-gradient(135deg, #D81B60, #B8105B)',
        padding: '32px 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'rgba(255, 255, 255, 0.9)'
      }}>
        <div className="container-pro">© {new Date().getFullYear()} {BRAND_NAME}</div>
      </footer>
    </div>
  )
}

export default UserAdmin
