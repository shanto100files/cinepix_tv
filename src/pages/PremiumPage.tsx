import { useState, useEffect } from 'react';
import { LuCrown, LuCheck, LuSparkles, LuZap, LuShieldCheck, LuClock3 } from 'react-icons/lu';
import useAuthStore from '../lib/zustand/authStore';
import { trackEvent } from '../lib/services/analyticsService';
import { FocusableButton } from '../components/layout/FocusableButton';
import './PremiumPage.css';

const API_BASE = 'https://cinepix.top/api/app';
const HARDCODED_KEY = '78a0e573dfd894d443685159b2e71e2f';

interface Package {
  id: number;
  name: string;
  price: number;
  currency: string;
  duration_days: number;
  features: string;
}

const PLAN_ICONS = [LuClock3, LuZap, LuSparkles, LuCrown];

export function PremiumPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [paymentNumbers, setPaymentNumbers] = useState({ bkash: '', nagad: '', rocket: '' });
  const [, setAdminContact] = useState({ phone: '', telegram: '' });
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const user = useAuthStore(s => s.user);
  const isPremium = useAuthStore(s => s.isPremium);
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    fetch(`${API_BASE}/premium-packages`, {
      headers: { 'X-App-Key': HARDCODED_KEY },
    })
      .then(r => r.json())
      .then(data => {
        setPackages(data.packages || []);
        setPaymentNumbers(data.payment_numbers || {});
        setAdminContact(data.admin_contact || {});
      })
      .catch(() => {});
  }, []);

  const handleSubscribe = async () => {
    if (!selectedPkg || !token) return;
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const res = await fetch(`${API_BASE}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-App-Key': HARDCODED_KEY,
        },
        body: JSON.stringify({
          package_id: selectedPkg.id,
          payment_method: paymentMethod,
          transaction_id: transactionId,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsg(data.msg || 'Request submitted!');
        trackEvent('premium_subscribe', { package: selectedPkg.name });
        setSelectedPkg(null);
        setTransactionId('');
      } else {
        setError(data.error || 'Failed');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  if (isPremium) {
    const expiry = user?.premium_expires_at
      ? new Date(user.premium_expires_at).toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null;
    return (
      <div className="premium-page">
        <div className="premium-active-card">
          <div className="premium-active-glow" aria-hidden="true" />
          <div className="premium-active-crown">
            <LuCrown size={30} />
          </div>
          <h1 className="premium-active-title">Premium Active</h1>
          <p className="premium-active-sub">
            Ad-free streaming, every provider, priority support — the full experience.
          </p>
          {expiry && <p className="premium-active-until">Valid until {expiry}</p>}
        </div>
      </div>
    );
  }

  const cheapest = packages.length
    ? Math.min(...packages.map(p => p.price))
    : 0;

  return (
    <div className="premium-page">
      {/* Header */}
      <div className="premium-header">
        <div className="premium-header-crown">
          <LuCrown size={26} />
        </div>
        <div>
          <h1 className="headline-lg premium-title">Go Premium</h1>
          <p className="premium-subtitle">
            Unlock every provider, zero ads, priority support.
          </p>
        </div>
      </div>

      {/* Perks strip */}
      <div className="premium-perks">
        <div className="premium-perk"><LuZap size={15} /> Ad-free streaming</div>
        <div className="premium-perk"><LuSparkles size={15} /> All providers</div>
        <div className="premium-perk"><LuShieldCheck size={15} /> Priority support</div>
      </div>

      {/* Plan cards */}
      <div className="premium-plans">
        {packages.map((pkg, index) => {
          const Icon = PLAN_ICONS[index % PLAN_ICONS.length];
          const isSelected = selectedPkg?.id === pkg.id;
          const isBestValue = pkg.price === cheapest && packages.length > 1;
          return (
            <FocusableButton
              key={pkg.id}
              focusKey={`PREMIUM_PLAN_${pkg.id}`}
              className={`premium-plan ${isSelected ? 'selected' : ''} ${isBestValue ? 'best' : ''}`}
              onClick={() => setSelectedPkg(pkg)}
            >
              {isBestValue && <span className="premium-plan-badge">Best value</span>}
              <div className="premium-plan-head">
                <span className="premium-plan-icon"><Icon size={18} /></span>
                <div className="premium-plan-names">
                  <h3 className="premium-plan-name">{pkg.name}</h3>
                  <p className="premium-plan-duration">{pkg.duration_days} days</p>
                </div>
                <div className="premium-plan-price">
                  <span className="premium-plan-amount">৳{pkg.price}</span>
                  <span className="premium-plan-per">
                    ৳{(pkg.price / pkg.duration_days).toFixed(1)}/day
                  </span>
                </div>
              </div>
              <div className="premium-plan-features">
                {(pkg.features || '').split(',').map((f, i) => (
                  <span key={i} className="premium-plan-feature">
                    <LuCheck size={13} /> {f.trim()}
                  </span>
                ))}
              </div>
              <span className={`premium-plan-check ${isSelected ? 'on' : ''}`}>
                {isSelected && <LuCheck size={13} />}
              </span>
            </FocusableButton>
          );
        })}
      </div>

      {/* Payment panel */}
      {selectedPkg && (
        <div className="premium-payment">
          <h3 className="premium-payment-title">
            Pay for <span>{selectedPkg.name}</span>
          </h3>

          <div className="premium-methods">
            {['bkash', 'nagad', 'rocket'].map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`premium-method ${paymentMethod === method ? 'active' : ''}`}
              >
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </button>
            ))}
          </div>

          <div className="premium-sendto">
            <p className="premium-sendto-label">
              Send <strong>৳{selectedPkg.price}</strong> to this number
            </p>
            <p className="premium-sendto-number">
              {paymentMethod === 'bkash'
                ? paymentNumbers.bkash
                : paymentMethod === 'nagad'
                  ? paymentNumbers.nagad
                  : paymentNumbers.rocket}
            </p>
          </div>

          <input
            type="text"
            value={transactionId}
            onChange={e => setTransactionId(e.target.value)}
            placeholder="Transaction ID (e.g. 9F7A2K1B)"
            className="premium-tx-input"
          />

          {error && <div className="premium-alert error">{error}</div>}
          {msg && <div className="premium-alert success">{msg}</div>}

          <button
            onClick={handleSubscribe}
            disabled={loading || !transactionId.trim()}
            className="premium-submit"
          >
            {loading ? 'Submitting…' : 'Submit Request'}
          </button>
          <p className="premium-note">
            Requests are reviewed manually — activation usually takes a few minutes.
          </p>
        </div>
      )}
    </div>
  );
}
