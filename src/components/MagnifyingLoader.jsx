import React from 'react';

/**
 * MagnifyingLoader - Premium loading animation
 * Shows Vita-loading avatar centered with a teal orbit ring.
 * When ring reaches leftmost point (3 o'clock), avatar briefly scales up.
 */
export default function MagnifyingLoader({ size = 64 }) {
  const ringSize = 24;
  const orbitRadius = 48;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size * 2, height: size * 2 }}
    >
      {/* Vita-loading avatar at center with pulse animation synced to orbit */}
      <div
        className="absolute rounded-full bg-teal-500/10 border-2 border-teal-400/50 flex items-center justify-center"
        style={{
          width: size,
          height: size,
          animation: 'avatar-pulse 2s ease-in-out infinite',
        }}
      >
        <img
          src="/avatars/vita-loading.png"
          alt="Vita loading"
          className="w-10 h-10 object-contain"
          onError={(e) => { e.currentTarget.src = '/avatars/default.png'; }}
        />
      </div>

      {/* Teal orbiting ring - orbits around avatar at radius 48px */}
      <div
        className="absolute rounded-full border-3 border-teal-400/70"
        style={{
          width: ringSize,
          height: ringSize,
          left: '50%',
          top: '50%',
          // Center the ring's center at the orbit origin before transform
          marginLeft: -ringSize / 2,
          marginTop: -ringSize / 2,
          animation: 'orbit 2s linear infinite',
        }}
      />
    </div>
  );
}
