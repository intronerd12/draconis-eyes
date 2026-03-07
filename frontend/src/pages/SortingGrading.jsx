import React, { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { API_BASE_URL } from '../config/api'
import UserHeader from '../components/user/UserHeader'
import './Landing.css'
import './SortingGrading.css'

const HISTORY_STORAGE_KEY = 'web_scan_history_v1'
const GRADE_FILTERS = ['All', 'A', 'B', 'C', 'N/A']
const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest' },
  { id: 'grade_desc', label: 'Best Grade' },
  { id: 'price_desc', label: 'Highest Price' },
]
const GRADE_RANK = { A: 5, B: 4, C: 3, D: 2, E: 1, 'N/A': 0 }

const toText = (value, fallback = '') => {
  const text = String(value ?? '').trim()
  return text || fallback
}

const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const normalizeGrade = (value) => {
  const grade = toText(value).toUpperCase()
  if (['A', 'B', 'C', 'D', 'E'].includes(grade)) return grade
  if (grade === 'UNKNOWN' || grade === 'NA' || grade === 'N/A' || !grade) return 'N/A'
  return grade
}

const formatPrice = (value) => {
  const n = toNumber(value, 0)
  return `PHP ${n.toFixed(2)}/kg`
}

const formatArea = (ratio) => {
  const n = toNumber(ratio, 0)
  if (n <= 0) return '0%'
  return `${Math.round(n * 100)}%`
}

const formatTimestamp = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString()
}

const parseUserMeta = () => {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return {}
    const user = JSON.parse(raw)
    return {
      userId: toText(user?._id || user?.id || user?.userId || user?.uid),
      userEmail: toText(user?.email).toLowerCase(),
      userName: toText(user?.name || user?.fullName || user?.username),
    }
  } catch {
    return {}
  }
}

const parseHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const isWebSource = (value) => toText(value).toLowerCase().includes('web')

const belongsToCurrentUser = (scan, userMeta, source = 'backend') => {
  const rowUserId = toText(scan?.user?._id || scan?.userId || scan?.user_id)
  const rowEmail = toText(scan?.operatorEmail || scan?.email).toLowerCase()
  const rowName = toText(scan?.operatorName || scan?.user?.name)

  if (userMeta.userId && rowUserId) return rowUserId === userMeta.userId
  if (userMeta.userEmail && rowEmail) return rowEmail === userMeta.userEmail
  if (userMeta.userName && rowName) return rowName === userMeta.userName

  return source === 'local'
}

const normalizeScanRow = (scan, idx) => ({
  id: toText(scan?.id || scan?._id || scan?.localScanId || `web-scan-${idx}`),
  localScanId: toText(scan?.localScanId || scan?._id || scan?.id),
  grade: normalizeGrade(scan?.grade),
  details: toText(scan?.details || scan?.notes || scan?.shelf_life_label || scan?.shelfLifeLabel, 'No notes provided.'),
  fruitType: toText(scan?.fruitType || scan?.fruit_type, 'Dragon Fruit'),
  imageUrl: toText(scan?.imageUrl || scan?.imageUri),
  timestamp: scan?.timestamp || scan?.createdAt || new Date().toISOString(),
  estimatedPricePerKg: toNumber(scan?.estimated_price_per_kg ?? scan?.estimatedPricePerKg, 0),
  fruitAreaRatio: toNumber(scan?.fruit_area_ratio ?? scan?.fruitAreaRatio, 0),
  sizeCategory: toText(scan?.size_category || scan?.sizeCategory || 'N/A'),
  marketValueLabel: toText(scan?.market_value_label || scan?.marketValueLabel || 'N/A'),
  weightGramsEst: Math.round(toNumber(scan?.weight_grams_est ?? scan?.weightGramsEst, 0)),
  qualityScore: Math.round(toNumber(scan?.quality_score ?? scan?.qualityScore, 0)),
  ripenessScore: Math.round(toNumber(scan?.ripeness_score ?? scan?.ripenessScore, 0)),
  source: toText(scan?.source, 'web_app').toLowerCase(),
})

const buildUserQuery = (userMeta, extra = {}) => {
  const query = new URLSearchParams()
  if (userMeta?.userId) query.set('userId', userMeta.userId)
  if (userMeta?.userEmail) query.set('operatorEmail', userMeta.userEmail)
  Object.entries(extra).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      query.set(key, String(value).trim())
    }
  })
  return query.toString()
}

const removeLocalHistoryRows = (predicate) => {
  try {
    const current = parseHistory()
    const next = current.filter((item) => !predicate(item))
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore local history cleanup issues
  }
}

const mergeByLocalScanId = (backendRows, localRows) => {
  const merged = new Map()

  const upsert = (row) => {
    const key = toText(row?.localScanId || row?.id || `row-${merged.size + 1}`)
    const current = merged.get(key)
    if (!current) {
      merged.set(key, row)
      return
    }

    merged.set(key, {
      ...current,
      ...row,
      imageUrl: row.imageUrl || current.imageUrl,
      details: row.details !== 'No notes provided.' ? row.details : current.details,
      estimatedPricePerKg: row.estimatedPricePerKg > 0 ? row.estimatedPricePerKg : current.estimatedPricePerKg,
      fruitAreaRatio: row.fruitAreaRatio > 0 ? row.fruitAreaRatio : current.fruitAreaRatio,
      sizeCategory: row.sizeCategory !== 'N/A' ? row.sizeCategory : current.sizeCategory,
      marketValueLabel: row.marketValueLabel !== 'N/A' ? row.marketValueLabel : current.marketValueLabel,
      weightGramsEst: row.weightGramsEst > 0 ? row.weightGramsEst : current.weightGramsEst,
      qualityScore: row.qualityScore > 0 ? row.qualityScore : current.qualityScore,
      ripenessScore: row.ripenessScore > 0 ? row.ripenessScore : current.ripenessScore,
      timestamp: row.timestamp || current.timestamp,
    })
  }

  backendRows.forEach(upsert)
  localRows.forEach(upsert)

  return Array.from(merged.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

const getGradePillClass = (grade) => {
  const normalized = normalizeGrade(grade)
  if (normalized === 'A') return 'sg-grade-pill sg-grade-a'
  if (normalized === 'B') return 'sg-grade-pill sg-grade-b'
  if (normalized === 'C') return 'sg-grade-pill sg-grade-c'
  return 'sg-grade-pill sg-grade-na'
}

function SortingGrading() {
  const [historyRows, setHistoryRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [gradeFilter, setGradeFilter] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [lastSync, setLastSync] = useState(null)
  const [deletingId, setDeletingId] = useState('')
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    mode: 'single',
    scan: null,
  })

  const loadHistory = useCallback(async ({ silent = false } = {}) => {
    const userMeta = parseUserMeta()
    const localRows = parseHistory()
      .filter((row) => belongsToCurrentUser(row, userMeta, 'local'))
      .map((row, index) => normalizeScanRow(row, index))

    try {
      if (!silent) setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/scan`, { cache: 'no-store' })
      const payload = await response.json().catch(() => [])
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to fetch scan history')
      }

      const backendRows = (Array.isArray(payload) ? payload : [])
        .filter((scan) => isWebSource(scan?.source || ''))
        .filter((scan) => belongsToCurrentUser(scan, userMeta, 'backend'))
        .map((scan, index) => normalizeScanRow(scan, index))

      setHistoryRows(mergeByLocalScanId(backendRows, localRows))
      setLastSync(new Date())
    } catch (error) {
      setHistoryRows(localRows)
      if (!silent) {
        toast.error(error?.message || 'Unable to load cloud history. Showing local history only.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    const onFocus = () => loadHistory({ silent: true })
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [loadHistory])

  const filteredRows = useMemo(() => {
    if (gradeFilter === 'All') return historyRows
    return historyRows.filter((scan) => normalizeGrade(scan.grade) === gradeFilter)
  }, [historyRows, gradeFilter])

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows]
    if (sortBy === 'grade_desc') {
      copy.sort((a, b) => (GRADE_RANK[normalizeGrade(b.grade)] || 0) - (GRADE_RANK[normalizeGrade(a.grade)] || 0))
      return copy
    }
    if (sortBy === 'price_desc') {
      copy.sort((a, b) => toNumber(b.estimatedPricePerKg, 0) - toNumber(a.estimatedPricePerKg, 0))
      return copy
    }
    copy.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return copy
  }, [filteredRows, sortBy])

  const metrics = useMemo(() => {
    const total = historyRows.length
    const bestGrade = historyRows.reduce((best, scan) => {
      const currentRank = GRADE_RANK[normalizeGrade(scan.grade)] || 0
      const bestRank = GRADE_RANK[normalizeGrade(best)] || 0
      return currentRank > bestRank ? normalizeGrade(scan.grade) : best
    }, 'N/A')
    const averagePrice =
      total === 0
        ? 0
        : historyRows.reduce((sum, scan) => sum + toNumber(scan.estimatedPricePerKg, 0), 0) / total

    return {
      total,
      bestGrade,
      averagePrice,
    }
  }, [historyRows])

  const openDeleteScanModal = useCallback((scan) => {
    setDeleteModal({
      open: true,
      mode: 'single',
      scan: scan || null,
    })
  }, [])

  const openDeleteAllModal = useCallback(() => {
    if (!historyRows.length) return
    setDeleteModal({
      open: true,
      mode: 'all',
      scan: null,
    })
  }, [historyRows.length])

  const closeDeleteModal = useCallback(() => {
    if (deletingId || bulkDeleting) return
    setDeleteModal({ open: false, mode: 'single', scan: null })
  }, [bulkDeleting, deletingId])

  const deleteScan = useCallback(async (scan) => {
    const identifier = toText(scan?.localScanId || scan?.id)
    if (!identifier) {
      toast.error('Unable to delete this scan: missing identifier.')
      return
    }

    const userMeta = parseUserMeta()
    setDeletingId(identifier)

    try {
      const queryString = buildUserQuery(userMeta)
      const response = await fetch(
        `${API_BASE_URL}/api/scan/${encodeURIComponent(identifier)}${queryString ? `?${queryString}` : ''}`,
        { method: 'DELETE' }
      )

      if (!response.ok && response.status !== 404) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.message || 'Failed to delete scan')
      }

      removeLocalHistoryRows((item) => {
        const localId = toText(item?.localScanId || item?.id)
        return localId === identifier
      })
      setHistoryRows((prev) => prev.filter((item) => toText(item?.localScanId || item?.id) !== identifier))
      toast.success('Scan deleted')
      setDeleteModal({ open: false, mode: 'single', scan: null })
    } catch (error) {
      toast.error(error?.message || 'Failed to delete scan')
    } finally {
      setDeletingId('')
    }
  }, [])

  const deleteAllScans = useCallback(async () => {
    if (!historyRows.length) return

    const userMeta = parseUserMeta()
    setBulkDeleting(true)

    try {
      const queryString = buildUserQuery(userMeta, { source: 'web_app' })
      const response = await fetch(`${API_BASE_URL}/api/scan${queryString ? `?${queryString}` : ''}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.message || 'Failed to delete all scans')
      }

      removeLocalHistoryRows((item) => belongsToCurrentUser(item, userMeta, 'local') && isWebSource(item?.source || 'web_app'))
      setHistoryRows([])
      toast.success('All scans deleted')
      setDeleteModal({ open: false, mode: 'single', scan: null })
    } catch (error) {
      toast.error(error?.message || 'Failed to delete all scans')
    } finally {
      setBulkDeleting(false)
    }
  }, [historyRows.length])

  return (
    <div className="app-shell sg-shell">
      <UserHeader />

      <main className="sg-main">
        <section className="lp-section" style={{ paddingTop: '28px' }}>
          <div className="container-pro">
            <div className="sg-hero">
              <div>
                <div className="sg-kicker">AI History Workspace</div>
                <h1 className="sg-title">Sorting & Grading Results</h1>
                <p className="sg-subtitle">
                  Review your past web scans with grade filters, value sorting, and historical quality metadata in one professional view.
                </p>
              </div>
              <div className="sg-stat-grid">
                <div className="sg-stat-card">
                  <div className="sg-stat-label">Total Scans</div>
                  <div className="sg-stat-value">{metrics.total}</div>
                </div>
                <div className="sg-stat-card">
                  <div className="sg-stat-label">Best Grade</div>
                  <div className="sg-stat-value">{metrics.bestGrade}</div>
                </div>
                <div className="sg-stat-card">
                  <div className="sg-stat-label">Average Value</div>
                  <div className="sg-stat-value">{formatPrice(metrics.averagePrice)}</div>
                </div>
              </div>
            </div>

            <div className="sg-controls">
              <div className="sg-control-block">
                <div className="sg-control-title">Grade Filter</div>
                <div className="sg-chip-row">
                  {GRADE_FILTERS.map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      className={`sg-chip ${gradeFilter === grade ? 'is-selected' : ''}`}
                      onClick={() => setGradeFilter(grade)}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sg-control-block">
                <div className="sg-control-title">Sort</div>
                <div className="sg-chip-row">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`sg-chip ${sortBy === option.id ? 'is-selected' : ''}`}
                      onClick={() => setSortBy(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sg-action-row">
                <button type="button" className="sg-refresh-btn" onClick={() => loadHistory()}>
                  Refresh History
                </button>
                <button
                  type="button"
                  className="sg-delete-all-btn"
                  onClick={openDeleteAllModal}
                  disabled={!historyRows.length || bulkDeleting}
                >
                  {bulkDeleting ? 'Deleting...' : 'Delete All'}
                </button>
              </div>
            </div>

            <div className="sg-sync-text">
              Last synced: {lastSync ? lastSync.toLocaleString() : 'Waiting for first sync'}
            </div>

            {loading ? (
              <div className="sg-empty-card">
                <div className="sg-empty-title">Loading scan history...</div>
              </div>
            ) : sortedRows.length === 0 ? (
              <div className="sg-empty-card">
                <div className="sg-empty-title">No web scans found</div>
                <div className="sg-empty-subtitle">Run AI Analysis to build your sorting and grading timeline.</div>
              </div>
            ) : (
              <div className="sg-results-grid">
                {sortedRows.map((scan) => (
                  <article key={scan.id} className="sg-result-card">
                    <div className="sg-thumb-wrap">
                      {scan.imageUrl ? (
                        <img src={scan.imageUrl} alt="Analyzed dragon fruit" className="sg-thumb-image" />
                      ) : (
                        <div className="sg-thumb-empty">
                          <span>No image</span>
                        </div>
                      )}
                    </div>
                    <div className="sg-result-content">
                      <div className="sg-result-head">
                        <span className={getGradePillClass(scan.grade)}>Grade {normalizeGrade(scan.grade)}</span>
                        <div className="sg-head-actions">
                          <span className="sg-price">{formatPrice(scan.estimatedPricePerKg)}</span>
                          <button
                            type="button"
                            className="sg-delete-one-btn"
                            onClick={() => openDeleteScanModal(scan)}
                            disabled={deletingId === toText(scan?.localScanId || scan?.id)}
                          >
                            {deletingId === toText(scan?.localScanId || scan?.id) ? '...' : 'Delete'}
                          </button>
                        </div>
                      </div>

                      <div className="sg-meta-row">
                        <span>{scan.sizeCategory || 'N/A'}</span>
                        <span>{scan.marketValueLabel || 'N/A'}</span>
                        <span>{scan.weightGramsEst > 0 ? `${scan.weightGramsEst}g` : '--'}</span>
                      </div>

                      <div className="sg-score-row">
                        <span>Area {formatArea(scan.fruitAreaRatio)}</span>
                        <span>Ripeness {scan.ripenessScore || 0}%</span>
                        <span>Quality {scan.qualityScore || 0}%</span>
                      </div>

                      <div className="sg-detail-line">{scan.fruitType}</div>
                      <div className="sg-detail-line secondary">{scan.details}</div>
                      <div className="sg-time">{formatTimestamp(scan.timestamp)}</div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {deleteModal.open ? (
        <div className="sg-modal-backdrop" role="dialog" aria-modal="true">
          <div className="sg-modal-card">
            <div className="sg-modal-kicker">Confirm Delete</div>
            <h3 className="sg-modal-title">
              {deleteModal.mode === 'all' ? 'Delete All Past Analyses?' : 'Delete This Analysis?'}
            </h3>
            <p className="sg-modal-text">
              {deleteModal.mode === 'all'
                ? 'This will permanently remove all your web sorting history records.'
                : 'This will permanently remove the selected scan result from your history.'}
            </p>

            {deleteModal.mode === 'single' && deleteModal.scan ? (
              <div className="sg-modal-scan-preview">
                {deleteModal.scan.imageUrl ? (
                  <img src={deleteModal.scan.imageUrl} alt="Scan to delete" className="sg-modal-thumb" />
                ) : (
                  <div className="sg-modal-thumb sg-modal-thumb-empty">No image</div>
                )}
                <div className="sg-modal-meta">
                  <div className="sg-modal-meta-title">
                    {deleteModal.scan.fruitType || 'Dragon Fruit'} - Grade {normalizeGrade(deleteModal.scan.grade)}
                  </div>
                  <div className="sg-modal-meta-sub">{formatTimestamp(deleteModal.scan.timestamp)}</div>
                </div>
              </div>
            ) : (
              <div className="sg-modal-count">{historyRows.length} scan(s) will be removed.</div>
            )}

            <div className="sg-modal-actions">
              <button
                type="button"
                className="sg-modal-cancel"
                onClick={closeDeleteModal}
                disabled={Boolean(deletingId || bulkDeleting)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sg-modal-danger"
                onClick={() => (deleteModal.mode === 'all' ? deleteAllScans() : deleteScan(deleteModal.scan))}
                disabled={Boolean(deletingId || bulkDeleting)}
              >
                {deleteModal.mode === 'all'
                  ? bulkDeleting ? 'Deleting...' : 'Delete All'
                  : deletingId ? 'Deleting...' : 'Delete Scan'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default SortingGrading
