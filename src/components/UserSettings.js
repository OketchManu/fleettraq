import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Save, Lock, Mail, Bell, Shield, ChevronLeft, CheckCircle, AlertCircle, Moon } from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useFleet } from "../context/FleetContext";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import Button from "./Button";

const UserSettings = () => {
  const navigate = useNavigate();
  const { darkMode, setDarkMode, user } = useFleet();
  const [settings, setSettings] = useState({
    darkMode: true,
    emailNotifications: false,
  });
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    const settingsRef = doc(db, "userSettings", `${user.uid}_user`);
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings((prev) => ({ ...prev, ...data }));
        if (data.darkMode !== undefined) setDarkMode(data.darkMode);
      }
      setLoading(false);
    }, (err) => {
      setError("Failed to load settings: " + err.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setDarkMode, user?.uid]);

  const handleSettingsChange = (e) => {
    const { name, checked } = e.target;
    const newValue = checked;
    setSettings((prev) => ({ ...prev, [name]: newValue }));
    if (name === "darkMode") setDarkMode(newValue);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async () => {
    if (!user?.uid) return;
    setError(null);
    setSuccess(null);
    try {
      const settingsRef = doc(db, "userSettings", `${user.uid}_user`);
      await setDoc(settingsRef, settings, { merge: true });
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save settings: " + err.message);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPasswordSuccess("Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err) {
      setPasswordError("Failed to update password. Please check your current password.");
    }
  };

  if (loading) {
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
              <User className="w-8 h-8 text-yellow-500" />
              <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                Account Settings
              </h1>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                <ChevronLeft size={18} />
                Back to Dashboard
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
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-800 dark:text-red-200 flex items-center gap-2"
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
              className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-800 dark:text-green-200 flex items-center gap-2"
            >
              <CheckCircle size={20} />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-6 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"} border shadow-lg`}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 flex items-center justify-center">
                <User className="w-8 h-8 text-black" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {user?.displayName || user?.email?.split('@')[0] || "User"}
                </h2>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded-xl ${darkMode ? "bg-black/30" : "bg-gray-50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-yellow-500" />
                  <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Account Type</span>
                </div>
                <p className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {localStorage.getItem("role") || "User"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-2xl p-6 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"} border shadow-lg`}
          >
            <h2 className={`text-xl font-semibold mb-5 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Bell className="w-5 h-5 text-yellow-500" />
              Preferences
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
                  onChange={handleSettingsChange}
                  className="w-5 h-5 rounded accent-yellow-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className={darkMode ? "text-gray-300" : "text-gray-600"}>Email Notifications</span>
                </div>
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={handleSettingsChange}
                  className="w-5 h-5 rounded accent-yellow-500"
                />
              </label>
            </div>

            <div className="mt-6 pt-4">
              <Button onClick={handleSaveSettings} className="w-full">
                <Save size={18} />
                Save Preferences
              </Button>
            </div>
          </motion.div>

          {/* Change Password */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`lg:col-span-2 rounded-2xl p-6 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"} border shadow-lg`}
          >
            <h2 className={`text-xl font-semibold mb-5 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Lock className="w-5 h-5 text-yellow-500" />
              Change Password
            </h2>
            
            <AnimatePresence>
              {passwordError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-800 dark:text-red-200 text-sm"
                >
                  {passwordError}
                </motion.div>
              )}
              {passwordSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-800 dark:text-green-200 text-sm"
                >
                  {passwordSuccess}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Current Password"
                className={`px-4 py-3 rounded-xl ${darkMode ? "bg-white/10 text-white placeholder-gray-500" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
              />
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="New Password"
                className={`px-4 py-3 rounded-xl ${darkMode ? "bg-white/10 text-white placeholder-gray-500" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
              />
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm New Password"
                className={`px-4 py-3 rounded-xl ${darkMode ? "bg-white/10 text-white placeholder-gray-500" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
              />
            </div>
            
            <div className="mt-4">
              <Button onClick={handleChangePassword} variant="secondary">
                <Lock size={18} />
                Update Password
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`mt-12 py-6 text-center border-t ${darkMode ? "border-white/10 text-gray-500" : "border-gray-200 text-gray-600"}`}>
        <p>© 2026 FleetTraq. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default UserSettings;