import React, { useState, useRef, useEffect } from 'react';
import { LuBlocks as Blocks, LuChevronDown as ChevronDown, LuCheck as Check, LuLock as Lock } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import useContentStore from '../../lib/zustand/contentStore';
import useAuthStore from '../../lib/zustand/authStore';
import { FocusableButton } from './FocusableButton';
import { settingsStorage } from '../../lib/storage';
import { toast } from '../../lib/zustand/toastStore';
import './ProviderSwitcher.css';

export const ProviderSwitcher: React.FC = () => {
  const { installedProviders, provider: activeProvider, setProvider } = useContentStore();
  const isAdmin = useAuthStore((s) => s.user?.is_admin);
  const isPremium = useAuthStore((s) => s.isPremium);
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Provider switching is an entitled action: premium or admin. Everyone
  // sees the switcher (locked) so the feature is discoverable.
  const canSwitch = !!isPremium || !!isAdmin;

  // 18+ providers stay out of the switcher unless the age gate is on.
  const adultAllowed = settingsStorage.isAdultEnabled();
  const visibleProviders = (installedProviders || []).filter(
    (p) => adultAllowed || !p.is_adult,
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!visibleProviders || visibleProviders.length === 0) {
    return null;
  }

  const handleSelect = (provider: any) => {
    if (!canSwitch) {
      if (!token) {
        toast({ type: 'warning', title: 'লগইন করুন', message: 'Provider পরিবর্তন করতে আগে লগইন করুন।' });
        navigate('/login');
      } else {
        toast({ type: 'warning', title: 'প্রিমিয়াম প্রয়োজন', message: 'Provider পরিবর্তন করতে Premium নিন অথবা admin-এর সাথে যোগাযোগ করুন।' });
        navigate('/premium');
      }
      setIsOpen(false);
      return;
    }
    setProvider(provider);
    setIsOpen(false);
  };

  return (
    <div className="provider-switcher-container" ref={dropdownRef}>
      <FocusableButton
        className="provider-switcher-button glass-overlay"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Blocks size={18} />
        <span className="label-md truncate">
          {activeProvider?.display_name || 'Select Provider'}
        </span>
        <ChevronDown size={18} className={`chevron ${isOpen ? 'open' : ''}`} />
      </FocusableButton>

      {isOpen && (
        <div className="provider-dropdown glass-overlay">
          {visibleProviders.map(provider => (
            <FocusableButton
              key={`${provider.source?.author}:${provider.value}`}
              className={`provider-option ${activeProvider?.value === provider.value ? 'active' : ''}`}
              onClick={() => handleSelect(provider)}
            >
              <div className="provider-option-info">
                {provider.icon ? (
                  <img src={provider.icon} alt="" className="provider-icon-small" />
                ) : (
                  <Blocks size={16} />
                )}
                <span className="label-md truncate">{provider.display_name}</span>
              </div>
              {activeProvider?.value === provider.value && (
                <Check size={16} className="text-primary" />
              )}
              {!canSwitch && <Lock size={14} style={{ opacity: 0.6 }} />}
            </FocusableButton>
          ))}
        </div>
      )}
    </div>
  );
};
