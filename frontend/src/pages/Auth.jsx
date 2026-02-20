import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BRAND_NAME, BRAND_TAGLINE } from '../config/brand'
import '../App.css'

function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const { name, email, password } = formData

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      if (user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/home')
      }
    }
  }, [navigate])

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }))
  }

  const validateForm = () => {
    if (!isLogin && !name.trim()) {
      toast.error('Please enter your full name')
      return false
    }
    
    if (!email.trim()) {
      toast.error('Please enter your email')
      return false
    }
    
    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return false
    }

    if (!password) {
      toast.error('Please enter your password')
      return false
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
    const payload = isLogin ? { email, password } : { name, email, password }

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong')
      }

      // Success
      localStorage.setItem('user', JSON.stringify(data))
      
      toast.success(isLogin ? `Welcome back to ${BRAND_NAME}` : `Account created on ${BRAND_NAME}`, {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      })
      
      // Delay navigation slightly for the toast to be seen
      setTimeout(() => {
        if (data.role === 'admin') {
          navigate('/admin')
        } else {
          navigate('/home')
        }
      }, 1000)

    } catch (error) {
      toast.error(error.message, {
        style: {
          borderRadius: '10px',
          background: '#ef4444',
          color: '#fff',
        },
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setFormData({ name: '', email: '', password: '' })
  }

  const SLIDES = [
    { src: '/landing/slider/slide-01.jpg', alt: 'Field to market', label: 'Overview', link: '/how-it-works', cta: 'How it works' },
    { src: '/landing/slider/slide-02.jpg', alt: 'Inspection closeup', label: 'Features', link: '/features', cta: 'See features' },
    { src: '/landing/slider/slide-03.jpg', alt: 'Pack and export', label: 'AI Analysis', link: '/admin/AdminAiAnalysis', cta: 'Open AI' },
  ]

  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActiveSlide(s => (s + 1) % SLIDES.length), 6000)
    return () => clearInterval(id)
  }, [])

  const goToSlide = (index) => {
    const next = (index + SLIDES.length) % SLIDES.length
    setActiveSlide(next)
  }

  const onSlideAction = (link) => {
    if (link.startsWith('#')) return window.location.assign(link)
    navigate(link)
  }

  return (
    <div className="auth-container">
      <div className="auth-slider" style={{ marginBottom: '18px' }}>
        <div className="home-slider-shell">
          <div className="home-slider-track">
            {SLIDES.map((slide, idx) => (
              <figure
                key={slide.src}
                className={`home-slide ${activeSlide === idx ? 'active' : ''}`}
                aria-hidden={activeSlide === idx ? 'false' : 'true'}
              >
                <img src={slide.src} alt={slide.alt} />
                <div className="home-slide-overlay">
                  <figcaption>{slide.label}</figcaption>
                  <button className="home-slide-btn" onClick={() => onSlideAction(slide.link)}>
                    {slide.cta}
                  </button>
                </div>
              </figure>
            ))}
          </div>
          <div className="home-slider-dots">
            {SLIDES.map((_, i) => (
              <button key={i} className={`home-dot ${activeSlide === i ? 'active' : ''}`} onClick={() => goToSlide(i)} />
            ))}
          </div>
        </div>
      </div>

      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌴</div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--gray-900)', letterSpacing: '-0.5px' }}>
              {isLogin ? `Sign in to ${BRAND_NAME}` : `Create your ${BRAND_NAME} account`}
            </h1>
            <p style={{ color: 'var(--gray-500)', marginTop: '8px', fontSize: '15px' }}>
              {isLogin ? BRAND_TAGLINE : 'Create an account to start scanning and grading.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {!isLogin && (
              <div>
                <label className="auth-label">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={onChange}
                  placeholder="John Doe"
                  className="auth-input"
                />
              </div>
            )}
            
            <div>
              <label className="auth-label">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                placeholder="you@example.com"
                className="auth-input"
              />
            </div>

            <div>
              <label className="auth-label">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                placeholder="••••••••"
                className="auth-input"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="auth-button"
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="auth-toggle">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button onClick={toggleMode}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
      </div>
    </div>
  )
}

export default Auth
