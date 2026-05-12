/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Truck, Settings, Users, Activity, FileText, 
  Car, User, Menu, X, Moon, Sun, Bell, Search, 
  TrendingUp, Fuel, Clock, AlertTriangle, ChevronRight,
  Navigation, Gauge, Calendar, Shield
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { db, auth } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { collection, query, onSnapshot, where, orderBy } from "firebase/firestore";
import { useFleet } from "../context/FleetContext";
import Button from "./Button";
import { CarIcon } from "./assets/car-icon";
import NotificationBell from "./NotificationBell";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MapViewController = ({ bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length > 0) {
      const leafletBounds = L.latLngBounds(bounds.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(leafletBounds, { padding: [50, 50], animate: true });
    }
  }, [bounds, map]);

  return null;
};

const VehicleMarker = ({ track, vehicle }) => {
  const [position, setPosition] = useState([track.lat, track.lng]);
  const markerRef = useRef(null);

  useEffect(() => {
    const newPosition = [track.lat, track.lng];
    setPosition(newPosition);
    if (markerRef.current) {
      markerRef.current.setLatLng(newPosition);
    }
  }, [track.lat, track.lng]);

  return (
    <Marker ref={markerRef} position={position} icon={CarIcon}>
      <Popup>
        <div className="min-w-[220px] p-3">
          <div className="flex items-center gap-2 mb-2">
            <Car className="w-5 h-5 text-yellow-500" />
            <strong className="text-lg text-gray-800">
              {vehicle ? `${vehicle.make} ${vehicle.model}` : "Unknown Vehicle"}
            </strong>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              <span className="font-semibold">Plate:</span> {vehicle?.licensePlate || vehicle?.plateNumber || "N/A"}
            </p>
            {track.locationName && (
              <p className="text-gray-600">
                <span className="font-semibold">Location:</span> {track.locationName}
              </p>
            )}
            <p className="text-gray-500 text-xs">
              <span className="font-semibold">Last Update:</span> {new Date(track.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { vehicles, fetchVehicles, darkMode, setDarkMode, user, sendNotification, maintenanceAlerts } = useFleet();
  const role = localStorage.getItem("role");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [trackedVehicles, setTrackedVehicles] = useState([]);
  const [showAlertBanner, setShowAlertBanner] = useState(true);
  const [stats, setStats] = useState({
    totalMileage: 0,
    avgFuelEfficiency: 0,
    activeAlerts: 0
  });
  const menuRef = useRef(null);

  // Send welcome notification when dashboard loads
  useEffect(() => {
    if (user && !localStorage.getItem("welcomeShown")) {
      sendNotification(`Welcome back, ${user.displayName || user.email}!`, "success");
      localStorage.setItem("welcomeShown", "true");
    }
  }, [user, sendNotification]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const loadVehicles = async () => {
      if (!auth.currentUser) {
        setError("You must be logged in to view fleet data.");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        await fetchVehicles();
      } catch (err) {
        setError("Failed to load fleet data: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "tracking"),
      where("accountId", "==", auth.currentUser.uid),
      where("isTracking", "==", true),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const trackedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          vehicleId: doc.data().vehicleId,
          lat: Number(doc.data().lat) || -1.2864,
          lng: Number(doc.data().lng) || 36.8172,
          locationName: doc.data().locationName || "Unknown Location",
          timestamp: doc.data().timestamp || new Date().toISOString(),
          isTracking: doc.data().isTracking,
        }));
        setTrackedVehicles([...new Map(trackedData.map((item) => [item.vehicleId, item])).values()]);
      },
      (err) => {
        setError("Failed to fetch tracking updates: " + err.message);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (vehicles.length) {
      const totalMileage = vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0);
      const avgFuelEfficiency = vehicles.length ? vehicles.reduce((sum, v) => sum + (v.fuelEfficiency || 15), 0) / vehicles.length : 0;
      const activeAlerts = maintenanceAlerts.length;
      setStats({ totalMileage, avgFuelEfficiency: Math.round(avgFuelEfficiency), activeAlerts });
    }
  }, [vehicles, maintenanceAlerts]);

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    const currentUser = auth.currentUser;
    if (currentUser) {
      const settingsRef = doc(db, "userSettings", `${currentUser.uid}_user`);
      await setDoc(settingsRef, { darkMode: newMode }, { merge: true });
    }
  };

  const getFleetStats = () => {
    if (!vehicles || !Array.isArray(vehicles)) {
      return { total: 0, active: 0, onRoute: 0, maintenance: 0 };
    }
    return {
      total: vehicles.length,
      active: vehicles.filter((v) => v.status?.toLowerCase() === "active").length,
      onRoute: vehicles.filter((v) => v.status?.toLowerCase() === "on_route").length,
      maintenance: vehicles.filter((v) => v.status?.toLowerCase() === "maintenance").length,
    };
  };

  const fleetStats = getFleetStats();

  const navButtons = [
    role === "admin" && { label: "Drivers", icon: <Users size={18} />, path: "/drivers", color: "from-yellow-500 to-amber-600" },
    { label: "Tracking", icon: <MapPin size={18} />, path: "/tracking", color: "from-yellow-500 to-amber-600" },
    { label: "Analytics", icon: <Activity size={18} />, path: "/analytics", color: "from-yellow-500 to-amber-600" },
    { label: "Reports", icon: <FileText size={18} />, path: "/reports", color: "from-yellow-500 to-amber-600" },
    { label: "Vehicles", icon: <Car size={18} />, path: "/vehicle-management", color: "from-yellow-500 to-amber-600" },
    { label: "Fuel", icon: <Fuel size={18} />, path: "/fuel-tracking", color: "from-yellow-500 to-amber-600" },
    { label: "Profile", icon: <User size={18} />, path: "/profile", color: "from-yellow-500 to-amber-600" },
    { label: "Settings", icon: <Settings size={18} />, path: "/settings", color: "from-yellow-500 to-amber-600" },
  ].filter(Boolean);

  const MapComponent = useMemo(() => {
    const defaultPosition = [-1.2864, 36.8172];
    const bounds =
      trackedVehicles.length > 0
        ? trackedVehicles.map((track) => [track.lat, track.lng])
        : [defaultPosition];

    return (
      <MapContainer
        center={defaultPosition}
        zoom={10}
        style={{ height: isMobile ? "60vh" : "70vh", width: "100%", borderRadius: "1rem" }}
        className="z-0"
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {trackedVehicles.map((track) => {
          const vehicle = vehicles.find((v) => v.id === track.vehicleId);
          return <VehicleMarker key={track.id} track={track} vehicle={vehicle} />;
        })}
        <MapViewController bounds={bounds} />
      </MapContainer>
    );
  }, [trackedVehicles, vehicles, isMobile]);

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]" : "bg-gray-50"}`}>
      {/* Maintenance Alert Banner */}
      {maintenanceAlerts.length > 0 && showAlertBanner && (
        <div className="bg-red-500/90 text-white p-3 text-center relative">
          <p className="text-sm font-medium">
            ⚠️ {maintenanceAlerts.length} vehicle(s) require maintenance attention!
          </p>
          <button
            onClick={() => setShowAlertBanner(false)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-200"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-20 ${darkMode ? "bg-black/50 backdrop-blur-xl border-b border-white/10" : "bg-white shadow-lg"}`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Truck className="w-8 h-8 text-yellow-500" />
              <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                Fleet<span className="text-yellow-500">Traq</span>
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navButtons.map((btn, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => navigate(btn.path)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-xl bg-gradient-to-r ${btn.color} text-black font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all`}
                >
                  {btn.icon}
                  {btn.label}
                </motion.button>
              ))}
              
              <NotificationBell />
              
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
              >
                {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              <NotificationBell />
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl bg-white/10"
              >
                {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-white/10"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden ${darkMode ? "bg-black/95" : "bg-white"} border-b border-white/10 shadow-xl`}
          >
            <div className="flex flex-col p-4 gap-2">
              {navButtons.map((btn, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    navigate(btn.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-xl bg-gradient-to-r ${btn.color} text-black font-semibold flex items-center gap-3`}
                >
                  {btn.icon}
                  {btn.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>Loading fleet data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300">
            {error}
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-lg`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Truck className="w-8 h-8 text-yellow-500" />
                  <span className="text-2xl font-bold text-yellow-500">{fleetStats.total}</span>
                </div>
                <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Total Vehicles</h3>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mt-1`}>Active: {fleetStats.active}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`p-5 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-lg`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Navigation className="w-8 h-8 text-cyan-400" />
                  <span className="text-2xl font-bold text-cyan-400">{fleetStats.onRoute}</span>
                </div>
                <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>On Route</h3>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mt-1`}>Currently active</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`p-5 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-lg`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Gauge className="w-8 h-8 text-green-400" />
                  <span className="text-2xl font-bold text-green-400">{stats.totalMileage.toLocaleString()}</span>
                </div>
                <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Total Mileage</h3>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mt-1`}>Across all vehicles</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`p-5 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-lg`}
              >
                <div className="flex items-center justify-between mb-3">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                  <span className="text-2xl font-bold text-red-400">{stats.activeAlerts}</span>
                </div>
                <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Active Alerts</h3>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mt-1`}>Require attention</p>
              </motion.div>
            </div>

            {/* Map Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`rounded-2xl overflow-hidden border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-xl`}
            >
              <div className={`p-4 border-b ${darkMode ? "border-white/10 bg-black/30" : "bg-gray-50"}`}>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-yellow-500" />
                  <h2 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Live Fleet Location</h2>
                  <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Live Tracking
                  </span>
                </div>
              </div>
              {MapComponent}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              <button
                onClick={() => navigate("/tracking")}
                className={`p-4 rounded-xl ${darkMode ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-gray-50"} border ${darkMode ? "border-white/10" : "border-gray-200"} transition-all group`}
              >
                <Navigation className="w-6 h-6 text-yellow-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>Start Tracking</p>
              </button>
              
              <button
                onClick={() => navigate("/vehicle-management")}
                className={`p-4 rounded-xl ${darkMode ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-gray-50"} border ${darkMode ? "border-white/10" : "border-gray-200"} transition-all group`}
              >
                <Car className="w-6 h-6 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>Manage Fleet</p>
              </button>
              
              <button
                onClick={() => navigate("/reports")}
                className={`p-4 rounded-xl ${darkMode ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-gray-50"} border ${darkMode ? "border-white/10" : "border-gray-200"} transition-all group`}
              >
                <FileText className="w-6 h-6 text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>View Reports</p>
              </button>
              
              <button
                onClick={() => navigate("/analytics")}
                className={`p-4 rounded-xl ${darkMode ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-gray-50"} border ${darkMode ? "border-white/10" : "border-gray-200"} transition-all group`}
              >
                <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>Analytics</p>
              </button>
            </motion.div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className={`mt-12 py-6 text-center border-t ${darkMode ? "border-white/10 text-gray-500" : "border-gray-200 text-gray-600"}`}>
        <p>© 2025 FleetTraq. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Dashboard;