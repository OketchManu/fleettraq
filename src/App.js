import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useFleet } from "./context/FleetContext";

// Components
import WelcomeScreen from "./components/WelcomeScreen";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ForgotPassword from "./components/ForgotPassword";
import Dashboard from "./components/Dashboard";
import Analytics from "./components/Analytics";
import Drivers from "./components/Drivers";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import Tracking from "./components/Tracking";
import VehicleManagement from "./components/VehicleManagement";
import UserSettings from "./components/UserSettings";
import AuthCallback from "./components/AuthCallback";
import FuelTracking from "./components/FuelTracking";
import NotFound from "./components/NotFound";

function AppRoutes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { darkMode } = useFleet();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode
            ? "bg-gradient-to-br from-purple-900 to-indigo-900"
            : "bg-gradient-to-br from-gray-100 to-amber-50"
        }`}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={darkMode ? "text-white text-lg" : "text-gray-800 text-lg"}>Loading FleetTraq...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/analytics" element={user ? <Analytics /> : <Navigate to="/login" />} />
      <Route path="/drivers" element={user ? <Drivers /> : <Navigate to="/login" />} />
      <Route path="/reports" element={user ? <Reports /> : <Navigate to="/login" />} />
      <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
      <Route path="/tracking" element={user ? <Tracking /> : <Navigate to="/login" />} />
      <Route path="/vehicle-management" element={user ? <VehicleManagement /> : <Navigate to="/login" />} />
      <Route path="/user-settings" element={user ? <UserSettings /> : <Navigate to="/login" />} />
      <Route path="/fuel-tracking" element={user ? <FuelTracking /> : <Navigate to="/login" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return <AppRoutes />;
}

export default App;