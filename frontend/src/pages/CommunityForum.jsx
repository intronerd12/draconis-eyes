import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { API_BASE_URL } from '../config/api'
import { BRAND_NAME } from '../config/brand'
import './Landing.css'

const NAV_ITEMS = [
  { path: '/overview', label: 'Overview', icon: 'Home' },
  { path: '/ai-analysis', label: 'AI Analysis', icon: 'Scan' },
  { path: '/community', label: 'Community', icon: 'Forum' },
]

const asText = (value, fallback = '') => {
  const text = String(value ?? '').trim()
  return text || fallback
}

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString()
}

const formatArea = (ratio) => {
  const n = Number(ratio)
  if (!Number.isFinite(n) || n <= 0) return '0%'
  return `${Math.round(n * 100)}%`
}

const formatPrice = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 'PHP 0.00/kg'
  return `PHP ${n.toFixed(2)}/kg`
}

const BAD_WORD_PATTERNS = [
  /\b(fuck|shit|bitch|asshole|motherfucker|cunt)\b/ig,
  /\b(puta|putangina|putang\s*ina|gago|tanga|ulol|pakyu|bobo)\b/ig,
]

const maskBadLanguage = (text) => {
  let masked = String(text || '')
  BAD_WORD_PATTERNS.forEach((pattern) => {
    masked = masked.replace(pattern, (match) => '*'.repeat(match.length))
  })
  return masked
}

const hasDragonContext = (text, scan) => {
  const combined = `${asText(text)} ${asText(scan?.fruitType || scan?.fruit_type)} ${asText(scan?.details || scan?.notes)}`.toLowerCase()
  const hasDragon = /\b(dragon\s*fruit|dragonfruit|pitaya|hylocereus|selenicereus)\b/i.test(combined)
  const hasNonDragon = /\b(no\s+dragon\s+fruit|not\s+(a\s+)?dragon\s*fruit|non[-\s]*dragon)\b/i.test(combined)
  return hasDragon && !hasNonDragon
}

function CommunityForum() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [scans, setScans] = useState([])
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [postText, setPostText] = useState('')
  const [selectedScanId, setSelectedScanId] = useState('')
  const [commentDrafts, setCommentDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [feedError, setFeedError] = useState('')
  const [formError, setFormError] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (!raw) {
      navigate('/login')
      return
    }
    try {
      setUser(JSON.parse(raw))
    } catch {
      localStorage.removeItem('user')
      navigate('/login')
    }
  }, [navigate])

  const userMeta = useMemo(() => {
    if (!user) return {}
    return {
      userId: String(user?._id || user?.id || user?.userId || '').trim() || undefined,
      authorName: asText(user?.name || user?.fullName || user?.username, 'Anonymous User'),
      authorEmail: asText(user?.email).toLowerCase() || undefined,
    }
  }, [user])

  const selectedScan = useMemo(
    () => scans.find((scan) => String(scan?._id || scan?.id || scan?.localScanId) === String(selectedScanId)) || null,
    [scans, selectedScanId]
  )

  const loadNotifications = useCallback(async () => {
    if (!userMeta.authorEmail && !userMeta.userId) return
    const query = new URLSearchParams()
    if (userMeta.authorEmail) query.set('email', userMeta.authorEmail)
    else if (userMeta.userId) query.set('userId', userMeta.userId)
    query.set('limit', '40')

    try {
      const res = await fetch(`${API_BASE_URL}/api/community/notifications?${query.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to load notifications')
      setNotifications(Array.isArray(data?.items) ? data.items : [])
      setUnreadCount(Number(data?.unreadCount || 0))
    } catch {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [userMeta.authorEmail, userMeta.userId])

  const loadData = useCallback(async () => {
    setLoading(true)
    const postsReq = fetch(`${API_BASE_URL}/api/community?limit=70`).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to load community posts')
      return Array.isArray(data) ? data : []
    })

    const scansReq = fetch(`${API_BASE_URL}/api/scan`).then(async (res) => {
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to load scans')
      const allScans = Array.isArray(data) ? data : []
      return allScans
        .filter((item) => {
          const sameEmail = userMeta.authorEmail && asText(item?.operatorEmail).toLowerCase() === userMeta.authorEmail
          const sameUser = userMeta.userId && String(item?.user?._id || item?.user || '') === userMeta.userId
          return sameEmail || sameUser
        })
        .sort((a, b) => new Date(b?.timestamp || b?.createdAt || 0).getTime() - new Date(a?.timestamp || a?.createdAt || 0).getTime())
    })

    const [postsResult, scansResult] = await Promise.allSettled([postsReq, scansReq, loadNotifications()])

    if (postsResult.status === 'fulfilled') {
      setPosts(postsResult.value)
      setFeedError('')
    } else {
      setPosts([])
      setFeedError(postsResult.reason?.message || 'Failed to load community posts')
    }

    if (scansResult.status === 'fulfilled') {
      setScans(scansResult.value)
      if (!selectedScanId && scansResult.value.length) {
        const first = scansResult.value[0]
        setSelectedScanId(String(first?._id || first?.id || first?.localScanId))
      }
    } else {
      setScans([])
    }

    setLoading(false)
  }, [loadNotifications, selectedScanId, userMeta.authorEmail, userMeta.userId])

  useEffect(() => {
    if (!user) return
    void loadData()
  }, [loadData, user])

  useEffect(() => {
    if (!user) return undefined
    const timer = setInterval(() => {
      void loadNotifications()
    }, 15000)
    return () => clearInterval(timer)
  }, [loadNotifications, user])

  const buildScanSnapshot = (scan) => {
    if (!scan) return undefined
    return {
      localScanId: asText(scan?.localScanId || scan?._id || scan?.id),
      grade: asText(scan?.grade || 'N/A').toUpperCase(),
      fruitType: asText(scan?.fruitType || 'Dragon Fruit'),
      notes: asText(scan?.details || 'Shared from scan history'),
      estimatedPricePerKg: Number(scan?.estimated_price_per_kg || scan?.estimatedPricePerKg || 0) || 0,
      fruitAreaRatio: Number(scan?.fruit_area_ratio || scan?.fruitAreaRatio || 0) || 0,
      sizeCategory: asText(scan?.size_category || scan?.sizeCategory || 'N/A'),
      shelfLifeLabel: asText(scan?.shelf_life_label || scan?.shelfLifeLabel || 'No result'),
      scanTimestamp: scan?.timestamp || scan?.createdAt || new Date().toISOString(),
      imageUrl: asText(scan?.imageUrl),
    }
  }

  const handleCreatePost = async (event) => {
    event.preventDefault()
    if (posting) return

    const scanSnapshot = buildScanSnapshot(selectedScan)
    const cleanText = asText(postText)

    if (!cleanText && !scanSnapshot) {
      setFormError('Add text or attach a scan result before posting.')
      return
    }

    if (!hasDragonContext(cleanText, scanSnapshot)) {
      setFormError('Community posts must be about dragon fruit scan results.')
      return
    }

    const maskedText = maskBadLanguage(cleanText)

    setPosting(true)
    setFormError('')
    try {
      const payload = {
        ...userMeta,
        text: maskedText,
        source: 'web_app',
        scanSnapshot,
      }

      const res = await fetch(`${API_BASE_URL}/api/community`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to create post')

      setPosts((prev) => [data, ...prev])
      setPostText('')
      toast.success('Posted to community')
      void loadNotifications()
    } catch (error) {
      setFormError(error?.message || 'Could not create post')
    } finally {
      setPosting(false)
    }
  }

  const handleReaction = async (post, type) => {
    try {
      const postId = String(post._id || post.id || '')
      const res = await fetch(`${API_BASE_URL}/api/community/${encodeURIComponent(postId)}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userMeta.userId,
          reactorName: userMeta.authorName,
          reactorEmail: userMeta.authorEmail,
          type,
        }),
      })
      const updated = await res.json()
      if (!res.ok) throw new Error(updated?.message || 'Failed to react')

      setPosts((prev) =>
        prev.map((p) => {
          const pid = String(p._id || p.id || '')
          const uid = String(updated._id || updated.id || '')
          return pid === uid ? updated : p
        })
      )
    } catch (error) {
      toast.error('Failed to update reaction')
    }
  }

  const handleComment = async (post) => {
    const postId = String(post?._id || post?.id || '')
    const text = asText(commentDrafts[postId])
    if (!postId || !text) return
    
    const maskedText = maskBadLanguage(text)

    try {
      const res = await fetch(`${API_BASE_URL}/api/community/${encodeURIComponent(postId)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userMeta.userId,
          commenterName: userMeta.authorName,
          commenterEmail: userMeta.authorEmail,
          text: maskedText,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to add comment')

      setPosts((prev) =>
        prev.map((item) => {
          const id = String(item?._id || item?.id || '')
          return id === postId ? data : item
        })
      )
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }))
      void loadNotifications()
    } catch (error) {
      toast.error(error?.message || 'Could not add comment')
    }
  }

  const markNotificationsRead = async () => {
    if (!userMeta.authorEmail && !userMeta.userId) return
    try {
      await fetch(`${API_BASE_URL}/api/community/notifications/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userMeta.authorEmail,
          userId: userMeta.userId,
        }),
      })
      setUnreadCount(0)
      setNotifications((prev) => prev.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })))
    } catch {}
  }

  return (
    <div className="app-shell" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #fff6fb 0%, #f8fbff 100%)' }}>
      <header
        style={{
          backdropFilter: 'blur(14px)',
          background: 'rgba(255, 255, 255, 0.92)',
          borderBottom: '1px solid rgba(16, 25, 39, 0.08)',
          padding: '16px 0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div className="container-pro" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
          <Link to="/home" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>TropiScan</div>
          </Link>
          <nav style={{ display: 'flex', gap: '28px', flex: 1, alignItems: 'center' }}>
            {NAV_ITEMS.map((item) => {
              const isActive = window.location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    textDecoration: 'none',
                    color: isActive ? '#D81B60' : '#6b7280',
                    fontWeight: isActive ? '700' : '500',
                    fontSize: '0.95rem',
                    paddingBottom: '4px',
                    borderBottom: isActive ? '2px solid #D81B60' : 'none',
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <Link
            to="/home"
            style={{
              padding: '8px 16px',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: '500',
              textDecoration: 'none',
              color: '#000',
              whiteSpace: 'nowrap',
            }}
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main>
        <section className="lp-section">
          <div className="container-pro" style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 460px) 1fr', gap: '24px' }}>
            <div style={{ background: '#fff', border: '1px solid rgba(16, 25, 39, 0.08)', borderRadius: '16px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Create Post</h2>
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen((prev) => !prev)
                    void markNotificationsRead()
                  }}
                  style={{
                    border: '1px solid rgba(16, 25, 39, 0.12)',
                    background: '#fff',
                    borderRadius: '999px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
                </button>
              </div>
              <p style={{ color: '#6b7280', marginTop: 0 }}>Share your scan result with other users.</p>
              <form onSubmit={handleCreatePost}>
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="Share what you observed from your scan..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    border: '1px solid rgba(16, 25, 39, 0.14)',
                    borderRadius: '12px',
                    padding: '12px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />

                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px' }}>Attach scan result</div>
                  <select
                    value={selectedScanId}
                    onChange={(e) => setSelectedScanId(e.target.value)}
                    style={{
                      width: '100%',
                      border: '1px solid rgba(16, 25, 39, 0.14)',
                      borderRadius: '10px',
                      padding: '10px',
                      fontFamily: 'inherit',
                    }}
                  >
                    <option value="">No attachment</option>
                    {scans.map((scan) => {
                      const id = String(scan?._id || scan?.id || scan?.localScanId)
                      return (
                        <option key={id} value={id}>
                          {asText(scan?.fruitType, 'Dragon Fruit')} | Grade {asText(scan?.grade, 'N/A')} | {formatDate(scan?.timestamp)}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {selectedScan ? (
                  <div style={{ marginTop: '10px', background: '#f8fafc', border: '1px solid rgba(16, 25, 39, 0.08)', borderRadius: '10px', padding: '10px' }}>
                    <div style={{ fontWeight: 700 }}>{asText(selectedScan?.fruitType, 'Dragon Fruit')}</div>
                    <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                      Grade {asText(selectedScan?.grade, 'N/A')} | {formatDate(selectedScan?.timestamp)}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
                      {asText(selectedScan?.details, 'No notes')}
                    </div>
                  </div>
                ) : null}

                {formError ? <div style={{ color: '#b91c1c', marginTop: '10px', fontWeight: 600 }}>{formError}</div> : null}
                <button
                  type="submit"
                  disabled={posting}
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    border: 'none',
                    background: 'linear-gradient(135deg, #D81B60, #B8105B)',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {posting ? 'Posting...' : 'Post to Community'}
                </button>
              </form>

              {notifOpen ? (
                <div style={{ marginTop: '16px', borderTop: '1px solid rgba(16,25,39,0.08)', paddingTop: '12px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '8px' }}>Notifications</div>
                  {notifications.length ? (
                    <div style={{ display: 'grid', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                      {notifications.map((item) => (
                        <div key={String(item?._id || item?.id)} style={{ border: '1px solid rgba(16,25,39,0.1)', borderRadius: '8px', padding: '8px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{asText(item?.message, 'Community update')}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(item?.createdAt)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#64748b' }}>No notifications yet.</div>
                  )}
                </div>
              ) : null}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Latest Posts</h2>
                  <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Shared by mobile and web users</div>
                </div>
                <button
                  type="button"
                  onClick={() => void loadData()}
                  style={{
                    border: '1px solid rgba(16,25,39,0.12)',
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Refresh
                </button>
              </div>

              {loading ? <div>Loading community posts...</div> : null}
              {!loading && feedError ? <div style={{ color: '#b91c1c', fontWeight: 600 }}>{feedError}</div> : null}

              <div style={{ display: 'grid', gap: '12px' }}>
                {posts.map((post) => {
                  const id = String(post?._id || post?.id)
                  const comments = Array.isArray(post?.comments) ? post.comments : []
                  const scan = post?.scanSnapshot || null

                  const reactions = Array.isArray(post?.reactions) ? post.reactions : []
                  const myReaction = reactions.find((r) => {
                    if (userMeta.userId && String(r.user) === String(userMeta.userId)) return true
                    if (userMeta.authorEmail && r.email === userMeta.authorEmail) return true
                    return false
                  })
                  const isHearted = myReaction?.type === 'heart'
                  const isLiked = myReaction?.type === 'like'
                  const heartCount = reactions.filter((r) => r.type === 'heart').length
                  const likeCount = reactions.filter((r) => r.type === 'like').length

                  return (
                    <article key={id} style={{ background: '#fff', border: '1px solid rgba(16,25,39,0.08)', borderRadius: '14px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontWeight: 700 }}>{asText(post?.authorName, 'Anonymous User')}</div>
                        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{formatDate(post?.createdAt)}</div>
                      </div>
                      {post?.authorEmail ? <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '2px' }}>{post.authorEmail}</div> : null}
                      {post?.text ? <p style={{ marginTop: '10px', marginBottom: '10px', lineHeight: 1.6 }}>{post.text}</p> : null}

                      {scan ? (
                        <div style={{ border: '1px solid rgba(16,25,39,0.08)', borderRadius: '10px', padding: '10px', background: '#f8fafc' }}>
                          {scan?.imageUrl ? (
                            <img
                              src={scan.imageUrl}
                              alt="Scan"
                              style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                            />
                          ) : null}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ background: '#fce7f3', color: '#9d174d', borderRadius: '999px', padding: '4px 8px', fontWeight: 700, fontSize: '0.82rem' }}>
                              Grade {asText(scan?.grade, 'N/A')}
                            </span>
                            <span style={{ background: '#ecfeff', color: '#155e75', borderRadius: '999px', padding: '4px 8px', fontWeight: 700, fontSize: '0.82rem' }}>
                              {formatArea(scan?.fruitAreaRatio)} area
                            </span>
                            <span style={{ background: '#f0fdf4', color: '#166534', borderRadius: '999px', padding: '4px 8px', fontWeight: 700, fontSize: '0.82rem' }}>
                              {formatPrice(scan?.estimatedPricePerKg)}
                            </span>
                          </div>
                          <div style={{ fontWeight: 700 }}>{asText(scan?.fruitType, 'Dragon fruit scan result')}</div>
                          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{asText(scan?.notes, 'No notes provided.')}</div>
                        </div>
                      ) : null}

                      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', marginBottom: '8px' }}>
                        <button
                          type="button"
                          onClick={() => void handleReaction(post, 'heart')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: isHearted ? '#e11d48' : '#64748b',
                            fontWeight: 600,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ fontSize: '1.2rem', filter: isHearted ? 'none' : 'grayscale(100%) opacity(0.6)' }}>❤️</span>
                          <span>{heartCount > 0 ? heartCount : 'Heart'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleReaction(post, 'like')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: isLiked ? '#2563eb' : '#64748b',
                            fontWeight: 600,
                            padding: '4px 8px',
                            borderRadius: '6px',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ fontSize: '1.2rem', filter: isLiked ? 'none' : 'grayscale(100%) opacity(0.6)' }}>👍</span>
                          <span>{likeCount > 0 ? likeCount : 'Like'}</span>
                        </button>
                      </div>

                      <div style={{ marginTop: '12px', borderTop: '1px solid rgba(16,25,39,0.08)', paddingTop: '10px' }}>
                        <div style={{ fontWeight: 700, marginBottom: '8px' }}>Comments ({comments.length})</div>
                        {comments.slice(-3).map((comment) => (
                          <div key={String(comment?._id || `${comment?.createdAt}-${comment?.text}`)} style={{ padding: '8px', border: '1px solid rgba(16,25,39,0.08)', borderRadius: '8px', marginBottom: '8px' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                              {asText(comment?.commenterName, 'User')} | {formatDate(comment?.createdAt)}
                            </div>
                            <div style={{ fontSize: '0.92rem', color: '#334155', marginTop: '2px' }}>{asText(comment?.text)}</div>
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            value={commentDrafts[id] || ''}
                            onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [id]: e.target.value }))}
                            placeholder="Write a comment..."
                            style={{
                              flex: 1,
                              border: '1px solid rgba(16,25,39,0.14)',
                              borderRadius: '8px',
                              padding: '8px 10px',
                              fontFamily: 'inherit',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => void handleComment(post)}
                            style={{
                              border: 'none',
                              background: '#be185d',
                              color: '#fff',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}

                {!loading && posts.length === 0 ? (
                  <div style={{ background: '#fff', border: '1px solid rgba(16,25,39,0.08)', borderRadius: '14px', padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    No posts yet. Be the first to share your dragon fruit scan.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer
        style={{
          background: 'linear-gradient(135deg, #D81B60, #B8105B)',
          padding: '28px 0',
          marginTop: '32px',
        }}
      >
        <div className="container-pro" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.92)' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>{BRAND_NAME}</div>
          <div style={{ fontSize: '0.9rem' }}>Community forum connected to mobile + web scans</div>
        </div>
      </footer>
    </div>
  )
}

export default CommunityForum

