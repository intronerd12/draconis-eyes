import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BRAND_NAME } from '../config/brand'
import './Landing.css'

function AiAnalysis() {
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [file, setFile] = useState(null)
  const [batchId, setBatchId] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)

  const handleLogout = () => {
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
    navigate('/')
  }

  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (batchId.trim()) formData.append('batch_id', batchId.trim())

      const res = await fetch('http://localhost:8000/detect', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setAnalysisResult(data)
      toast.success('Analysis complete!')
    } catch (err) {
      toast.error(err.message || 'Analysis failed')
    } finally {
      setUploading(false)
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
        <section className="analyze lp-section lp-section-alt" id="analyze">
          <div className="container-pro">
            <div className="analyze-card">
              <div className="analyze-bg-blur" />
              <div className="analyze-content">
                <div className="analyze-left">
                  <h2>Upload a fruit image for analysis 🧪</h2>
                  <p>Use a high-quality image and let the system estimate ripeness and grade within seconds.</p>
                  <div className="upload-form">
                    <form onSubmit={handleAnalyze}>
                      <label className="upload-zone">
                        <div className="upload-icon">📸</div>
                        <span className="upload-text">Click to upload image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            setFileName(f?.name ?? '')
                            setFile(f)
                          }}
                        />
                      </label>
                      {fileName && (
                        <div className="upload-filename">
                          <span>{fileName}</span>
                          <button type="button" onClick={() => setFileName('')}>✕</button>
                        </div>
                      )}
                      <input
                        type="text"
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        placeholder="Batch ID (optional)"
                        className="batch-input"
                      />
                      <button type="submit" disabled={!fileName || uploading} className="btn-primary analyze-button">
                        {uploading ? 'Analyzing...' : 'Analyze Now'}
                      </button>
                    </form>
                  </div>
                </div>

                {analysisResult && (
                  <div className="analyze-right">
                    <div className="result-card">
                      <div className="result-header">
                        <div className="result-avatar">🐲</div>
                        <div className="result-info">
                          <div className="result-title">Latest Analysis</div>
                          <div className="result-id">ID: {analysisResult?.id?.slice(0, 8) || '#8392-A'}</div>
                        </div>
                      </div>
                      <div className="result-metrics">
                        <div className="metric">
                          <div className="metric-header">
                            <span className="metric-label">Ripeness score</span>
                            <span className="metric-value">{Math.round(analysisResult.ripeness_score)}%</span>
                          </div>
                        </div>
                        <div className="metric">
                          <div className="metric-header">
                            <span className="metric-label">Quality score</span>
                            <span className="metric-value">{Math.round(analysisResult.quality_score)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="result-footer">
                        <div className="result-stat">
                          <div className="result-stat-value">{analysisResult.grade}</div>
                          <div className="result-stat-label">Quality grade</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* NEW FOOTER */}
      <footer style={{
        background: 'linear-gradient(135deg, #D81B60, #B8105B)',
        padding: '32px 0',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: '48px'
      }}>
        <div className="container-pro" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '12px', color: '#fff' }}>🌴 {BRAND_NAME}</div>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', margin: '0 0 12px 0' }}>Intelligent Dragon Fruit Detection & Quality Control</p>
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>© {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}

export default AiAnalysis
