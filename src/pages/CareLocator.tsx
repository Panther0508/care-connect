import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Phone, Star, Navigation, Loader2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getItem, getAllFacilities, storeFacilities } from "../lib/idb";
import LoadingSpinner from "../components/LoadingSpinner";

interface Facility {
  id: string;
  name: string;
  type: string;
  address: string;
  distance: string;
  rating: number;
  phone: string;
  services: string[];
  latitude: number;
  longitude: number;
}

export default function CareLocator() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Facility | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Load facilities from IndexedDB or fallback to JSON
  useEffect(() => {
    async function loadFacilities() {
      try {
        setLoading(true);
        setError(null);

        // Try to load from IDB first
        let stored = await getAllFacilities();
        if (stored.length === 0) {
          // Fallback to public JSON
          try {
            const response = await fetch("/facilities_offline.json");
            const data = await response.json();
            stored = data.facilities || data || [];
            // Store for future use
            await storeFacilities(stored);
          } catch (err) {
            console.error("Failed to load facilities:", err);
            setError("Could not load facilities data.");
            setLoading(false);
            return;
          }
        }

        setFacilities(stored as Facility[]);

        // Get user location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
              setUserLocation(coords);
              // Fly to user location after a short delay
              setTimeout(() => {
                if (mapRef.current) {
                  mapRef.current.flyTo(coords, 13);
                }
              }, 500);
            },
            () => {
              // Permission denied — use default view (Nigeria)
              setUserLocation([9.0820, 8.6753]);
            }
          );
        } else {
          // Geolocation not supported
          setUserLocation([9.0820, 8.6753]); // Center of Nigeria
        }
      } catch (err) {
        console.error("Error loading facilities:", err);
        setError("Failed to load facilities.");
      } finally {
        setLoading(false);
      }
    }

    loadFacilities();
  }, []);

  const filtered = facilities.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.type.toLowerCase().includes(search.toLowerCase())
  );

  // Custom marker icon
  const hospitalIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  // Component to fly to selected facility
  function FlyToSelected() {
    const map = useMap();
    useMapEvents({
      click() {
        // No-op; we just want map ref
      },
    });
    if (selected && selected.latitude && selected.longitude) {
      map.flyTo([selected.latitude, selected.longitude], 16, { duration: 0.8 });
    }
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size={48} />
          <p className="text-slate-400 text-sm">Loading facilities...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
          <div className="glass-card p-6 text-center">
            <p className="text-rose-300">{error}</p>
          </div>
        </div>
      </motion.div>
    );
  }

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

        {/* Map */}
        <div className="glass-card p-0 overflow-hidden mb-6" style={{ height: "300px", borderRadius: "16px" }}>
          {userLocation && (
            <MapContainer
              center={userLocation}
              zoom={13}
              className="h-full w-full"
              whenCreated={(map) => {
                mapRef.current = map;
              }}
              zoomControl={false}
            >
              <FlyToSelected />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filtered.map((facility) => (
                <Marker
                  key={facility.id}
                  position={[facility.latitude, facility.longitude]}
                  icon={hospitalIcon}
                  eventHandlers={{
                    click: () => setSelected(facility),
                  }}
                >
                  <Popup>
                    <div className="text-slate-900">
                      <strong>{facility.name}</strong>
                      <p className="text-sm">{facility.type}</p>
                      <p className="text-xs">{facility.address}</p>
                      <p className="text-xs">⭐ {facility.rating}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
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
                  <button
                    className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-white font-medium transition-colors"
                    onClick={() => {
                      if (userLocation) {
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`,
                          "_blank"
                        );
                      }
                    }}
                  >
                    Get Directions
                  </button>
                  <button
                    className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-white transition-colors"
                    onClick={() => {
                      window.location.href = `tel:${selected.phone}`;
                    }}
                  >
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
