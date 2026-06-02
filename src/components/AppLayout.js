import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useFleet } from "../context/FleetContext";
import FleetNavBar from "./FleetNavBar";

const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const { darkMode, setDarkMode, user, canManageFleet, isDriver, membershipPending, membershipSuspended } = useFleet();

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
    <div className="min-h-screen overflow-x-hidden">
      <FleetNavBar
        darkMode={darkMode}
        onToggleDark={toggleDarkMode}
        onLogout={handleLogout}
        user={user}
        canManageFleet={canManageFleet}
        isDriver={isDriver}
      />
      {(membershipPending || membershipSuspended) && (
        <div
          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-center leading-relaxed ${
            membershipSuspended
              ? "bg-red-500/15 text-red-300 border-b border-red-500/30"
              : "bg-amber-500/15 text-amber-300 border-b border-amber-500/30"
          }`}
        >
          {membershipSuspended
            ? "Your access has been suspended by your fleet administrator. Please contact them to restore access."
            : "Your account is awaiting approval from your fleet administrator. You'll see your assigned vehicles once you're approved."}
        </div>
      )}
      <div className="overflow-x-hidden">{children}</div>
    </div>
  );
};

export default AppLayout;
