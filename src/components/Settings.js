import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Settings as SettingsIcon, AlertCircle, Save, ChevronLeft, CheckCircle, RefreshCw, LogOut } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";

const Button = ({ onClick, children, disabled, variant = "primary", className = "" }) => {
  const baseStyle = "px-3 py-2 rounded-md font-bold flex items-center text-sm shadow-lg border";
  const variants = {
    primary: `${baseStyle} bg-gradient-to-r from-yellow-500 to-amber-700 text-black border-yellow-300`,
    secondary: `${baseStyle} bg-gradient-to-r from-gray-500 to-gray-700 text-white border-gray-500`,
    danger: `${baseStyle} bg-gradient-to-r from-red-500 to-red-700 text-white border-red-500`,
  };
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      className={`${variants[variant]} ${className} ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </motion.button>
  );
};

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useFleet();
  const [settings, setSettings] = useState({
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
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setError("Please log in to access settings");
      setIsLoading(false);
      navigate("/login");
      return;
    }
    const settingsRef = doc(db, "userSettings", auth.currentUser.uid);
    const unsubscribe = onSnapshot(
      settingsRef,
      (docSnap) => {
        if (docSnap.exists()) setSettings((prev) => ({ ...prev, ...docSnap.data() }));
        else setDoc(settingsRef, settings, { merge: true }).catch((err) => setError("Failed to initialize settings: " + err.message));
        setIsLoading(false);
      },
      (err) => {
        setError("Failed to load settings: " + err.message);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [navigate, settings]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value }));
  };

  const handleSave = async () => {
    if (!auth.currentUser) {
      setError("You must be logged in to save settings");
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const settingsRef = doc(db, "userSettings", auth.currentUser.uid);
      await setDoc(settingsRef, settings, { merge: true });
      setSuccess("Settings saved successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save settings: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!auth.currentUser) {
      setError("You must be logged in to reset settings");
      return;
    }
    const defaultSettings = {
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
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const settingsRef = doc(db, "userSettings", auth.currentUser.uid);
      await setDoc(settingsRef, defaultSettings, { merge: true });
      setSettings(defaultSettings);
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
      navigate("/welcome");
    } catch (error) {
      setError("Logout error: " + error.message);
      console.error("Logout error:", error);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } } };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-900 to-indigo-900 text-yellow-200">Loading settings...</div>;

  return (
    <motion.div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg, #080016 0%, #150025 100%)", color: "#fff" }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <header className="bg-black bg-opacity-50 px-4 py-3 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center text-yellow-300">
            <SettingsIcon className="mr-2" /> Settings
          </h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/dashboard")} variant="secondary">
              <ChevronLeft size={16} className="mr-1" /> Back to Dashboard
            </Button>
            <Button onClick={handleLogout} variant="danger">
              <LogOut size={16} className="mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-red-600 rounded-lg shadow-lg w-full max-w-lg text-white font-semibold"
              >
                <AlertCircle className="inline mr-2" size={20} /> {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 bg-green-600 rounded-lg shadow-lg w-full max-w-lg text-white font-semibold"
              >
                <CheckCircle className="inline mr-2" size={20} /> {success}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            className="bg-black bg-opacity-20 p-6 rounded-lg shadow-lg w-full max-w-lg"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h2 className="text-xl font-semibold text-yellow-300 mb-4">{user?.email || "User"}'s Preferences</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-yellow-300">
                <input
                  type="checkbox"
                  name="notifications"
                  checked={settings.notifications}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="accent-yellow-400"
                />
                Enable Notifications
              </label>
              <label className="flex items-center gap-2 text-yellow-300">
                <input
                  type="checkbox"
                  name="darkMode"
                  checked={settings.darkMode}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="accent-yellow-400"
                />
                Dark Mode
              </label>
              <label className="flex items-center gap-2 text-yellow-300">
                <input
                  type="checkbox"
                  name="emailAlerts"
                  checked={settings.emailAlerts}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="accent-yellow-400"
                />
                Email Alerts
              </label>
              <div>
                <label className="block text-yellow-300 mb-1">Language</label>
                <select
                  name="language"
                  value={settings.language}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
              <div>
                <label className="block text-yellow-300 mb-1">Time Zone</label>
                <select
                  name="timeZone"
                  value={settings.timeZone}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
              <div>
                <label className="block text-yellow-300 mb-1">Units</label>
                <select
                  name="units"
                  value={settings.units}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                >
                  <option value="metric">Metric</option>
                  <option value="imperial">Imperial</option>
                </select>
              </div>
              <div>
                <label className="block text-yellow-300 mb-1">Default Map View</label>
                <select
                  name="defaultMapView"
                  value={settings.defaultMapView}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                >
                  <option value="roadmap">Roadmap</option>
                  <option value="satellite">Satellite</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-yellow-300">
                <input
                  type="checkbox"
                  name="fuelTracking"
                  checked={settings.fuelTracking}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="accent-yellow-400"
                />
                Fuel Tracking
              </label>
              <div>
                <label className="block text-yellow-300 mb-1">Report Frequency</label>
                <select
                  name="reportFrequency"
                  value={settings.reportFrequency}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-yellow-300 mb-1">Tracking Refresh Rate (seconds)</label>
                <input
                  type="number"
                  name="trackingRefreshRate"
                  value={settings.trackingRefreshRate}
                  onChange={handleChange}
                  disabled={isSaving}
                  min="10"
                  max="300"
                  className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                />
              </div>
              <label className="flex items-center gap-2 text-yellow-300">
                <input
                  type="checkbox"
                  name="maintenanceReminders"
                  checked={settings.maintenanceReminders}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="accent-yellow-400"
                />
                Maintenance Reminders
              </label>
              <div>
                <label className="block text-yellow-300 mb-1">Dashboard Layout</label>
                <select
                  name="dashboardLayout"
                  value={settings.dashboardLayout}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                >
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save size={16} className="mr-1" /> Save
                </Button>
                <Button onClick={handleReset} variant="secondary" disabled={isSaving}>
                  <RefreshCw size={16} className="mr-1" /> Reset
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <footer className="bg-black bg-opacity-70 p-4 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} FleetTraq. All rights reserved.
      </footer>
    </motion.div>
  );
};

export default Settings;