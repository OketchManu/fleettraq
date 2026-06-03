import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, MapPin, Plus, Trash2, Shield } from "lucide-react";
import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { collection, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useFleet } from "../context/FleetContext";
import { useGeofences } from "../hooks/useGeofences";
import { useFleetAlertSettings } from "../hooks/useFleetAlertSettings";
import Button from "./Button";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MapClickHandler = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const Geofences = () => {
  const navigate = useNavigate();
  const { darkMode, fleetId, canManageFleet, sendNotification } = useFleet();
  const { geofences, loading, error } = useGeofences(fleetId, canManageFleet);
  const { settings: fleetAlertSettings } = useFleetAlertSettings(fleetId, canManageFleet);
  const [form, setForm] = useState({
    name: "",
    lat: "",
    lng: "",
    radiusM: 250,
    alertOnEnter: true,
    alertOnLeave: true,
    vehicleIds: [],
  });
  const [saving, setSaving] = useState(false);
  const [pickMode, setPickMode] = useState(true);

  useEffect(() => {
    if (!canManageFleet) navigate("/dashboard", { replace: true });
  }, [canManageFleet, navigate]);

  const handlePick = useCallback((lat, lng) => {
    if (!pickMode) return;
    setForm((prev) => ({
      ...prev,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
    }));
  }, [pickMode]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!fleetId || !form.name || !form.lat || !form.lng) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "geofences"), {
        accountId: fleetId,
        name: form.name.trim(),
        lat: Number(form.lat),
        lng: Number(form.lng),
        radiusM: Number(form.radiusM) || 250,
        active: true,
        alertOnEnter: form.alertOnEnter,
        alertOnLeave: form.alertOnLeave,
        vehicleIds: form.vehicleIds.length ? form.vehicleIds : null,
        createdAt: new Date().toISOString(),
      });
      sendNotification?.(`Geofence "${form.name}" created`, "success");
      setForm({
        name: "",
        lat: "",
        lng: "",
        radiusM: 250,
        alertOnEnter: true,
        alertOnLeave: true,
        vehicleIds: [],
      });
    } catch (err) {
      sendNotification?.("Failed to create geofence: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete geofence "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, "geofences", id));
      sendNotification?.(`Geofence "${name}" deleted`, "info");
    } catch (err) {
      sendNotification?.("Delete failed: " + err.message, "error");
    }
  };

  const toggleActive = async (fence) => {
    try {
      await updateDoc(doc(db, "geofences", fence.id), {
        active: fence.active === false,
      });
    } catch (err) {
      sendNotification?.("Update failed: " + err.message, "error");
    }
  };

  const mapCenter =
    form.lat && form.lng
      ? [Number(form.lat), Number(form.lng)]
      : geofences[0]
        ? [Number(geofences[0].lat), Number(geofences[0].lng)]
        : [-1.2864, 36.8172];

  const cardClass = `rounded-2xl border ${darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"} shadow-lg`;

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]" : "bg-gray-50"}`}>
      <header className={`sticky top-0 z-20 border-b ${darkMode ? "border-white/10 bg-black/50 backdrop-blur-xl" : "bg-white/95 backdrop-blur border-gray-200"}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button type="button" onClick={() => navigate("/dashboard")} className={`p-2 rounded-xl ${darkMode ? "hover:bg-white/10 text-white" : "hover:bg-gray-100"}`}>
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
              <Shield className="text-cyan-400" size={22} />
              Geofences
            </h1>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Draw zones — get alerts when vehicles enter or leave
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {!fleetAlertSettings.enableGeofencing && (
          <div className={`lg:col-span-2 p-3 rounded-xl text-sm border ${darkMode ? "bg-amber-500/10 border-amber-500/30 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
            Geofence alerts are off. Enable <strong>Geofencing</strong> under Fleet Settings to receive enter/leave notifications.
          </div>
        )}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`overflow-hidden ${cardClass}`}>
          <div className={`p-3 border-b flex items-center justify-between ${darkMode ? "border-white/10" : "border-gray-200"}`}>
            <span className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Map — click to set center</span>
            <button
              type="button"
              onClick={() => setPickMode((v) => !v)}
              className={`text-xs px-2 py-1 rounded-lg ${pickMode ? "bg-yellow-500 text-black" : darkMode ? "bg-white/10 text-gray-300" : "bg-gray-100"}`}
            >
              {pickMode ? "Picking…" : "Pick location"}
            </button>
          </div>
          <MapContainer center={mapCenter} zoom={12} style={{ height: "50vh", minHeight: "280px", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapClickHandler onPick={handlePick} />
            {geofences.map((fence) => (
              <Circle
                key={fence.id}
                center={[Number(fence.lat), Number(fence.lng)]}
                radius={Number(fence.radiusM) || 200}
                pathOptions={{
                  color: fence.active === false ? "#6b7280" : "#06b6d4",
                  fillOpacity: 0.1,
                  weight: 2,
                }}
              >
                <Popup>{fence.name}</Popup>
              </Circle>
            ))}
            {form.lat && form.lng && (
              <>
                <Marker position={[Number(form.lat), Number(form.lng)]}>
                  <Popup>New geofence center</Popup>
                </Marker>
                <Circle
                  center={[Number(form.lat), Number(form.lng)]}
                  radius={Number(form.radiusM) || 250}
                  pathOptions={{ color: "#eab308", dashArray: "6", fillOpacity: 0.05 }}
                />
              </>
            )}
          </MapContainer>
        </motion.div>

        <div className="space-y-5">
          <motion.form onSubmit={handleCreate} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`p-4 ${cardClass} space-y-3`}>
            <h2 className={`font-semibold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
              <Plus size={18} className="text-yellow-500" />
              Add geofence
            </h2>
            <input
              required
              placeholder="Zone name (e.g. Warehouse)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-sm ${darkMode ? "bg-white/10 text-white border border-white/10" : "bg-gray-100 border border-gray-200"}`}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                placeholder="Latitude"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
                className={`px-3 py-2 rounded-xl text-sm ${darkMode ? "bg-white/10 text-white border border-white/10" : "bg-gray-100 border border-gray-200"}`}
              />
              <input
                required
                placeholder="Longitude"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
                className={`px-3 py-2 rounded-xl text-sm ${darkMode ? "bg-white/10 text-white border border-white/10" : "bg-gray-100 border border-gray-200"}`}
              />
            </div>
            <label className={`block text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Radius: {form.radiusM} m
              <input
                type="range"
                min={50}
                max={5000}
                step={50}
                value={form.radiusM}
                onChange={(e) => setForm({ ...form, radiusM: Number(e.target.value) })}
                className="w-full accent-yellow-500 mt-1"
              />
            </label>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.alertOnEnter} onChange={(e) => setForm({ ...form, alertOnEnter: e.target.checked })} />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>Alert on enter</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.alertOnLeave} onChange={(e) => setForm({ ...form, alertOnLeave: e.target.checked })} />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>Alert on leave</span>
              </label>
            </div>
            <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
              Enable geofencing in Fleet Settings. Leave vehicle list empty to monitor all vehicles.
            </p>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Create geofence"}
            </Button>
          </motion.form>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cardClass}>
            <div className={`p-3 border-b ${darkMode ? "border-white/10" : "border-gray-200"}`}>
              <h2 className={`font-semibold text-sm flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                <MapPin size={16} className="text-cyan-400" />
                Active zones ({geofences.length})
              </h2>
            </div>
            {loading && <p className={`p-4 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Loading…</p>}
            {error && <p className="p-4 text-sm text-red-400">{error}</p>}
            {!loading && geofences.length === 0 && (
              <p className={`p-4 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>No geofences yet. Click the map to place one.</p>
            )}
            <div className="divide-y divide-white/5">
              {geofences.map((fence) => (
                <div key={fence.id} className="p-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{fence.name}</p>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {fence.radiusM || 200} m · {fence.lat?.toFixed?.(4)}, {fence.lng?.toFixed?.(4)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleActive(fence)}
                    className={`text-xs px-2 py-1 rounded-lg ${fence.active === false ? "bg-gray-500/20 text-gray-400" : "bg-green-500/20 text-green-400"}`}
                  >
                    {fence.active === false ? "Off" : "On"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(fence.id, fence.name)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Geofences;
