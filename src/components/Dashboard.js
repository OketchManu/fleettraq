import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Truck, Settings, Users, Activity, FileText, Car, User, Menu, X, Moon, Sun } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { db, auth } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { useFleet } from "../context/FleetContext";

// Fix Leaflet marker icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import carIcon from './assets/car-icon.png'; // Import the car icon

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Larger car icon for tracked vehicles
let CarIcon = L.icon({
  iconUrl: carIcon,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
  popupAnchor: [0, -24],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Map view controller component
const MapViewController = ({ bounds }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      const leafletBounds = L.latLngBounds(bounds.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(leafletBounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { vehicles, fetchVehicles, trackingData, darkMode, setDarkMode } = useFleet();
  const role = localStorage.getItem("role");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [trackedVehicles, setTrackedVehicles] = useState([]);
  const menuRef = useRef(null);

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

  // Listen for real-time tracking updates
  useEffect(() => {
    const q = query(
      collection(db, "tracking"),
      where("isTracking", "==", true)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trackedData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const trackedArray = trackedData.map(track => ({
        vehicleId: track.vehicleId,
        lat: track.lat,
        lng: track.lng,
        locationName: track.locationName,
        timestamp: track.timestamp
      }));
      
      setTrackedVehicles(trackedArray);
    }, (err) => {
      setError("Failed to fetch tracking updates: " + err.message);
    });

    return () => unsubscribe();
  }, []);

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    const user = auth.currentUser;
    if (user) {
      const settingsRef = doc(db, "userSettings", `${user.uid}_user`);
      await setDoc(settingsRef, { darkMode: newMode }, { merge: true });
    }
  };

  // Calculate fleet statistics
  const getFleetStats = () => {
    if (!vehicles || !Array.isArray(vehicles)) {
      return {
        total: 0,
        active: 0,
        onRoute: 0,
        maintenance: 0
      };
    }

    return {
      total: vehicles.length,
      active: vehicles.filter(v => v.status?.toLowerCase() === "active").length,
      onRoute: vehicles.filter(v => v.status?.toLowerCase() === "on_route").length,
      maintenance: vehicles.filter(v => v.status?.toLowerCase() === "maintenance").length
    };
  };

  const fleetStats = getFleetStats();

  const themeStyles = {
    background: darkMode
      ? "linear-gradient(135deg, #1a0033 0%, #330066 50%, #4d0099 100%)"
      : "linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)",
    color: darkMode ? "#fff" : "#000",
  };

  const navButtons = [
    role === "admin" && { label: "Drivers", icon: <Users size={16} className="mr-1" />, path: "/drivers", color: "bg-gradient-to-r from-yellow-500 to-amber-700" },
    { label: "Tracking", icon: <MapPin size={16} className="mr-1" />, path: "/tracking", color: "bg-gradient-to-r from-yellow-500 to-amber-700" },
    { label: "Analytics", icon: <Activity size={16} className="mr-1" />, path: "/analytics", color: "bg-gradient-to-r from-yellow-500 to-amber-700" },
    { label: "Reports", icon: <FileText size={16} className="mr-1" />, path: "/reports", color: "bg-gradient-to-r from-yellow-500 to-amber-700" },
    { label: "Vehicles", icon: <Car size={16} className="mr-1" />, path: "/vehicle-management", color: "bg-gradient-to-r from-yellow-500 to-amber-700" },
    { label: "Profile", icon: <User size={16} className="mr-1" />, path: "/profile", color: "bg-gradient-to-r from-yellow-500 to-amber-700" },
    { label: "Settings", icon: <Settings size={16} className="mr-1" />, path: "/settings", color: "bg-gradient-to-r from-yellow-500 to-amber-700" },
  ].filter(Boolean);

  const MapComponent = () => {
    const defaultPosition = [-1.2864, 36.8172]; // Nairobi coordinates
    const center = trackingData ? [trackingData.lat, trackingData.lng] : defaultPosition;
    const bounds = trackedVehicles.length > 0 
      ? trackedVehicles.map(track => [track.lat, track.lng])
      : [center];

    return (
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: isMobile ? "60vh" : "80vh", width: "100%", borderRadius: "0.5rem" }}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {trackedVehicles.map((track) => {
          const vehicle = vehicles.find(v => v.id === track.vehicleId);
          return (
            <Marker
              key={`tracked-${track.id}`}
              position={[track.lat, track.lng]}
              icon={CarIcon}
            >
              <Popup>
                <div style={{ 
                  minWidth: "200px", 
                  padding: "10px", 
                  fontSize: "14px", 
                  lineHeight: "1.5",
                  fontFamily: "Arial, sans-serif"
                }}>
                  <strong style={{ fontSize: "16px", color: "#333" }}>
                    {vehicle ? `${vehicle.make} ${vehicle.model}` : "Unknown Vehicle"}
                  </strong>
                  <br />
                  <span style={{ color: "#666" }}>
                    Plate: {vehicle?.licensePlate || vehicle?.plateNumber || "N/A"}
                  </span>
                  <br />
                  {track.locationName && (
                    <>
                      <strong>Location:</strong> {track.locationName}
                      <br />
                    </>
                  )}
                  <strong>Coordinates:</strong> {track.lat.toFixed(6)}, {track.lng.toFixed(6)}
                  <br />
                  <strong>Last Update:</strong> {new Date(track.timestamp).toLocaleString()}
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        <MapViewController bounds={bounds} />
      </MapContainer>
    );
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col"
      style={themeStyles}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <header className={`px-4 py-3 shadow-lg sticky top-0 z-10 ${darkMode ? "bg-black bg-opacity-50" : "bg-gray-200 bg-opacity-70"}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <Truck className="mr-2 text-yellow-400" /> FleetTraq
          </h1>
          <div className="flex items-center gap-2">
            {!isMobile && (
              <div className="flex gap-2 mr-2">
                {navButtons.map((btn, index) => (
                  <motion.button
                    key={index}
                    onClick={() => navigate(btn.path)}
                    className={`px-3 py-2 text-black rounded-md font-bold flex items-center text-sm ${btn.color} hover:brightness-110 shadow-lg border border-yellow-300`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ textShadow: "0px 0px 2px rgba(0,0,0,0.2)" }}
                  >
                    {btn.icon} {btn.label}
                  </motion.button>
                ))}
              </div>
            )}
            <motion.button
              onClick={toggleDarkMode}
              className="p-2 bg-gradient-to-r from-yellow-500 to-amber-700 text-black rounded-md flex items-center justify-center shadow-lg border border-yellow-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>
            {isMobile && (
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 bg-gradient-to-r from-yellow-500 to-amber-700 text-black rounded-md flex items-center justify-center shadow-lg border border-yellow-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.button>
            )}
          </div>
          <AnimatePresence>
            {isMobile && mobileMenuOpen && (
              <motion.div
                ref={menuRef}
                className={`absolute right-4 top-14 z-20 rounded-lg shadow-xl border py-2 w-48 ${darkMode ? "bg-gray-900 bg-opacity-95 border-gray-700" : "bg-gray-100 bg-opacity-95 border-gray-300"}`}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {navButtons.map((btn, index) => (
                  <motion.button
                    key={index}
                    onClick={() => {
                      navigate(btn.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-black font-bold flex items-center text-sm ${btn.color} hover:brightness-110`}
                    whileTap={{ scale: 0.98 }}
                  >
                    {btn.icon} {btn.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <motion.div
              className="text-center text-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Loading fleet data...
            </motion.div>
          ) : error ? (
            <motion.div
              className="mb-4 p-4 bg-red-600 rounded-lg shadow-lg"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                <motion.div
                  className="p-6 rounded-lg shadow-lg bg-opacity-15"
                  style={{
                    backgroundImage: darkMode
                      ? "linear-gradient(135deg, rgba(75, 0, 130, 0.7) 0%, rgba(138, 43, 226, 0.4) 100%)"
                      : "linear-gradient(135deg, rgba(200, 200, 200, 0.7) 0%, rgba(240, 240, 240, 0.4) 100%)",
                  }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: "#facc15" }}>
                    <Truck className="mr-2" /> Fleet Overview
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg ${darkMode ? "bg-black bg-opacity-30" : "bg-gray-200"}`}>
                      <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} text-sm`}>Total Vehicles</p>
                      <p className={`text-3xl font-bold ${darkMode ? "text-white" : "text-black"}`}>
                        {fleetStats.total}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? "bg-black bg-opacity-30" : "bg-gray-200"}`}>
                      <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} text-sm`}>Active Vehicles</p>
                      <p className="text-3xl font-bold text-green-400">
                        {fleetStats.active}
                      </p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  className="p-6 rounded-lg shadow-lg"
                  style={{
                    backgroundImage: darkMode
                      ? "linear-gradient(135deg, rgba(0, 128, 128, 0.7) 0%, rgba(0, 179, 179, 0.4) 100%)"
                      : "linear-gradient(135deg, rgba(180, 230, 230, 0.7) 0%, rgba(220, 255, 255, 0.4) 100%)",
                  }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: "#facc15" }}>
                    <Activity className="mr-2" /> Quick Stats
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg ${darkMode ? "bg-black bg-opacity-30" : "bg-gray-200"}`}>
                      <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} text-sm`}>On Route</p>
                      <p className="text-3xl font-bold text-blue-400">
                        {fleetStats.onRoute}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? "bg-black bg-opacity-30" : "bg-gray-200"}`}>
                      <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} text-sm`}>Maintenance</p>
                      <p className="text-3xl font-bold" style={{ color: "#facc15" }}>
                        {fleetStats.maintenance}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
              <motion.div
                className="rounded-lg overflow-hidden shadow-xl mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className={`p-4 border-b ${darkMode ? "bg-gray-900 bg-opacity-80 border-gray-800" : "bg-gray-100 border-gray-300"}`}>
                  <h2 className="text-xl font-semibold flex items-center" style={{ color: "#facc15" }}>
                    <MapPin className="mr-2" /> Live Fleet Location
                  </h2>
                </div>
                <MapComponent />
              </motion.div>
            </>
          )}
        </div>
      </main>
      <footer className={`p-4 text-center text-sm ${darkMode ? "bg-black bg-opacity-70 text-gray-400" : "bg-gray-200 text-gray-600"}`}>
        © {new Date().getFullYear()} FleetTraq. All rights reserved.
      </footer>
    </motion.div>
  );
};

export default Dashboard;
