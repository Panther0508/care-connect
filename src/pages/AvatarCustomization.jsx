// src/pages/AvatarCustomization.jsx
import { useState, useEffect } from 'react';
import { 
  getAllAccessories, 
  unlockAccessory, 
  equipAccessory, 
  getEquippedAccessories,
  initializeAvatarData
} from '../services/avatarCustomization';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export function AvatarCustomization() {
  const [accessories, setAccessories] = useState([]);
  const [equipped, setEquipped] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(new Set());
  const [equipping, setEquipping] = useState(new Set());
  
  // Assuming we have a way to get the current user ID
  const userId = 'current-user'; // Placeholder

  useEffect(() => {
    const loadAvatarData = async () => {
      setLoading(true);
      try {
        // Initialize avatar data for the user (if not exists)
        await initializeAvatarData(userId);
        
        // Get all accessories with lock status
        const allAccessories = await getAllAccessories(userId);
        setAccessories(allAccessories);
        
        // Get equipped accessories
        const equippedAccessories = await getEquippedAccessories(userId);
        setEquipped(equippedAccessories);
      } catch (error) {
        console.error('Failed to load avatar data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAvatarData();
    
    // Set up a listener for changes (in a real app, this would use IndexedDB change listeners)
    // For now, we'll just refresh every 30 seconds
    const interval = setInterval(loadAvatarData, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleUnlock = async (accessoryId) => {
    setUnlocking(prev => new Set(prev).add(accessoryId));
    try {
      const result = await unlockAccessory(userId, accessoryId);
      if (result.success) {
        // Refresh the accessories list to update lock status
        const allAccessories = await getAllAccessories(userId);
        setAccessories(allAccessories);
      } else {
        alert(result.error || 'Failed to unlock accessory');
      }
    } catch (error) {
      console.error('Error unlocking accessory:', error);
      alert('An error occurred while unlocking the accessory');
    } finally {
      setUnlocking(prev => {
        const newSet = new Set(prev);
        newSet.delete(accessoryId);
        return newSet;
      });
    }
  };

  const handleEquip = async (accessoryId) => {
    setEquipping(prev => new Set(prev).add(accessoryId));
    try {
      const result = await equipAccessory(userId, accessoryId);
      if (result.success) {
        // Refresh equipped list
        const equippedAccessories = await getEquippedAccessories(userId);
        setEquipped(equippedAccessories);
      } else {
        alert(result.error || 'Failed to equip accessory');
      }
    } catch (error) {
      console.error('Error equipping accessory:', error);
      alert('An error occurred while equipping the accessory');
    } finally {
      setEquipping(prev => {
        const newSet = new Set(prev);
        newSet.delete(accessoryId);
        return newSet;
      });
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset avatar to default? This will unequip all accessories.')) {
      const db = await (await import('../services/avatarCustomization')).initAvatarDB();
      const userData = await db.get('avatarData', userId) || { userId, unlocked: [], equipped: [] };
      userData.equipped = [];
      await db.put('avatarData', userData);
      setEquipped([]);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-900 p-4"
      >
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-pulse rounded-full w-16 h-16 bg-teal-500/20 mb-4"></div>
          <p className="text-slate-400">Loading your avatar...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-slate-900"
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-slate-100">Avatar Customization</h1>
          <Link to="/" className="text-sm text-teal-400 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
        <p className="text-slate-400">
          Unlock and equip accessories to personalize your VitaChain avatar
        </p>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Current Avatar Preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-slate-100 mb-3">Your Avatar</h3>
            <div className="w-32 h-32 relative">
              {/* Base Avatar */}
              <div className="w-full h-full bg-teal-500/20 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-teal-500 rounded-full">
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                    VC
                  </div>
                </div>
              </div>
              
              {/* Equipped Accessories */}
              {equipped.map((accessory, index) => (
                <div 
                  key={`${accessory.id}-${index}`} 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    left: accessory.position?.x || '50%',
                    top: accessory.position?.y || '50%',
                    transform: `translate(-50%, -50%) scale(${accessory.position?.scale || 1})`
                  }}
                >
                  <div className="w-4 h-4 bg-teal-400/20 rounded-full flex items-center justify-center">
                    {accessory.name.charAt(0)}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-400 mt-2">
              {equipped.length} accessory{equipped.length !== 1 ? 's' : ''} equipped
            </p>
          </div>
        </motion.div>

        {/* Accessories Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="font-semibold text-slate-100 mb-4">Accessories</h3>
          <p className="text-slate-400 mb-4">
            Unlock accessories by earning points or completing specific achievements
          </p>
          
          <div className="space-y-4">
            {accessories.map(accessory => {
              const isUnlocked = accessories.some(a => a.id === accessory.id && a.unlocked);
              const isEquipped = equipped.some(e => e.id === accessory.id);
              
              return (
                <motion.div
                  key={accessory.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: accessory.id.length * 10 }}
                  className={`glass-card p-4 cursor-default 
                    ${isUnlocked 
                      ? (isEquipped 
                          ? 'border-teal-500/30 bg-teal-500/5' 
                          : 'border-teal-500/20 bg-teal-500/10 hover:bg-teal-500/5') 
                      : 'border-slate-600/20 bg-slate-900/20'}
                    hover:${isUnlocked && !isEquipped ? 'scale-105' : ''} 
                    transition-transform duration-300`
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full 
                          ${isUnlocked 
                            ? 'bg-teal-500/20' 
                            : 'bg-slate-600/20'}"
                          className="flex items-center justify-center">
                          {accessory.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-100 
                            ${isUnlocked ? '' : 'line-through'}">
                            {accessory.name}
                          </h4>
                          <p className="text-xs text-slate-400 
                            ${isUnlocked ? '' : 'line-through'}">
                            {accessory.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {isUnlocked ? (
                          isEquipped ? (
                            <span className="text-teal-400">Equipped</span>
                          ) : (
                            <button 
                              onClick={() => handleEquip(accessory.id)}
                              disabled={equipping.has(accessory.id)}
                              className="px-2 py-0.5 
                                ${equipping.has(accessory.id) 
                                  ? 'bg-slate-600/20 text-slate-400' 
                                  : 'bg-teal-500/20 text-teal-400'} 
                                rounded hover:bg-teal-500/30"
                            >
                              Equip
                            </button>
                          )
                        ) : (
                          <button 
                            onClick={() => handleUnlock(accessory.id)}
                            disabled={unlocking.has(accessory.id)}
                            className="px-2 py-0.5 
                              ${unlocking.has(accessory.id) 
                                ? 'bg-slate-600/20 text-slate-400' 
                                : 'bg-teal-500/20 text-teal-400'} 
                              rounded hover:bg-teal-500/30"
                          >
                            Unlock
                            {accessory.unlockCondition({ points: 0, badges: [] }) 
                              ? '' 
                              : ` (${getUnlockRequirementText(accessory)})`}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Locked overlay */}
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                        <div className="text-slate-400 text-center">
                          ???
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
            })}
          </div>
        </motion.div>

        {/* Reset Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <button 
            onClick={handleReset}
            className="w-full px-4 py-2 bg-slate-600/20 text-slate-100 rounded hover:bg-slate-600/30"
          >
            Reset to Default
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Helper function to get unlock requirement text
function getUnlockRequirementText(accessory) {
  // In a real app, we would have a more sophisticated way to get this
  // For now, we'll return a placeholder
  if (accessory.unlockCondition({ points: 100, badges: [] })) {
    return '100 points';
  }
  if (accessory.unlockCondition({ points: 0, badges: ['health_scribe'] })) {
    return 'Health Scribe badge';
  }
  if (accessory.unlockCondition({ points: 500, badges: [] })) {
    return '500 points';
  }
  if (accessory.unlockCondition({ points: 0, badges: ['vitachain_advocate'] })) {
    return 'VitaChain Advocate badge';
  }
  if (accessory.unlockCondition({ points: 300, badges: [] })) {
    return '300 points';
  }
  if (accessory.unlockCondition({ points: 150, badges: [] })) {
    return '150 points';
  }
  if (accessory.unlockCondition({ points: 0, badges: ['medication_master'] })) {
    return 'Medication Master badge';
  }
  if (accessory.unlockCondition({ points: 250, badges: [] })) {
    return '250 points';
  }
  if (accessory.unlockCondition({ points: 0, badges: ['community_guardian'] })) {
    return 'Community Guardian badge';
  }
  if (accessory.unlockCondition({ points: 200, badges: [] })) {
    return '200 points';
  }
  if (accessory.unlockCondition({ points: 0, badids: ['workout_warrior'] })) {
    return 'Workout Warrior badge';
  }
  if (accessory.unlockCondition({ points: 0, badids: ['first_responder'] })) {
    return 'First Responder badge';
  }
  if (accessory.unlockCondition({ points: 0, badids: ['mindful_soul'] })) {
    return 'Mindful Soul badge';
  }
  if (accessory.unlockCondition({ points: 1000, badids: [] })) {
    return '1000 points';
  }
  return 'Unknown requirement';
}