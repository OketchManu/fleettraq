import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useFleet } from "./context/FleetContext";

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
import HelpCenter from "./components/HelpCenter";
import RouteHistory from "./components/RouteHistory";
import Geofences from "./components/Geofences";
import MyVehicle from "./components/MyVehicle";
import Demo from "./components/Demo";
import NotFound from "./components/NotFound";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfService from "./components/TermsOfService";
import AppLayout from "./components/AppLayout";
import RequireActiveMembership from "./components/RequireActiveMembership";

function AuthenticatedShell({ children }) {
  return <AppLayout>{children}</AppLayout>;
}

function RequireFleetAdmin({ children }) {
  const { user, loading, canManageFleet } = useFleet();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!canManageFleet) return <Navigate to="/dashboard" replace />;

  return children;
}

function HomeRoute({ user }) {
  if (user) return <Navigate to="/dashboard" replace />;
  return <WelcomeScreen />;
}

function AppRoutes() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const { darkMode, loading: fleetLoading } = useFleet();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  if (!authReady || (user && fleetLoading)) {
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

  const adminShell = (page) =>
    user ? (
      <AuthenticatedShell>
        <RequireFleetAdmin>{page}</RequireFleetAdmin>
      </AuthenticatedShell>
    ) : (
      <Navigate to="/login" />
    );

  const authedShell = (page) =>
    user ? <AuthenticatedShell>{page}</AuthenticatedShell> : <Navigate to="/login" />;

  const activeMemberShell = (page) =>
    user ? (
      <AuthenticatedShell>
        <RequireActiveMembership>{page}</RequireActiveMembership>
      </AuthenticatedShell>
    ) : (
      <Navigate to="/login" />
    );

  return (
    <Routes>
      <Route path="/" element={<HomeRoute user={user} />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/dashboard" element={authedShell(<Dashboard />)} />
      <Route path="/analytics" element={adminShell(<Analytics />)} />
      <Route path="/drivers" element={adminShell(<Drivers />)} />
      <Route path="/reports" element={adminShell(<Reports />)} />
      <Route path="/settings" element={adminShell(<Settings />)} />
      <Route path="/tracking" element={activeMemberShell(<Tracking />)} />
      <Route path="/vehicle-management" element={adminShell(<VehicleManagement />)} />
      <Route path="/my-vehicle" element={activeMemberShell(<MyVehicle />)} />
      <Route path="/user-settings" element={authedShell(<UserSettings />)} />
      <Route path="/fuel-tracking" element={activeMemberShell(<FuelTracking />)} />
      <Route path="/route-history" element={adminShell(<RouteHistory />)} />
      <Route path="/geofences" element={adminShell(<Geofences />)} />
      <Route path="/help" element={authedShell(<HelpCenter />)} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return <AppRoutes />;
}

export default App;
