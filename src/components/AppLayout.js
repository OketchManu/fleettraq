import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useFleet } from "../context/FleetContext";
import FleetNavBar from "./FleetNavBar";

const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const { darkMode, setDarkMode, user, canManageFleet, isDriver } = useFleet();

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    const currentUser = auth.currentUser;
    if (currentUser) {
      const settingsRef = doc(db, "userSettings", `${currentUser.uid}_user`);
      await setDoc(settingsRef, { darkMode: newMode }, { merge: true });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("profilePicture");
      localStorage.removeItem("welcomeShown");
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <>
      <FleetNavBar
        darkMode={darkMode}
        onToggleDark={toggleDarkMode}
        onLogout={handleLogout}
        user={user}
        canManageFleet={canManageFleet}
        isDriver={isDriver}
      />
      {children}
    </>
  );
};

export default AppLayout;
