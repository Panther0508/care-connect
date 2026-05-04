import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { setItem, getItem } from '../lib/idb';
import { User, Stethoscope, Building2, Clock, CreditCard, FileText, Save, Edit3, Check, X } from 'lucide-react';
import MagnifyingLoader from '../components/MagnifyingLoader';

interface ClinicianProfileData {
  firstName: string;
  lastName: string;
  specialty: string;
  licenseNumber: string;
  hospital: string;
  experienceYears: number;
  consultationFee: number;
  bio: string;
}

const SPECIALTIES = [
  'General Practice',
  'Internal Medicine',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'Surgery',
  'Cardiology',
  'Neurology',
  'Psychiatry',
  'Dermatology',
  'Ophthalmology',
  'Orthopedics',
  'Other',
];

export default function ClinicianProfile() {
  const { user, isLoaded } = useAuth();
  const navigate = useNavigate();
  const [ editing, setEditing ] = useState(false);
  const [ saving, setSaving ] = useState(false);
  const [ form, setForm ] = useState<ClinicianProfileData>({
    firstName: '',
    lastName: '',
    specialty: '',
    licenseNumber: '',
    hospital: '',
    experienceYears: 0,
    consultationFee: 0,
    bio: '',
  });

  useEffect(() => {
    if (!isLoaded || !user) return;
    const load = async () => {
      const stored = await getItem<ClinicianProfileData>(`clinician_profile_${user.id}`);
      if (stored) {
        setForm(stored);
      } else {
        // Prefill from Clerk
        const fullName = user.fullName || '';
        const parts = fullName.split(' ');
        setForm(prev => ({
          ...prev,
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' ') || '',
        }));
      }
    };
    load();
  }, [user, isLoaded]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setItem(`clinician_profile_${user.id}`, form);
      // Could also sync to Clerk publicMetadata if desired
      setEditing(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

   if (!isLoaded) {
     return <div className="flex items-center justify-center min-h-screen"><MagnifyingLoader size={48} /></div>;
   }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Professional Profile</h1>
          <p className="text-slate-400">Manage your clinician credentials</p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600">
              <X size={20} />
            </button>
            <button onClick={handleSave} disabled={saving} className="p-2 rounded-lg bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50">
              <Save size={20} />
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2">
            <Edit3 size={16} /> Edit
          </button>
        )}
      </div>

      <div className="glass-card p-6 space-y-6">
        {/* Avatar & Name */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center border-2 border-teal-500/30 overflow-hidden">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-slate-400" />
            )}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="glass-input"
                  value={form.firstName}
                  onChange={e => setForm(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="First Name"
                />
                <input
                  className="glass-input"
                  value={form.lastName}
                  onChange={e => setForm(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Last Name"
                />
              </div>
            ) : (
              <h2 className="text-xl font-semibold text-white">{form.firstName} {form.lastName}</h2>
            )}
            <p className="text-slate-400 text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>

        {/* Professional Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Specialty */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
              <Stethoscope size={14} className="text-teal-400" /> Specialty
            </label>
            {editing ? (
              <select
                className="glass-input"
                value={form.specialty}
                onChange={e => setForm(prev => ({ ...prev, specialty: e.target.value }))}
              >
                <option value="">Select specialty</option>
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <div className="px-3 py-2.5 bg-slate-800/30 rounded-lg text-slate-200 border border-slate-700/30">{form.specialty || 'Not set'}</div>
            )}
          </div>

          {/* License Number */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
              <FileText size={14} className="text-teal-400" /> License Number
            </label>
            {editing ? (
              <input
                className="glass-input"
                value={form.licenseNumber}
                onChange={e => setForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                placeholder="Medical license number"
              />
            ) : (
              <div className="px-3 py-2.5 bg-slate-800/30 rounded-lg text-slate-200 border border-slate-700/30 font-mono">{form.licenseNumber || 'Not set'}</div>
            )}
          </div>

          {/* Hospital Affiliation */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
              <Building2 size={14} className="text-teal-400" /> Hospital / Clinic
            </label>
            {editing ? (
              <input
                className="glass-input"
                value={form.hospital}
                onChange={e => setForm(prev => ({ ...prev, hospital: e.target.value }))}
                placeholder="Primary hospital or clinic"
              />
            ) : (
              <div className="px-3 py-2.5 bg-slate-800/30 rounded-lg text-slate-200 border border-slate-700/30">{form.hospital || 'Not set'}</div>
            )}
          </div>

          {/* Experience */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
              <Clock size={14} className="text-teal-400" /> Years of Experience
            </label>
            {editing ? (
              <input
                type="number"
                className="glass-input"
                value={form.experienceYears || ''}
                onChange={e => setForm(prev => ({ ...prev, experienceYears: Number(e.target.value) || 0 }))}
                placeholder="Years"
                min="0"
              />
            ) : (
              <div className="px-3 py-2.5 bg-slate-800/30 rounded-lg text-slate-200 border border-slate-700/30">{form.experienceYears || 'Not set'} years</div>
            )}
          </div>

          {/* Consultation Fee */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
              <CreditCard size={14} className="text-teal-400" /> Consultation Fee (NGN)
            </label>
            {editing ? (
              <input
                type="number"
                className="glass-input"
                value={form.consultationFee || ''}
                onChange={e => setForm(prev => ({ ...prev, consultationFee: Number(e.target.value) || 0 }))}
                placeholder="e.g. 5000"
                min="0"
              />
            ) : (
              <div className="px-3 py-2.5 bg-slate-800/30 rounded-lg text-slate-200 border border-slate-700/30">
                {form.consultationFee ? `₦${form.consultationFee.toLocaleString()}` : 'Not set'}
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">Professional Bio</label>
            {editing ? (
              <textarea
                className="glass-input min-h-[100px] resize-y"
                value={form.bio}
                onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Brief professional background, areas of expertise, etc."
              />
            ) : (
              <div className="px-3 py-2.5 bg-slate-800/30 rounded-lg text-slate-200 border border-slate-700/30 min-h-[60px] whitespace-pre-line">
                {form.bio || 'No bio provided.'}
              </div>
            )}
          </div>
        </div>

        {/* Save button (mobile friendly) */}
        {editing && (
          <div className="pt-2">
            <button onClick={handleSave} disabled={saving} className="w-full btn-primary flex items-center justify-center gap-2">
              {saving ? 'Saving...' : <><Check size={16} /> Save Changes</>}
            </button>
          </div>
        )}
      </div>

      {/* Stats overview (placeholder) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-white">12</div>
          <div className="text-xs text-slate-400">Scans Today</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-white">48</div>
          <div className="text-xs text-slate-400">Patients</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-white">4.9</div>
          <div className="text-xs text-slate-400">Rating</div>
        </div>
      </div>
    </motion.div>
  );
}
