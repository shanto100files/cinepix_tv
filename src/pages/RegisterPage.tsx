import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LuEye as Eye, LuEyeOff as EyeOff } from 'react-icons/lu';
import useAuthStore from '../lib/zustand/authStore';
import { trackEvent } from '../lib/services/analyticsService';
import './AuthPages.css';

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore(s => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    const result = await register(username.trim(), email.trim(), password);
    setLoading(false);
    if (result.ok) {
      trackEvent('register');
      navigate('/');
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><img src="/cinepix-app-icon.png" alt="Cinepix" /></div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join Cinepix today</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-username">Username</label>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Choose a username"
              className="auth-input"
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="auth-input"
              autoComplete="email"
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-password">Password</label>
            <div className="auth-input-wrap">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Create a password"
                className="auth-input has-toggle"
                autoComplete="new-password"
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
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
        <button onClick={() => navigate('/')} className="auth-skip">Skip for now</button>
      </div>
    </div>
  );
}
