import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Save, Lock, Mail, Bell, ChevronLeft, CheckCircle, AlertCircle, Moon, Copy, Trash2, Key, Shield, X } from "lucide-react";
import { doc, onSnapshot, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useFleet } from "../context/FleetContext";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "firebase/auth";
import Button from "./Button";

const UserSettings = () => {
  const navigate = useNavigate();
  const { darkMode, setDarkMode, user, fleetId, canManageFleet, isDriver, sendNotification } = useFleet();
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
  
  // Delete Account States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

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
      sendNotification?.("Settings saved successfully", "success");
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
      const currentUser = auth.currentUser;
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      setPasswordSuccess("Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      sendNotification?.("Password updated successfully", "success");
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err) {
      setPasswordError("Failed to update password. Please check your current password.");
    }
  };

  // Delete Account Function
  const handleDeleteAccount = async () => {
    if (!user?.uid) {
      setDeleteError("You must be logged in to delete your account");
      return;
    }

    if (deleteConfirmText !== "DELETE") {
      setDeleteError('Please type "DELETE" to confirm account deletion');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No user found");
      }

      // Reauthenticate if password provided
      if (deletePassword) {
        const credential = EmailAuthProvider.credential(currentUser.email, deletePassword);
        await reauthenticateWithCredential(currentUser, credential);
      }

      // Delete all user data from Firestore
      const collections = ["vehicles", "drivers", "reports", "tracking", "sessions", "deletionRequests", "fuelRecords"];
      
      for (const coll of collections) {
        try {
          const q = query(collection(db, coll), where("accountId", "==", user.uid));
          const snapshot = await getDocs(q);
          const deletePromises = snapshot.docs.map((docSnapshot) => deleteDoc(doc(db, coll, docSnapshot.id)));
          await Promise.all(deletePromises);
        } catch (err) {
          // Collection might not exist or have different structure
          console.log(`Skipping ${coll}:`, err.message);
        }
      }

      // Delete user document
      try {
        await deleteDoc(doc(db, "users", user.uid));
      } catch (err) {
        console.log("User document might not exist:", err.message);
      }

      // Delete user settings
      try {
        await deleteDoc(doc(db, "userSettings", `${user.uid}_user`));
      } catch (err) {
        console.log("User settings might not exist:", err.message);
      }

      // Send notification before deleting (if possible)
      try {
        if (sendNotification) {
          await sendNotification("Your account has been deleted. We're sad to see you go!", "info");
        }
      } catch (err) {
        console.log("Could not send notification:", err.message);
      }

      // Delete the Firebase Auth user
      await deleteUser(currentUser);

      // Clear local storage
      localStorage.clear();
      
      // Redirect to home page
      navigate("/");
    } catch (err) {
      console.error("Deletion error:", err);
      if (err.code === "auth/requires-recent-login") {
        setDeleteError("Please enter your password to confirm account deletion");
      } else if (err.code === "auth/wrong-password") {
        setDeleteError("Incorrect password. Please try again.");
      } else {
        setDeleteError("Failed to delete account: " + err.message);
      }
    } finally {
      setIsDeleting(false);
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

        {isDriver && (
          <p className={`mb-6 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Driver accounts can update preferences and password here. Vehicle assignment and fleet setup are managed by your administrator.
          </p>
        )}

        {canManageFleet && fleetId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 rounded-2xl p-4 border ${darkMode ? "bg-cyan-500/10 border-cyan-500/30" : "bg-cyan-50 border-cyan-200"}`}
          >
            <p className={`text-sm font-medium mb-2 ${darkMode ? "text-cyan-100" : "text-cyan-900"}`}>
              Fleet organization ID — give this to drivers when they sign up so they join the correct fleet.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <code className={`text-xs sm:text-sm break-all rounded-lg px-3 py-2 ${darkMode ? "bg-black/40 text-white" : "bg-white text-gray-900 border border-gray-200"}`}>
                {fleetId}
              </code>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(fleetId);
                    setSuccess("Fleet organization ID copied to clipboard.");
                    setTimeout(() => setSuccess(null), 2500);
                  } catch {
                    setError("Could not copy to clipboard.");
                  }
                }}
              >
                <Copy size={16} />
                Copy
              </Button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Profile Information Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-6 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"} border shadow-lg`}
          >
            <h2 className={`text-xl font-semibold mb-5 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <User className="w-5 h-5 text-yellow-500" />
              Profile Information
            </h2>
            
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg`}>
                <span className="text-2xl font-bold text-black">
                  {user?.displayName ? user.displayName[0].toUpperCase() : user?.email?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {user?.displayName || user?.email?.split('@')[0] || "User"}
                </h3>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {user?.email}
                </p>
                <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"} capitalize mt-1`}>
                  <Shield className="w-3 h-3 inline mr-1" />
                  Role: {localStorage.getItem("role") || "User"}
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
            className={`rounded-2xl p-6 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"} border shadow-lg`}
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

          {/* Delete Account Section - DANGER ZONE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`rounded-2xl p-6 border-2 ${darkMode ? "bg-red-500/10 border-red-500/30" : "bg-red-50 border-red-200"} shadow-lg`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Trash2 className="w-5 h-5 text-red-500" />
              <h2 className={`text-xl font-semibold text-red-500`}>
                Danger Zone
              </h2>
            </div>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} mb-4`}>
              Once you delete your account, all your data will be permanently removed. 
              This action cannot be undone. All vehicles, drivers, reports, and tracking data associated with your account will be lost forever.
            </p>
            <Button 
              onClick={() => setShowDeleteModal(true)} 
              variant="danger"
            >
              <Trash2 size={16} className="mr-1" />
              Delete Account
            </Button>
          </motion.div>
        </div>
      </main>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteModal(false);
              setDeletePassword("");
              setDeleteConfirmText("");
              setDeleteError(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl ${darkMode ? "bg-[#1a1a2e] border-red-500/30" : "bg-white border-red-200"} border shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-5 border-b ${darkMode ? "border-white/10" : "border-gray-200"} flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                    Delete Account
                  </h2>
                </div>
                <button 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword("");
                    setDeleteConfirmText("");
                    setDeleteError(null);
                  }} 
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div className={`p-3 rounded-lg ${darkMode ? "bg-red-500/10" : "bg-red-50"} border border-red-500/30`}>
                  <p className="text-sm text-red-400">
                    ⚠️ <span className="font-semibold">Warning:</span> This action cannot be undone. 
                    All your data will be permanently deleted.
                  </p>
                </div>

                <div>
                  <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Type <span className="font-mono font-bold text-red-500">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      darkMode ? "bg-white/10 text-white border-white/20" : "bg-gray-100 text-gray-800 border-gray-300"
                    }`}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    <Key className="w-3 h-3 inline mr-1" />
                    Password (required for security)
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      darkMode ? "bg-white/10 text-white border-white/20" : "bg-gray-100 text-gray-800 border-gray-300"
                    }`}
                  />
                </div>

                {deleteError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm"
                  >
                    {deleteError}
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={handleDeleteAccount} 
                    variant="danger" 
                    disabled={isDeleting || deleteConfirmText !== "DELETE" || !deletePassword}
                    className="flex-1"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} className="mr-1" />
                        Permanently Delete
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletePassword("");
                      setDeleteConfirmText("");
                      setDeleteError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className={`mt-12 py-6 text-center border-t ${darkMode ? "border-white/10 text-gray-500" : "border-gray-200 text-gray-600"}`}>
        <p>© 2026 FleetTraq. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default UserSettings;