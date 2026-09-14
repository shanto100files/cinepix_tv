import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LuEye as Eye, LuEyeOff as EyeOff } from 'react-icons/lu';
import useAuthStore from '../lib/zustand/authStore';
import { sendHeartbeat } from '../lib/services/heartbeatService';
import { trackEvent } from '../lib/services/analyticsService';
import './AuthPages.css';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(s => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(username.trim(), password);
    setLoading(false);
    if (result.ok) {
      trackEvent('login');
      sendHeartbeat();
      navigate('/');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><img src="/cinepix-app-icon.png" alt="Cinepix" /></div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your Cinepix account</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-username">Username or Email</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username or email"
              className="auth-input"
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">Password</label>
            <div className="auth-input-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className="auth-input has-toggle"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-toggle"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" disabled={loading} className="auth-submit">
            {loading && <span className="auth-spinner" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-switch">
          Don&apos;t have an account? <Link to="/register">Sign Up</Link>
        </div>
        <button onClick={() => navigate('/')} className="auth-skip">Skip for now</button>
      </div>
    </div>
  );
}
