// src/pages/OutbreakDashboard.tsx
// Outbreak visualisation dashboard – heatmap, anomaly alerts, privacy-preserving

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { meshOrchestrator } from "../services/meshOrchestrator";
import { getAllFacilities, getAllSearchLogs } from "../lib/idb";
import type { Facility } from "../services/aiSearch";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function OutbreakDashboard() {
  const [meshData, setMeshData] = useState<{
    searchCounters: Record<string, number>;
    confirmedFacilities: string[];
    stockoutAlerts: any[];
  }>({ searchCounters: {}, confirmedFacilities: [], stockoutAlerts: [] });
  
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [anomalies, setAnomalies] = useState<Array<{term: string, multiplier: number, count: number}>>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const isDebug = urlParams.get('debug') === 'true';

  // Refresh data periodically
  useEffect(() => {
    const refresh = () => {
      const data = meshOrchestrator.getAggregatedMeshData();
      setMeshData(data);
      computeAnomalies(data);
      loadFacilities();
    };

    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadFacilities = async () => {
    const all = await getAllFacilities();
    setFacilities(all);
  };

  /**
   * Compute anomalies: if a term's count > 5x the average across all terms
   */
  const computeAnomalies = (current: typeof meshData) => {
    const entries = Object.entries(current.searchCounters);
    if (entries.length === 0) {
      setAnomalies([]);
      return;
    }
    const total = entries.reduce((sum, [, cnt]) => sum + cnt, 0);
    const avg = total / entries.length;
    const anomalyList = entries
      .filter(([term, count]) => count > avg * 5 && count >= 3)
      .map(([term, count]) => ({
        term,
        count,
        multiplier: Number((count / avg).toFixed(1)),
      }))
      .sort((a, b) => b.multiplier - a.multiplier);
    setAnomalies(anomalyList);
  };

  /**
   * Debug: simulate an outbreak by injecting many search logs
   */
  const simulateOutbreak = () => {
    setIsSimulating(true);
    const fakeTerm = 'fever with stiff neck';
    for (let i = 0; i < 25; i++) {
      meshOrchestrator.recordSearch(fakeTerm);
    }
    setTimeout(() => setIsSimulating(false), 500);
  };

  // Top 10 search terms for bar chart
  const topTerms = Object.entries(meshData.searchCounters)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Map marker data from confirmed facilities
  const confirmedFacilityObjects = facilities.filter(f => 
    meshData.confirmedFacilities.includes(f.id) && f.latitude && f.longitude
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Outbreak Intelligence</h1>
        <p className="text-slate-400 text-sm">
          Anonymised community signals. No personal data leaves your device.
        </p>
      </header>

      {/* Anomaly Alerts */}
      {anomalies.length > 0 && (
        <section className="glass-card p-5 border-l-4 border-red-500">
          <h2 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Anomaly Alerts
          </h2>
          <div className="space-y-3">
            {anomalies.map((a) => (
              <motion.div
                key={a.term}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-100 capitalize">{a.term}</span>
                  <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">
                    {(a.multiplier).toFixed(1)}x normal
                  </span>
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  {a.count} searches detected (normally ~{Math.round(a.count / a.multiplier)})
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Heatmap / Facility Confirmation Map */}
      <section className="glass-card p-5">
        <h2 className="text-lg font-semibold text-slate-100 mb-3">Facility Confirmations</h2>
        {confirmedFacilityObjects.length > 0 ? (
          <div className="h-64 rounded-lg overflow-hidden border border-slate-700/30">
            <MapContainer
              center={
                confirmedFacilityObjects.length > 0
                  ? [
                      confirmedFacilityObjects.reduce((sum, f) => sum + (f.latitude || 0), 0) / confirmedFacilityObjects.length,
                      confirmedFacilityObjects.reduce((sum, f) => sum + (f.longitude || 0), 0) / confirmedFacilityObjects.length,
                    ]
                  : [20, 0]
              }
              zoom={confirmedFacilityObjects.length > 0 ? 5 : 2}
              className="h-full w-full"
              style={{ zIndex: 0 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {confirmedFacilityObjects.map((f) => (
                <CircleMarker
                  key={f.id}
                  center={[f.latitude!, f.longitude!]}
                  radius={8}
                  pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.6 }}
                >
                  <Popup>
                    <div>
                      <div className="font-medium">{f.name}</div>
                      <div className="text-xs text-slate-600">{f.address_city}, {f.address_stateOrRegion}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        ) : (
          <div className="h-32 bg-slate-800/30 rounded-lg flex items-center justify-center text-slate-500 text-sm">
            No facility confirmations yet. Reserving care contributes to this map.
          </div>
        )}
      </section>

      {/* Top Search Terms Bar Chart */}
      <section className="glass-card p-5">
        <h2 className="text-lg font-semibold text-slate-100 mb-3">Community Search Trends</h2>
        {topTerms.length > 0 ? (
          <div className="space-y-3">
            {topTerms.map(([term, count]) => (
              <div key={term} className="flex items-center gap-3">
                <div className="w-32 text-sm text-slate-300 truncate capitalize">{term}</div>
                <div className="flex-1 bg-slate-700/30 rounded-full h-4 relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((count / (topTerms[0][1] || 1)) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 rounded-full"
                  />
                </div>
                <div className="w-12 text-right text-sm text-slate-400">{count}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No search data collected yet.</p>
        )}
      </section>

      {/* Stockout Alerts */}
      {meshData.stockoutAlerts.length > 0 && (
        <section className="glass-card p-5">
          <h2 className="text-lg font-semibold text-slate-100 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Reported Stockouts
          </h2>
          <div className="space-y-2">
            {meshData.stockoutAlerts.map((alert, idx) => (
              <div key={idx} className="bg-amber-500/10 border border-amber-500/20 rounded p-3">
                <div className="text-slate-200">{alert.drugName}</div>
                <div className="text-xs text-slate-400">at facility {alert.facilityId} • {new Date(alert.timestamp).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Debug Controls */}
      {isDebug && (
        <section className="glass-card p-5 border-dashed border-2 border-teal-500/50">
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Debug Panel</h2>
          <button
            onClick={simulateOutbreak}
            disabled={isSimulating}
            className="px-4 py-2 bg-teal-500/20 text-teal-300 rounded-lg text-sm hover:bg-teal-500/30 disabled:opacity-50"
          >
            {isSimulating ? 'Simulating...' : 'Simulate Outbreak'}
          </button>
          <p className="text-xs text-slate-500 mt-2">
            Injects 25 searches for "fever with stiff neck" to trigger an anomaly alert.
          </p>
        </section>
      )}

      <footer className="text-center text-xs text-slate-600 py-4">
        All data is aggregated and anonymised. No personal information is transmitted.
      </footer>
    </div>
  );
}
