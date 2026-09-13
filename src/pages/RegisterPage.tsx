import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../lib/zustand/authStore';
import { trackEvent } from '../lib/services/analyticsService';

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[var(--surface-container)] border border-[var(--outline-variant)]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--on-surface)]">Create Account</h1>
          <p className="text-sm text-[var(--on-surface-variant)] mt-2">Join Cinepix today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--on-surface-variant)] mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Choose a username"
              className="w-full px-4 py-3 rounded-xl bg-[var(--surface-container-high)] border border-[var(--outline-variant)] text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--on-surface-variant)] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-xl bg-[var(--surface-container-high)] border border-[var(--outline-variant)] text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--on-surface-variant)] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Create a password"
              className="w-full px-4 py-3 rounded-xl bg-[var(--surface-container-high)] border border-[var(--outline-variant)] text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center mt-6">
          <span className="text-sm text-[var(--on-surface-variant)]">Already have an account? </span>
          <Link to="/login" className="text-sm text-[var(--primary)] font-medium hover:underline">Sign In</Link>
        </div>

        <div className="text-center mt-4">
          <button onClick={() => navigate('/')} className="text-xs text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]">Skip for now</button>
        </div>
      </div>
    </div>
  );
}
