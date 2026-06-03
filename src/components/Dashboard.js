/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Truck, FileText, 
  Car, Menu, X, Moon, Sun, 
  TrendingUp, Fuel, AlertTriangle,
  Navigation, Gauge, BookOpen, Shield
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { db } from "../firebase";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { useFleet } from "../context/FleetContext";
import Button from "./Button";
import FleetOrganizationIdCard from "./FleetOrganizationIdCard";
import { CarIcon } from "./assets/car-icon";
import ProfilePicture from './ProfilePicture';
import { pickAuthoritativeTrack } from "../utils/deviceId";
import { computeMotionState, getMotionMeta, normalizeTimestamp } from "../utils/vehicleMotion";
import { useRouteHistory } from "../hooks/useRouteHistory";
import FleetRouteOverlay from "./FleetRouteOverlay";
// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MapViewController = ({ bounds, fitKey }) => {
  const map = useMap();
  const lastFitKeyRef = useRef("");

  useEffect(() => {
    if (!bounds?.length || fitKey === lastFitKeyRef.current) return;

    const fit = () => {
      try {
        const container = map.getContainer?.();
        if (!container || container.offsetHeight === 0) return;

        map.invalidateSize();
        const points = bounds.filter(
          ([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng)
        );
        if (!points.length) return;

        const leafletBounds = L.latLngBounds(points);
        if (!leafletBounds.isValid()) return;

        map.fitBounds(leafletBounds, { padding: [50, 50], animate: false, maxZoom: 15 });
        lastFitKeyRef.current = fitKey;
      } catch {
        // Map may still be initializing or unmounting.
      }
    };

    if (map.whenReady) {
      map.whenReady(fit);
    } else {
      fit();
    }
  }, [bounds, fitKey, map]);

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

  const motionMeta = track.motionState ? getMotionMeta(track.motionState, "popup") : null;

  return (
    <Marker ref={markerRef} position={position} icon={CarIcon}>
      <Popup>
        <div className="map-popup-card min-w-[220px] p-1">
          <div className="flex items-center gap-2 mb-2">
            <Car className="w-5 h-5 text-yellow-500" />
            <strong className="map-popup-title text-lg">
              {vehicle ? `${vehicle.make} ${vehicle.model}` : "Unknown Vehicle"}
            </strong>
          </div>
          {motionMeta && (
            <div className="mb-2">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${motionMeta.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${motionMeta.dotClass}`} />
                {motionMeta.label}
              </span>
            </div>
          )}
          <div className="space-y-1 text-sm">
            <p className="map-popup-text">
              <span className="font-semibold">Plate:</span> {vehicle?.licensePlate || vehicle?.plateNumber || "N/A"}
            </p>
            {track.locationName && (
              <p className="map-popup-text">
                <span className="font-semibold">Location:</span> {track.locationName}
              </p>
            )}
            <p className="map-popup-muted text-xs">
              <span className="font-semibold">Last Update:</span> {new Date(track.timestamp).toLocaleString()}
            </p>
            {track.deviceId && (
              <p className="map-popup-accent text-xs mt-1">GPS device: {String(track.deviceId).slice(0, 8)}…</p>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { vehicles, darkMode, user, sendNotification, maintenanceAlerts, canManageFleet, isDriver, membershipPending, fleetId, inviteCode, inviteLoading, inviteError, loadInviteCode, regenerateInvite, loading: fleetLoading } = useFleet();
  const [error, setError] = useState(null);
  const isLoading = fleetLoading && vehicles.length === 0;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [trackedVehicles, setTrackedVehicles] = useState([]);
  const [showAlertBanner, setShowAlertBanner] = useState(true);
  const [showRouteTrails, setShowRouteTrails] = useState(false);
  const motionAnchors = useRef(new Map());
  const [stats, setStats] = useState({
    totalMileage: 0,
    avgFuelEfficiency: 0,
    activeAlerts: 0
  });

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
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fid = fleetId;
    if (!fid) return;

    const q = query(
      collection(db, "tracking"),
      where("accountId", "==", fid),
      where("isTracking", "==", true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allTracks = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        const byVehicleId = new Map();
        for (const track of allTracks) {
          if (!track.vehicleId) continue;
          const list = byVehicleId.get(track.vehicleId) || [];
          list.push(track);
          byVehicleId.set(track.vehicleId, list);
        }

        const now = Date.now();
        const authoritative = [];
        for (const vehicle of vehicles) {
          const tracks = byVehicleId.get(vehicle.id);
          if (!tracks?.length) continue;
          const best = pickAuthoritativeTrack(tracks, vehicle);
          if (best) {
            const lat = Number(best.lat) || -1.2864;
            const lng = Number(best.lng) || 36.8172;
            const timestamp = best.timestamp || new Date().toISOString();
            const motionState = computeMotionState(
              motionAnchors.current,
              best.vehicleId,
              { lat, lng, timestamp, isTracking: best.isTracking !== false },
              now
            );
            authoritative.push({
              id: best.id,
              vehicleId: best.vehicleId,
              lat,
              lng,
              locationName: best.locationName || "Unknown Location",
              timestamp,
              isTracking: best.isTracking,
              deviceId: best.deviceId,
              motionState,
            });
          }
        }

        authoritative.sort(
          (a, b) => normalizeTimestamp(b.timestamp) - normalizeTimestamp(a.timestamp)
        );
        setTrackedVehicles(authoritative);
      },
      (err) => {
        setError("Failed to fetch tracking updates: " + err.message);
      }
    );

    return () => unsubscribe();
  }, [fleetId, vehicles]);

  useEffect(() => {
    if (vehicles.length) {
      const totalMileage = vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0);
      const avgFuelEfficiency = vehicles.length ? vehicles.reduce((sum, v) => sum + (v.fuelEfficiency || 15), 0) / vehicles.length : 0;
      const activeAlerts = maintenanceAlerts.length;
      setStats({ totalMileage, avgFuelEfficiency: Math.round(avgFuelEfficiency), activeAlerts });
    }
  }, [vehicles, maintenanceAlerts]);

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

  // Full fleet status: every vehicle gets moving / parked / offline.
  const fleetLiveStatus = useMemo(() => {
    const trackByVehicle = new Map(trackedVehicles.map((t) => [t.vehicleId, t]));
    return vehicles.map((vehicle) => {
      const track = trackByVehicle.get(vehicle.id);
      if (track) {
        return { vehicle, track, motionState: track.motionState };
      }
      return { vehicle, track: null, motionState: "offline" };
    });
  }, [vehicles, trackedVehicles]);

  const motionCounts = useMemo(() => {
    const counts = { moving: 0, parked: 0, offline: 0 };
    fleetLiveStatus.forEach(({ motionState }) => {
      if (counts[motionState] != null) counts[motionState] += 1;
    });
    return counts;
  }, [fleetLiveStatus]);

  const {
    routesByVehicle: todayRoutes,
    stopsByVehicle: todayStops,
    loading: routesLoading,
  } = useRouteHistory(
    fleetId,
    "today",
    vehicles.map((v) => v.id),
    canManageFleet && showRouteTrails
  );

  const mapFitKey = useMemo(
    () =>
      trackedVehicles.length > 0
        ? trackedVehicles.map((track) => track.vehicleId).sort().join(",")
        : "default",
    [trackedVehicles]
  );

  const mapBounds = useMemo(() => {
    const defaultPosition = [-1.2864, 36.8172];
    return trackedVehicles.length > 0
      ? trackedVehicles.map((track) => [track.lat, track.lng])
      : [defaultPosition];
  }, [trackedVehicles]);

  const defaultMapCenter = [-1.2864, 36.8172];

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]" : "bg-gray-50"}`}>
      {/* Maintenance Alert Banner */}
      {maintenanceAlerts.length > 0 && showAlertBanner && (
        <div className="bg-red-500/90 text-white p-3 text-center relative pr-12">
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

      {/* Main Content */}
      <main className="app-page-main py-4 sm:py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>Loading fleet data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-800 dark:text-red-300">
            {error}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              <Button variant="outline" size="sm" onClick={() => navigate("/help")}>
                <BookOpen size={16} />
                Setup guide & help
              </Button>
              {canManageFleet && (
                <Button variant="secondary" size="sm" onClick={() => navigate("/drivers")}>
                  <Shield size={16} />
                  Manage drivers
                </Button>
              )}
            </div>

            {canManageFleet && (
              inviteCode ? (
                <FleetOrganizationIdCard
                  inviteCode={inviteCode}
                  darkMode={darkMode}
                  compact
                  className="mb-4"
                  onRegenerate={regenerateInvite}
                  regenerating={inviteLoading}
                />
              ) : inviteLoading ? (
                <div className={`mb-6 p-4 rounded-2xl border animate-pulse ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200"}`}>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Loading your driver invite code…</p>
                </div>
              ) : inviteError ? (
                <div className={`mb-6 p-4 rounded-2xl border ${darkMode ? "bg-red-500/10 border-red-500/30" : "bg-red-50 border-red-200"}`}>
                  <p className={`text-sm font-medium ${darkMode ? "text-red-200" : "text-red-800"}`}>
                    Could not load your driver invite code.
                  </p>
                  <p className={`text-xs mt-1 ${darkMode ? "text-red-300/80" : "text-red-700"}`}>{inviteError}</p>
                  <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={loadInviteCode}>
                    Try again
                  </Button>
                </div>
              ) : (
                <div className={`mb-6 p-4 rounded-2xl border ${darkMode ? "bg-yellow-500/10 border-yellow-500/30" : "bg-yellow-50 border-yellow-200"}`}>
                  <p className={`text-sm ${darkMode ? "text-yellow-100" : "text-yellow-900"}`}>
                    Your driver invite code is not ready yet.
                  </p>
                  <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={loadInviteCode}>
                    Generate invite code
                  </Button>
                </div>
              )
            )}
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
              <div className={`p-3 sm:p-4 border-b ${darkMode ? "border-white/10 bg-black/30" : "bg-gray-50"}`}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                  <MapPin className="w-5 h-5 text-yellow-500 shrink-0" />
                  <h2 className={`font-semibold text-sm sm:text-base ${darkMode ? "text-white" : "text-gray-800"}`}>Live Fleet Location</h2>
                  {canManageFleet && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowRouteTrails((v) => !v)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                          showRouteTrails
                            ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-300"
                            : darkMode
                              ? "border-white/10 text-gray-400 hover:text-white"
                              : "border-gray-200 text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {showRouteTrails ? "Hide routes" : "Show routes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/route-history")}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                          darkMode
                            ? "border-white/10 text-cyan-300 hover:bg-white/5"
                            : "border-gray-200 text-cyan-700 hover:bg-gray-100"
                        }`}
                      >
                        Route history
                      </button>
                    </>
                  )}
                  <span className={`sm:ml-auto text-xs flex items-center gap-1 ${trackedVehicles.length > 0 ? "text-green-400" : darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    <span className={`w-2 h-2 rounded-full ${trackedVehicles.length > 0 ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}></span>
                    {trackedVehicles.length > 0 ? "Live Tracking" : "No live GPS"}
                    {showRouteTrails && routesLoading ? " · loading routes…" : ""}
                  </span>
                </div>
              </div>
              <MapContainer
                key="fleet-dashboard-map"
                center={defaultMapCenter}
                zoom={10}
                scrollWheelZoom={false}
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
                {canManageFleet && showRouteTrails && (
                  <FleetRouteOverlay
                    routesByVehicle={todayRoutes}
                    stopsByVehicle={todayStops}
                    vehicles={vehicles}
                    showRoutes
                    showStops
                  />
                )}
                <MapViewController bounds={mapBounds} fitKey={mapFitKey} />
              </MapContainer>
            </motion.div>

            {/* Live vehicle status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className={`mt-6 rounded-2xl border ${darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"} shadow-lg overflow-hidden`}
            >
              <div className={`p-3 sm:p-4 border-b flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 ${darkMode ? "border-white/10" : "border-gray-200"}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Navigation className="w-5 h-5 text-yellow-500 shrink-0" />
                  <h2 className={`font-semibold text-sm sm:text-base truncate ${darkMode ? "text-white" : "text-gray-800"}`}>Live Vehicle Status</h2>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:ml-auto">
                  {["moving", "parked", "offline"].map((s) => {
                    const meta = getMotionMeta(s);
                    return (
                      <span key={s} className={`flex items-center gap-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                        {meta.label}: <strong>{motionCounts[s] ?? 0}</strong>
                      </span>
                    );
                  })}
                </div>
              </div>
              {fleetLiveStatus.length === 0 ? (
                <p className={`p-5 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  No vehicles in your fleet yet. Add vehicles under Manage Fleet, then assign drivers to start live tracking.
                </p>
              ) : (
                <div className="divide-y divide-white/5">
                  {fleetLiveStatus.map(({ vehicle, track, motionState }) => {
                    const meta = getMotionMeta(motionState);
                    return (
                      <div key={vehicle.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <Car className="w-5 h-5 text-yellow-500 shrink-0" />
                          <div className="min-w-0">
                            <p className={`font-medium truncate ${darkMode ? "text-white" : "text-gray-900"}`}>
                              {vehicle.make} {vehicle.model}
                              {(vehicle.licensePlate || vehicle.plateNumber) && (
                                <span className={`ml-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                  {vehicle.licensePlate || vehicle.plateNumber}
                                </span>
                              )}
                            </p>
                            <p className={`text-xs truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              {track
                                ? `${track.locationName} · ${new Date(track.timestamp).toLocaleTimeString()}`
                                : "No GPS signal — not tracking"}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass} ${motionState === "moving" ? "animate-pulse" : ""}`} />
                          {meta.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            {!membershipPending && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              {(canManageFleet || isDriver) && (
              <button
                onClick={() => navigate("/tracking")}
                className={`p-4 rounded-xl ${darkMode ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-gray-50"} border ${darkMode ? "border-white/10" : "border-gray-200"} transition-all group`}
              >
                <Navigation className="w-6 h-6 text-yellow-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>{isDriver ? "My tracking" : "Start Tracking"}</p>
              </button>
              )}
              
              {canManageFleet && (
              <>
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
              </>
              )}

              {isDriver && !canManageFleet && (
              <button
                onClick={() => navigate("/fuel-tracking")}
                className={`p-4 rounded-xl ${darkMode ? "bg-white/5 hover:bg-white/10" : "bg-white hover:bg-gray-50"} border ${darkMode ? "border-white/10" : "border-gray-200"} transition-all group`}
              >
                <Fuel className="w-6 h-6 text-teal-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>Fuel log</p>
              </button>
              )}
            </motion.div>
            )}
            {membershipPending && (
              <p className={`mt-6 text-sm text-center ${darkMode ? "text-amber-300" : "text-amber-700"}`}>
                Quick actions unlock after your administrator approves your account.
              </p>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className={`mt-12 py-6 text-center border-t ${darkMode ? "border-white/10 text-gray-500" : "border-gray-200 text-gray-600"}`}>
        <p>© 2026 FleetTraq. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Dashboard;