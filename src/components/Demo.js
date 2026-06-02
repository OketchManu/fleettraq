import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Truck, Navigation, Gauge, Fuel, MapPin, ArrowLeft, ArrowRight,
  Sun, Moon, Activity, Play, Pause,
} from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { createCarIcon } from "./assets/car-icon";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Sample fleet around Nairobi for the demo.
const SEED_VEHICLES = [
  { id: "d1", make: "Toyota", model: "Hilux", plate: "KDA 123A", driver: "James M.", color: "#facc15", lat: -1.2864, lng: 36.8172, heading: 45, speed: 42, fuel: 78 },
  { id: "d2", make: "Isuzu", model: "D-Max", plate: "KCB 456B", driver: "Aisha K.", color: "#22d3ee", lat: -1.2921, lng: 36.8219, heading: 120, speed: 0, fuel: 54 },
  { id: "d3", make: "Nissan", model: "Navara", plate: "KDG 789C", driver: "Peter O.", color: "#34d399", lat: -1.2800, lng: 36.8100, heading: 200, speed: 63, fuel: 91 },
  { id: "d4", make: "Mitsubishi", model: "L200", plate: "KCE 321D", driver: "Grace W.", color: "#f472b6", lat: -1.3000, lng: 36.8300, heading: 310, speed: 28, fuel: 33 },
];

const iconCache = {};
const getIcon = (color) => {
  if (!iconCache[color]) iconCache[color] = createCarIcon(color);
  return iconCache[color];
};

const DemoMarker = ({ vehicle }) => {
  const markerRef = useRef(null);
  useEffect(() => {
    if (markerRef.current) markerRef.current.setLatLng([vehicle.lat, vehicle.lng]);
  }, [vehicle.lat, vehicle.lng]);

  return (
    <Marker ref={markerRef} position={[vehicle.lat, vehicle.lng]} icon={getIcon(vehicle.color)}>
      <Popup>
        <div className="map-popup-card min-w-[200px] p-1">
          <strong className="map-popup-title text-base">{vehicle.make} {vehicle.model}</strong>
          <div className="map-popup-text text-sm mt-1 space-y-0.5">
            <p><b>Plate:</b> {vehicle.plate}</p>
            <p><b>Driver:</b> {vehicle.driver}</p>
            <p><b>Speed:</b> {Math.round(vehicle.speed)} km/h</p>
            <p><b>Fuel:</b> {Math.round(vehicle.fuel)}%</p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

const Demo = () => {
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useFleet();
  const [vehicles, setVehicles] = useState(SEED_VEHICLES);
  const [running, setRunning] = useState(true);

  // Simulate live GPS movement.
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.speed === 0) return v;
          const rad = (v.heading * Math.PI) / 180;
          const step = (v.speed / 3600) * 0.9; // rough km → deg
          let heading = v.heading + (Math.random() - 0.5) * 25;
          if (heading < 0) heading += 360;
          if (heading > 360) heading -= 360;
          let speed = v.speed + (Math.random() - 0.5) * 12;
          speed = Math.max(8, Math.min(90, speed));
          let fuel = Math.max(5, v.fuel - 0.05);
          return {
            ...v,
            lat: v.lat + Math.cos(rad) * step * 0.45,
            lng: v.lng + Math.sin(rad) * step * 0.45,
            heading,
            speed,
            fuel,
          };
        })
      );
    }, 1500);
    return () => clearInterval(interval);
  }, [running]);

  const stats = useMemo(() => {
    const moving = vehicles.filter((v) => v.speed > 1).length;
    const avgFuel = Math.round(vehicles.reduce((s, v) => s + v.fuel, 0) / vehicles.length);
    const avgSpeed = Math.round(vehicles.reduce((s, v) => s + v.speed, 0) / vehicles.length);
    return { total: vehicles.length, moving, avgFuel, avgSpeed };
  }, [vehicles]);

  const center = [-1.2864, 36.8172];

  const cardClass = darkMode
    ? "bg-white/5 border-white/10"
    : "bg-white border-gray-200";

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]" : "bg-gray-50"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-[1000] ${darkMode ? "bg-black/60 backdrop-blur-xl border-b border-white/10" : "bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm"}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={() => navigate("/")} className={`flex items-center gap-2 text-sm font-medium ${darkMode ? "text-gray-200 hover:text-white" : "text-gray-700 hover:text-gray-900"}`}>
            <ArrowLeft size={18} />
            Back to Home
          </button>
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-yellow-500" />
            <span className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>FleetTraq <span className="text-yellow-500">Demo</span></span>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${darkMode ? "bg-white/10 text-yellow-400" : "bg-gray-200 text-gray-800"}`} aria-label="Toggle theme">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className={`mb-5 p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${darkMode ? "bg-yellow-500/10 border-yellow-500/30" : "bg-yellow-50 border-yellow-200"}`}>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-yellow-500" />
            <p className={`text-sm font-medium ${darkMode ? "text-yellow-100" : "text-yellow-900"}`}>
              Live demo with simulated vehicles — no account needed. This is sample data.
            </p>
          </div>
          <button
            onClick={() => setRunning((r) => !r)}
            className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg ${darkMode ? "bg-white/10 text-white hover:bg-white/15" : "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50"}`}
          >
            {running ? <Pause size={16} /> : <Play size={16} />}
            {running ? "Pause" : "Resume"} live updates
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Truck, label: "Total Vehicles", value: stats.total, color: "text-yellow-500" },
            { icon: Navigation, label: "Currently Moving", value: stats.moving, color: "text-cyan-400" },
            { icon: Gauge, label: "Avg Speed (km/h)", value: stats.avgSpeed, color: "text-green-400" },
            { icon: Fuel, label: "Avg Fuel (%)", value: stats.avgFuel, color: "text-pink-400" },
          ].map((s) => (
            <div key={s.label} className={`p-5 rounded-2xl border shadow-lg ${cardClass}`}>
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`w-7 h-7 ${s.color}`} />
                <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
              </div>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className={`lg:col-span-2 rounded-2xl border overflow-hidden shadow-lg ${cardClass}`}>
            <div className={`px-4 py-3 flex items-center gap-2 border-b ${darkMode ? "border-white/10" : "border-gray-200"}`}>
              <MapPin className="w-5 h-5 text-yellow-500" />
              <h2 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Live Fleet Location</h2>
            </div>
            <div style={{ height: "460px" }}>
              <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                {vehicles.map((v) => (
                  <DemoMarker key={v.id} vehicle={v} />
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Vehicle list */}
          <div className={`rounded-2xl border shadow-lg ${cardClass}`}>
            <div className={`px-4 py-3 flex items-center gap-2 border-b ${darkMode ? "border-white/10" : "border-gray-200"}`}>
              <Truck className="w-5 h-5 text-yellow-500" />
              <h2 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Fleet</h2>
            </div>
            <div className="p-3 space-y-2 max-h-[460px] overflow-y-auto">
              {vehicles.map((v) => (
                <div key={v.id} className={`p-3 rounded-xl ${darkMode ? "bg-black/20" : "bg-gray-50"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: v.color }} />
                      <span className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{v.make} {v.model}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${v.speed > 1 ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                      {v.speed > 1 ? "Moving" : "Parked"}
                    </span>
                  </div>
                  <div className={`mt-1 text-xs grid grid-cols-2 gap-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    <span>{v.plate}</span>
                    <span>{v.driver}</span>
                    <span><Gauge size={11} className="inline mr-1" />{Math.round(v.speed)} km/h</span>
                    <span><Fuel size={11} className="inline mr-1" />{Math.round(v.fuel)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-8 rounded-2xl p-6 text-center border ${darkMode ? "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30" : "bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300"}`}
        >
          <h3 className={`text-xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Like what you see? Track your real fleet.
          </h3>
          <p className={`text-sm mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Create a free account, add your vehicles, and assign drivers in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/signup")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold inline-flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-yellow-500/25 transition-all"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className={`px-6 py-3 rounded-xl border-2 font-semibold transition-all ${darkMode ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black" : "border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"}`}
            >
              Sign In
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Demo;
