import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, LogOut } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import Button from "./Button";

const Profile = () => {
  const navigate = useNavigate();
  const { darkMode, user } = useFleet();

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    navigate("/login");
  };

  const themeStyles = {
    background: darkMode ? "linear-gradient(135deg, #080016 0%, #150025 100%)" : "linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)",
    color: darkMode ? "#fff" : "#000",
  };

  return (
    <motion.div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", ...themeStyles }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <header style={{ background: darkMode ? "rgba(0, 0, 0, 0.5)" : "#e5e7eb", padding: "12px 16px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", display: "flex", alignItems: "center", color: darkMode ? "#facc15" : "#1f2937" }}>
            <User style={{ marginRight: "8px" }} /> Profile
          </h1>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button onClick={() => navigate("/dashboard")}>Back</Button>
            <Button onClick={handleLogout} className="bg-gradient-to-r from-red-500 to-red-700 border-red-300"><LogOut size={16} style={{ marginRight: "4px" }} /> Logout</Button>
          </div>
        </div>
      </header>
      <main style={{ flexGrow: 1, padding: "16px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <motion.div style={{ background: darkMode ? "rgba(0, 0, 0, 0.2)" : "#fff", padding: "24px", borderRadius: "8px" }}>
            <h2 style={{ color: darkMode ? "#facc15" : "#1f2937", marginBottom: "16px" }}>User Info</h2>
            <p>Email: {user?.email || "N/A"}</p>
            <p>Role: {localStorage.getItem("role") || "N/A"}</p>
          </motion.div>
        </div>
      </main>
      <footer style={{ background: darkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.9)", padding: "16px", textAlign: "center", color: darkMode ? "#9ca3af" : "#6b7280", fontSize: "14px" }}>
        © {new Date().getFullYear()} FleetTraq
      </footer>
    </motion.div>
  );
};

export default Profile;