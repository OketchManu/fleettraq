import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

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
import Profile from "./components/Profile";
import UserSettings from "./components/UserSettings";
import AuthCallback from "./components/AuthCallback";
import FuelTracking from "./components/FuelTracking";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading FleetTraq...</p>
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
      <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
      <Route path="/user-settings" element={user ? <UserSettings /> : <Navigate to="/login" />} />
      <Route path="/fuel-tracking" element={user ? <FuelTracking /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;