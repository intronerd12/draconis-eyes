import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, BarChart3, Eye, EyeOff, ScanLine, ShieldCheck } from 'lucide-react';
import BrandMark from '../components/BrandMark';
import { BRAND_NAME, BRAND_TAGLINE } from '../config/brand';
import { API_BASE_URL } from '../config/api';
import '../App.css';

function AuthPro() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { name, email, password } = formData;

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      if (cancelled) return;
      navigate(user.role === 'admin' ? '/admin' : '/home');
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const onChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    if (!isLogin && !name.trim()) {
      toast.error('Please enter your full name');
      return false;
    }

    if (!email.trim()) {
      toast.error('Please enter your email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (!password) {
      toast.error('Please enter your password');
      return false;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const submitAuth = async () => {
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { name, email, password };

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Something went wrong');

    localStorage.setItem('user', JSON.stringify(data));
    toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
    navigate(data.role === 'admin' ? '/admin' : '/home');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await submitAuth();
    } catch (err) {
      if (err?.message?.includes('rate limit')) {
        toast.error('Too many attempts. Please wait or use a different email.');
      } else {
        toast.error(err?.message || 'Something went wrong');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin((v) => !v);
    setFormData({ name: '', email: '', password: '' });
  };

  const authModeLabel = 'MongoDB Auth';

  const featureList = useMemo(
    () => [
      { icon: <ScanLine size={18} />, title: 'Scan Insights', desc: 'Track scans, grades, and defects in one place.' },
      { icon: <BarChart3 size={18} />, title: 'Analytics', desc: 'Real-time dashboards backed by your data.' },
      { icon: <ShieldCheck size={18} />, title: 'Admin Controls', desc: 'Role-based access and user management.' },
    ],
    [],
  );

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <div className="auth-left">
          <div className="auth-left-top">
            <div className="auth-brand">
              <BrandMark size={46} />
              <div>
                <div className="auth-brand-name">{BRAND_NAME}</div>
                <div className="auth-brand-tagline">{BRAND_TAGLINE}</div>
              </div>
            </div>
            <div className="auth-left-title">Welcome to the admin-grade TropiScan portal.</div>
            <div className="auth-left-subtitle">Sign in to view real metrics, manage users, and monitor API health.</div>
          </div>

          <div className="auth-features">
            {featureList.map((f) => (
              <div key={f.title} className="auth-feature">
                <div className="auth-feature-icon">{f.icon}</div>
                <div>
                  <div className="auth-feature-title">{f.title}</div>
                  <div className="auth-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="auth-left-foot">
            <div className="auth-mode-pill">{authModeLabel}</div>
            <div className="auth-foot-note">© {new Date().getFullYear()} {BRAND_NAME}</div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-card-pro">
            <div className="auth-card-header">
              <div className="auth-card-nav">
                <Link to="/" className="auth-back-link" aria-label="Back to landing page">
                  <ArrowLeft size={15} />
                  <span>Back to Landing</span>
                </Link>
              </div>
              <div className="auth-card-title">{isLogin ? 'Sign in' : 'Create account'}</div>
              <div className="auth-card-subtitle">
                {isLogin ? 'Use your email and password to continue.' : 'Create an account to start using TropiScan.'}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin ? (
                <div className="auth-field">
                  <label className="auth-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={name}
                    onChange={onChange}
                    placeholder="Jane Doe"
                    className="auth-input"
                    autoComplete="name"
                    required
                  />
                </div>
              ) : null}

              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  placeholder="you@company.com"
                  className="auth-input"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div className="auth-password">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={onChange}
                    placeholder="••••••••"
                    className="auth-input auth-input-password"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="auth-button">
                {isLoading ? 'Processing…' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="auth-divider">
              <span />
              <div>or</div>
              <span />
            </div>

            <div className="auth-toggle-pro">
              <div>{isLogin ? "Don't have an account?" : 'Already have an account?'}</div>
              <button type="button" onClick={toggleMode}>
                {isLogin ? 'Create account' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPro;
