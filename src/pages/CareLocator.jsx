// src/pages/CareLocator.jsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Heart, Star, Map, AlertCircle, Building2 } from 'lucide-react';
import Pagination from '../components/Pagination';

export default function CareLocator() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(facilities.length / itemsPerPage);
  const paginatedFacilities = facilities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    const loadFacilities = async () => {
      setLoading(true);
      try {
        const response = await fetch('/facilities.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch facilities: ${response.status}`);
        }
        const data = await response.json();
        setFacilities(data);
      } catch (err) {
        console.error('Error loading facilities:', err);
        setError('Failed to load healthcare facilities. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadFacilities();
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-[calc(100vh-4rem)] flex items-center justify-center"
      >
        <div className="text-center">
          <div className="animate-pulse rounded-full w-16 h-16 bg-teal-500/20 mb-4"></div>
          <h2 className="text-xl font-bold text-slate-100">Loading facilities...</h2>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-[calc(100vh-4rem)] flex items-center justify-center"
      >
        <div className="text-center">
          <div className="text-slate-400 w-16 h-16 mb-4">
            <AlertCircle size={32} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Error</h2>
          <p className="text-slate-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary px-6 py-2"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[calc(100vh-4rem)] p-6"
    >
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h1 className="text-2xl font-bold text-slate-100">
            Care Locator
          </h1>
          <p className="text-slate-400 max-w-xl">
            Find nearby healthcare facilities, clinics, hospitals, and pharmacies.
          </p>
        </motion.div>

        {/* Facilities List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {facilities.length > 0 ? (
            <div className="space-y-4">
              {paginatedFacilities.map((facility) => (
                <motion.div
                  key={facility.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-6 hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="flex items-center mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-teal-500/20 shrink-0`}>
                      <Building2 size={24} className="text-teal-400" />
                    </div>
                    <div className="flex-1 space-x-3">
                      <h3 className="text-lg font-medium text-slate-100">{facility.name}</h3>
                      <p className="text-sm text-slate-400 truncate">{facility.type}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-slate-400">
                    <p>
                      <MapPin size={16} className="mr-2 text-teal-400" /> {facility.address}
                    </p>
                    <p>
                      <Phone size={16} className="mr-2 text-teal-400" /> {facility.phone}
                    </p>
                    <p>
                      <Heart size={16} className="mr-2 text-teal-400" /> 
                      Services: {facility.services.join(', ')}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-sm">
                        <Star size={16} className="text-amber-400" /> 
                        <span className="font-medium">{facility.rating}</span>
                      </span>
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <Map size={16} className="mr-1" /> {facility.distance}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-slate-400 mb-4">No healthcare facilities found nearby.</p>
              <p className="text-slate-500 text-sm mb-6">Try adjusting your location or search criteria.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
              >
                Refresh Search
              </button>
            </motion.div>
          )}
        </motion.div>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-slate-500 text-sm"
        >
          Facility data is available offline once loaded.
        </motion.div>
      </div>
    </motion.div>
  );
}