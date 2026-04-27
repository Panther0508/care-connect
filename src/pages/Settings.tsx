import { useState } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../services/translation/useTranslation';

type Tab = 'profile' | 'security' | 'notifications' | 'subscription' | 'export' | 'delete';

export default function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'export', label: 'Export Data' },
    { id: 'delete', label: 'Delete Account' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 p-4 pb-24"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('settings')}</h1>
          <p className="text-slate-400">Manage your account and preferences</p>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>

      <div className="flex gap-4 border-b border-slate-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-teal-400 border-b-2 border-teal-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/50 min-h-[400px]">
        {activeTab === 'profile' && <ProfileTab t={t} />}
        {activeTab === 'security' && <SecurityTab t={t} />}
        {activeTab === 'notifications' && <NotificationsTab t={t} />}
        {activeTab === 'subscription' && <SubscriptionTab t={t} />}
        {activeTab === 'export' && <ExportTab t={t} />}
        {activeTab === 'delete' && <DeleteTab t={t} />}
      </div>
    </motion.div>
  );
}

function ProfileTab({ t }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Profile</h3>
      <p className="text-slate-400">Profile editing coming soon. Use Clerk's UserButton for sign-out.</p>
    </div>
  );
}

function SecurityTab({ t }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Security</h3>
      <div className="space-y-2">
        <p>Change Passphrase</p>
        <p>Biometric Settings</p>
        <p>Two-Factor Authentication</p>
        <p>Active Sessions</p>
      </div>
    </div>
  );
}

function NotificationsTab({ t }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>
      <div className="space-y-3">
        {[
          ['mesh_alerts', 'Mesh Alerts'],
          ['appointment_reminders', 'Appointment Reminders'],
          ['medication_reminders', 'Medication Reminders'],
          ['passport_shares', 'Passport Share Confirmations'],
          ['product_updates', 'Product Updates'],
        ].map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-slate-300">{label}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubscriptionTab({ t }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Subscription</h3>
      <div className="bg-slate-900/40 p-4 rounded-lg">
        <p className="text-slate-300">Current Plan: <span className="font-semibold text-teal-400">Free</span></p>
        <p className="text-sm text-slate-400 mt-2">Upgrade to Premium for additional features.</p>
        <button className="mt-4 px-6 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg font-semibold transition-colors">
          View Plans
        </button>
      </div>
    </div>
  );
}

function ExportTab({ t }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Export Your Data</h3>
      <p className="text-slate-400">Download a copy of your health records in various formats.</p>
      <div className="flex flex-wrap gap-3">
        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
          Export as PDF
        </button>
        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
          Export as JSON
        </button>
        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
          Export as VC
        </button>
      </div>
    </div>
  );
}

function DeleteTab({ t }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

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
        <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg">
          <p className="text-red-200 mb-4">Are you sure? This will permanently erase all your health records.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alert('Account deletion requested');
                setConfirmDelete(false);
              }}
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
