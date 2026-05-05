import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
import { storeSetting, getSetting } from '../lib/idb';
import { toast } from '../hooks/use-toast';

type BaseAvatar = 'male-1' | 'male-2' | 'female-1' | 'female-2' | 'nonbinary-1' | 'nonbinary-2';

interface Accessory {
  id: string;
  name: string;
  category: 'glasses' | 'hats' | 'jewelry' | 'masks' | 'helmets' | 'headbands';
  svg: string;
  unlockCondition: {
    type: 'quest' | 'streak' | 'points';
    requirement: string;
    threshold: number;
  };
}

const BASE_AVATARS: { id: BaseAvatar; name: string; svg: string }[] = [
  { id: 'male-1', name: 'Alex', svg: '<circle cx="50" cy="45" r="20" fill="#8B7355"/><path d="M35 70 Q50 85 65 70" stroke="#8B7355" strokeWidth="8" fill="none"/><rect x="35" y="70" width="30" height="40" rx="5" fill="#4A90E2"/>' },
  { id: 'male-2', name: 'Sam', svg: '<circle cx="50" cy="45" r="20" fill="#D4A574"/><path d="M35 70 Q50 85 65 70" stroke="#D4A574" strokeWidth="8" fill="none"/><rect x="35" y="70" width="30" height="40" rx="5" fill="#2C5282"/>' },
  { id: 'female-1', name: 'Maya', svg: '<circle cx="50" cy="45" r="20" fill="#DEB887"/><path d="M35 70 Q50 90 65 70" stroke="#DEB887" strokeWidth="8" fill="none"/><rect x="35" y="70" width="30" height="40" rx="5" fill="#9F7AEA"/>' },
  { id: 'female-2', name: 'Zoe', svg: '<circle cx="50" cy="45" r="20" fill="#F5DEB3"/><path d="M35 70 Q50 90 65 70" stroke="#F5DEB3" strokeWidth="8" fill="none"/><rect x="35" y="70" width="30" height="40" rx="5" fill="#D53F8C"/>' },
  { id: 'nonbinary-1', name: 'Riley', svg: '<circle cx="50" cy="45" r="20" fill="#FF69B4"/><path d="M35 70 Q50 85 65 70" stroke="#FF69B4" strokeWidth="8" fill="none"/><rect x="35" y="70" width="30" height="40" rx="5" fill="#00BFFF"/>' },
  { id: 'nonbinary-2', name: 'Charlie', svg: '<circle cx="50" cy="45" r="20" fill="#BA55D3"/><path d="M35 70 Q50 85 65 70" stroke="#BA55D3" strokeWidth="8" fill="none"/><rect x="35" y="70" width="30" height="40" rx="5" fill="#38A169"/>' },
];

const ACCESSORIES: Accessory[] = [
  { id: 'glasses-round', name: 'Round Glasses', category: 'glasses', svg: 'M30 45 Q50 35 70 45 Q50 55 30 45', unlockCondition: { type: 'quest', requirement: 'Complete 5 health logs', threshold: 5 } },
  { id: 'glasses-square', name: 'Square Glasses', category: 'glasses', svg: 'M25 45 L75 45 M25 50 L75 50 M25 45 L75 50 M25 50 L75 45', unlockCondition: { type: 'streak', requirement: '7-day streak', threshold: 7 } },
  { id: 'cap', name: 'Baseball Cap', category: 'hats', svg: 'M20 55 L50 25 L80 55 Z M20 55 L80 55', unlockCondition: { type: 'points', requirement: 'Earn 500 points', threshold: 500 } },
  { id: 'beanie', name: 'Beanie', category: 'hats', svg: 'M30 40 Q50 20 70 40', unlockCondition: { type: 'streak', requirement: '14-day streak', threshold: 14 } },
  { id: 'necklace', name: 'Necklace', category: 'jewelry', svg: 'M35 75 L50 80 L65 75', unlockCondition: { type: 'quest', requirement: 'Verify profile', threshold: 1 } },
  { id: 'earrings', name: 'Earrings', category: 'jewelry', svg: 'M45 40 M55 40', unlockCondition: { type: 'points', requirement: 'Earn 300 points', threshold: 300 } },
  { id: 'medical-mask', name: 'Medical Mask', category: 'masks', svg: 'M30 55 Q50 60 70 55', unlockCondition: { type: 'quest', requirement: 'Complete health assessment', threshold: 1 } },
  { id: 'vr-helmet', name: 'VR Helmet', category: 'helmets', svg: 'M25 35 Q50 15 75 35 Q75 60 50 70 Q25 60 25 35', unlockCondition: { type: 'points', requirement: 'Earn 1000 points', threshold: 1000 } },
  { id: 'headband', name: 'Headband', category: 'headbands', svg: 'M25 35 L75 35', unlockCondition: { type: 'streak', requirement: '3-day streak', threshold: 3 } },
  { id: 'party-hat', name: 'Party Hat', category: 'hats', svg: 'M40 20 L50 5 L60 20', unlockCondition: { type: 'quest', requirement: 'Share with 3 friends', threshold: 3 } },
];

interface AvatarSelection {
  base: BaseAvatar;
  accessories: string[];
}

const getUnlockProgress = (condition: Accessory['unlockCondition'], userStats: { questsCompleted: number; streak: number; points: number }) => {
  switch (condition.type) {
    case 'quest': return { current: userStats.questsCompleted, needed: condition.threshold };
    case 'streak': return { current: userStats.streak, needed: condition.threshold };
    case 'points': return { current: userStats.points, needed: condition.threshold };
    default: return { current: 0, needed: condition.threshold };
  }
};

const isUnlocked = (condition: Accessory['unlockCondition'], userStats: { questsCompleted: number; streak: number; points: number }) => {
  const progress = getUnlockProgress(condition, userStats);
  return progress.current >= progress.needed;
};

export default function AvatarCustomization() {
  const { userId } = useAuth();
  const [selection, setSelection] = useState<AvatarSelection>({ base: 'male-1', accessories: [] });
  const [saved, setSaved] = useState(false);

  const [userStats, setUserStats] = useState({ questsCompleted: 2, streak: 5, points: 150 });

  useEffect(() => {
    const loadAvatar = async () => {
      const saved = await getSetting<AvatarSelection>('avatar_selection');
      if (saved) setSelection(saved);
    };
    loadAvatar();
  }, []);

  useEffect(() => {
    setSaved(false);
  }, [selection]);

  const toggleAccessory = (accessoryId: string) => {
    setSelection(prev => {
      const isSelected = prev.accessories.includes(accessoryId);
      return {
        ...prev,
        accessories: isSelected
          ? prev.accessories.filter(id => id !== accessoryId)
          : [...prev.accessories, accessoryId]
      };
    });
  };

  const saveAvatar = async () => {
    if (!userId) return;
    await storeSetting('avatar_selection', selection);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast({
      title: "Avatar Saved",
      description: "Your avatar customization has been saved successfully.",
    });
  };

  const selectedBase = BASE_AVATARS.find(a => a.id === selection.base)!;
  const selectedAccessories = ACCESSORIES.filter(a => selection.accessories.includes(a.id));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 p-4 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Avatar Studio</h1>
        <p className="text-slate-400">Customize your VitaChain avatar</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
          <div className="relative w-48 h-48 mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <g dangerouslySetInnerHTML={{ __html: selectedBase.svg }} />
              {selectedAccessories.map(acc => (
                <g key={acc.id} dangerouslySetInnerHTML={{ __html: acc.svg }} />
              ))}
            </svg>
          </div>
          <p className="text-teal-400 font-medium">{selectedBase.name}</p>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Bases</h3>
          <div className="grid grid-cols-3 gap-3">
            {BASE_AVATARS.map(avatar => (
              <button
                key={avatar.id}
                onClick={() => setSelection(prev => ({ ...prev, base: avatar.id }))}
                className={`p-3 rounded-xl border transition-all ${
                  selection.base === avatar.id
                    ? 'border-teal-500 bg-teal-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-teal-400'
                }`}
              >
                <svg viewBox="0 0 100 100" className="w-12 h-12 mx-auto mb-1">
                  <g dangerouslySetInnerHTML={{ __html: avatar.svg }} />
                </svg>
                <span className="text-xs text-slate-300">{avatar.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Accessories</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {ACCESSORIES.map(accessory => {
            const unlocked = isUnlocked(accessory.unlockCondition, userStats);
            const isSelected = selection.accessories.includes(accessory.id);
            const progress = getUnlockProgress(accessory.unlockCondition, userStats);

            return (
              <div key={accessory.id} className="relative">
                <button
                  onClick={() => unlocked && toggleAccessory(accessory.id)}
                  disabled={!unlocked}
                  className={`w-full p-3 rounded-xl border transition-all ${
                    !unlocked
                      ? 'border-slate-700 bg-slate-800/30 opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'border-teal-500 bg-teal-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-teal-400'
                  }`}
                >
                  <svg viewBox="0 0 100 100" className="w-10 h-10 mx-auto mb-2">
                    <g dangerouslySetInnerHTML={{ __html: accessory.svg }} />
                  </svg>
                  <span className="text-xs text-slate-300">{accessory.name}</span>
                </button>

                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-xl">
                    <div className="text-center px-2">
                      <div className="text-xs text-amber-400 mb-1">🔒 Locked</div>
                      <div className="text-[10px] text-slate-400">{accessory.unlockCondition.requirement}</div>
                      <div className="text-[10px] text-teal-400 mt-1">{progress.current}/{progress.needed}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={saveAvatar}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-teal-600 hover:bg-teal-500 text-white'
          }`}
        >
          {saved ? '✓ Saved!' : 'Save Avatar'}
        </button>
      </div>
    </motion.div>
  );
}