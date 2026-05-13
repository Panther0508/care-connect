import { motion } from "framer-motion";
import { Shield, AlertTriangle, Heart, Droplets, Baby, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { initHealthGraph, getCurrentHealthState } from "../services/healthGraph";
import { getUserProfile } from "../lib/idb";
import QRCode from "qrcode";
import LoadingSpinner from "../components/LoadingSpinner";

interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

interface UserData {
  name: string;
  bloodType: string;
  allergies: string[];
  conditions: string[];
  emergencyContact: EmergencyContact;
}

export default function EmergencyID() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [qrDataURL, setQrDataURL] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Initialize health graph
        await initHealthGraph();

        // Get profile
        const profile = user ? await getUserProfile(user.id) : null;

        // Get health state
        const healthState = getCurrentHealthState();

        // Build user data object
        const data: UserData = {
          name: profile?.displayName || "Patient Name",
          bloodType: profile?.bloodType || "O+",
          allergies: healthState.allergies?.map((a: any) => a.substance) || [],
          conditions: healthState.conditions?.map((c: any) => c.name) || [],
          emergencyContact: {
            name: profile?.emergencyContactName || "Emergency Contact",
            phone: profile?.emergencyContactPhone || "+234 800 000 0000",
            relationship: profile?.emergencyContactRelation || "Spouse",
          },
        };

        setUserData(data);

        // Generate QR code
        const qrText = JSON.stringify(data);
        const qrUrl = await QRCode.toDataURL(qrText, {
          width: 400,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
        setQrDataURL(qrUrl);
      } catch (err) {
        console.error("Failed to load emergency ID data:", err);
        setError("Could not load emergency data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size={48} />
          <p className="text-slate-400 text-sm">Loading emergency info...</p>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full"
      >
        <div className="p-4 pb-24">
          <h1 className="text-2xl font-bold text-white mb-2">Emergency ID</h1>
          <div className="glass-card p-6 text-center">
            <p className="text-rose-300">{error || "No data available"}</p>
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
        <h1 className="text-2xl font-bold text-white mb-2">Emergency ID</h1>
        <p className="text-slate-400 text-sm mb-6">Critical info for first responders</p>

        {/* QR Code */}
        <div className="glass-card p-6 text-center mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Scan for Emergency Info</h2>
          <div className="bg-white p-4 rounded-xl inline-block mb-3">
            {qrDataURL && (
              <img src={qrDataURL} alt="Emergency QR" className="w-40 h-40" />
            )}
          </div>
          <p className="text-xs text-slate-400">
            Emergency personnel can scan to access your medical summary, allergies, and emergency contact.
          </p>
        </div>

        {/* Summary card */}
        <div className="space-y-4">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Personal Info</h3>
              <Shield className="text-teal-400" size={18} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-400 text-xs">Name</p>
                <p className="text-slate-200">{userData.name}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Blood Type</p>
                <p className="text-slate-200">{userData.bloodType}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 border-rose-500/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-rose-400" size={18} />
              <h3 className="font-semibold text-white">Allergies</h3>
            </div>
            {userData.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userData.allergies.map((allergy) => (
                  <span key={allergy} className="px-3 py-1 rounded-lg bg-rose-500/15 text-rose-300 text-sm border border-rose-500/20">
                    {allergy}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">None recorded</p>
            )}
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="text-amber-400" size={18} />
              <h3 className="font-semibold text-white">Conditions</h3>
            </div>
            {userData.conditions.length > 0 ? (
              <ul className="space-y-1">
                {userData.conditions.map((cond) => (
                  <li key={cond} className="text-slate-300 text-sm flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400" />
                    {cond}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-sm">None recorded</p>
            )}
          </div>

          <div className="glass-card p-4 border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="text-emerald-400" size={18} />
              <h3 className="font-semibold text-white">Emergency Contact</h3>
            </div>
            <div className="text-sm text-slate-300">
              <p className="font-medium">{userData.emergencyContact.name}</p>
              <p className="text-slate-400">{userData.emergencyContact.relationship}</p>
              <a href={`tel:${userData.emergencyContact.phone}`} className="text-teal-400 hover:underline">
                {userData.emergencyContact.phone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
