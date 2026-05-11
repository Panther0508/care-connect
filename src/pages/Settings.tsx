import { useState, useEffect, useRef } from 'react';
import { useAuth } from "../context/AuthContext";
import { motion } from 'framer-motion';
import { useTranslation } from '../services/translation/useTranslation';
import { useStatus } from '../hooks/useStatus';
import { changePassphrase } from '../services/healthGraph';
import Referral from './Referral';
import Support from './Support';
import LanguageSelector from '../components/LanguageSelector';
import { Settings as SettingsIcon, User, Lock, Bell, CreditCard, Download, Trash2, Globe, Mic, Camera } from 'lucide-react';
import { getSetting, storeSetting } from '../lib/idb';
import { getUserProfile, storeUserProfile, type UserProfile } from '../lib/idb';
import PWAInstallPrompt from '../components/PWAInstallPrompt';
import { registerBiometric, disableBiometric, isBiometricRegistered } from '../services/biometricAuth';

type Tab = 'profile' | 'security' | 'notifications' | 'subscription' | 'export' | 'delete' | 'referral' | 'support' | 'language' | 'voice' | 'install';

export default function Settings() {
  const { t } = useTranslation();
  const { showStatus } = useStatus();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'referral', label: 'Referral', icon: SettingsIcon },
    { id: 'support', label: 'Help & Support', icon: SettingsIcon },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'voice', label: 'Voice Mode', icon: Mic },
    { id: 'install', label: 'Install', icon: Download },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'delete', label: 'Delete', icon: Trash2 },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white leading-tight mb-1">Settings</h1>
        <p className="text-slate-400 text-sm">Manage your account and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 min-w-[90px] flex items-center gap-2 px-4 py-3 rounded-xl text-lg font-medium whitespace-nowrap transition-all border ${
                  activeTab === tab.id
                    ? 'bg-teal-500/15 border-teal-500/40 text-teal-100'
                    : 'bg-slate-800/50 border-slate-700/30 text-slate-300 hover:bg-slate-700/50 hover:border-teal-500/30'
                }`}
              >
              <Icon size={20} />
              {tab.label}
            </button>
          );
        })}
        {/* Gradient fade indicator on right edge */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent" />
      </div>

      {/* Tab Content */}
      <div className="glass-card p-6 min-h-[400px]">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'subscription' && <SubscriptionTab />}
        {activeTab === 'referral' && <Referral />}
        {activeTab === 'support' && <Support />}
        {activeTab === 'language' && <LanguageSelector />}
        {activeTab === 'voice' && <VoiceTab />}
        {activeTab === 'install' && <PWAInstallPrompt />}
        {activeTab === 'export' && <ExportTab />}
        {activeTab === 'delete' && <DeleteTab />}
      </div>

      {/* Legal Links Footer */}
      <div className="mt-8 pt-6 border-t border-white/5 text-center">
        <p className="text-slate-500 text-xs">
          <span className="mx-2">© 2026 VitaChain.</span>
          <a href="/terms" className="text-teal-400 hover:underline mx-1">Terms</a>
          <span className="text-slate-600 mx-1">•</span>
          <a href="/privacy" className="text-teal-400 hover:underline mx-1">Privacy</a>
          <span className="text-slate-600 mx-1">•</span>
          <a href="/contact" className="text-teal-400 hover:underline mx-1">Contact</a>
        </p>
      </div>
    </motion.div>
  );
}

function ProfileTab() {
  const { user, isLoaded } = useAuth();
  const { showStatus } = useStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    displayName: '',
    phone: '',
    gender: '' as 'male' | 'female' | 'non-binary' | 'other' | 'prefer-not-to-say' | '',
    otherGender: '',
    biologicalSex: '' as 'male' | 'female' | '',
    dateOfBirth: '',
    height: '',
    weight: '',
    activityLevel: '' as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | '',
    preferredLanguage: 'en',
    avatarUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [photoChanging, setPhotoChanging] = useState(false);

  // Load IDB profile on mount
  useEffect(() => {
    async function load() {
      if (!user?.id) return;
      try {
        const profile = await getUserProfile(user.id);
        if (profile) {
          setForm({
            displayName: profile.displayName || '',
            phone: profile.phone || '',
            gender: profile.gender || '',
            otherGender: '',
            biologicalSex: profile.biologicalSex || '',
            dateOfBirth: profile.dateOfBirth || '',
            height: profile.height?.toString() || '',
            weight: profile.weight?.toString() || '',
            activityLevel: profile.activityLevel || '',
            preferredLanguage: profile.preferredLanguage || 'en',
            avatarUrl: profile.avatarUrl || '',
          });
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      }
    }
    load();
  }, [user]);

  // Fallback: populate displayName from Clerk if empty
  useEffect(() => {
    if (isLoaded && user && !form.displayName) {
      setForm(prev => ({ ...prev, displayName: user.fullName || '' }));
    }
  }, [isLoaded, user, form.displayName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPhotoChanging(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      // Update state
      setForm(prev => ({ ...prev, avatarUrl: dataUrl }));
      // Also store immediately to IDB (merge with existing)
      const current = await getUserProfile(user.id);
      const toStore: UserProfile = {
        userId: user.id,
        displayName: current?.displayName || form.displayName,
        phone: current?.phone || form.phone,
        gender: (current?.gender || form.gender) as any,
        biologicalSex: (current?.biologicalSex || form.biologicalSex) as any,
        dateOfBirth: current?.dateOfBirth || form.dateOfBirth,
        height: current?.height ?? (form.height ? Number(form.height) : null),
        weight: current?.weight ?? (form.weight ? Number(form.weight) : null),
        activityLevel: (current?.activityLevel || form.activityLevel) as any,
        avatarUrl: dataUrl,
        preferredLanguage: current?.preferredLanguage || form.preferredLanguage,
        enableCycleTracking: current?.enableCycleTracking || false,
        createdAt: current?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      await storeUserProfile(toStore);
      showStatus('success', 'Photo Updated', 'Your profile photo has been changed.');
    } catch (err) {
      console.error('Photo upload failed:', err);
      showStatus('error', 'Upload Failed', 'Could not update photo.');
    } finally {
      setPhotoChanging(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const profile: UserProfile = {
        userId: user.id,
        displayName: form.displayName,
        phone: form.phone,
        gender: form.gender as any,
        biologicalSex: form.biologicalSex as any,
        dateOfBirth: form.dateOfBirth || null,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        activityLevel: form.activityLevel as any,
        avatarUrl: form.avatarUrl,
        preferredLanguage: form.preferredLanguage,
        enableCycleTracking: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await storeUserProfile(profile);
      // Sync to Clerk publicMetadata (best-effort)
      try {
        await user.update({
          publicMetadata: {
            displayName: form.displayName,
            phone: form.phone,
            gender: form.gender,
            biologicalSex: form.biologicalSex,
            dateOfBirth: form.dateOfBirth,
            height: form.height,
            weight: form.weight,
            activityLevel: form.activityLevel,
            preferredLanguage: form.preferredLanguage,
            avatarUrl: form.avatarUrl,
          }
        });
      } catch (e) {
        console.warn('Clerk publicMetadata update failed (non-critical):', e);
      }
      showStatus('success', 'Profile Saved', 'Your profile has been updated.');
    } catch (err) {
      console.error('Save failed:', err);
      showStatus('error', 'Save Failed', 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Profile</h3>

      {/* Avatar & Photo Upload */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-teal-500/30">
          {form.avatarUrl ? (
            <img src={form.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : user?.imageUrl ? (
            <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl text-slate-400">{form.displayName?.charAt(0) || '?'}</span>
          )}
        </div>
        <div>
          <div className="font-medium text-white">{form.displayName || 'Set your name'}</div>
          <div className="text-sm text-slate-400">{user?.emailAddresses?.[0]?.emailAddress}</div>
          <label className="mt-2 inline-block text-base text-teal-400 hover:underline cursor-pointer">
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
              onChange={handlePhotoSelect}
              disabled={photoChanging}
            />
            {photoChanging ? 'Changing...' : 'Change Photo'}
          </label>
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <label className="block text-base font-medium text-slate-300 mb-1">Display Name</label>
          <input
            name="displayName"
            value={form.displayName}
            onChange={handleChange}
            placeholder="Your display name"
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-base text-slate-100 focus:border-teal-400"
          />
        </div>

        <div>
          <label className="block text-base font-medium text-slate-300 mb-1">Phone Number</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+234801234567"
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-base text-slate-100 focus:border-teal-400"
          />
          <p className="text-slate-500 text-sm mt-1">Nigerian or international format</p>
        </div>

        <div>
          <label className="block text-base font-medium text-slate-300 mb-2">Gender</label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['male','female','non-binary','other','prefer-not-to-say'] as const).map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, gender: g }))}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-base font-medium border transition-all ${
                  form.gender === g
                    ? 'bg-teal-500/20 border-teal-500/40 text-teal-100'
                    : 'bg-slate-800/50 border-slate-700/30 text-slate-300'
                }`}
              >
                {g.charAt(0).toUpperCase() + g.slice(1).replace('-',' ')}
              </button>
            ))}
          </div>
          {form.gender === 'other' && (
            <input
              name="otherGender"
              value={form.otherGender}
              onChange={handleChange}
              placeholder="Specify gender"
              className="w-full px-3 py-2 mt-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-base text-slate-100 focus:border-teal-400"
            />
          )}
        </div>

        <div>
          <label className="block text-base font-medium text-slate-300 mb-2">Biological Sex</label>
          <div className="flex gap-2">
            {['male','female'].map(sex => (
              <button
                key={sex}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, biologicalSex: sex }))}
                className={`flex-1 py-2 rounded-lg text-base font-medium border transition-all ${
                  form.biologicalSex === sex
                    ? 'bg-teal-500/20 border-teal-500/40 text-teal-100'
                    : 'bg-slate-800/50 border-slate-700/30 text-slate-300'
                }`}
              >
                {sex.charAt(0).toUpperCase() + sex.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-slate-500 text-sm mt-1">Used for fitness calculations</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-base font-medium text-slate-300 mb-1">Date of Birth</label>
            <input
              name="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-base text-slate-100 focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-base font-medium text-slate-300 mb-1">Preferred Language</label>
            <select
              name="preferredLanguage"
              value={form.preferredLanguage}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-base text-slate-100 focus:border-teal-400"
            >
              <option value="en">English</option>
              <option value="ig">Igbo</option>
              <option value="ha">Hausa</option>
              <option value="yo">Yoruba</option>
              <option value="pcm">Nigerian Pidgin</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-base font-medium text-slate-300 mb-1">Height (cm)</label>
            <input
              name="height"
              type="number"
              min="50"
              max="300"
              value={form.height}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-base text-slate-100 focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-base font-medium text-slate-300 mb-1">Weight (kg)</label>
            <input
              name="weight"
              type="number"
              min="20"
              max="500"
              value={form.weight}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-base text-slate-100 focus:border-teal-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-base font-medium text-slate-300 mb-1">Activity Level</label>
          <select
            name="activityLevel"
            value={form.activityLevel}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-base text-slate-100 focus:border-teal-400"
          >
            <option value="">Select activity level</option>
            <option value="sedentary">Sedentary</option>
            <option value="light">Light</option>
            <option value="moderate">Moderate</option>
            <option value="active">Active</option>
            <option value="very_active">Very Active</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors mt-4"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function SecurityTab() {
  const { user } = useAuth();
  const { showStatus } = useStatus();
  const [passCurrent, setPassCurrent] = useState('');
  const [passNew, setPassNew] = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [changing, setChanging] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Guest Mode state
  const [guestModeEnabled, setGuestModeEnabled] = useState(false);
  const [guestPin, setGuestPin] = useState('');
  const [guestPinConfirm, setGuestPinConfirm] = useState('');
  const [savingGuest, setSavingGuest] = useState(false);
  const [hasGuestPin, setHasGuestPin] = useState(false);

  // Load settings from IDB on mount
  useEffect(() => {
    getSetting<boolean>('biometric_enabled').then(value => {
      if (value !== null) setBiometricEnabled(value);
    });
    getSetting<boolean>('guest_mode_enabled').then(value => {
      if (value) setGuestModeEnabled(value);
    });
    getSetting<string>('guest_pin_hash').then(value => {
      if (value) setHasGuestPin(true);
    });
  }, []);

   const toggleBiometric = async () => {
     const newVal = !biometricEnabled;

     if (newVal) {
       // Enabling biometrics — register credential
       if (!user?.id) {
         showStatus('error', 'Cannot enable', 'You must be logged in to enable biometrics');
         return;
       }
       const result = await registerBiometric(user.id);
       if (!result.success) {
         showStatus('error', 'Registration Failed', result.error || 'Could not register biometric');
         return;
       }
       setBiometricEnabled(true);
       await storeSetting('biometric_enabled', true);
       showStatus('success', 'Biometric Enabled', 'You can now use fingerprint/face to unlock');
     } else {
       // Disabling biometrics — clear credentials
       if (user?.id) {
         await disableBiometric(user.id);
       }
       setBiometricEnabled(false);
       await storeSetting('biometric_enabled', false);
       showStatus('success', 'Biometric Disabled', 'Biometric unlock has been turned off');
     }
   };

  // Hash PIN using SHA-256
  const hashPin = async (pin: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const saveGuestPin = async () => {
    if (guestPin.length < 4) {
      showStatus('error', 'PIN Too Short', 'Use at least 4 digits');
      return;
    }
    if (guestPin !== guestPinConfirm) {
      showStatus('error', 'PINs Mismatch', 'Please ensure both PINs match');
      return;
    }
    setSavingGuest(true);
    try {
      const pinHash = await hashPin(guestPin);
      await storeSetting('guest_mode_enabled', true);
      await storeSetting('guest_pin_hash', pinHash);
      setGuestModeEnabled(true);
      setHasGuestPin(true);
      setGuestPin('');
      setGuestPinConfirm('');
      showStatus('success', 'Guest Mode Enabled', 'Your PIN has been set. You will need it to access the app.');
    } catch (err) {
      console.error('Failed to save guest PIN:', err);
      showStatus('error', 'Error', 'Could not save PIN');
    } finally {
      setSavingGuest(false);
    }
  };

   const disableGuestMode = async () => {
     setSavingGuest(true);
     try {
       await storeSetting('guest_mode_enabled', false);
       setGuestModeEnabled(false);
       showStatus('success', 'Guest Mode Disabled', 'PIN requirement removed');
     } catch (err) {
       console.error('Failed to disable guest mode:', err);
     } finally {
       setSavingGuest(false);
     }
   };

   const handlePassphraseChange = async () => {
     if (!passCurrent || !passNew || !passConfirm) {
       showStatus('error', 'Missing Fields', 'Please fill in all passphrase fields');
       return;
     }
     if (passNew !== passConfirm) {
       showStatus('error', 'Mismatch', 'New passphrase and confirmation do not match');
       return;
     }
     setChanging(true);
     try {
       await changePassphrase(passCurrent, passNew);
       showStatus('success', 'Passphrase Changed', 'Your health data encryption passphrase has been updated');
       setPassCurrent('');
       setPassNew('');
       setPassConfirm('');
     } catch (err: any) {
       showStatus('error', 'Change Failed', err?.message || 'Could not change passphrase');
     } finally {
       setChanging(false);
     }
   };

   return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Security</h3>

      {/* Change Passphrase */}
      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
        <h4 className="font-medium text-white mb-3">Change Passphrase</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Current Passphrase</label>
            <input
              type="password"
              value={passCurrent}
              onChange={(e) => setPassCurrent(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">New Passphrase</label>
            <input
              type="password"
              value={passNew}
              onChange={(e) => setPassNew(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Confirm New Passphrase</label>
            <input
              type="password"
              value={passConfirm}
              onChange={(e) => setPassConfirm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
            />
          </div>
          <button
            onClick={handlePassphraseChange}
            disabled={changing || !passCurrent || !passNew || !passConfirm}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
          >
            {changing ? 'Changing...' : 'Change Passphrase'}
          </button>
        </div>
      </div>

      {/* Biometric Settings */}
      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-white">Biometric Unlock</h4>
            <p className="text-xs text-slate-400">Use fingerprint or face ID to unlock the app</p>
          </div>
          <button
            onClick={toggleBiometric}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${biometricEnabled ? 'bg-teal-600' : 'bg-slate-600'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${biometricEnabled ? 'translate-x-6' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {biometricEnabled ? 'Biometric unlock is active. App will require auth after 15 minutes of inactivity.' : 'Enable for faster, secure access.'}
        </p>
      </div>

      {/* Guest Mode PIN Gate */}
      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium text-white">Guest Mode PIN Protection</h4>
            <p className="text-xs text-slate-400">Require PIN to access the app</p>
          </div>
          <button
            onClick={() => {
              if (guestModeEnabled) {
                disableGuestMode();
              } else {
                setGuestPin('');
                setGuestPinConfirm('');
                setGuestModeEnabled(true);
              }
            }}
            disabled={savingGuest}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${guestModeEnabled ? 'bg-teal-600' : 'bg-slate-600'} disabled:opacity-50`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${guestModeEnabled ? 'translate-x-6' : ''}`} />
          </button>
        </div>
        {guestModeEnabled && (
          <div className="space-y-3">
            {!hasGuestPin ? (
              <>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Set PIN (4-6 digits)</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={guestPin}
                    onChange={e => setGuestPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
                    placeholder="Enter PIN"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Confirm PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={guestPinConfirm}
                    onChange={e => setGuestPinConfirm(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
                    placeholder="Confirm PIN"
                  />
                </div>
                <button
                  onClick={saveGuestPin}
                  disabled={savingGuest || guestPin.length < 4 || guestPin !== guestPinConfirm}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                  {savingGuest ? 'Saving...' : 'Save PIN'}
                </button>
              </>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">PIN is set. You can change it below.</span>
                <button
                  onClick={() => {
                    setGuestPin('');
                    setGuestPinConfirm('');
                    setHasGuestPin(false);
                  }}
                  className="text-xs text-amber-400 hover:underline"
                >
                  Change PIN
                </button>
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-slate-500 mt-2">
          When enabled, you will need to enter this PIN each time you open the app.
        </p>
      </div>

      {/* MFA Status */}
      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
        <h4 className="font-medium text-white mb-2">Two-Factor Authentication</h4>
        {user?.twoFactorEnabled ? (
          <div className="flex items-center gap-2 text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Enabled
          </div>
        ) : (
          <div className="text-amber-400">Not enabled – required for admin accounts</div>
        )}
        <p className="text-xs text-slate-500 mt-2">Managed through your Clerk account settings.</p>
      </div>

      {/* Active Sessions placeholder */}
      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
        <h4 className="font-medium text-white mb-2">Active Sessions</h4>
        <p className="text-sm text-slate-400">This device – Active now</p>
        <p className="text-xs text-slate-500 mt-1">Other sessions can be managed through Clerk.</p>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const { showStatus } = useStatus();
  const [prefs, setPrefs] = useState({
    mesh_alerts: true,
    appointment_reminders: true,
    medication_reminders: true,
    passport_shares: true,
    product_updates: false,
  });

  // Load prefs from IDB on mount
  useEffect(() => {
    getSetting<typeof prefs>('notification_prefs').then(stored => {
      if (stored) setPrefs(stored);
    });
  }, []);

  const toggle = async (key: keyof typeof prefs) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      return next;
    });
    // Persist to IDB (use next value after state update)
    const next = { ...prefs, [key]: !prefs[key] };
    await storeSetting('notification_prefs', next);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>
      <div className="space-y-3">
        {Object.entries(prefs).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-slate-300">{key.replace('_', ' ')}</span>
            <button
              onClick={() => toggle(key as keyof typeof prefs)}
              className={`w-11 h-6 rounded-full p-1 transition-colors ${prefs[key as keyof typeof prefs] ? 'bg-teal-600' : 'bg-slate-600'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${prefs[key as keyof typeof prefs] ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function VoiceTab() {
  const { showStatus } = useStatus();
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSetting<boolean>('voice_mode_enabled').then(value => {
      if (value !== null) setVoiceEnabled(value);
    });
  }, []);

  const toggleVoiceMode = async () => {
    setSaving(true);
    const newVal = !voiceEnabled;
    try {
      await storeSetting('voice_mode_enabled', newVal);
      setVoiceEnabled(newVal);
      showStatus('success', newVal ? 'Voice Mode Enabled' : 'Voice Mode Disabled', '');
    } catch (err) {
      console.error('Failed to toggle voice mode:', err);
      showStatus('error', 'Error', 'Could not update voice mode');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Voice Mode</h3>

      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium text-white">Voice-Only Mode</h4>
            <p className="text-xs text-slate-400">Use语音和听问答 interact with Vita AI via voice</p>
          </div>
          <button
            onClick={toggleVoiceMode}
            disabled={saving}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${voiceEnabled ? 'bg-teal-600' : 'bg-slate-600'} disabled:opacity-50`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${voiceEnabled ? 'translate-x-6' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-slate-500">
          When enabled, you can speak to Vita AI and hear responses. This mode uses your device's microphone and speaker.
        </p>
      </div>

      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
        <h4 className="font-medium text-white mb-2">How to use</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
          <li>Open the <strong>Vita AI</strong> page from the dashboard.</li>
          <li>Tap the microphone icon to start speaking.</li>
          <li>Release to send your message; Vita will respond with voice.</li>
          <li>You can continue the conversation hands‑free.</li>
        </ol>
      </div>
    </div>
  );
}

function SubscriptionTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Subscription</h3>
      <div className="bg-slate-900/40 p-4 rounded-xl">
        <p className="text-slate-300">
          Current Plan: <span className="font-semibold text-teal-400">Free</span>
        </p>
        <p className="text-sm text-slate-400 mt-2">Upgrade to Premium for additional features.</p>
        <button className="mt-4 px-6 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg font-semibold transition-colors">
          View Plans
        </button>
      </div>
    </div>
  );
}

function ExportTab() {
  const { showStatus } = useStatus();

  const exportJSON = async () => {
    const state = await (await import('../services/healthGraph')).getCurrentHealthState();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vitachain-health-export.json';
    a.click();
    URL.revokeObjectURL(url);
    showStatus('success', 'Export Complete', 'Your health data has been downloaded.');
  };

  const exportVC = async () => {
    // Use passport service to create credential
    try {
      const { createCredential, encodeCredential } = await import('../lib/vc');
      const { getCurrentHealthState } = await import('../services/healthGraph');
      const health = getCurrentHealthState();
      const vc = await createCredential({
        issuer: 'did:vitachain:admin',
        subject: 'self',
        type: 'HealthSummary',
        issuanceDate: new Date().toISOString(),
        data: health,
      });
      const vcJson = encodeCredential(vc);
      const blob = new Blob([vcJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vitachain-health-credential.json';
      a.click();
      URL.revokeObjectURL(url);
      showStatus('success', 'Credential Exported', 'Verifiable credential downloaded.');
    } catch (err) {
      console.error(err);
      showStatus('error', 'Export Failed', 'Could not generate verifiable credential.');
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Export Your Data</h3>
      <p className="text-slate-400">Download a copy of your health records in various formats.</p>
      <div className="flex flex-wrap gap-3">
        <button onClick={exportJSON} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
          Export JSON
        </button>
        <button onClick={exportVC} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
          Export VC
        </button>
        <button onClick={handlePrintPDF} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
          Save as PDF
        </button>
      </div>
    </div>
  );
}

function DeleteTab() {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { showStatus } = useStatus();

  const handleDelete = async () => {
    // In production: call Clerk's deleteUser API and clear IndexedDB
    showStatus('error', 'Not Implemented', 'Account deletion will be available in a future update.');
    setConfirmDelete(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-red-400">Delete Account</h3>
      <p className="text-slate-400">
        Permanently delete your account and all data. This action cannot be undone.
      </p>
      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors"
        >
          Delete My Account
        </button>
      ) : (
        <div className="bg-red-900/30 border border-red-700 p-4 rounded-xl">
          <p className="text-red-200 mb-4">Are you sure? This will permanently erase all your health records.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-colors"
            >
              Yes, Delete Everything
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
