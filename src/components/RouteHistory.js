import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  MapPin,
  Route,
  PauseCircle,
  Clock,
  Ruler,
  Eye,
  EyeOff,
  AlertCircle,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useFleet } from "../context/FleetContext";
import { useRouteHistory } from "../hooks/useRouteHistory";
import { useGeofences } from "../hooks/useGeofences";
import FleetRouteOverlay from "./FleetRouteOverlay";
import RoutePlaybackMarker, { RoutePlaybackControls } from "./RoutePlayback";
import { CarIcon } from "./assets/car-icon";
import { getVehicleRouteColor } from "../utils/routeColors";
import { formatDistance, formatDuration } from "../utils/routeAnalysis";
import { downloadAllRoutesZipLike } from "../utils/routeExport";
import { pickAuthoritativeTrack } from "../utils/deviceId";
import { computeMotionState, getMotionMeta } from "../utils/vehicleMotion";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TIME_RANGES = [
  { key: "today", label: "Today" },
  { key: "24h", label: "Last 24 hours" },
  { key: "7d", label: "Last 7 days" },
];

const RouteHistory = () => {
  const navigate = useNavigate();
  const { darkMode, vehicles, fleetId, canManageFleet } = useFleet();
  const [rangeKey, setRangeKey] = useState("today");
  const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showStops, setShowStops] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [liveTracks, setLiveTracks] = useState([]);
  const [playbackVehicleId, setPlaybackVehicleId] = useState("");
  const [playing, setPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playbackTimerRef = useRef(null);
  const motionAnchors = useRef(new Map());

  const { geofences } = useGeofences(fleetId, canManageFleet);

  const activeVehicleIds = useMemo(
    () => (selectedVehicleIds.length ? selectedVehicleIds : vehicles.map((v) => v.id)),
    [selectedVehicleIds, vehicles]
  );

  const {
    routesByVehicle,
    stopsByVehicle,
    summaryByVehicle,
    allStops,
    loading,
    error,
    truncated,
  } = useRouteHistory(fleetId, rangeKey, activeVehicleIds);

  const playbackPoints = useMemo(() => {
    if (!playbackVehicleId) return [];
    return routesByVehicle.get(playbackVehicleId) || [];
  }, [playbackVehicleId, routesByVehicle]);

  const playbackVehicle = vehicles.find((v) => v.id === playbackVehicleId);

  useEffect(() => {
    if (!canManageFleet) {
      navigate("/dashboard", { replace: true });
    }
  }, [canManageFleet, navigate]);

  useEffect(() => {
    const firstWithRoute = vehicles.find((v) => (routesByVehicle.get(v.id) || []).length > 1);
    if (firstWithRoute && !playbackVehicleId) {
      setPlaybackVehicleId(firstWithRoute.id);
    }
  }, [vehicles, routesByVehicle, playbackVehicleId]);

  useEffect(() => {
    setPlaybackIndex(0);
    setPlaying(false);
  }, [playbackVehicleId, rangeKey]);

  useEffect(() => {
    if (!playing || playbackPoints.length < 2) {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      return undefined;
    }

    const intervalMs = Math.max(80, 800 / Math.max(playbackSpeed, 0.5));
    playbackTimerRef.current = setInterval(() => {
      setPlaybackIndex((prev) => {
        const next = prev + 1;
        if (next >= playbackPoints.length) {
          setPlaying(false);
          return prev;
        }
        return next;
      });
    }, intervalMs);

    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [playing, playbackPoints, playbackSpeed]);

  useEffect(() => {
    if (!fleetId) return undefined;

    const q = query(
      collection(db, "tracking"),
      where("accountId", "==", fleetId),
      where("isTracking", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allTracks = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      const byVehicleId = new Map();
      for (const track of allTracks) {
        if (!track.vehicleId) continue;
        const list = byVehicleId.get(track.vehicleId) || [];
        list.push(track);
        byVehicleId.set(track.vehicleId, list);
      }

      const now = Date.now();
      const live = [];
      for (const vehicle of vehicles) {
        if (!activeVehicleIds.includes(vehicle.id)) continue;
        const tracks = byVehicleId.get(vehicle.id);
        if (!tracks?.length) continue;
        const best = pickAuthoritativeTrack(tracks, vehicle);
        if (!best) continue;
        live.push({
          ...best,
          lat: Number(best.lat),
          lng: Number(best.lng),
          motionState: computeMotionState(
            motionAnchors.current,
            vehicle.id,
            { lat: Number(best.lat), lng: Number(best.lng), timestamp: best.timestamp },
            now
          ),
        });
      }
      setLiveTracks(live);
    });

    return () => unsubscribe();
  }, [fleetId, vehicles, activeVehicleIds]);

  const mapBounds = useMemo(() => {
    const coords = [];
    for (const points of routesByVehicle.values()) {
      for (const p of points) {
        coords.push([Number(p.lat), Number(p.lng)]);
      }
    }
    for (const track of liveTracks) {
      coords.push([track.lat, track.lng]);
    }
    return coords.length ? coords : [[-1.2864, 36.8172]];
  }, [routesByVehicle, liveTracks]);

  const totals = useMemo(() => {
    let distanceM = 0;
    let stopCount = 0;
    for (const summary of summaryByVehicle.values()) {
      distanceM += summary.distanceM;
      stopCount += summary.stopCount;
    }
    return { distanceM, stopCount, vehicleCount: summaryByVehicle.size };
  }, [summaryByVehicle]);

  const toggleVehicle = (vehicleId) => {
    setSelectedVehicleIds((prev) => {
      const base = prev.length ? prev : vehicles.map((v) => v.id);
      if (base.includes(vehicleId)) {
        const next = base.filter((id) => id !== vehicleId);
        return next.length ? next : vehicles.map((v) => v.id);
      }
      return [...base, vehicleId];
    });
  };

  const handleScrub = useCallback((index) => {
    setPlaying(false);
    setPlaybackIndex(index);
  }, []);

  const cardClass = `rounded-2xl border ${darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"} shadow-lg`;

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]" : "bg-gray-50"}`}>
      <header className={`sticky top-0 z-20 border-b ${darkMode ? "border-white/10 bg-black/50 backdrop-blur-xl" : "bg-white/95 backdrop-blur border-gray-200"}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className={`p-2 rounded-xl ${darkMode ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-800"}`}
          >
            <ChevronLeft size={22} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className={`text-lg sm:text-xl font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
              <Route className="text-yellow-500 shrink-0" size={22} />
              Route History
            </h1>
            <p className={`text-xs sm:text-sm truncate ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Routes, stops, playback, exports, and geofences
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadAllRoutesZipLike(routesByVehicle, vehicles, "csv")}
              disabled={routesByVehicle.size === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 ${
                darkMode ? "bg-white/10 text-gray-200" : "bg-gray-100 text-gray-800"
              }`}
            >
              <FileSpreadsheet size={14} />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => downloadAllRoutesZipLike(routesByVehicle, vehicles, "gpx")}
              disabled={routesByVehicle.size === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 ${
                darkMode ? "bg-cyan-500/20 text-cyan-200" : "bg-cyan-50 text-cyan-800"
              }`}
            >
              <Download size={14} />
              Export GPX
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 space-y-5">
        <div className="flex flex-wrap gap-2">
          {TIME_RANGES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRangeKey(key)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                rangeKey === key
                  ? "bg-yellow-500 text-black"
                  : darkMode
                    ? "bg-white/10 text-gray-200 hover:bg-white/15"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowRoutes((v) => !v)}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${
              darkMode ? "bg-white/10 text-gray-200" : "bg-gray-100 text-gray-700"
            }`}
          >
            {showRoutes ? <Eye size={16} /> : <EyeOff size={16} />}
            Routes
          </button>
          <button
            type="button"
            onClick={() => setShowStops((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${
              darkMode ? "bg-white/10 text-gray-200" : "bg-gray-100 text-gray-700"
            }`}
          >
            {showStops ? <Eye size={16} /> : <EyeOff size={16} />}
            Stops
          </button>
          <button
            type="button"
            onClick={() => setShowGeofences((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium ${
              darkMode ? "bg-white/10 text-gray-200" : "bg-gray-100 text-gray-700"
            }`}
          >
            {showGeofences ? <Eye size={16} /> : <EyeOff size={16} />}
            Geofences
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Ruler, label: "Distance tracked", value: formatDistance(totals.distanceM), color: "text-cyan-400" },
            { icon: PauseCircle, label: "Stops detected", value: String(totals.stopCount), color: "text-amber-400" },
            { icon: MapPin, label: "Vehicles with routes", value: String(totals.vehicleCount), color: "text-green-400" },
          ].map(({ icon: Icon, label, value, color }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`p-4 ${cardClass}`}>
              <Icon className={`w-6 h-6 mb-2 ${color}`} />
              <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{value}</p>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{label}</p>
            </motion.div>
          ))}
        </div>

        {(error || truncated) && (
          <div
            className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
              error
                ? "bg-red-500/10 text-red-300 border border-red-500/20"
                : "bg-amber-500/10 text-amber-200 border border-amber-500/20"
            }`}
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>
              {error ||
                "Showing the most recent 3,000 GPS points for this period. Use a shorter time range for full detail."}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className={`lg:col-span-2 overflow-hidden ${cardClass}`}>
            <div className={`p-3 border-b flex flex-wrap items-center gap-2 ${darkMode ? "border-white/10" : "border-gray-200"}`}>
              <h2 className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>Route map</h2>
              <select
                value={playbackVehicleId}
                onChange={(e) => setPlaybackVehicleId(e.target.value)}
                className={`ml-auto text-xs rounded-lg px-2 py-1 ${
                  darkMode ? "bg-white/10 text-white border border-white/10" : "bg-gray-100 border border-gray-200"
                }`}
              >
                <option value="">Playback vehicle…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model}
                  </option>
                ))}
              </select>
            </div>
            <MapContainer
              center={mapBounds[0]}
              zoom={11}
              style={{ height: "55vh", minHeight: "320px", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {showGeofences &&
                geofences
                  .filter((g) => g.active !== false)
                  .map((fence) => (
                    <Circle
                      key={fence.id}
                      center={[Number(fence.lat), Number(fence.lng)]}
                      radius={Number(fence.radiusM) || 200}
                      pathOptions={{
                        color: "#06b6d4",
                        fillColor: "#06b6d4",
                        fillOpacity: 0.08,
                        weight: 2,
                      }}
                    >
                      <Popup>{fence.name || "Geofence"}</Popup>
                    </Circle>
                  ))}
              <FleetRouteOverlay
                routesByVehicle={routesByVehicle}
                stopsByVehicle={stopsByVehicle}
                vehicles={vehicles}
                showRoutes={showRoutes}
                showStops={showStops}
              />
              {playbackVehicleId && playbackPoints.length > 0 && (
                <RoutePlaybackMarker points={playbackPoints} index={playbackIndex} />
              )}
              {!playing &&
                liveTracks.map((track) => {
                  const vehicle = vehicles.find((v) => v.id === track.vehicleId);
                  const meta = getMotionMeta(track.motionState, "popup");
                  return (
                    <Marker key={track.id} position={[track.lat, track.lng]} icon={CarIcon}>
                      <Popup>
                        <div className="map-popup-card min-w-[180px] p-1 text-sm">
                          <strong className="map-popup-title">
                            {vehicle ? `${vehicle.make} ${vehicle.model}` : "Live vehicle"}
                          </strong>
                          <span className={`inline-flex mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${meta.badgeClass}`}>
                            {meta.label}
                          </span>
                          <p className="map-popup-muted text-xs mt-2">
                            Updated {new Date(track.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
            </MapContainer>
            <RoutePlaybackControls
              darkMode={darkMode}
              points={playbackPoints}
              playing={playing}
              onPlayPause={() => setPlaying((p) => !p)}
              onReset={() => {
                setPlaying(false);
                setPlaybackIndex(0);
              }}
              speedMultiplier={playbackSpeed}
              onSpeedChange={setPlaybackSpeed}
              progressIndex={playbackIndex}
              onScrub={handleScrub}
              playbackVehicleLabel={
                playbackVehicle ? `${playbackVehicle.make} ${playbackVehicle.model}` : null
              }
            />
            {loading && (
              <p className={`p-3 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Loading route data…</p>
            )}
            {!loading && routesByVehicle.size === 0 && (
              <p className={`p-4 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                No route points yet. Routes appear after drivers share GPS while assigned to a vehicle.
              </p>
            )}
          </div>

          <div className="space-y-5">
            <div className={cardClass}>
              <div className={`p-3 border-b ${darkMode ? "border-white/10" : "border-gray-200"}`}>
                <h2 className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>Vehicles</h2>
              </div>
              <div className="p-3 space-y-2 max-h-56 overflow-y-auto">
                {vehicles.map((vehicle, index) => {
                  const checked = activeVehicleIds.includes(vehicle.id);
                  const color = getVehicleRouteColor(vehicle.id, index);
                  const summary = summaryByVehicle.get(vehicle.id);
                  return (
                    <label
                      key={vehicle.id}
                      className={`flex items-start gap-2 p-2 rounded-xl cursor-pointer ${
                        darkMode ? "hover:bg-white/5" : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleVehicle(vehicle.id)}
                        className="mt-1"
                      />
                      <span className="w-3 h-3 rounded-full shrink-0 mt-1" style={{ backgroundColor: color }} />
                      <span className="min-w-0">
                        <span className={`block text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                          {vehicle.make} {vehicle.model}
                        </span>
                        <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {summary
                            ? `${formatDistance(summary.distanceM)} · ${summary.stopCount} stops`
                            : "No route data"}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className={cardClass}>
              <div className={`p-3 border-b flex items-center gap-2 ${darkMode ? "border-white/10" : "border-gray-200"}`}>
                <Clock size={16} className="text-yellow-500" />
                <h2 className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>Stop events</h2>
              </div>
              {allStops.length === 0 ? (
                <p className={`p-4 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Stops appear when a vehicle stays in roughly the same place for 3+ minutes.
                </p>
              ) : (
                <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                  {allStops.slice(0, 30).map((stop, idx) => {
                    const vehicle = vehicles.find((v) => v.id === stop.vehicleId);
                    const color = getVehicleRouteColor(stop.vehicleId);
                    return (
                      <div key={`${stop.vehicleId}-${stop.startTime}-${idx}`} className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle"}
                          </span>
                          <span className={`ml-auto text-xs font-semibold ${darkMode ? "text-amber-300" : "text-amber-700"}`}>
                            {formatDuration(stop.durationMs)}
                          </span>
                        </div>
                        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {new Date(stop.startTime).toLocaleString()} — {new Date(stop.endTime).toLocaleTimeString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate("/geofences")}
              className={`w-full p-3 rounded-xl text-sm font-semibold text-left ${
                darkMode ? "bg-cyan-500/10 text-cyan-200 border border-cyan-500/20" : "bg-cyan-50 text-cyan-900 border border-cyan-200"
              }`}
            >
              Manage geofences →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RouteHistory;
