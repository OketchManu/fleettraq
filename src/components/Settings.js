/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings as SettingsIcon, AlertCircle, Save, ChevronLeft, CheckCircle, 
  RefreshCw, LogOut, Bell, Moon, Mail, Globe, Map, Calendar, 
  Gauge, Layout, Clock, TrendingUp, Fuel, Truck, Users, Shield, Key, Copy
} from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { doc, onSnapshot, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import Button from "./Button";
import ProfilePicture from "./ProfilePicture";

const DEFAULT_FLEET_SETTINGS = {
  // Notification Settings
  notifications: true,
  emailAlerts: false,
  maintenanceReminders: true,
  
  // Display Preferences
  darkMode: true,
  language: "en",
  timeZone: "UTC",
  units: "metric",
  
  // Map & Tracking
  defaultMapView: "roadmap",
  fuelTracking: true,
  trackingRefreshRate: 30,
  
  // Reports
  reportFrequency: "weekly",
  
  // Dashboard
  dashboardLayout: "grid",
  
  // Fleet Settings (Admin only)
  enableGeofencing: false,
  autoAssignDrivers: false,
  speedLimitAlert: 80,
  idleTimeAlert: 15,
};

const Settings = () => {
  const navigate = useNavigate();
  const { darkMode, setDarkMode, user, sendNotification, canManageFleet, isAdmin, fleetId } = useFleet();
  const [settings, setSettings] = useState(DEFAULT_FLEET_SETTINGS);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fleetStats, setFleetStats] = useState({
    totalVehicles: 0,
    totalDrivers: 0,
    activeTrackings: 0,
  });

  // Load fleet stats (Admin only)
  useEffect(() => {
    if (!canManageFleet || !user?.uid) return;

    const loadFleetStats = async () => {
      try {
        const vehiclesQuery = query(collection(db, "vehicles"), where("accountId", "==", user.uid));
        const driversQuery = query(collection(db, "drivers"), where("accountId", "==", user.uid));
        const trackingQuery = query(collection(db, "tracking"), where("accountId", "==", user.uid), where("isTracking", "==", true));
        
        const [vehiclesSnap, driversSnap, trackingSnap] = await Promise.all([
          getDocs(vehiclesQuery),
          getDocs(driversQuery),
          getDocs(trackingQuery)
        ]);
        
        setFleetStats({
          totalVehicles: vehiclesSnap.size,
          totalDrivers: driversSnap.size,
          activeTrackings: trackingSnap.size,
        });
      } catch (err) {
        console.error("Failed to load fleet stats:", err);
      }
    };
    
    loadFleetStats();
  }, [canManageFleet, user?.uid]);

  // Load settings
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }
    const settingsRef = doc(db, "fleetSettings", `${user.uid}_fleet`);
    const unsubscribe = onSnapshot(
      settingsRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings((prev) => ({ ...prev, ...data }));
          if (data.darkMode !== undefined) setDarkMode(data.darkMode);
        } else {
          setDoc(settingsRef, DEFAULT_FLEET_SETTINGS, { merge: true }).catch((err) => setError("Failed to initialize settings: " + err.message));
        }
        setIsLoading(false);
      },
      (err) => {
        setError("Failed to load settings: " + err.message);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [setDarkMode, user?.uid]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    const newValue = type === "checkbox" ? checked : type === "number" ? Number(value) : value;
    setSettings((prev) => ({ ...prev, [name]: newValue }));
    if (name === "darkMode") setDarkMode(newValue);
  };

  const handleSave = async () => {
    if (!user?.uid) {
      setError("You must be logged in to save settings");
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const settingsRef = doc(db, "fleetSettings", `${user.uid}_fleet`);
      await setDoc(settingsRef, settings, { merge: true });
      setSuccess("Fleet settings saved successfully!");
      sendNotification?.("Fleet settings updated", "success");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save settings: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!user?.uid) {
      setError("You must be logged in to reset settings");
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const settingsRef = doc(db, "fleetSettings", `${user.uid}_fleet`);
      await setDoc(settingsRef, DEFAULT_FLEET_SETTINGS, { merge: true });
      setSettings({ ...DEFAULT_FLEET_SETTINGS });
      setDarkMode(true);
      setSuccess("Settings reset to defaults");
      sendNotification?.("Fleet settings reset to defaults", "info");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to reset settings: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate("/");
    } catch (error) {
      setError("Logout error: " + error.message);
    }
  };

  // Copy fleet ID to clipboard
  const copyFleetId = async () => {
    if (!fleetId) return;
    try {
      await navigator.clipboard.writeText(fleetId);
      setSuccess("Fleet ID copied to clipboard!");
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError("Could not copy to clipboard");
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gradient-to-br from-[#0a0a1a] to-[#0f0f2a]" : "bg-gray-50"}`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>Loading fleet settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]" : "bg-gray-50"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-20 ${darkMode ? "bg-black/50 backdrop-blur-xl border-b border-white/10" : "bg-white shadow-lg"}`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-yellow-500" />
              <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                Fleet Settings
              </h1>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                <ChevronLeft size={18} />
                Back to Dashboard
              </Button>
              <Button variant="danger" onClick={handleLogout}>
                <LogOut size={18} />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 flex items-center gap-2"
            >
              <AlertCircle size={20} />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-300 flex items-center gap-2"
            >
              <CheckCircle size={20} />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fleet Overview Cards (Admin only) */}
        {canManageFleet && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"}`}>
              <div className="flex items-center gap-3">
                <Truck className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{fleetStats.totalVehicles}</p>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Vehicles</p>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"}`}>
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-cyan-400" />
                <div>
                  <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{fleetStats.totalDrivers}</p>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Drivers</p>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"}`}>
              <div className="flex items-center gap-3">
                <Map className="w-8 h-8 text-green-400" />
                <div>
                  <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{fleetStats.activeTrackings}</p>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Active Tracking</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fleet ID Card */}
        {canManageFleet && fleetId && (
          <div className={`mb-6 rounded-2xl p-4 border ${darkMode ? "bg-yellow-500/10 border-yellow-500/30" : "bg-yellow-50 border-yellow-200"}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? "text-yellow-100" : "text-yellow-900"}`}>
                  <Shield className="w-4 h-4 inline mr-1" />
                  Fleet Organization ID
                </p>
                <code className={`text-xs break-all ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {fleetId}
                </code>
              </div>
              <Button variant="secondary" size="sm" onClick={copyFleetId}>
                <Copy size={14} />
                Copy ID
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-6 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"} border shadow-lg`}
          >
            <h2 className={`text-xl font-semibold mb-5 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Bell className="w-5 h-5 text-yellow-500" />
              Notification Settings
            </h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className={darkMode ? "text-gray-300" : "text-gray-600"}>Push Notifications</span>
                <input
                  type="checkbox"
                  name="notifications"
                  checked={settings.notifications}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-5 h-5 rounded accent-yellow-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className={darkMode ? "text-gray-300" : "text-gray-600"}>Email Alerts</span>
                <input
                  type="checkbox"
                  name="emailAlerts"
                  checked={settings.emailAlerts}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-5 h-5 rounded accent-yellow-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className={darkMode ? "text-gray-300" : "text-gray-600"}>Maintenance Reminders</span>
                <input
                  type="checkbox"
                  name="maintenanceReminders"
                  checked={settings.maintenanceReminders}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-5 h-5 rounded accent-yellow-500"
                />
              </label>
            </div>
          </motion.div>

          {/* Display Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-2xl p-6 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"} border shadow-lg`}
          >
            <h2 className={`text-xl font-semibold mb-5 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Globe className="w-5 h-5 text-yellow-500" />
              Display Preferences
            </h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Moon className="w-4 h-4 text-gray-400" />
                  <span className={darkMode ? "text-gray-300" : "text-gray-600"}>Dark Mode</span>
                </div>
                <input
                  type="checkbox"
                  name="darkMode"
                  checked={settings.darkMode}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-5 h-5 rounded accent-yellow-500"
                />
              </label>
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Language</label>
                <select
                  name="language"
                  value={settings.language}
                  onChange={handleChange}
                  disabled={isSaving}
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    darkMode ? "bg-white/10 text-white border-white/20" : "bg-gray-100 text-gray-800 border-gray-300"
                  }`}
                >
                  <option value="en" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>English</option>
                  <option value="es" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>Español</option>
                  <option value="fr" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>Français</option>
                  <option value="de" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>Deutsch</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Time Zone</label>
                <select
                  name="timeZone"
                  value={settings.timeZone}
                  onChange={handleChange}
                  disabled={isSaving}
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    darkMode ? "bg-white/10 text-white border-white/20" : "bg-gray-100 text-gray-800 border-gray-300"
                  }`}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Units</label>
                <select
                  name="units"
                  value={settings.units}
                  onChange={handleChange}
                  disabled={isSaving}
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    darkMode ? "bg-white/10 text-white border-white/20" : "bg-gray-100 text-gray-800 border-gray-300"
                  }`}
                >
                  <option value="metric">Metric (km, L)</option>
                  <option value="imperial">Imperial (miles, gal)</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Map & Tracking Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-2xl p-6 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"} border shadow-lg`}
          >
            <h2 className={`text-xl font-semibold mb-5 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Map className="w-5 h-5 text-yellow-500" />
              Map & Tracking
            </h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Default Map View</label>
                <select
                  name="defaultMapView"
                  value={settings.defaultMapView}
                  onChange={handleChange}
                  disabled={isSaving}
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    darkMode ? "bg-white/10 text-white border-white/20" : "bg-gray-100 text-gray-800 border-gray-300"
                  }`}
                >
                  <option value="roadmap">Roadmap</option>
                  <option value="satellite">Satellite</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Fuel className="w-4 h-4 text-gray-400" />
                  <span className={darkMode ? "text-gray-300" : "text-gray-600"}>Fuel Tracking</span>
                </div>
                <input
                  type="checkbox"
                  name="fuelTracking"
                  checked={settings.fuelTracking}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-5 h-5 rounded accent-yellow-500"
                />
              </label>
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Tracking Refresh Rate</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    name="trackingRefreshRate"
                    value={settings.trackingRefreshRate}
                    onChange={handleChange}
                    disabled={isSaving}
                    min="10"
                    max="120"
                    step="5"
                    className="flex-1 accent-yellow-500"
                  />
                  <span className={`text-sm font-mono ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {settings.trackingRefreshRate}s
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Reports & Dashboard Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-2xl p-6 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"} border shadow-lg`}
          >
            <h2 className={`text-xl font-semibold mb-5 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Calendar className="w-5 h-5 text-yellow-500" />
              Reports & Dashboard
            </h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Report Frequency</label>
                <select
                  name="reportFrequency"
                  value={settings.reportFrequency}
                  onChange={handleChange}
                  disabled={isSaving}
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    darkMode ? "bg-white/10 text-white border-white/20" : "bg-gray-100 text-gray-800 border-gray-300"
                  }`}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Dashboard Layout</label>
                <select
                  name="dashboardLayout"
                  value={settings.dashboardLayout}
                  onChange={handleChange}
                  disabled={isSaving}
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    darkMode ? "bg-white/10 text-white border-white/20" : "bg-gray-100 text-gray-800 border-gray-300"
                  }`}
                >
                  <option value="grid">Grid View</option>
                  <option value="list">List View</option>
                </select>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Admin Advanced Settings */}
        {canManageFleet && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`mt-6 rounded-2xl p-6 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"} border shadow-lg`}
          >
            <h2 className={`text-xl font-semibold mb-5 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Shield className="w-5 h-5 text-yellow-500" />
              Advanced Fleet Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className={darkMode ? "text-gray-300" : "text-gray-600"}>Enable Geofencing</span>
                  <p className="text-xs text-gray-500">Alert when vehicles enter/leave designated areas</p>
                </div>
                <input
                  type="checkbox"
                  name="enableGeofencing"
                  checked={settings.enableGeofencing}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-5 h-5 rounded accent-yellow-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className={darkMode ? "text-gray-300" : "text-gray-600"}>Auto-Assign Drivers</span>
                  <p className="text-xs text-gray-500">Automatically assign drivers to available vehicles</p>
                </div>
                <input
                  type="checkbox"
                  name="autoAssignDrivers"
                  checked={settings.autoAssignDrivers}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-5 h-5 rounded accent-yellow-500"
                />
              </label>
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Speed Limit Alert (km/h)</label>
                <input
                  type="number"
                  name="speedLimitAlert"
                  value={settings.speedLimitAlert}
                  onChange={handleChange}
                  disabled={isSaving}
                  min="0"
                  max="200"
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    darkMode ? "bg-white/10 text-white border-white/20" : "bg-gray-100 text-gray-800 border-gray-300"
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Idle Time Alert (minutes)</label>
                <input
                  type="number"
                  name="idleTimeAlert"
                  value={settings.idleTimeAlert}
                  onChange={handleChange}
                  disabled={isSaving}
                  min="0"
                  max="120"
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    darkMode ? "bg-white/10 text-white border-white/20" : "bg-gray-100 text-gray-800 border-gray-300"
                  }`}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className={`flex gap-3 mt-6 pt-4 border-t ${darkMode ? "border-white/10" : "border-gray-200"}`}>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save size={18} />
            Save All Settings
          </Button>
          <Button variant="secondary" onClick={handleReset} disabled={isSaving}>
            <RefreshCw size={18} />
            Reset to Defaults
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className={`mt-12 py-6 text-center border-t ${darkMode ? "border-white/10 text-gray-500" : "border-gray-200 text-gray-600"}`}>
        <p>© 2026 FleetTraq. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Settings;