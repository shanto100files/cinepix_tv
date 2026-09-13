import { useState, useEffect } from 'react';
import useAuthStore from '../lib/zustand/authStore';
import { trackEvent } from '../lib/services/analyticsService';

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

export function PremiumPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [paymentNumbers, setPaymentNumbers] = useState({ bkash: '', nagad: '', rocket: '' });
  const [adminContact, setAdminContact] = useState({ phone: '', telegram: '' });
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
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="rounded-2xl bg-[var(--surface-container)] border border-[var(--outline-variant)] p-8 text-center">
          <div className="text-5xl mb-4">👑</div>
          <h1 className="text-2xl font-bold text-[var(--on-surface)] mb-2">Premium Active</h1>
          <p className="text-[var(--on-surface-variant)]">You have an active premium subscription.</p>
          {user?.premium_expires_at && (
            <p className="text-sm text-[var(--on-surface-variant)] mt-2">Expires: {new Date(user.premium_expires_at).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--on-surface)] mb-6">Premium Plans</h1>

      <div className="space-y-3 mb-6">
        {packages.map(pkg => (
          <div
            key={pkg.id}
            onClick={() => setSelectedPkg(pkg)}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              selectedPkg?.id === pkg.id
                ? 'border-[var(--primary)] bg-[var(--primary-container)]'
                : 'border-[var(--outline-variant)] bg-[var(--surface-container)] hover:border-[var(--primary)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[var(--on-surface)]">{pkg.name}</h3>
                <p className="text-sm text-[var(--on-surface-variant)]">{pkg.duration_days} days</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-[var(--primary)]">৳{pkg.price}</span>
              </div>
            </div>
            {pkg.features && (
              <p className="text-xs text-[var(--on-surface-variant)] mt-2">{pkg.features}</p>
            )}
          </div>
        ))}
      </div>

      {selectedPkg && (
        <div className="rounded-2xl bg-[var(--surface-container)] border border-[var(--outline-variant)] p-6 space-y-4">
          <h3 className="font-semibold text-[var(--on-surface)]">Payment Details</h3>

          <div className="flex gap-2">
            {['bkash', 'nagad', 'rocket'].map(method => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  paymentMethod === method
                    ? 'bg-[var(--primary)] text-[var(--on-primary)]'
                    : 'bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]'
                }`}
              >
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-[var(--surface-container-high)]">
            <p className="text-xs text-[var(--on-surface-variant)]">Send ৳{selectedPkg.price} to:</p>
            <p className="text-sm font-semibold text-[var(--on-surface)] mt-1">
              {paymentMethod === 'bkash' ? paymentNumbers.bkash : paymentMethod === 'nagad' ? paymentNumbers.nagad : paymentNumbers.rocket}
            </p>
          </div>

          <input
            type="text"
            value={transactionId}
            onChange={e => setTransactionId(e.target.value)}
            placeholder="Transaction ID"
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface-container-high)] border border-[var(--outline-variant)] text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:border-[var(--primary)] transition-colors"
          />

          {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}
          {msg && <div className="p-3 rounded-lg bg-green-500/10 text-green-400 text-sm">{msg}</div>}

          <button
            onClick={handleSubscribe}
            disabled={loading || !transactionId.trim()}
            className="w-full py-3 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      )}
    </div>
  );
}
