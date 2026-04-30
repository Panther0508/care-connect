import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStatus } from '../hooks/useStatus';
import { getUserProfile, storeUserProfile, syncProfileToClerk } from '../services/userProfile';
import type { ProfileData } from '../services/userProfile';
import { User, Phone, Calendar, Ruler, Weight, Activity, Globe, Camera, Check } from 'lucide-react';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
] as const;

const BIOLOGICAL_SEX_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
] as const;

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (little to no exercise)' },
  { value: 'light', label: 'Lightly Active (1-3 days/week)' },
  { value: 'moderate', label: 'Moderately Active (3-5 days/week)' },
  { value: 'active', label: 'Very Active (6-7 days/week)' },
  { value: 'very_active', label: 'Extra Active (very active daily + physical job)' },
] as const;

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ha', name: 'Hausa' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'ig', name: 'Igbo' },
  { code: 'fr', name: 'Français' },
  { code: 'sw', name: 'Swahili' },
];

export default function ProfileEdit() {
  const { user, isLoaded } = useAuth();
  const navigate = useNavigate();
  const { showStatus } = useStatus();

  const [form, setForm] = useState<Partial<ProfileData>>({});
  const [saving, setSaving] = useState(false);
  const [otherGender, setOtherGender] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing profile
  useEffect(() => {
    const load = async () => {
      if (!isLoaded || !user) return;
      // Try IDB first
      const local = await getUserProfile(user.id);
      if (local) {
        setForm(local);
        if (local.gender === 'other') setOtherGender(local.gender);
      } else {
        // Fallback: construct from Clerk
        setForm({
          displayName: user.fullName || '',
          phone: user.phoneNumbers?.[0]?.phoneNumber || '',
          email: user.emailAddresses?.[0]?.emailAddress || '',
          gender: (user.publicMetadata as any)?.gender || '',
          biologicalSex: (user.publicMetadata as any)?.biologicalSex || '',
          dateOfBirth: (user.publicMetadata as any)?.dateOfBirth || null,
          height: (user.publicMetadata as any)?.height || null,
          weight: (user.publicMetadata as any)?.weight || null,
          activityLevel: (user.publicMetadata as any)?.activityLevel || '',
          avatarUrl: user.imageUrl || '',
          preferredLanguage: (user.publicMetadata as any)?.preferredLanguage || 'en',
          enableCycleTracking: (user.publicMetadata as any)?.enableCycleTracking || false,
        });
      }
    };
    load();
  }, [user, isLoaded]);

  // Avatar change
  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setForm(prev => ({ ...prev, avatarUrl: base64 }));
    };
    reader.readAsDataURL(file);
  }, []);

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.gender) newErrors.gender = 'Please select a gender';
    if (form.gender === 'other' && !otherGender.trim()) newErrors.otherGender = 'Specify gender';
    if (!form.biologicalSex) newErrors.biologicalSex = 'Please select biological sex';
    if (form.displayName && form.displayName.length > 100) newErrors.displayName = 'Name too long';
    if (form.phone && !/^\+?[0-9]{10,15}$/.test(form.phone)) newErrors.phone = 'Invalid phone number';
    if (form.height && (form.height < 50 || form.height > 300)) newErrors.height = 'Height must be 50-300 cm';
    if (form.weight && (form.weight < 20 || form.weight > 500)) newErrors.weight = 'Weight must be 20-500 kg';
    if (form.dateOfBirth) {
      const birth = new Date(form.dateOfBirth);
      const age = (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (birth > new Date()) newErrors.dateOfBirth = 'Date cannot be in the future';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save handler
  const handleSave = async () => {
    if (!validate()) {
      showStatus('error', 'Validation Error', 'Please correct the errors before saving.');
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const profileData: ProfileData = {
        userId: user.id,
        displayName: form.displayName || '',
        phone: form.phone || '',
        gender: form.gender || '',
        biologicalSex: form.biologicalSex || '',
        dateOfBirth: form.dateOfBirth,
        height: form.height ?? null,
        weight: form.weight ?? null,
        activityLevel: form.activityLevel || '',
        avatarUrl: form.avatarUrl || '',
        preferredLanguage: form.preferredLanguage || 'en',
        enableCycleTracking: form.enableCycleTracking || false,
      };

      // Save locally
      await storeUserProfile(profileData);

      // Sync to Clerk if online
      try {
        await syncProfileToClerk(user.id, profileData, user);
      } catch (err) {
        console.warn('Clerk sync failed (offline?), stored locally:', err);
        // Register background sync for later
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'REGISTER_SYNC', tag: 'sync-profile' });
        }
      }

      showStatus('success', 'Profile Updated', 'Your profile has been saved.');
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      console.error(err);
      showStatus('error', 'Save Failed', 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCycleTracking = () => {
    setForm(prev => ({ ...prev, enableCycleTracking: !prev.enableCycleTracking }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Edit Profile</h1>
        <p className="text-slate-400">Manage your personal information</p>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-teal-500/50">
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-slate-400" />
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-8 h-8 bg-teal-500 hover:bg-teal-600 rounded-full flex items-center justify-center cursor-pointer">
            <Camera size={14} className="text-white" />
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" id="avatar-upload" />
          </label>
        </div>
        <button onClick={() => document.getElementById('avatar-upload')?.click()} className="mt-2 text-xs text-teal-400">
          Change Photo
        </button>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Display Name</label>
          <input
            type="text"
            value={form.displayName || ''}
            onChange={e => setForm(prev => ({ ...prev, displayName: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
            placeholder="Your full name"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="tel"
              value={form.phone || ''}
              onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
              placeholder="+234..."
            />
          </div>
          {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
        </div>

        {/* Gender (Segmented) */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Gender</label>
          <div className="flex flex-wrap gap-2">
            {GENDER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setForm(prev => ({ ...prev, gender: opt.value }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.gender === opt.value ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50' : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:border-slate-600'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {errors.gender && <p className="text-xs text-red-400 mt-1">{errors.gender}</p>}

          {form.gender === 'other' && (
            <div className="mt-2">
              <input
                type="text"
                value={otherGender}
                onChange={e => setOtherGender(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
                placeholder="Specify your gender"
              />
              {errors.otherGender && <p className="text-xs text-red-400 mt-1">{errors.otherGender}</p>}
            </div>
          )}
        </div>

        {/* Biological Sex (Segmented) */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Biological Sex</label>
          <div className="flex flex-wrap gap-2">
            {BIOLOGICAL_SEX_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setForm(prev => ({ ...prev, biologicalSex: opt.value }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.biologicalSex === opt.value ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50 hover:border-teal-400' : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:border-slate-600'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {errors.biologicalSex && <p className="text-xs text-red-400 mt-1">{errors.biologicalSex}</p>}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Date of Birth</label>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="date"
              value={form.dateOfBirth || ''}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => setForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
            />
          </div>
          {errors.dateOfBirth && <p className="text-xs text-red-400 mt-1">{errors.dateOfBirth}</p>}
        </div>

        {/* Height */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Height (cm)</label>
          <div className="relative">
            <Ruler size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="number"
              value={form.height ?? ''}
              onChange={e => setForm(prev => ({ ...prev, height: e.target.value ? Number(e.target.value) : null }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
              placeholder="e.g., 175"
              min="50"
              max="300"
            />
          </div>
          {errors.height && <p className="text-xs text-red-400 mt-1">{errors.height}</p>}
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Weight (kg)</label>
          <div className="relative">
            <Weight size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="number"
              value={form.weight ?? ''}
              onChange={e => setForm(prev => ({ ...prev, weight: e.target.value ? Number(e.target.value) : null }))}
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400"
              placeholder="e.g., 68"
              min="20"
              max="500"
            />
          </div>
          {errors.weight && <p className="text-xs text-red-400 mt-1">{errors.weight}</p>}
        </div>

        {/* Activity Level */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Activity Level</label>
          <div className="relative">
            <Activity size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <select
              value={form.activityLevel || ''}
              onChange={e => setForm(prev => ({ ...prev, activityLevel: e.target.value as any }))}
              className="w-full pl-9 pr-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400 appearance-none"
            >
              <option value="">Select activity level</option>
              {ACTIVITY_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Preferred Language */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Language</label>
          <div className="relative">
            <Globe size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <select
              value={form.preferredLanguage || 'en'}
              onChange={e => setForm(prev => ({ ...prev, preferredLanguage: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-sm text-slate-100 focus:border-teal-400 appearance-none"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Cycle Tracking Toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="font-medium text-slate-200">Enable Cycle Tracking</div>
            <div className="text-xs text-slate-400">Track menstrual cycle and fertility window</div>
          </div>
          <button
            onClick={toggleCycleTracking}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${form.enableCycleTracking ? 'bg-teal-600' : 'bg-slate-600'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${form.enableCycleTracking ? 'translate-x-6' : ''}`} />
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </motion.div>
  );
}
