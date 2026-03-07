import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { API_BASE_URL } from '../config/api'
import { BRAND_NAME } from '../config/brand'
import UserHeader from '../components/user/UserHeader'
import './Landing.css'

const WEB_SCAN_HISTORY_KEY = 'web_scan_history_v1'
const MAX_LOCAL_WEB_HISTORY = 36

const toPercent = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0%'
  return `${Math.max(0, Math.min(100, Math.round(n)))}%`
}

const toAreaPercent = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return '0%'
  return `${Math.round(n * 100)}%`
}

const toCurrency = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 'PHP 0.00/kg'
  return `PHP ${n.toFixed(2)}/kg`
}

const parseUserMeta = () => {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return {}
    const user = JSON.parse(raw)
    return {
      userId: String(user?._id || user?.id || user?.userId || '').trim() || undefined,
      userName: String(user?.name || user?.fullName || user?.username || '').trim() || undefined,
      userEmail: String(user?.email || '').trim().toLowerCase() || undefined,
    }
  } catch {
    return {}
  }
}

const createCompressedDataUrl = (file, maxSide = 900, quality = 0.76) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const width = Number(image.width || 0)
        const height = Number(image.height || 0)
        const largest = Math.max(width, height, 1)
        const scale = largest > maxSide ? maxSide / largest : 1
        const targetWidth = Math.max(1, Math.round(width * scale))
        const targetHeight = Math.max(1, Math.round(height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve('')
          return
        }
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      image.onerror = () => reject(new Error('Failed to load image preview'))
      image.src = String(reader.result || '')
    }
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  })

const appendWebScanHistory = async ({ file, result, userMeta, localScanId, imageUrl }) => {
  try {
    if (!file) return

    const previewUrl = imageUrl || (await createCompressedDataUrl(file).catch(() => ''))
    const entry = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      localScanId,
      source: 'web_app',
      timestamp: new Date().toISOString(),
      userId: userMeta?.userId,
      operatorEmail: userMeta?.userEmail,
      operatorName: userMeta?.userName,
      grade: String(result?.grade || 'N/A').toUpperCase(),
      details: result?.notes || result?.shelf_life_label || 'AI web analysis',
      fruitType: result?.fruit_type || result?.fruitType || 'Dragon Fruit',
      imageUrl: previewUrl,
      estimated_price_per_kg: Number(result?.estimated_price_per_kg || 0) || 0,
      fruit_area_ratio: Number(result?.fruit_area_ratio || 0) || 0,
      size_category: result?.size_category || 'N/A',
      market_value_label: result?.market_value_label || 'N/A',
      weight_grams_est: Number(result?.weight_grams_est || 0) || 0,
      ripeness_score: Number(result?.ripeness_score || 0) || 0,
      quality_score: Number(result?.quality_score || 0) || 0,
      shelf_life_label: result?.shelf_life_label || 'No result',
    }

    const rawHistory = localStorage.getItem(WEB_SCAN_HISTORY_KEY)
    const parsed = rawHistory ? JSON.parse(rawHistory) : []
    const history = Array.isArray(parsed) ? parsed : []
    const withoutDuplicate = history.filter((item) => String(item?.localScanId || '') !== String(localScanId))
    const next = [entry, ...withoutDuplicate].slice(0, MAX_LOCAL_WEB_HISTORY)
    localStorage.setItem(WEB_SCAN_HISTORY_KEY, JSON.stringify(next))
  } catch {
    // Keep analysis successful even if local history sync fails.
  }
}

function AiAnalysis() {
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [file, setFile] = useState(null)
  const [batchId, setBatchId] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)

  const previewUrl = useMemo(() => {
    if (!file) return ''
    return URL.createObjectURL(file)
  }, [file])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])
  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)
      if (batchId.trim()) formData.append('batch_id', batchId.trim())
      formData.append('client', 'web')
      formData.append('source', 'web_app')

      const res = await fetch(`${API_BASE_URL}/api/scan/analyze`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.message || data?.detail || 'Analysis failed')
      }

      const scanTimestamp = new Date().toISOString()
      const localScanId = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const userMeta = parseUserMeta()
      const previewImageUrl = await createCompressedDataUrl(file, 640, 0.72).catch(() => '')
      setAnalysisResult(data)
      localStorage.setItem(
        'latest_web_scan_result',
        JSON.stringify({
          ...data,
          createdAt: scanTimestamp,
          localScanId,
          imageUrl: previewImageUrl,
        })
      )

      void appendWebScanHistory({
        file,
        result: data,
        userMeta,
        localScanId,
        imageUrl: previewImageUrl,
      })

      try {
        await fetch(`${API_BASE_URL}/api/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grade: String(data?.grade || 'UNKNOWN').toUpperCase(),
            details: data?.notes || data?.shelf_life_label || 'AI web analysis',
            imageUrl: previewImageUrl || '',
            timestamp: scanTimestamp,
            userId: userMeta?.userId,
            operatorName: userMeta?.userName,
            operatorEmail: userMeta?.userEmail,
            fruitType: data?.fruit_type || data?.fruitType || 'Dragon Fruit',
            localScanId,
            source: 'web_app',
            estimated_price_per_kg: Number(data?.estimated_price_per_kg || 0) || 0,
            fruit_area_ratio: Number(data?.fruit_area_ratio || 0) || 0,
            size_category: data?.size_category || 'N/A',
            market_value_label: data?.market_value_label || 'N/A',
            weight_grams_est: Number(data?.weight_grams_est || 0) || 0,
            ripeness_score: Number(data?.ripeness_score || 0) || 0,
            quality_score: Number(data?.quality_score || 0) || 0,
            shelf_life_label: data?.shelf_life_label || 'No result',
          }),
        })
      } catch {
        // Keep analysis success even if scan record sync fails.
      }
      toast.success('Analysis complete')
    } catch (err) {
      toast.error(err.message || 'Analysis failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="app-shell" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fdf4f9 0%, #f3f7ff 60%, #eefbf7 100%)' }}>
      <UserHeader />

      <main>
        <section className="lp-section" style={{ paddingTop: '24px' }}>
          <div className="container-pro">
            <div
              id="ai-analyze-workspace"
              style={{
                borderRadius: '24px',
                border: '1px solid rgba(16, 25, 39, 0.08)',
                background: 'linear-gradient(135deg, #ffffff 0%, #fff6fb 45%, #f5fbff 100%)',
                boxShadow: '0 20px 50px rgba(15, 23, 42, 0.12)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '34px 34px 16px',
                  borderBottom: '1px solid rgba(16, 25, 39, 0.06)',
                  background: 'linear-gradient(120deg, rgba(216, 27, 96, 0.08), rgba(59, 130, 246, 0.08))',
                }}
              >
                <div style={{ fontSize: '0.82rem', letterSpacing: '0.08em', fontWeight: 700, color: '#9f1239', textTransform: 'uppercase' }}>
                  AI Quality Lab
                </div>
                <h1 style={{ margin: '10px 0 8px', fontSize: '2rem', lineHeight: 1.2, color: '#0f172a' }}>
                  Professional Dragonfruit Analysis
                </h1>
                <p style={{ margin: 0, color: '#475569', maxWidth: '860px' }}>
                  Upload one clear image and the model will return grading, quality score, area coverage, estimated price, and recommendation.
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065f46', background: '#d1fae5', borderRadius: '999px', padding: '4px 10px' }}>YOLO Enabled</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#075985', background: '#e0f2fe', borderRadius: '999px', padding: '4px 10px' }}>Web + Mobile Aligned</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7c2d12', background: '#ffedd5', borderRadius: '999px', padding: '4px 10px' }}>Scan Sync Active</span>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(320px, 1fr) minmax(300px, 0.92fr)',
                  gap: '20px',
                  padding: '24px',
                }}
              >
                <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>Upload Image</div>
                  <label
                    style={{
                      border: '2px dashed rgba(148, 163, 184, 0.45)',
                      borderRadius: '16px',
                      background: '#ffffff',
                      minHeight: '210px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', maxHeight: '300px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#64748b' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '6px' }}>Upload</div>
                        <div style={{ fontWeight: 600 }}>Click to choose dragonfruit image</div>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const selected = e.target.files?.[0]
                        setFile(selected || null)
                        setFileName(selected?.name || '')
                      }}
                    />
                  </label>

                  {fileName ? (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        border: '1px solid rgba(148, 163, 184, 0.35)',
                        borderRadius: '10px',
                        padding: '8px 10px',
                        color: '#334155',
                        fontSize: '0.9rem',
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null)
                          setFileName('')
                        }}
                        style={{ border: 'none', background: 'transparent', color: '#b91c1c', cursor: 'pointer', fontWeight: 700 }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}

                  <input
                    type="text"
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    placeholder="Batch ID (optional)"
                    style={{
                      border: '1px solid rgba(148, 163, 184, 0.4)',
                      borderRadius: '10px',
                      padding: '12px',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />

                  <button
                    type="submit"
                    disabled={!file || uploading}
                    style={{
                      marginTop: '4px',
                      border: 'none',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #D81B60, #B8105B)',
                      color: '#fff',
                      padding: '12px 16px',
                      fontWeight: 700,
                      fontSize: '0.96rem',
                      cursor: !file || uploading ? 'not-allowed' : 'pointer',
                      opacity: !file || uploading ? 0.65 : 1,
                    }}
                  >
                    {uploading ? 'Analyzing image...' : 'Run AI Analysis'}
                  </button>
                </form>

                <div
                  style={{
                    border: '1px solid rgba(16, 25, 39, 0.08)',
                    borderRadius: '16px',
                    background: '#ffffff',
                    padding: '16px',
                    minHeight: '390px',
                  }}
                >
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>Analysis Result</div>

                  {!analysisResult ? (
                    <div
                      style={{
                        border: '1px dashed rgba(148, 163, 184, 0.45)',
                        borderRadius: '12px',
                        minHeight: '310px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        color: '#64748b',
                        padding: '20px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: '6px' }}>No analysis yet</div>
                        <div>Upload a fruit image to view model output.</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: '1px solid rgba(216, 27, 96, 0.18)',
                          background: 'rgba(253, 242, 248, 0.9)',
                          borderRadius: '12px',
                          padding: '12px',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#9f1239', fontWeight: 700 }}>Predicted Grade</div>
                          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: '#be185d', lineHeight: 1 }}>
                            {String(analysisResult?.grade || 'N/A').toUpperCase()}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 700 }}>Estimated Price</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f766e' }}>
                            {toCurrency(analysisResult?.estimated_price_per_kg)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid rgba(148, 163, 184, 0.22)' }}>
                          <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>Ripeness Score</div>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{toPercent(analysisResult?.ripeness_score)}</div>
                        </div>
                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid rgba(148, 163, 184, 0.22)' }}>
                          <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>Quality Score</div>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{toPercent(analysisResult?.quality_score)}</div>
                        </div>
                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid rgba(148, 163, 184, 0.22)' }}>
                          <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>Detected Area</div>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{toAreaPercent(analysisResult?.fruit_area_ratio)}</div>
                        </div>
                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', border: '1px solid rgba(148, 163, 184, 0.22)' }}>
                          <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>Size Category</div>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{analysisResult?.size_category || 'N/A'}</div>
                        </div>
                      </div>

                      <div style={{ border: '1px solid rgba(148, 163, 184, 0.22)', borderRadius: '10px', padding: '10px', background: '#fff' }}>
                        <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>Fruit Type</div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{analysisResult?.fruit_type || 'Unknown'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px' }}>
                          {analysisResult?.notes || analysisResult?.shelf_life_label || 'No additional notes.'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer
        style={{
          background: 'linear-gradient(135deg, #D81B60, #B8105B)',
          padding: '30px 0',
          marginTop: '34px',
        }}
      >
        <div className="container-pro" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.92)' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '8px' }}>{BRAND_NAME}</div>
          <div style={{ fontSize: '0.9rem' }}>Professional AI-based dragonfruit quality analysis</div>
        </div>
      </footer>
    </div>
  )
}

export default AiAnalysis

