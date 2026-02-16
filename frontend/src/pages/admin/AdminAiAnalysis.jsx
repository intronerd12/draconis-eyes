import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, BarChart3, TrendingUp, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

function AdminAiAnalysis() {
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [batchId, setBatchId] = useState('')
  const [recentAnalyses, setRecentAnalyses] = useState([])
  const [historySummary, setHistorySummary] = useState({
    total: 0,
    average_quality: null,
    pass_rate: null,
    grade_distribution: { A: 0, B: 0, C: 0 },
  })

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('http://localhost:8000/history', { signal: AbortSignal.timeout(3000) })
        if (!res.ok) return
        const data = await res.json()
        setRecentAnalyses(data.items ?? [])
        setHistorySummary({
          total: data.total ?? 0,
          average_quality: data.average_quality ?? null,
          pass_rate: data.pass_rate ?? null,
          grade_distribution: data.grade_distribution ?? { A: 0, B: 0, C: 0 },
        })
      } catch (err) {
        console.debug('AI service unavailable:', err.message)
      }
    }
    fetchHistory()
  }, [])

  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!file) {
      toast.error('Please select an image')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (batchId.trim()) {
        formData.append('batch_id', batchId.trim())
      }

      const res = await fetch('http://localhost:8000/detect', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Analysis failed')

      const data = await res.json()
      setAnalysisResult(data)
      setRecentAnalyses((prev) => {
        const next = [data, ...prev]
        return next.slice(0, 10)
      })
      toast.success('Analysis completed')
    } catch (err) {
      console.error(err)
      toast.error('Analysis failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header with Back Button */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 32px' }}>
        <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>
      </div>

      <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
          AI Analysis Engine
        </h1>
        <p style={{ fontSize: '15px', color: '#6b7280' }}>
          Upload fruit images for real-time quality assessment and grading analysis.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Upload Section */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={20} /> Upload Image
          </h2>

          <form onSubmit={handleAnalyze}>
            <label style={{
              display: 'block',
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: '#f9fafb'
            }} onDragOver={(e) => {
              e.preventDefault()
              e.currentTarget.style.backgroundColor = '#f0fdf4'
              e.currentTarget.style.borderColor = '#10b981'
            }} onDragLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb'
              e.currentTarget.style.borderColor = '#d1d5db'
            }} onDrop={(e) => {
              e.preventDefault()
              const files = e.dataTransfer.files
              if (files[0]) {
                setFile(files[0])
                setFileName(files[0].name)
              }
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                Click or drag image here
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>PNG, JPG up to 10MB</div>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    setFile(f)
                    setFileName(f.name)
                  }
                }}
              />
            </label>

            {fileName && (
              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#065f46' }}>✓ {fileName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    setFileName('')
                  }}
                  style={{ background: 'none', border: 'none', color: '#065f46', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              </div>
            )}

            <input
              type="text"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="Batch ID (optional)"
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />

            <button
              type="submit"
              disabled={!fileName || uploading}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '12px',
                backgroundColor: uploading ? '#d1d5db' : '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {uploading ? 'Analyzing...' : 'Analyze Image'}
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} /> Latest Analysis
          </h2>

          {analysisResult ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Grade</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{analysisResult.grade}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Size Category</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                    {analysisResult.size_category || analysisResult.size_classification || 'Medium'}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Ripeness Score</div>
                <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${analysisResult.ripeness_score}%`,
                    backgroundColor: '#f59e0b',
                    height: '100%',
                    transition: 'width 0.3s'
                  }} />
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {Math.round(analysisResult.ripeness_score)}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Quality Score</div>
                <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${analysisResult.quality_score}%`,
                    backgroundColor: '#10b981',
                    height: '100%',
                    transition: 'width 0.3s'
                  }} />
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {Math.round(analysisResult.quality_score)}%
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
              <div style={{ fontSize: '14px' }}>No analysis yet. Upload an image to see results.</div>
            </div>
          )}
        </div>
      </div>

      {/* History Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>
            Total Analyzed
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>{historySummary.total}</div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>
            Average Quality
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
            {historySummary.average_quality != null ? `${historySummary.average_quality.toFixed(1)}%` : '—'}
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>
            Pass Rate
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
            {historySummary.pass_rate != null ? `${historySummary.pass_rate.toFixed(1)}%` : '—'}
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={20} /> Recent Analyses
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: '600' }}>Grade</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: '600' }}>Ripeness</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: '600' }}>Quality</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: '600' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAnalyses.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                    No analyses yet
                  </td>
                </tr>
              ) : (
                recentAnalyses.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#1f2937' }}>{item.grade}</td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{item.ripeness_level}</td>
                    <td style={{ padding: '12px', color: '#6b7280' }}>{Math.round(item.quality_score)}%</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: item.grade === 'C' ? '#fee2e2' : '#d1fae5',
                        color: item.grade === 'C' ? '#991b1b' : '#065f46'
                      }}>
                        {item.grade === 'C' ? 'Review' : 'Pass'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  )
}

export default AdminAiAnalysis
