import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, BarChart3, Eye, EyeOff, ScanLine, ShieldCheck } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../config/firebase';
import BrandMark from '../components/BrandMark';
import { BRAND_NAME, BRAND_TAGLINE } from '../config/brand';
import { API_BASE_URL } from '../config/api';
import '../App.css';

function AuthPro() {
  // background video for login
  const BG_VIDEO = 'https://res.cloudinary.com/dkqnaqbvg/video/upload/v1771296730/4443529-hd_1920_1080_25fps_up7btg.mp4';

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
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
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || 'Something went wrong';
      if (isLogin && /verify/i.test(String(msg))) {
        setNeedsVerification(true);
        setVerifyEmail(email);
        toast.error('Please verify your email to continue.');
        return null;
      }
      throw new Error(msg);
    }
    if (!isLogin && data?.requiresVerification) {
      setNeedsVerification(true);
      setVerifyEmail(String(data?.email || email));
      toast.success('Registration successful. Check your email for the 6-digit code.');
      return null;
    }
    localStorage.setItem('user', JSON.stringify(data));
    toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
    navigate(data.role === 'admin' ? '/admin' : '/home');
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await submitAuth();
      if (result === null) {
        // switched to verification flow
      }
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

  const handleSocialLogin = async (providerName) => {
    try {
      setIsLoading(true);
      const provider = providerName === 'google' ? googleProvider : facebookProvider;
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Send to backend to create/login user
      const res = await fetch(`${API_BASE_URL}/api/auth/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.displayName,
          email: user.email,
          googleId: providerName === 'google' ? user.uid : undefined,
          facebookId: providerName === 'facebook' ? user.uid : undefined,
          avatar: user.photoURL,
        }),
      });

      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse backend response:', text);
        data = {};
      }

      if (!res.ok) {
        console.error('Social login backend error:', res.status, text);
        throw new Error(data?.message || `Social login failed (${res.status})`);
      }

      localStorage.setItem('user', JSON.stringify(data));
      toast.success(`Welcome back, ${data.name}!`);
      
      // Force reload or navigate
      window.location.href = data.role === 'admin' ? '/admin' : '/home';
    } catch (error) {
      console.error('Social Auth Error:', error);
      toast.error(error.message || 'Social authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin((v) => !v);
    setFormData({ name: '', email: '', password: '' });
    setNeedsVerification(false);
    setVerifyEmail('');
    setVerifyCode('');
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
      <video className="auth-video-bg" src={BG_VIDEO} autoPlay muted loop playsInline />
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

            {!needsVerification ? (
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

              <button
                type="submit"
                disabled={isLoading}
                className="auth-btn-primary"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isLogin ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </button>

              <div className="auth-divider">
                <span />
                <div>or continue with</div>
                <span />
              </div>

              <div className="auth-social-grid">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  disabled={isLoading}
                  className="auth-btn-social auth-btn-google"
                >
                  <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.147-1.133 8.213-3.293 2.1-2.173 2.72-5.453 2.72-8.24 0-.573-.053-1.093-.147-1.547H12.48z" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('facebook')}
                  disabled={isLoading}
                  className="auth-btn-social auth-btn-facebook"
                >
                  <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Facebook</span>
                </button>
              </div>
            </form>
            ) : (
              <div className="auth-form">
                <div className="auth-field">
                  <label className="auth-label">Verify Email</label>
                  <input
                    type="email"
                    value={verifyEmail}
                    onChange={(e) => setVerifyEmail(e.target.value)}
                    className="auth-input"
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">6-digit code</label>
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                    placeholder="ABC123"
                    className="auth-input"
                    inputMode="text"
                    autoCapitalize="characters"
                    spellCheck={false}
                  />
                </div>
                <button
                  type="button"
                  disabled={isVerifying || !verifyEmail || verifyCode.length !== 6}
                  className="auth-button"
                  onClick={async () => {
                    setIsVerifying(true);
                    try {
                      const res = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: verifyEmail, code: verifyCode }),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) throw new Error(data?.message || 'Verification failed');
                      localStorage.setItem('user', JSON.stringify(data));
                      toast.success('Email verified. Welcome!');
                      navigate(data.role === 'admin' ? '/admin' : '/home');
                    } catch (err) {
                      toast.error(err?.message || 'Verification failed');
                    } finally {
                      setIsVerifying(false);
                    }
                  }}
                >
                  {isVerifying ? 'Verifying…' : 'Verify Email'}
                </button>
                <div className="auth-toggle-pro">
                  <div>Entered the wrong email?</div>
                  <button type="button" onClick={() => setNeedsVerification(false)}>Go back</button>
                </div>
              </div>
            )}

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
