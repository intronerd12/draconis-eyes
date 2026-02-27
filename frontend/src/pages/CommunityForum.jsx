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

const UserAvatar = ({ url, name, size = 32 }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?'
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: '#e2e8f0',
        backgroundImage: url ? `url(${url})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#475569',
        fontWeight: 'bold',
        fontSize: size * 0.45,
        flexShrink: 0,
        border: '1px solid rgba(16,25,39,0.1)',
      }}
    >
      {!url && initial}
    </div>
  )
}

const ReactionButton = ({ type, count, isActive, reactors, onClick }) => {
  const [hover, setHover] = useState(false)
  
  return (
    <div 
      style={{ position: 'relative' }} 
      onMouseEnter={() => setHover(true)} 
      onMouseLeave={() => setHover(false)}
    >
      {hover && reactors.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          zIndex: 50,
          minWidth: '180px',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Reacted by
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {reactors.slice(0, 5).map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserAvatar url={r.user?.avatar} name={r.name} size={24} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                  {r.name}
                </span>
              </div>
            ))}
          </div>
          {reactors.length > 5 && (
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px', textAlign: 'center', fontWeight: 500 }}>
              + {reactors.length - 5} others
            </div>
          )}
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: '12px',
            height: '12px',
            background: 'white',
            borderRight: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0',
          }} />
        </div>
      )}
      
      <button
        type="button"
        onClick={onClick}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: isActive ? (type === 'heart' ? '#e11d48' : '#2563eb') : '#64748b',
          fontWeight: 600,
          padding: '6px 10px',
          borderRadius: '8px',
          transition: 'all 0.2s',
          backgroundColor: isActive ? (type === 'heart' ? '#ffe4e6' : '#dbeafe') : 'transparent',
        }}
        onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = '#f1f5f9')}
        onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = 'transparent')}
      >
        <span style={{ fontSize: '1.2rem', filter: isActive ? 'none' : 'grayscale(100%) opacity(0.6)' }}>
          {type === 'heart' ? '❤️' : '👍'}
        </span>
        <span>{count > 0 ? count : (type === 'heart' ? 'Heart' : 'Like')}</span>
      </button>
    </div>
  )
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
    const postsReq = fetch(`${API_BASE_URL}/api/community?limit=70`, { cache: 'no-store' }).then(async (res) => {
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
    } catch (err) {
      toast.error(err?.message || 'Failed to update reaction')
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
    } catch (err) {
      toast.error(err?.message || 'Could not add comment')
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
    } catch (err) {
      void err
    }
  }

  const canDeletePost = (post) => {
    const byUser = userMeta.userId && String(post?.user?._id || post?.user || '') === String(userMeta.userId)
    const byEmail = userMeta.authorEmail && asText(post?.authorEmail).toLowerCase() === userMeta.authorEmail
    return Boolean(byUser || byEmail)
  }

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const confirmDeletePost = (post) => {
    setDeleteTarget(post)
    setDeleteOpen(true)
  }

  const handleDeletePost = async (post) => {
    const rawId = String(post?._id || post?.id || '')
    const postId = rawId.trim()
    if (!postId) return

    console.log('Attempting to delete post:', postId)

    try {
      let res = await fetch(`${API_BASE_URL}/api/community/${encodeURIComponent(postId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userMeta.userId || '',
          'X-User-Email': userMeta.authorEmail || '',
        },
        body: JSON.stringify({
          userId: userMeta.userId,
          authorEmail: userMeta.authorEmail,
        }),
      })

      if (res.status === 404) {
        // If post not found, consider it deleted
        setPosts((prev) => prev.filter((p) => String(p?._id || p?.id) !== postId))
        toast.success('Post deleted')
        setDeleteOpen(false)
        setDeleteTarget(null)
        return
      }

      if (!res.ok) {
        res = await fetch(`${API_BASE_URL}/api/community/${encodeURIComponent(postId)}/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userMeta.userId || '',
            'X-User-Email': userMeta.authorEmail || '',
          },
          body: JSON.stringify({
            userId: userMeta.userId,
            authorEmail: userMeta.authorEmail,
          }),
        })
      }
      
      if (res.status === 404) {
         setPosts((prev) => prev.filter((p) => String(p?._id || p?.id) !== postId))
         toast.success('Post deleted')
         setDeleteOpen(false)
         setDeleteTarget(null)
         return
      }

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Failed to delete post')
      
      setPosts((prev) => prev.filter((p) => String(p?._id || p?.id) !== postId))
      toast.success('Post deleted')
      setDeleteOpen(false)
      setDeleteTarget(null)
      
      // Force reload to ensure consistency with backend
      void loadData()
    } catch (err) {
      toast.error(err?.message || 'Could not delete post')
    }
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
                        <div key={String(item?._id || item?.id)} style={{ border: '1px solid rgba(16,25,39,0.1)', borderRadius: '8px', padding: '8px', display: 'flex', gap: '10px', alignItems: 'start' }}>
                          <UserAvatar url={item?.actorUser?.avatar} name={item?.actorUser?.name || 'System'} size={32} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{asText(item?.message, 'Community update')}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(item?.createdAt)}</div>
                          </div>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <UserAvatar url={post?.user?.avatar} name={post?.authorName} size={40} />
                          <div style={{ fontWeight: 700 }}>{asText(post?.authorName, 'Anonymous User')}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{formatDate(post?.createdAt)}</div>
                          {canDeletePost(post) ? (
                            <button
                              type="button"
                              onClick={() => confirmDeletePost(post)}
                              style={{
                                border: '1px solid rgba(16,25,39,0.12)',
                                background: '#fff',
                                color: '#b91c1c',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontWeight: 700,
                              }}
                            >
                              Delete
                            </button>
                          ) : null}
                        </div>
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
                        <ReactionButton 
                          type="heart" 
                          count={heartCount} 
                          isActive={isHearted} 
                          reactors={reactions.filter(r => r.type === 'heart')} 
                          onClick={() => void handleReaction(post, 'heart')} 
                        />
                        <ReactionButton 
                          type="like" 
                          count={likeCount} 
                          isActive={isLiked} 
                          reactors={reactions.filter(r => r.type === 'like')} 
                          onClick={() => void handleReaction(post, 'like')} 
                        />
                      </div>

                      <div style={{ marginTop: '12px', borderTop: '1px solid rgba(16,25,39,0.08)', paddingTop: '10px' }}>
                        <div style={{ fontWeight: 700, marginBottom: '8px' }}>Comments ({comments.length})</div>
                        {comments.slice(-3).map((comment) => (
                          <div key={String(comment?._id || `${comment?.createdAt}-${comment?.text}`)} style={{ padding: '8px', border: '1px solid rgba(16,25,39,0.08)', borderRadius: '8px', marginBottom: '8px', display: 'flex', gap: '10px', alignItems: 'start' }}>
                            <UserAvatar url={comment?.commenterUser?.avatar} name={comment?.commenterName} size={32} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                                {asText(comment?.commenterName, 'User')} <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.8rem' }}>• {formatDate(comment?.createdAt)}</span>
                              </div>
                              <div style={{ fontSize: '0.92rem', color: '#334155', marginTop: '2px' }}>{asText(comment?.text)}</div>
                            </div>
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
      {deleteOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(16,25,39,0.35)',
            backdropFilter: 'blur(6px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 60,
          }}
          onClick={() => setDeleteOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(520px, 92vw)',
              background: '#fff',
              border: '1px solid rgba(16,25,39,0.12)',
              borderRadius: '14px',
              boxShadow: '0 10px 30px rgba(16,25,39,0.2)',
              padding: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fee2e2', display: 'grid', placeItems: 'center' }}>
                <span style={{ color: '#b91c1c', fontWeight: 900 }}>!</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>Delete this post?</div>
            </div>
            <div style={{ color: '#475569', fontSize: '0.95rem' }}>
              This will permanently remove the post from the community. This action cannot be undone.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                style={{
                  border: '1px solid rgba(16,25,39,0.12)',
                  background: '#fff',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: '#111827',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteTarget && handleDeletePost(deleteTarget)}
                style={{
                  border: 'none',
                  background: '#b91c1c',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <footer
        style={{
          background: 'linear-gradient(135deg, #D81B60, #B8105B)',
          padding: '28px 0',
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
