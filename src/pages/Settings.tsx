import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../services/translation/useTranslation';
import { useStatus } from '../hooks/useStatus';
import { changePassphrase } from '../services/healthGraph';
import Referral from './Referral';
import Support from './Support';
import LanguageSelector from '../components/LanguageSelector';
import { Settings as SettingsIcon, User, Lock, Bell, CreditCard, Download, Trash2, Globe } from 'lucide-react';
import { getSetting, storeSetting } from '../lib/idb';

type Tab = 'profile' | 'security' | 'notifications' | 'subscription' | 'export' | 'delete' | 'referral' | 'support' | 'language';

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
    { id: 'export', label: 'Export', icon: Download },
    { id: 'delete', label: 'Delete', icon: Trash2 },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-slate-400">Manage your account and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'bg-slate-800/40 text-slate-300 hover:bg-slate-700/40 border border-transparent'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50 min-h-[400px]">
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'subscription' && <SubscriptionTab />}
        {activeTab === 'referral' && <Referral />}
        {activeTab === 'support' && <Support />}
        {activeTab === 'language' && <LanguageSelector />}
        {activeTab === 'export' && <ExportTab />}
        {activeTab === 'delete' && <DeleteTab />}
       </div>

      {/* Legal Links Footer */}
      <div className="mt-8 pt-6 border-t border-white/5 text-center">
        <p className="text-slate-500 text-sm">
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
  const [form, setForm] = useState({ firstName: '', lastName: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [isLoaded, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await user.update({ firstName: form.firstName, lastName: form.lastName });
      showStatus('success', 'Profile Updated', 'Your changes have been saved.');
    } catch (err) {
      console.error(err);
      showStatus('error', 'Update Failed', 'Could not update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Profile</h3>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-teal-500/30">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl text-slate-400">?</span>
          )}
        </div>
        <div>
          <div className="font-medium text-white">{user?.fullName || 'Set your name'}</div>
          <div className="text-sm text-slate-400">{user?.emailAddresses?.[0]?.emailAddress}</div>
          <button className="mt-2 text-xs text-teal-400 hover:underline">Change Photo</button>
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">First Name</label>
          <input
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
          <input
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
          <input
            disabled
            value={user?.emailAddresses?.[0]?.emailAddress || ''}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-sm text-slate-500"
          />
          <p className="text-xs text-slate-500 mt-1">Email cannot be changed here.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
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

  // Load biometric setting from IDB on mount
  useEffect(() => {
    getSetting<boolean>('biometric_enabled').then(value => {
      if (value !== null) setBiometricEnabled(value);
    });
  }, []);

  const toggleBiometric = async () => {
    const newVal = !biometricEnabled;
    setBiometricEnabled(newVal);
    await storeSetting('biometric_enabled', newVal);
    showStatus('success', newVal ? 'Biometric Enabled' : 'Biometric Disabled', '');
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
