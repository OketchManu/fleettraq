import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import WelcomeScreen from "./components/WelcomeScreen";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ForgotPassword from "./components/ForgotPassword";
import Dashboard from "./components/Dashboard";
import Analytics from "./components/Analytics";
import VehicleManagement from "./components/VehicleManagement";
import Drivers from "./components/Drivers";
import Reports from "./components/Reports";
import UserSettings from "./components/UserSettings";
import Tracking from "./components/Tracking";
import Profile from "./components/Profile";
import AuthCallback from "./components/AuthCallback";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const App = () => {
  const token = localStorage.getItem("token");
  return (
    <Routes>
      <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <WelcomeScreen />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["admin", "manager", "driver"]}><Dashboard /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute allowedRoles={["admin", "manager"]}><Analytics /></ProtectedRoute>} />
      <Route path="/vehicle-management" element={<ProtectedRoute allowedRoles={["admin", "manager"]}><VehicleManagement /></ProtectedRoute>} />
      <Route path="/drivers" element={<ProtectedRoute allowedRoles={["admin"]}><Drivers /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute allowedRoles={["admin", "manager"]}><Reports /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute allowedRoles={["admin", "manager", "driver"]}><UserSettings /></ProtectedRoute>} />
      <Route path="/tracking" element={<ProtectedRoute allowedRoles={["admin", "manager", "driver"]}><Tracking /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute allowedRoles={["admin", "manager", "driver"]}><Profile /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;