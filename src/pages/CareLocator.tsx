import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Phone, Star, Navigation } from "lucide-react";

interface Facility {
  id: string;
  name: string;
  type: string;
  address: string;
  distance: string;
  rating: number;
  phone: string;
  services: string[];
}

const MOCK_FACILITIES: Facility[] = [
  {
    id: "1",
    name: "Lagos General Hospital",
    type: "General Hospital",
    address: "1 Broad St, Lagos Island",
    distance: "2.3 km",
    rating: 4.5,
    phone: "+234 800 123 4567",
    services: ["Emergency", "Laboratory", "Pharmacy", "Imaging"],
  },
  {
    id: "2",
    name: "Abuja Primary Care Centre",
    type: "Primary Care",
    address: "45 Aminu Kano Crescent, Wuse",
    distance: "0.8 km",
    rating: 4.2,
    phone: "+234 800 987 6543",
    services: ["General Consultations", "Vaccinations", "Maternal Health"],
  },
  {
    id: "3",
    name: "Kano Specialist Hospital",
    type: "Specialist",
    address: "7 Hospital Rd, Kano",
    distance: "5.1 km",
    rating: 4.0,
    phone: "+234 800 456 7890",
    services: ["Cardiology", "Neurology", "Surgery"],
  },
];

export default function CareLocator() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Facility | null>(null);

  const filtered = MOCK_FACILITIES.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full"
    >
      <div className="p-4 pb-24">
        <h1 className="text-2xl font-bold text-white mb-2">Find Care</h1>
        <p className="text-slate-400 text-sm mb-6">Locate nearby health facilities</p>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or type..."
            className="glass-input w-full pl-10 pr-4 py-3 text-sm"
          />
        </div>

        {/* Map placeholder */}
        <div className="glass-card p-6 h-48 flex items-center justify-center mb-6">
          <div className="text-center">
            <MapPin className="text-slate-400 mx-auto mb-2" size={32} />
            <p className="text-slate-500 text-sm">Interactive map view coming soon.</p>
            <p className="text-slate-600 text-xs mt-1">Currently showing list view</p>
          </div>
        </div>

        {/* Facility list */}
        <div className="space-y-3">
          {filtered.map((facility) => (
            <motion.div
              key={facility.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelected(facility)}
              className="glass-card p-4 cursor-pointer hover:border-teal-500/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-xl">
                  🏥
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white truncate">{facility.name}</h3>
                    <div className="flex items-center gap-1 text-amber-400 text-xs">
                      <Star size={12} fill="currentColor" />
                      {facility.rating}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{facility.type}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Navigation size={10} />
                    {facility.distance} away
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Facility detail modal */}
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="max-w-lg mx-auto mt-20 glass-card rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-white/5">
                <h2 className="text-lg font-semibold text-white">{selected.name}</h2>
                <p className="text-sm text-slate-400">{selected.address}</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="text-teal-400" size={18} />
                  <a href={`tel:${selected.phone}`} className="text-teal-300 hover:underline">
                    {selected.phone}
                  </a>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Services</h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.services.map((s) => (
                      <span key={s} className="px-2 py-1 rounded-lg bg-slate-700/50 text-slate-300 text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-white font-medium transition-colors">
                    Get Directions
                  </button>
                  <button className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-white transition-colors">
                    Call Now
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-full py-3 border-t border-white/5 text-slate-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
