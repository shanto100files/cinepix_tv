import { useNavigate } from 'react-router-dom';
import useAuthStore from '../lib/zustand/authStore';

export function ProfilePage() {
  const user = useAuthStore(s => s.user);
  const isPremium = useAuthStore(s => s.isPremium);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--on-surface)] mb-6">Profile</h1>

      <div className="rounded-2xl bg-[var(--surface-container)] border border-[var(--outline-variant)] p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--primary-container)] flex items-center justify-center text-2xl font-bold text-[var(--on-primary-container)]">
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--on-surface)]">{user?.username || 'Guest'}</h2>
            <p className="text-sm text-[var(--on-surface-variant)]">{user?.email || 'Not signed in'}</p>
          </div>
        </div>

        <div className="border-t border-[var(--outline-variant)] pt-4">
          <div className="flex items-center justify-between">
            <span className="text-[var(--on-surface-variant)]">Premium Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isPremium ? 'bg-green-500/20 text-green-400' : 'bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]'}`}>
              {isPremium ? 'Active' : 'Free'}
            </span>
          </div>
          {user?.premium_expires_at && (
            <p className="text-xs text-[var(--on-surface-variant)] mt-1">Expires: {new Date(user.premium_expires_at).toLocaleDateString()}</p>
          )}
        </div>

        {user && (
          <div className="border-t border-[var(--outline-variant)] pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--on-surface-variant)]">User ID</span>
              <span className="text-[var(--on-surface)]">{user.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--on-surface-variant)]">Account Type</span>
              <span className="text-[var(--on-surface)]">{user.is_admin ? 'Admin' : 'User'}</span>
            </div>
          </div>
        )}

        <div className="border-t border-[var(--outline-variant)] pt-4 space-y-2">
          {!isPremium && (
            <button
              onClick={() => navigate('/premium')}
              className="w-full py-3 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold hover:opacity-90 transition-opacity"
            >
              Upgrade to Premium
            </button>
          )}
          {user && (
            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 font-semibold hover:bg-red-500/20 transition-colors"
            >
              Sign Out
            </button>
          )}
          {!user && (
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold hover:opacity-90 transition-opacity"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
