import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import { X, ExternalLink, Search } from 'lucide-react';

// Load icons dynamically from the public directory
const imageModules = import.meta.glob('/public/images/icons/icons/png/filled/{body,blood,conditions,diagnostics,anatomy}/**/*.png', { eager: true, query: '?url', import: 'default' });

const ImageLibrary = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Process the globally imported modules into a usable array
  const ASSETS = useMemo(() => {
    return Object.keys(imageModules).map(key => {
      // key format: /public/images/icons/icons/png/filled/body/skeleton.png
      const parts = key.split('/');
      const filename = parts.pop();
      const category = parts.pop();
      // Remove '/public' to get the actual URL for the browser
      const url = key.replace('/public', '');
      const title = filename.replace(/\.[^/.]+$/, "").replace(/_/g, " ").replace(/@2x/g, " HD");
      
      return { name: filename, url, title, category };
    }).filter(asset => !asset.name.includes('@2x')); // Filter out @2x duplicates for cleaner grid
  }, []);

  const filteredAssets = ASSETS.filter(asset => 
    asset.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    asset.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Medical Image Library</h1>
        <p className="text-slate-400 text-sm mt-1">Explore medical illustrations: bones, blood, structure, and more.</p>
        
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search anatomy, blood..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500/50"
          />
        </div>
      </header>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {filteredAssets.map((asset, index) => (
          <GlassCard 
            key={asset.url} 
            className="overflow-hidden p-0 group flex flex-col cursor-pointer hover:border-teal-500/30"
            onClick={() => setSelectedImage(asset)}
          >
            <div className="aspect-square p-4 flex items-center justify-center bg-slate-800/30">
              <img 
                src={asset.url} 
                alt={asset.title} 
                className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <div className="p-2 border-t border-slate-700/50 bg-slate-900/40">
              <p className="text-[10px] font-medium text-slate-300 truncate text-center capitalize">{asset.title}</p>
            </div>
          </GlassCard>
        ))}
        {filteredAssets.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            No images found for "{searchTerm}"
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative max-w-lg w-full flex flex-col bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
                <div>
                  <h3 className="text-lg font-semibold text-white capitalize">{selectedImage.title}</h3>
                  <p className="text-xs text-teal-400 capitalize">{selectedImage.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={selectedImage.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 transition-colors"
                  >
                    <ExternalLink size={18} />
                  </a>
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="p-12 flex items-center justify-center bg-slate-800/30 pattern-dots">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.title} 
                  className="w-48 h-48 object-contain drop-shadow-2xl"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageLibrary;