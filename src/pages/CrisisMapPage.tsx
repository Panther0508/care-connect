import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { motion } from "framer-motion";

// Custom icon for markers
const getMarkerIcon = (color: string) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const DesertOverlay: L.Class = L.Polygon.extend({
  options: {
    color: "#ff0000",
    weight: 2,
    opacity: 0.6,
    fillColor: "#ff0000",
    fillOpacity: 0.2
  }
});

import { getAllFacilities } from "../lib/idb";

export default function CrisisMapPage() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [deserts, setDeserts] = useState<any[]>([]);
  const [showDes_overlay, setShowDesOverlay] = useState(false);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Center of India
  const [mapZoom, setMapZoom] = useState(5);

  useEffect(() => {
    async function loadData() {
      const data = await getAllFacilities();
      // Only show facilities with valid lat/lng
      setFacilities(data.filter(f => f.latitude !== null && f.longitude !== null));
    }
    loadData();

    // Mock desert data - in reality this would come from /api/agent/deserts
    setDeserts([
      {
        id: "desert-1",
        name: "Western Rajasthan Desert",
        coordinates: [[26, 70], [26, 75], [28, 75], [28, 70]],
        missing_services: ["ICU", "Dialysis", "Emergency Surgery"]
      },
      {
        id: "desert-2",
        name: "Northern Bihar Desert",
        coordinates: [[26, 84], [26, 88], [28, 88], [28, 84]],
        missing_services: ["ICU", "Specialized Pediatrics"]
      }
    ]);
  }, []);

  useEffect(() => {
    // Adjust map to show all facilities
    if (facilities.length > 0) {
      const bounds = facilities.reduce((bounds, facility) => {
        return bounds.extend([facility.latitude, facility.longitude]);
      }, new L.LatLngBounds([facilities[0].latitude, facilities[0].longitude]));
      
      // We would normally set the map bounds here, but we'll just set center and zoom for simplicity
      const center = bounds.getCenter();
      setMapCenter([center.lat, center.lng]);
      setMapZoom(Math.max(5, Math.min(12, 12 - Math.round(bounds.getEast() - bounds.getWest()) / 10)));
    }
  }, [facilities]);

  return (
    <div className="flex flex-col min-h-[70vh]">
      <header className="pt-4 pb-6">
        <motion.h1 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
          className="text-2xl font-bold text-slate-100 mb-2 leading-tight"
        >
          Medical Desert Map
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.2 }}
          className="text-slate-400 mb-6 text-sm"
        >
          Interactive map showing healthcare access across India
        </motion.p>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <button 
            onClick={() => setShowDes_overlay(!showDes_overlay)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              showDes_overlay 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : 'bg-slate-800/20 text-slate-400 border border-slate-700/30'
            }`}
          >
            {showDes_overlay ? 'Hide Desert Overlay' : 'Show Desert Overlay'}
          </button>
          
           <span className="text-xs text-slate-500">
             Legend: 
              <span className="inline-flex items-center gap-1 mr-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />{' '}
                <span>Green: High Trust (80-100)</span>
              </span>
              <span className="inline-flex items-center gap-1 mr-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />{' '}
                <span>Amber: Medium Trust (50-79)</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400" />{' '}
                <span>Red: Low Trust (&lt;50)</span>
              </span>
           </span>
        </div>
      </header>

      <section className="flex-1">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          className="w-full h-full"
          whenCreated={map => {
            // Make map available for potential future use
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Desert Overlay */}
          {showDes_overlay && deserts.map(desert => (
            <DesertOverlay
              key={desert.id}
              positions={desert.coordinates}
              className="desert-overlay"
            >
              <Popup>
                <div className="text-sm">
                  <strong>{desert.name}</strong><br/>
                  <span className="text-slate-400">Missing services: {desert.missing_services.join(', ')}</span>
                </div>
              </Popup>
            </DesertOverlay>
          ))}
          
          {/* Facility Markers */}
          {facilities.map(facility => {
            const color = facility.trust_score >= 80 ? 'green' : 
                         facility.trust_score >= 50 ? 'amber' : 'red';
            return (
              <Marker
                key={facility.id}
                position={[facility.latitude, facility.longitude]}
                icon={getMarkerIcon(color)}
              >
                <Popup>
                  <div className="w-64">
                    <h4 className="font-bold text-slate-100 mb-1">{facility.name}</h4>
                    <p className="text-sm text-slate-400 mb-2">
                      {facility.address_city}, {facility.address_stateOrRegion}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        facility.trust_score >= 80 ? 'bg-green-500/20 text-green-400' :
                        facility.trust_score >= 50 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        Trust: {facility.trust_score}
                      </span>
                      {facility.is_medical_desert && (
                        <span className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5 text-xs">
                          🏜️ Desert Area
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mb-2">
                      <span className="text-xs text-slate-400">
                        {facility.specialties.slice(0, 2).map(s => s.replace(/([A-Z])/g, ' $1').trim()).join(', ')}
                        {facility.specialties.length > 2 && '+...'}
                      </span>
                    </div>
                     <button 
                       onClick={() => {/* In a real app, we'd navigate to facility details */}}
                       className="w-full btn-primary py-1 px-2 text-xs flex justify-center items-center gap-1"
                     >
                      View Details
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                        <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </section>

      {/* Summary Box */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.8 }}
        className="p-4 bg-slate-800/50 rounded-lg mt-4"
      >
        <h3 className="text-slate-100 font-semibold mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
            <path d="M9 12l2 2 4-4"/>
          </svg>
          Impact Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 p-3 bg-slate-700/30 rounded-lg">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                <path d="M4 4v16h16V4"/>
                <path d="M8 13h8"/>
                <path d="M12 8v5"/>
              </svg>
            </div>
            <div>
              <p className="text-slate-300 font-medium">Medical Deserts Identified</p>
              <p className="text-slate-100 font-bold">{deserts.length} regions</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-slate-700/30 rounded-lg">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                <path d="M12 8v4l3 3"/>
                <path to="M16 12h-8"/>
              </svg>
            </div>
             <div>
               <p className="text-slate-300 font-medium">Facilities in Desert Areas</p>
               <p className="text-slate-100 font-bold">
                 {facilities.filter(f => f.is_medical_desert).length}
               </p>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}