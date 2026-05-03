import React from 'react';
import GlassCard from '../components/GlassCard';

const ImageLibrary = () => {
  return (
    <div className="p-6">
      <GlassCard>
        <h1 className="text-2xl font-bold text-slate-100 mb-4">Image Library</h1>
        <p className="text-slate-300">Medical image library coming soon.</p>
      </GlassCard>
    </div>
  );
};

export default ImageLibrary;