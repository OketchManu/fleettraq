/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Settings as SettingsIcon, AlertCircle, Save, ChevronLeft, CheckCircle, RefreshCw, LogOut, Bell, Moon, Mail, Globe, Map, Battery, Calendar, Gauge, Layout, Clock } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import Button from "./Button";

const DEFAULT_FLEET_SETTINGS = {
  notifications: true,
  darkMode: true,
  emailAlerts: false,
  language: "en",
  timeZone: "UTC",
  units: "metric",
  defaultMapView: "roadmap",
  fuelTracking: true,
  reportFrequency: "weekly",
  trackingRefreshRate: 30,
  maintenanceReminders: true,
  dashboardLayout: "grid",
};

const Settings = () => {
  const navigate = useNavigate();
  const { darkMode, setDarkMode, user } = useFleet();
  const [settings, setSettings] = useState(DEFAULT_FLEET_SETTINGS);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }
    const settingsRef = doc(db, "userSettings", `${user.uid}_user`);
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
      const settingsRef = doc(db, "userSettings", `${user.uid}_user`);
      await setDoc(settingsRef, settings, { merge: true });
      setSuccess("Settings saved successfully!");
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
      const settingsRef = doc(db, "userSettings", `${user.uid}_user`);
      await setDoc(settingsRef, DEFAULT_FLEET_SETTINGS, { merge: true });
      setSettings({ ...DEFAULT_FLEET_SETTINGS });
      setDarkMode(true);
      setSuccess("Settings reset to defaults");
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

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gradient-to-br from-[#0a0a1a] to-[#0f0f2a]" : "bg-gray-50"}`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>Loading settings...</p>
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
                Settings
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
      <main className="max-w-4xl mx-auto px-4 py-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preferences Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-6 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"} border shadow-lg`}
          >
            <h2 className={`text-xl font-semibold mb-5 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Bell className="w-5 h-5 text-yellow-500" />
              Notifications
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

            <h2 className={`text-xl font-semibold mt-6 mb-5 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Globe className="w-5 h-5 text-yellow-500" />
              Preferences
            </h2>
            <div className="space-y-4">
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
                  <option value="UTC" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>UTC</option>
                  <option value="America/New_York" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>Eastern Time</option>
                  <option value="America/Chicago" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>Central Time</option>
                  <option value="America/Denver" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>Mountain Time</option>
                  <option value="America/Los_Angeles" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>Pacific Time</option>
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
                  <option value="metric" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>Metric (km, L)</option>
                  <option value="imperial" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>Imperial (miles, gal)</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Advanced Settings Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
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
                  <option value="roadmap" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>Roadmap</option>
                  <option value="satellite" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>Satellite</option>
                  <option value="hybrid" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>Hybrid</option>
                </select>
              </div>
              <label className="flex items-center justify-between cursor-pointer">
                <span className={darkMode ? "text-gray-300" : "text-gray-600"}>Fuel Tracking</span>
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

            <h2 className={`text-xl font-semibold mt-6 mb-5 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Calendar className="w-5 h-5 text-yellow-500" />
              Reports
            </h2>
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
                <option value="daily" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>Daily</option>
                <option value="weekly" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>Weekly</option>
                <option value="monthly" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>Monthly</option>
              </select>
            </div>

            <h2 className={`text-xl font-semibold mt-6 mb-5 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Layout className="w-5 h-5 text-yellow-500" />
              Dashboard
            </h2>
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
                <option value="grid" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>Grid View</option>
                <option value="list" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>List View</option>
              </select>
            </div>

            <div className={`flex gap-3 mt-8 pt-4 border-t ${darkMode ? "border-white/10" : "border-gray-200"}`}>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save size={18} />
                Save Changes
              </Button>
              <Button variant="secondary" onClick={handleReset} disabled={isSaving}>
                <RefreshCw size={18} />
                Reset to Defaults
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`mt-12 py-6 text-center border-t ${darkMode ? "border-white/10 text-gray-500" : "border-gray-200 text-gray-600"}`}>
        <p>© 2024 FleetTraq. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Settings;