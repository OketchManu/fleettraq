/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronLeft, Crosshair, MapIcon, Trash2, Navigation, Car, Clock, AlertCircle, Wifi, WifiOff, Shield, Info } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { collection, addDoc, onSnapshot, query, where, updateDoc, doc, deleteDoc, getDocs, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../firebase";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Button from "./Button";
import { v4 as uuidv4 } from "uuid";
import { CarIcon } from "./assets/car-icon";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MapViewController = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);

  return null;
};

const Tracking = () => {
  const navigate = useNavigate();
  const { darkMode, vehicles, trackingData, setTrackingData, user, fleetId, sendNotification } = useFleet();
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [locationName, setLocationName] = useState("");
  const [useManualCoordinates, setUseManualCoordinates] = useState(false);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [myDeviceTrackedVehicles, setMyDeviceTrackedVehicles] = useState([]);
  const [otherDeviceTrackedVehicles, setOtherDeviceTrackedVehicles] = useState([]);
  
  // Generate or retrieve persistent Device ID (stays the same across sessions on this device)
  const [deviceId] = useState(() => {
    let id = localStorage.getItem("trackingDeviceId");
    if (!id) {
      id = uuidv4();
      localStorage.setItem("trackingDeviceId", id);
    }
    return id;
  });
  
  const [trackingDocId, setTrackingDocId] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDeviceInfo, setShowDeviceInfo] = useState(false);

  const nairobiCoordinates = useMemo(() => ({ lat: -1.2864, lng: 36.8172 }), []);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch tracked vehicles - SEPARATE by device
  useEffect(() => {
    if (!user?.uid) return;

    const fid = fleetId || user?.uid;
    if (!fid) return;

    const q = query(
      collection(db, "tracking"), 
      where("accountId", "==", fid),
      orderBy("timestamp", "desc")
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allTracking = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        
        // Separate by device
        const myDevice = [];
        const otherDevices = [];
        const seenMyVehicles = new Set();
        const seenOtherVehicles = new Set();
        
        for (const item of allTracking) {
          if (item.deviceId === deviceId) {
            // This device's tracking
            if (!seenMyVehicles.has(item.vehicleId)) {
              seenMyVehicles.add(item.vehicleId);
              myDevice.push(item);
            }
          } else {
            // Other device's tracking
            if (!seenOtherVehicles.has(item.vehicleId) && item.vehicleId) {
              seenOtherVehicles.add(item.vehicleId);
              otherDevices.push(item);
            }
          }
        }
        
        setMyDeviceTrackedVehicles(myDevice);
        setOtherDeviceTrackedVehicles(otherDevices);
        
        // If selected vehicle is being tracked by this device, update its location
        if (selectedVehicle) {
          const myTrack = myDevice.find(t => t.vehicleId === selectedVehicle);
          if (myTrack) {
            setCurrentLocation({
              lat: myTrack.lat,
              lng: myTrack.lng,
              name: myTrack.locationName
            });
            setTrackingDocId(myTrack.id);
            setIsTracking(myTrack.isTracking);
          }
        }
      },
      (err) => {
        setError("Failed to fetch tracked vehicles: " + err.message);
      }
    );
    return () => unsubscribe();
  }, [user?.uid, fleetId, deviceId, selectedVehicle]);

  const saveLocation = useCallback(
    async (lat, lng, name, method) => {
      const newLocation = { lat, lng, name };
      setCurrentLocation(newLocation);
      setTrackingData(newLocation);

      if (!isOnline) {
        // Store locally for later sync
        const pendingTrackings = JSON.parse(localStorage.getItem("pendingTrackings") || "[]");
        pendingTrackings.push({
          vehicleId: selectedVehicle,
          lat,
          lng,
          locationName: name,
          timestamp: new Date().toISOString(),
          method,
          deviceId,
          accountId: fleetId || auth.currentUser?.uid,
          isTracking: true,
        });
        localStorage.setItem("pendingTrackings", JSON.stringify(pendingTrackings));
        sendNotification?.("Location saved offline - will sync when online", "info");
        return;
      }

      try {
        if (!trackingDocId) {
          const docRef = await addDoc(collection(db, "tracking"), {
            vehicleId: selectedVehicle,
            lat,
            lng,
            locationName: name,
            timestamp: new Date().toISOString(),
            method,
            deviceId,
            accountId: fleetId || auth.currentUser.uid,
            isTracking: true,
          });
          setTrackingDocId(docRef.id);
          sendNotification?.(`Started tracking ${vehicles.find(v => v.id === selectedVehicle)?.make} ${vehicles.find(v => v.id === selectedVehicle)?.model} on this device`, "success");
        } else {
          const trackingRef = doc(db, "tracking", trackingDocId);
          await updateDoc(trackingRef, {
            lat,
            lng,
            locationName: name,
            timestamp: new Date().toISOString(),
            method,
            isTracking: true,
          });
        }
      } catch (err) {
        setError("Failed to save location: " + err.message);
        throw err;
      }
    },
    [selectedVehicle, deviceId, trackingDocId, setTrackingData, isOnline, fleetId, vehicles, sendNotification]
  );

  // Sync pending trackings when coming back online
  useEffect(() => {
    if (isOnline) {
      const syncPendingTrackings = async () => {
        const pending = JSON.parse(localStorage.getItem("pendingTrackings") || "[]");
        if (pending.length > 0) {
          for (const tracking of pending) {
            if (tracking.deviceId === deviceId) {
              try {
                await addDoc(collection(db, "tracking"), tracking);
                sendNotification?.("Offline tracking data synced!", "success");
              } catch (err) {
                console.error("Failed to sync tracking:", err);
              }
            }
          }
          localStorage.removeItem("pendingTrackings");
        }
      };
      syncPendingTrackings();
    }
  }, [isOnline, deviceId, sendNotification]);

  const handleTrackVehicle = async () => {
    if (!selectedVehicle) {
      setError("Please select a vehicle to track.");
      return;
    }

    if (!auth.currentUser) {
      setError("You must be logged in to track a vehicle.");
      return;
    }

    setError(null);

    // Check if THIS DEVICE is already tracking this vehicle
    const alreadyTrackingThisDevice = myDeviceTrackedVehicles.some((v) => v.vehicleId === selectedVehicle);
    if (alreadyTrackingThisDevice) {
      setError("You are already tracking this vehicle on THIS device. Stop tracking first if you want to restart.");
      return;
    }

    if (useManualCoordinates) {
      if (!manualLat || !manualLng) {
        setError("Please enter both latitude and longitude values.");
        return;
      }

      const lat = parseFloat(manualLat);
      const lng = parseFloat(manualLng);

      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        setError("Please enter valid coordinates.");
        return;
      }

      await saveLocation(lat, lng, locationName || "Manual Location", "manual");
      setIsTracking(true);
    } else {
      setIsTracking(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await saveLocation(latitude, longitude, locationName || "Current Location", "gps");
          },
          (err) => {
            setIsTracking(false);
            setError("Unable to get your location: " + err.message);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        setError("Geolocation is not supported by your browser.");
        setIsTracking(false);
      }
    }
  };

  // Real-time tracking updates (only for this device's active tracking)
  useEffect(() => {
    let watchId = null;

    if (isTracking && !useManualCoordinates && navigator.geolocation && trackingDocId) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await saveLocation(latitude, longitude, locationName || "Current Location", "gps");
        },
        (err) => {
          setError("Tracking error: " + err.message);
          setIsTracking(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking, useManualCoordinates, saveLocation, locationName, trackingDocId]);

  // Listen for tracking updates for selected vehicle (from this device only)
  useEffect(() => {
    if (!selectedVehicle || !auth.currentUser) {
      setCurrentLocation(null);
      setTrackingHistory([]);
      setTrackingDocId(null);
      return;
    }

    const fid = fleetId || auth.currentUser.uid;
    const q = query(
      collection(db, "tracking"),
      where("vehicleId", "==", selectedVehicle),
      where("accountId", "==", fid),
      where("deviceId", "==", deviceId),  // Only this device's tracking for the selected vehicle
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const updates = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTrackingHistory(updates);

        if (updates.length > 0) {
          const latest = updates[0];
          setTrackingDocId(latest.id);
          const newLocation = {
            lat: latest.lat,
            lng: latest.lng,
            name: latest.locationName,
          };
          setCurrentLocation(newLocation);
          setTrackingData(newLocation);
          setLocationName(latest.locationName || "");
          setIsTracking(latest.isTracking);
        } else {
          setCurrentLocation(null);
          setTrackingHistory([]);
          setTrackingDocId(null);
        }
      },
      (err) => {
        setError("Failed to fetch tracking updates: " + err.message);
      }
    );

    return () => unsubscribe();
  }, [selectedVehicle, setTrackingData, fleetId, deviceId]);

  // Set initial map view
  useEffect(() => {
    if (!trackingData) {
      setTrackingData(nairobiCoordinates);
    }
  }, [trackingData, setTrackingData, nairobiCoordinates]);

  const stopTracking = async () => {
    if (!trackingDocId) {
      setError("No active tracking session found.");
      return;
    }

    if (!auth.currentUser) {
      setError("You must be logged in to stop tracking.");
      return;
    }

    const trackingRef = doc(db, "tracking", trackingDocId);

    try {
      await updateDoc(trackingRef, { isTracking: false });
      setIsTracking(false);
      setTrackingDocId(null);
      sendNotification?.("Stopped tracking vehicle on this device", "info");
      setError(null);
    } catch (err) {
      setError("Failed to stop tracking: " + err.message);
    }
  };

  const removeVehicleFromTracking = async (trackingId, vehicleId) => {
    if (!trackingId) {
      setError("No tracking entry selected for removal.");
      return;
    }

    if (!auth.currentUser) {
      setError("You must be logged in to remove tracking.");
      return;
    }

    try {
      const trackingRef = doc(db, "tracking", trackingId);
      await deleteDoc(trackingRef);
      sendNotification?.("Removed vehicle from your tracking list", "success");
      setError(null);
      
      if (selectedVehicle === vehicleId) {
        setCurrentLocation(null);
        setTrackingHistory([]);
        setTrackingDocId(null);
        setIsTracking(false);
        setSelectedVehicle("");
      }
      
      // Refresh the lists
      setMyDeviceTrackedVehicles(prev => prev.filter(v => v.id !== trackingId));
      setOtherDeviceTrackedVehicles(prev => prev.filter(v => v.id !== trackingId));
    } catch (err) {
      setError("Failed to remove vehicle from tracking: " + err.message);
    }
  };

  const MapComponent = () => {
    const position = currentLocation || trackingData || nairobiCoordinates;

    return (
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={13}
        style={{
          height: "400px",
          width: "100%",
          borderRadius: "1rem",
        }}
        className="z-0"
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {currentLocation && (
          <Marker position={[currentLocation.lat, currentLocation.lng]} icon={CarIcon}>
            <Popup>
              <div className="min-w-[200px] p-2">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-4 h-4 text-yellow-500" />
                  <strong className="text-gray-800 dark:text-gray-200">
                    {vehicles.find((v) => v.id === selectedVehicle)?.make || "Vehicle"}{" "}
                    {vehicles.find((v) => v.id === selectedVehicle)?.model || ""}
                  </strong>
                </div>
                {currentLocation.name && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Location:</strong> {currentLocation.name}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </p>
                <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1">
                  <Shield size={10} /> Tracked from this device
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        <MapViewController center={[position.lat, position.lng]} zoom={13} />
      </MapContainer>
    );
  };

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);
  const isSelectedVehicleTrackedByMe = myDeviceTrackedVehicles.some(v => v.vehicleId === selectedVehicle);
  const isSelectedVehicleTrackedByOther = otherDeviceTrackedVehicles.some(v => v.vehicleId === selectedVehicle);

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]" : "bg-gray-50"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-20 ${darkMode ? "bg-black/50 backdrop-blur-xl border-b border-white/10" : "bg-white shadow-lg"}`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-yellow-500" />
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  Live Tracking
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {isOnline ? (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <Wifi size={12} /> Live - Device: {deviceId.slice(0, 8)}...
                    </span>
                  ) : (
                    <span className="text-xs text-red-400 flex items-center gap-1">
                      <WifiOff size={12} /> Offline Mode
                    </span>
                  )}
                  <button
                    onClick={() => setShowDeviceInfo(!showDeviceInfo)}
                    className="text-gray-400 hover:text-yellow-500 transition-colors"
                    title="Device Info"
                  >
                    <Info size={12} />
                  </button>
                </div>
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>
              <ChevronLeft size={18} />
              Back
            </Button>
          </div>
        </div>
      </header>

      {/* Device Info Tooltip */}
      <AnimatePresence>
        {showDeviceInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-20 right-4 z-30 max-w-sm p-4 rounded-xl border shadow-lg ${darkMode ? "bg-gray-800 border-yellow-500/30" : "bg-white border-yellow-300"}`}
          >
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className={`font-semibold mb-1 ${darkMode ? "text-white" : "text-gray-800"}`}>Device-Specific Tracking</h4>
                <p className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  ✅ Each device has its own unique Device ID.<br />
                  ✅ Tracking is per-device, not per-account.<br />
                  ✅ Your phone and laptop can track different vehicles independently.<br />
                  ✅ This device ID: <code className="font-mono bg-black/20 px-1 rounded">{deviceId}</code>
                </p>
                <button
                  onClick={() => setShowDeviceInfo(false)}
                  className="text-xs text-yellow-500 mt-2 hover:underline"
                >
                  Got it
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm flex items-center gap-2"
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}

        {/* This Device's Tracked Vehicles */}
        {myDeviceTrackedVehicles.length > 0 && (
          <div className={`mb-6 p-4 rounded-xl ${darkMode ? "bg-green-500/10 border border-green-500/30" : "bg-green-50 border border-green-200"}`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? "text-green-300" : "text-green-800"}`}>
              <Navigation className="w-4 h-4" />
              THIS DEVICE - Currently Tracking ({myDeviceTrackedVehicles.length})
              <span className="text-xs text-gray-400 ml-2">(Device ID: {deviceId.slice(0, 8)}...)</span>
            </h3>
            <div className="space-y-2">
              {myDeviceTrackedVehicles.map((track) => {
                const vehicle = vehicles.find(v => v.id === track.vehicleId);
                return (
                  <div key={track.id} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? "bg-green-500/5" : "bg-green-100/50"}`}>
                    <div className="flex items-center gap-3">
                      <Car className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : "Unknown Vehicle"}
                        </p>
                        <p className="text-xs text-gray-400">
                          Last update: {new Date(track.timestamp).toLocaleString()}
                          {track.isTracking && <span className="text-green-500 ml-2">● Live</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {track.isTracking && (
                        <button
                          onClick={stopTracking}
                          className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors"
                        >
                          Stop
                        </button>
                      )}
                      <button
                        onClick={() => removeVehicleFromTracking(track.id, track.vehicleId)}
                        className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <Trash2 size={16} className="text-gray-400 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Other Devices' Tracked Vehicles (Info only - cannot control) */}
        {otherDeviceTrackedVehicles.length > 0 && (
          <div className={`mb-6 p-4 rounded-xl ${darkMode ? "bg-gray-500/10 border border-gray-500/30" : "bg-gray-100 border border-gray-300"}`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              <MapPin className="w-4 h-4" />
              OTHER DEVICES - Tracking ({otherDeviceTrackedVehicles.length})
            </h3>
            <div className="space-y-2">
              {otherDeviceTrackedVehicles.map((track) => {
                const vehicle = vehicles.find(v => v.id === track.vehicleId);
                return (
                  <div key={track.id} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? "bg-gray-500/5" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-3">
                      <Car className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : "Unknown Vehicle"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Device: {track.deviceId?.slice(0, 8)}...
                          {track.isTracking && <span className="text-yellow-500 ml-2">● Live</span>}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 px-2 py-1 rounded bg-white/10">
                      View only
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-white/10">
              💡 These vehicles are being tracked by other devices in your account. You cannot control them from this device.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls Panel */}
          <div className={`rounded-2xl p-6 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"} border shadow-lg`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Navigation className="w-5 h-5 text-yellow-500" />
              Start New Tracking (This Device)
            </h2>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Select Vehicle</label>
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    darkMode ? "bg-white/10 text-white border-white/20" : "bg-gray-100 text-gray-800 border-gray-300"
                  }`}
                >
                  <option value="" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>Choose a vehicle</option>
                  {vehicles
                    .filter(v => !myDeviceTrackedVehicles.some(t => t.vehicleId === v.id))
                    .map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id} className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>
                        {vehicle.make} {vehicle.model} - {vehicle.licensePlate}
                      </option>
                    ))}
                </select>
                {selectedVehicle && isSelectedVehicleTrackedByOther && (
                  <p className="text-xs text-yellow-500 mt-1">
                    ⚠️ This vehicle is being tracked by another device. You can still track it on this device independently.
                  </p>
                )}
              </div>

              {selectedVehicleData && (
                <div className={`p-3 rounded-xl ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                  <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Status:{" "}
                    <span className={`font-semibold ${
                      selectedVehicleData.status === "Active" ? "text-green-400" :
                      selectedVehicleData.status === "Maintenance" ? "text-yellow-400" :
                      "text-gray-400"
                    }`}>
                      {selectedVehicleData.status}
                    </span>
                  </p>
                  <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"} mt-1`}>
                    Mileage: {selectedVehicleData.mileage?.toLocaleString() || 0} miles
                  </p>
                </div>
              )}

              <div>
                <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Location Name (Optional)</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g., Warehouse A, Client Site"
                  className={`w-full px-4 py-3 rounded-xl ${darkMode ? "bg-white/10 text-white placeholder-gray-500" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                  disabled={isSelectedVehicleTrackedByMe}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="manualCoords"
                  checked={useManualCoordinates}
                  onChange={() => setUseManualCoordinates(!useManualCoordinates)}
                  className="w-4 h-4 rounded accent-yellow-500"
                  disabled={isSelectedVehicleTrackedByMe}
                />
                <label htmlFor="manualCoords" className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Enter coordinates manually
                </label>
              </div>

              {useManualCoordinates && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="any"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    placeholder="Latitude"
                    className={`px-4 py-3 rounded-xl ${darkMode ? "bg-white/10 text-white placeholder-gray-500" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                  />
                  <input
                    type="number"
                    step="any"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    placeholder="Longitude"
                    className={`px-4 py-3 rounded-xl ${darkMode ? "bg-white/10 text-white placeholder-gray-500" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleTrackVehicle}
                  disabled={!selectedVehicle || isSelectedVehicleTrackedByMe}
                  className="flex-1"
                >
                  <Crosshair size={18} />
                  {isTracking && !useManualCoordinates ? "Tracking..." : useManualCoordinates ? "Set Location" : "Start Tracking on THIS Device"}
                </Button>
                {isTracking && !useManualCoordinates && (
                  <Button variant="danger" onClick={stopTracking}>
                    Stop
                  </Button>
                )}
              </div>
              {isSelectedVehicleTrackedByMe && (
                <p className="text-xs text-yellow-500 text-center">
                  ⚡ You are already tracking this vehicle on this device. Stop tracking first to start a new session.
                </p>
              )}
            </div>

            {/* Current Location Info */}
            {currentLocation && (
              <div className={`mt-6 p-4 rounded-xl ${darkMode ? "bg-black/30" : "bg-gray-50"}`}>
                <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                  <Clock size={16} className="text-yellow-500" />
                  Current Location (This Device)
                </h3>
                {currentLocation.name && (
                  <p className={`text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    📍 {currentLocation.name}
                  </p>
                )}
                <p className={`text-sm font-mono ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Lat: {currentLocation.lat.toFixed(6)}<br />
                  Lng: {currentLocation.lng.toFixed(6)}
                </p>
                {isTracking && !useManualCoordinates && (
                  <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Live tracking active on this device
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Map Panel */}
          <div className={`rounded-2xl overflow-hidden ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"} border shadow-lg`}>
            <div className={`p-4 border-b ${darkMode ? "border-white/10" : "border-gray-200"}`}>
              <h2 className={`font-semibold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
                <MapIcon size={18} className="text-yellow-500" />
                Live Map View (This Device's Tracking)
              </h2>
            </div>
            <MapComponent />
          </div>
        </div>

        {/* Tracking History for selected vehicle (from this device) */}
        {trackingHistory.length > 1 && (
          <div className={`mt-6 rounded-2xl p-4 ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"} border`}>
            <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-800"}`}>
              Recent Location History (This Device)
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {trackingHistory.slice(0, 10).map((history, idx) => (
                <div key={history.id} className={`flex items-center justify-between p-2 rounded-lg ${darkMode ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{idx === 0 ? "Latest" : `${idx + 1}`}</span>
                    <MapPin size={14} className="text-yellow-500" />
                    <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {history.locationName || `${history.lat.toFixed(4)}, ${history.lng.toFixed(4)}`}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(history.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`mt-12 py-6 text-center border-t ${darkMode ? "border-white/10 text-gray-500" : "border-gray-200 text-gray-600"}`}>
        <p>© 2026 FleetTraq. All rights reserved. Device-specific tracking active.</p>
      </footer>
    </div>
  );
};

export default Tracking;