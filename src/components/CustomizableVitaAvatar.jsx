// src/components/CustomizableVitaAvatar.jsx
import { useState, useEffect } from 'react';
import { getEquippedAccessories } from '../services/avatarCustomization';

export default function CustomizableVitaAvatar({ size = 'lg', className = '' }) {
  const [equippedAccessories, setEquippedAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Assuming we have a way to get the current user ID
  const userId = 'current-user'; // Placeholder

  useEffect(() => {
    const loadEquippedAccessories = async () => {
      setLoading(true);
      try {
        const accessories = await getEquippedAccessories(userId);
        setEquippedAccessories(accessories);
      } catch (error) {
        console.error('Failed to load equipped accessories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEquippedAccessories();
    
    // Refresh periodically
    const interval = setInterval(loadEquippedAccessories, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // Base avatar sizes
  const sizeMap = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
    '2xl': 'w-24 h-24'
  };

  const baseSize = sizeMap[size] || sizeMap.lg;

  if (loading) {
    return (
      <div className={`${baseSize} flex-shrink-0 ${className}`}>
        {/* Placeholder for base avatar while loading */}
        <div className="w-full h-full bg-teal-500/20 rounded-full flex items-center justify-center">
          <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${baseSize} flex-shrink-0 ${className}`}>
      {/* Base Vita Avatar - in a real app, this would be the VitaChain avatar */}
      <div className="w-full h-full bg-teal-500/20 rounded-full flex items-center justify-center">
        <div className="w-4 h-4 bg-teal-500 rounded-full">
          {/* VitaChain logo or initials */}
          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
            VC
          </div>
        </div>
      </div>
      
      {/* Equipped Accessories */}
      {equippedAccessories.map((accessory, index) => (
        <div 
          key={`${accessory.id}-${index}`} 
          className="absolute inset-0 pointer-events-none"
          style={{
            left: accessory.position?.x || '50%',
            top: accessory.position?.y || '50%',
            transform: `translate(-50%, -50%) scale(${accessory.position?.scale || 1})`
          }}
        >
          {/* In a real app, we would render the SVG path here */}
          {/* For now, we'll show a placeholder */}
          <div className="w-4 h-4 bg-teal-400/20 rounded-full flex items-center justify-center">
            {accessory.name.charAt(0)}
          </div>
        </div>
      ))}
    </div>
  );
}