import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useFleet } from "../context/FleetContext";
import FleetNavBar from "./FleetNavBar";

const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const { darkMode, setDarkMode, user, canManageFleet, isDriver, membershipPending, membershipSuspended, error: fleetError, quotaPaused } = useFleet();

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
      {(quotaPaused || (fleetError && /quota exceeded/i.test(fleetError))) && (
        <div className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-left leading-relaxed bg-red-600/20 text-red-100 border-b border-red-500/40">
          <p className="font-semibold mb-1">Firebase daily limit reached — saves (unassign, fuel, settings) will not complete.</p>
          <p className="mb-2">
            This is a Firebase Spark plan limit, not a bug in FleetTraq. GPS and background sync are paused for 6 hours to protect your quota.
            Close extra tabs, wait until midnight Pacific, or upgrade to Blaze in Firebase Console.
          </p>
          <p className="mb-1">
            <strong>Manual fix now:</strong> Firebase Console → Firestore → clear{" "}
            <code className="text-red-200">assignedVehicleId</code> on the driver and{" "}
            <code className="text-red-200">assignedDriverUid</code> on the vehicle.
          </p>
          <a
            href="https://console.firebase.google.com/project/fleet-tracking-system-b80a3/firestore"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-200 underline hover:text-white"
          >
            Open Firebase Console
          </a>
        </div>
      )}
      <div className="overflow-x-hidden">{children}</div>
    </div>
  );
};

export default AppLayout;
