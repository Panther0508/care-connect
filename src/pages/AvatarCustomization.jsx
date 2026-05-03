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

export default function AvatarCustomization() {
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

        {/* Accessories List */}
        <div className="space-y-4">
          {accessories.map((accessory) => (
            <div key={accessory.id} className="p-4 border border-teal-500/20 rounded">
              <h4 className="text-slate-100">{accessory.name}</h4>
              <p className="text-slate-400">{accessory.category}</p>
              <div className="mt-2">
                {accessory.locked ? (
                  <button
                    onClick={() => handleUnlock(accessory.id)}
                    disabled={unlocking.has(accessory.id)}
                    className="px-3 py-1 text-sm bg-yellow-500/20 text-yellow-300 rounded hover:bg-yellow-500/30"
                  >
                    {unlocking.has(accessory.id) ? 'Unlocking...' : 'Unlock'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleEquip(accessory.id)}
                    disabled={equipping.has(accessory.id)}
                    className="px-3 py-1 text-sm bg-teal-500/20 text-teal-300 rounded hover:bg-teal-500/30"
                  >
                    {equipping.has(accessory.id) ? 'Equipping...' : 'Equip'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

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