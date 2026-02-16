import { useState, useEffect } from 'react'

function SystemStatus() {
  const [status, setStatus] = useState({
    mongodb: 'checking...',
    cloudinary: 'checking...',
    ai_service: 'checking...'
  })

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('http://localhost:5000/status')
        if (res.ok) {
          const data = await res.json()
          setStatus(data)
        } else {
          setStatus({
            mongodb: 'error',
            cloudinary: 'error',
            ai_service: 'error'
          })
        }
      } catch (err) { // eslint-disable-line no-unused-vars
        setStatus({
          mongodb: 'offline',
          cloudinary: 'offline',
          ai_service: 'offline'
        })
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 10000) // Check every 10s
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (s) => {
    if (!s || typeof s !== 'string') return '#ef4444' // Red for undefined
    if (s.includes('connected') || s === 'healthy') return '#10b981' // Green
    if (s === 'checking...') return '#f59e0b' // Yellow
    return '#ef4444' // Red
  }

  const getStatusIcon = (s) => {
    if (!s || typeof s !== 'string') return '✕' // Error icon for undefined
    if (s.includes('connected') || s === 'healthy') return '●'
    if (s === 'checking...') return '○'
    return '✕'
  }

  return (
    <div className="system-status-card">
      <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--gray-700)' }}>System Health</h3>
      <div className="status-item">
        <span className="status-name">Database (MongoDB)</span>
        <span className="status-indicator" style={{ color: getStatusColor(status.mongodb) }}>
          {getStatusIcon(status.mongodb)} {status.mongodb}
        </span>
      </div>
      <div className="status-item">
        <span className="status-name">Storage (Cloudinary)</span>
        <span className="status-indicator" style={{ color: getStatusColor(status.cloudinary) }}>
          {getStatusIcon(status.cloudinary)} {status.cloudinary}
        </span>
      </div>
      <div className="status-item">
        <span className="status-name">AI Engine (Python)</span>
        <span className="status-indicator" style={{ color: getStatusColor(status.ai_service) }}>
          {getStatusIcon(status.ai_service)} {status.ai_service}
        </span>
      </div>
    </div>
  )
}

export default SystemStatus
