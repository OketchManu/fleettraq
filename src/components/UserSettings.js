import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Save, Lock } from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useFleet } from "../context/FleetContext";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import Button from "./Button";

const UserSettings = () => {
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useFleet();
  const [settings, setSettings] = useState({
    darkMode: true,
    emailNotifications: false,
  });
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login");
      return;
    }
    const settingsRef = doc(db, "userSettings", `${auth.currentUser.uid}_user`);
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings((prev) => ({ ...prev, ...data }));
        setDarkMode(data.darkMode ?? true);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate, setDarkMode]);

  const handleSettingsChange = (e) => {
    const { name, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : e.target.value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async () => {
    if (!auth.currentUser) return;
    const settingsRef = doc(db, "userSettings", `${auth.currentUser.uid}_user`);
    try {
      await setDoc(settingsRef, settings, { merge: true });
      setDarkMode(settings.darkMode);
      setPasswordSuccess("Settings saved successfully!");
      setTimeout(() => setPasswordSuccess(null), 3000); // Clear success message after 3s
    } catch (error) {
      setPasswordError("Failed to save settings. Please try again.");
      console.error("Error saving settings:", error.message);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);
    const { currentPassword, newPassword, confirmPassword } = passwordData;

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
      await reauthenticateWithCredential(user, credential); // Reauthenticate user
      await updatePassword(user, newPassword);
      setPasswordSuccess("Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (error) {
      setPasswordError("Failed to update password. Check your current password and try again.");
      console.error("Error updating password:", error.message);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: darkMode ? "#080016" : "#f3f4f6", color: darkMode ? "#facc15" : "#1f2937" }}>
        Loading your settings...
      </div>
    );
  }

  const themeStyles = {
    background: darkMode ? "linear-gradient(135deg, #080016 0%, #150025 100%)" : "linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)",
    color: darkMode ? "#fff" : "#000",
    cardBg: darkMode ? "rgba(20, 10, 40, 0.7)" : "rgba(255, 255, 255, 0.9)",
    cardBorder: darkMode ? "2px solid rgba(250, 204, 21, 0.5)" : "2px solid rgba(59, 130, 246, 0.5)",
    cardGlow: darkMode ? "0 0 15px rgba(250, 204, 21, 0.3)" : "0 0 15px rgba(59, 130, 246, 0.2)",
  };

  return (
    <motion.div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        ...themeStyles,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ flex: "1 0 auto" }}>
        <header
          style={{
            background: darkMode ? "rgba(0, 0, 0, 0.5)" : "#e5e7eb",
            padding: "12px 16px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                color: darkMode ? "#facc15" : "#1f2937",
              }}
            >
              <User style={{ marginRight: "8px" }} /> User Settings
            </h1>
            <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
          </div>
        </header>

        <main style={{ padding: "16px", flexGrow: 1 }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <motion.div
              style={{
                background: themeStyles.cardBg,
                padding: "24px",
                borderRadius: "8px",
                maxWidth: "512px",
                border: themeStyles.cardBorder,
                boxShadow: themeStyles.cardGlow,
              }}
              whileHover={{ scale: 1.02 }}
            >
              <h2 style={{ fontSize: "20px", fontWeight: "600", color: darkMode ? "#facc15" : "#1f2937", marginBottom: "16px" }}>Account Preferences</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    name="darkMode"
                    checked={settings.darkMode}
                    onChange={handleSettingsChange}
                    style={{ accentColor: darkMode ? "#facc15" : "#3b82f6" }}
                  />
                  <span style={{ color: darkMode ? "#facc15" : "#1f2937" }}>Enable Dark Mode</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={settings.emailNotifications}
                    onChange={handleSettingsChange}
                    style={{ accentColor: darkMode ? "#facc15" : "#3b82f6" }}
                  />
                  <span style={{ color: darkMode ? "#facc15" : "#1f2937" }}>Receive Email Notifications</span>
                </label>
                <Button onClick={handleSaveSettings}>
                  <Save size={16} style={{ marginRight: "4px" }} /> Save Preferences
                </Button>
              </div>

              <h2 style={{ fontSize: "20px", fontWeight: "600", color: darkMode ? "#facc15" : "#1f2937", margin: "24px 0 16px" }}>Change Password</h2>
              {passwordError && <p style={{ color: "#ef4444", marginBottom: "12px" }}>{passwordError}</p>}
              {passwordSuccess && <p style={{ color: "#22c55e", marginBottom: "12px" }}>{passwordSuccess}</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Current Password"
                  style={{
                    padding: "8px",
                    background: darkMode ? "#1a0033" : "#f3f4f6",
                    color: darkMode ? "#fff" : "#000",
                    border: `1px solid ${darkMode ? "#4b5563" : "#d1d5db"}`,
                    borderRadius: "4px",
                  }}
                  required
                />
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="New Password"
                  style={{
                    padding: "8px",
                    background: darkMode ? "#1a0033" : "#f3f4f6",
                    color: darkMode ? "#fff" : "#000",
                    border: `1px solid ${darkMode ? "#4b5563" : "#d1d5db"}`,
                    borderRadius: "4px",
                  }}
                  required
                />
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm New Password"
                  style={{
                    padding: "8px",
                    background: darkMode ? "#1a0033" : "#f3f4f6",
                    color: darkMode ? "#fff" : "#000",
                    border: `1px solid ${darkMode ? "#4b5563" : "#d1d5db"}`,
                    borderRadius: "4px",
                  }}
                  required
                />
                <Button onClick={handleChangePassword}>
                  <Lock size={16} style={{ marginRight: "4px" }} /> Update Password
                </Button>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      <footer
        style={{
          background: darkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.9)",
          padding: "16px",
          textAlign: "center",
          color: darkMode ? "#9ca3af" : "#6b7280",
          fontSize: "14px",
          flexShrink: 0,
        }}
      >
        © {new Date().getFullYear()} FleetTraq
      </footer>
    </motion.div>
  );
};

export default UserSettings;