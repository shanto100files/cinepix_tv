import { useNavigate } from 'react-router-dom';
import { LuCrown, LuLogOut, LuLogIn, LuChevronRight, LuBadgeCheck } from 'react-icons/lu';
import useAuthStore from '../lib/zustand/authStore';
import { FocusableButton } from '../components/layout/FocusableButton';
import './ProfilePage.css';

export function ProfilePage() {
  const user = useAuthStore(s => s.user);
  const isPremium = useAuthStore(s => s.isPremium);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = user?.username?.[0]?.toUpperCase() || '?';
  const expiry = user?.premium_expires_at
    ? new Date(user.premium_expires_at).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="profile-page">
      <h1 className="headline-lg profile-page-title">Profile</h1>

      {/* Hero identity card */}
      <div className={`profile-hero ${isPremium ? 'profile-hero-premium' : ''}`}>
        <div className="profile-hero-glow" aria-hidden="true" />
        <div className="profile-hero-inner">
          <div className="profile-avatar">
            {initial}
            {isPremium && <span className="profile-avatar-crown"><LuCrown size={13} /></span>}
          </div>
          <div className="profile-hero-copy">
            <h2 className="profile-name">
              {user?.username || 'Guest'}
              {isPremium && <LuBadgeCheck size={17} className="profile-verified" />}
            </h2>
            <p className="profile-email">{user?.email || 'Not signed in'}</p>
            {isPremium && expiry && (
              <p className="profile-premium-until">Premium until {expiry}</p>
            )}
          </div>
          <div className={`profile-plan-chip ${isPremium ? 'premium' : ''}`}>
            {isPremium ? 'PREMIUM' : 'FREE'}
          </div>
        </div>
      </div>

      {/* Account details */}
      {user && (
        <div className="profile-card">
          <div className="profile-detail-row">
            <span className="profile-detail-label">User ID</span>
            <span className="profile-detail-value">#{user.id}</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-detail-label">Account Type</span>
            <span className="profile-detail-value">{user.is_admin ? 'Admin' : 'User'}</span>
          </div>
          <div className="profile-detail-row">
            <span className="profile-detail-label">Premium Status</span>
            <span className={`profile-plan-pill ${isPremium ? 'premium' : ''}`}>
              {isPremium ? 'Active' : 'Free plan'}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="profile-actions">
        {!isPremium && (
          <FocusableButton
            className="profile-cta-premium"
            onClick={() => navigate('/premium')}
          >
            <LuCrown size={18} />
            <span>Upgrade to Premium</span>
            <span className="profile-cta-sub">Ad-free · All providers · 4K</span>
          </FocusableButton>
        )}
        {user ? (
          <FocusableButton className="profile-cta-ghost" onClick={handleLogout}>
            <LuLogOut size={16} />
            <span>Sign Out</span>
          </FocusableButton>
        ) : (
          <FocusableButton
            className="profile-cta-premium"
            onClick={() => navigate('/login')}
          >
            <LuLogIn size={18} />
            <span>Sign In</span>
          </FocusableButton>
        )}
        {isPremium && (
          <div className="profile-manage-hint">
            Manage plan <LuChevronRight size={14} />
          </div>
        )}
      </div>
    </div>
  );
}
