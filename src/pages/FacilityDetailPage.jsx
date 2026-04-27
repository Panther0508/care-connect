import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';

export default function FacilityDetailPage() {
  const { id } = useParams();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4 pb-24"
    >
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Facility Details</h1>
        <p className="text-slate-400">Facility ID: {id}</p>
      </div>
      <div className="glass-card p-6 text-center text-slate-400">
        Facility details page coming soon. Full info, reviews, and booking.
      </div>
    </motion.div>
  );
}
