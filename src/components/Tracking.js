import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ChevronLeft, Crosshair, MapIcon, Trash2 } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { collection, addDoc, onSnapshot, query, orderBy, where, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Button from "./Button";
import { v4 as uuidv4 } from "uuid";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import carIcon from "./assets/car-icon.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

let CarIcon = L.icon({
  iconUrl: carIcon,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

L.Marker.prototype.options.icon = DefaultIcon;

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
  const { darkMode, vehicles, trackingData, setTrackingData } = useFleet();
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [locationName, setLocationName] = useState("");
  const [useManualCoordinates, setUseManualCoordinates] = useState(false);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [trackedVehicles, setTrackedVehicles] = useState([]);
  const [deviceId] = useState(() => localStorage.getItem("deviceId") || uuidv4());
  const [trackingDocId, setTrackingDocId] = useState(null); // Track active document

  localStorage.setItem("deviceId", deviceId);

  const nairobiCoordinates = useMemo(() => ({ lat: -1.2864, lng: 36.8172 }), []);

  // Fetch all tracked vehicles for the current user
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "tracking"),
      where("accountId", "==", auth.currentUser.uid),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allTracking = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const uniqueVehicles = [...new Map(allTracking.map((item) => [item.vehicleId, item])).values()];
        setTrackedVehicles(uniqueVehicles);
      },
      (err) => {
        setError("Failed to fetch tracked vehicles: " + err.message);
      }
    );
    return () => unsubscribe();
  }, []);

  const saveLocation = useCallback(
    async (lat, lng, name, method) => {
      const newLocation = { lat, lng, name };
      setCurrentLocation(newLocation);
      setTrackingData(newLocation);

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
            accountId: auth.currentUser.uid,
            isTracking: true,
          });
          setTrackingDocId(docRef.id);
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
    [selectedVehicle, deviceId, trackingDocId, setTrackingData]
  );

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

    if (trackedVehicles.some((v) => v.vehicleId === selectedVehicle && v.deviceId !== deviceId)) {
      setError("This vehicle is already being tracked by another device.");
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
      setIsTracking(true); // Enable tracking state for manual input
    } else {
      setIsTracking(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await saveLocation(latitude, longitude, "Current Location", "gps");
          },
          (err) => {
            setIsTracking(false);
            setError("Unable to get your location: " + err.message);
          },
          { enableHighAccuracy: true }
        );
      } else {
        setError("Geolocation is not supported by your browser.");
        setIsTracking(false);
      }
    }
  };

  // Real-time tracking updates
  useEffect(() => {
    let watchId = null;

    if (isTracking && !useManualCoordinates && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await saveLocation(latitude, longitude, "Current Location", "gps");
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
  }, [isTracking, useManualCoordinates, saveLocation]);

  // Listen for tracking updates for selected vehicle
  useEffect(() => {
    if (!selectedVehicle || !auth.currentUser) {
      setCurrentLocation(null);
      setTrackingHistory([]);
      setTrackingDocId(null);
      return;
    }

    const q = query(
      collection(db, "tracking"),
      where("vehicleId", "==", selectedVehicle),
      where("accountId", "==", auth.currentUser.uid),
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
          setLocationName(latest.locationName);
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
  }, [selectedVehicle, setTrackingData]);

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
      setCurrentLocation(null);
      setError(null);
    } catch (err) {
      setError("Failed to stop tracking: " + err.message);
    }
  };

  const removeVehicleFromTracking = async (trackingId) => {
    if (!trackingId) {
      setError("No tracking entry selected for removal.");
      return;
    }

    if (!auth.currentUser) {
      setError("You must be logged in to remove tracking.");
      return;
    }

    const trackingRef = doc(db, "tracking", trackingId);
    const vehicleTracking = trackedVehicles.find((v) => v.id === trackingId);

    if (!vehicleTracking) {
      setError("Tracking entry not found.");
      return;
    }

    try {
      await deleteDoc(trackingRef);
      setError(null);
      if (selectedVehicle === vehicleTracking.vehicleId) {
        setCurrentLocation(null);
        setTrackingHistory([]);
        setTrackingDocId(null);
        setIsTracking(false);
        setSelectedVehicle("");
      }
      setTrackedVehicles((prev) => prev.filter((v) => v.id !== trackingId));
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
          height: "calc(50vh - 60px)",
          width: "100%",
          borderRadius: "0.5rem",
          minHeight: "200px",
        }}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {currentLocation && (
          <Marker position={[currentLocation.lat, currentLocation.lng]} icon={CarIcon}>
            <Popup>
              {selectedVehicle
                ? `Vehicle: ${vehicles.find((v) => v.id === selectedVehicle)?.make} ${
                    vehicles.find((v) => v.id === selectedVehicle)?.model
                  }`
                : "Current Location"}
              <br />
              {currentLocation.name && (
                <span>
                  <strong>Location:</strong> {currentLocation.name}
                  <br />
                </span>
              )}
              <strong>Coordinates:</strong> {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              {trackingHistory.length > 0 && (
                <>
                  <br />
                  <strong>Last Update:</strong> {new Date(trackingHistory[0].timestamp).toLocaleString()}
                  <br />
                  <strong>Tracking Device:</strong> {trackingHistory[0].deviceId === deviceId ? "This Device" : "Another Device"}
                </>
              )}
            </Popup>
          </Marker>
        )}
        <MapViewController center={[position.lat, position.lng]} zoom={13} />
      </MapContainer>
    );
  };

  const themeStyles = {
    background: darkMode
      ? "linear-gradient(135deg, #080016 0%, #150025 100%)"
      : "linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)",
    color: darkMode ? "#fff" : "#000",
    cardBg: darkMode ? "rgba(20, 10, 40, 0.7)" : "rgba(255, 255, 255, 0.9)",
    cardBorder: darkMode ? "2px solid rgba(250, 204, 21, 0.5)" : "2px solid rgba(59, 130, 246, 0.5)",
    cardGlow: darkMode ? "0 0 15px rgba(250, 204, 21, 0.3)" : "0 0 15px rgba(59, 130, 246, 0.2)",
    inputBg: darkMode ? "#1a0033" : "#f3f4f6",
    inputBorder: `1px solid ${darkMode ? "#4b5563" : "#d1d5db"}`,
    inputText: darkMode ? "#fff" : "#000",
    labelText: darkMode ? "#facc15" : "#1f2937",
  };

  return (
    <motion.div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        ...themeStyles,
        padding: "0 1rem",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ flex: "1 0 auto" }}>
        <header
          style={{
            background: darkMode ? "rgba(0, 0, 0, 0.5)" : "#e5e7eb",
            padding: "0.75rem 1rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <MapPin
                style={{
                  height: "2rem",
                  width: "2rem",
                  color: darkMode ? "#facc15" : "#1f2937",
                  marginRight: "0.5rem",
                }}
              />
              <div>
                <h1
                  style={{
                    fontSize: "clamp(1.25rem, 4vw, 1.5rem)",
                    fontWeight: "bold",
                    color: darkMode ? "#facc15" : "#1f2937",
                  }}
                >
                  Track Your Vehicles
                </h1>
                <p style={{ fontSize: "clamp(0.75rem, 2.5vw, 0.875rem)", opacity: 0.7 }}>
                  See where your fleet is right now
                </p>
              </div>
            </div>
            <Button onClick={() => navigate("/dashboard")} style={{ padding: "0.5rem 1rem" }}>
              <ChevronLeft size={16} style={{ marginRight: "0.25rem" }} />
              Back to Dashboard
            </Button>
          </div>
        </header>

        <main style={{ padding: "1rem", flexGrow: 1 }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            {error && (
              <motion.div
                style={{
                  marginBottom: "1rem",
                  padding: "1rem",
                  background: "#dc2626",
                  borderRadius: "0.5rem",
                  color: "#fff",
                  fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
                }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
              <h2
                style={{
                  color: themeStyles.labelText,
                  fontSize: "clamp(1rem, 3vw, 1.125rem)",
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                }}
              >
                Currently Tracked Vehicles:
              </h2>
              {trackedVehicles.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {trackedVehicles.map((track) => (
                    <li
                      key={track.id}
                      style={{
                        marginBottom: "0.75rem",
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {vehicles.find((v) => v.id === track.vehicleId)?.make || "Unknown"}{" "}
                      {vehicles.find((v) => v.id === track.vehicleId)?.model || "Vehicle"} (
                      {track.deviceId === deviceId ? "This Device" : "Another Device"})
                      {track.isTracking && track.deviceId === deviceId && (
                        <Button
                          onClick={() => stopTracking()}
                          style={{
                            background: "#dc2626",
                            marginLeft: "0.5rem",
                            padding: "0.5rem",
                            fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
                          }}
                          disabled={!auth.currentUser}
                        >
                          Stop Tracking
                        </Button>
                      )}
                      <Button
                        onClick={() => removeVehicleFromTracking(track.id)}
                        style={{
                          background: "#ff6b6b",
                          marginLeft: "0.5rem",
                          padding: "0.5rem",
                          fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
                        }}
                        disabled={!auth.currentUser}
                      >
                        <Trash2 size={16} style={{ marginRight: "0.25rem" }} /> Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: "clamp(0.875rem, 2.5vw, 1rem)" }}>
                  No vehicles are currently being tracked.
                </p>
              )}
            </div>

            <motion.div
              style={{
                background: themeStyles.cardBg,
                padding: "1.5rem",
                borderRadius: "0.5rem",
                border: themeStyles.cardBorder,
                boxShadow: themeStyles.cardGlow,
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr)",
                  gap: "1.5rem",
                  ...(window.innerWidth >= 768 && { gridTemplateColumns: "1fr 2fr" }),
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label
                      style={{
                        color: themeStyles.labelText,
                        fontSize: "clamp(1rem, 3vw, 1.125rem)",
                        fontWeight: "600",
                      }}
                    >
                      Choose a Vehicle:
                    </label>
                    <select
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                      style={{
                        padding: "0.5rem",
                        background: themeStyles.inputBg,
                        color: themeStyles.inputText,
                        border: themeStyles.inputBorder,
                        borderRadius: "0.25rem",
                        fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
                      }}
                    >
                      <option value="">Select a vehicle</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label
                      style={{
                        color: themeStyles.labelText,
                        fontSize: "clamp(1rem, 3vw, 1.125rem)",
                        fontWeight: "600",
                      }}
                    >
                      Location Name:
                    </label>
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="Enter location name (optional)"
                      style={{
                        padding: "0.5rem",
                        background: themeStyles.inputBg,
                        color: themeStyles.inputText,
                        border: themeStyles.inputBorder,
                        borderRadius: "0.25rem",
                        fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
                      }}
                      disabled={trackingHistory.length > 0 && trackingHistory[0]?.deviceId !== deviceId}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <input
                      type="checkbox"
                      id="manualCoords"
                      checked={useManualCoordinates}
                      onChange={() => setUseManualCoordinates(!useManualCoordinates)}
                      style={{ accentColor: darkMode ? "#facc15" : "#3b82f6" }}
                      disabled={trackingHistory.length > 0 && trackingHistory[0]?.deviceId !== deviceId}
                    />
                    <label
                      htmlFor="manualCoords"
                      style={{
                        color: themeStyles.inputText,
                        cursor: "pointer",
                        fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
                      }}
                    >
                      Enter coordinates manually
                    </label>
                  </div>

                  {useManualCoordinates && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label
                        style={{
                          color: themeStyles.labelText,
                          fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
                          fontWeight: "600",
                        }}
                      >
                        <MapIcon size={16} style={{ marginRight: "0.25rem", verticalAlign: "middle" }} />
                        Manual Coordinates:
                      </label>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: window.innerWidth < 640 ? "column" : "row",
                          gap: "0.5rem",
                        }}
                      >
                        <input
                          type="text"
                          value={manualLat}
                          onChange={(e) => setManualLat(e.target.value)}
                          placeholder="Latitude"
                          style={{
                            padding: "0.5rem",
                            width: "100%",
                            background: themeStyles.inputBg,
                            color: themeStyles.inputText,
                            border: themeStyles.inputBorder,
                            borderRadius: "0.25rem",
                            fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
                          }}
                          disabled={trackingHistory.length > 0 && trackingHistory[0]?.deviceId !== deviceId}
                        />
                        <input
                          type="text"
                          value={manualLng}
                          onChange={(e) => setManualLng(e.target.value)}
                          placeholder="Longitude"
                          style={{
                            padding: "0.5rem",
                            width: "100%",
                            background: themeStyles.inputBg,
                            color: themeStyles.inputText,
                            border: themeStyles.inputBorder,
                            borderRadius: "0.25rem",
                            fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
                          }}
                          disabled={trackingHistory.length > 0 && trackingHistory[0]?.deviceId !== deviceId}
                        />
                      </div>
                      <p
                        style={{
                          fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
                          color: darkMode ? "#d1d5db" : "#6b7280",
                        }}
                      >
                        Format: Decimal degrees (e.g., -1.2864, 36.8172)
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleTrackVehicle}
                    disabled={!selectedVehicle || !auth.currentUser}
                    style={{
                      padding: "0.5rem 1rem",
                      fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
                    }}
                  >
                    <Crosshair size={16} style={{ marginRight: "0.25rem" }} />
                    {isTracking && !useManualCoordinates
                      ? "Tracking..."
                      : useManualCoordinates
                      ? "Set Location"
                      : "Start Tracking"}
                  </Button>

                  {isTracking && !useManualCoordinates && trackingHistory[0]?.deviceId === deviceId && (
                    <Button
                      onClick={stopTracking}
                      style={{
                        background: "#dc2626",
                        padding: "0.5rem 1rem",
                        fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
                      }}
                    >
                      Stop Tracking
                    </Button>
                  )}

                  {currentLocation && (
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "0.75rem",
                        background: darkMode ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.05)",
                        borderRadius: "0.5rem",
                      }}
                    >
                      <h3
                        style={{
                          color: themeStyles.labelText,
                          fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
                          fontWeight: "600",
                        }}
                      >
                        Current Location:
                      </h3>
                      {currentLocation.name && (
                        <p
                          style={{
                            color: darkMode ? "#d1d5db" : "#4b5563",
                            marginTop: "0.25rem",
                            fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
                          }}
                        >
                          <strong>Location:</strong> {currentLocation.name}
                        </p>
                      )}
                      <p
                        style={{
                          color: darkMode ? "#d1d5db" : "#4b5563",
                          marginTop: "0.25rem",
                          fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
                        }}
                      >
                        <strong>Latitude:</strong> {currentLocation.lat.toFixed(6)}
                      </p>
                      <p
                        style={{
                          color: darkMode ? "#d1d5db" : "#4b5563",
                          fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
                        }}
                      >
                        <strong>Longitude:</strong> {currentLocation.lng.toFixed(6)}
                      </p>
                      {trackingHistory.length > 0 && (
                        <>
                          <p
                            style={{
                              color: darkMode ? "#d1d5db" : "#4b5563",
                              marginTop: "0.25rem",
                              fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
                            }}
                          >
                            <strong>Last Update:</strong> {new Date(trackingHistory[0].timestamp).toLocaleString()}
                          </p>
                          <p
                            style={{
                              color: darkMode ? "#d1d5db" : "#4b5563",
                              marginTop: "0.25rem",
                              fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
                            }}
                          >
                            <strong>Tracking Device:</strong>{" "}
                            {trackingHistory[0].deviceId === deviceId ? "This Device" : "Another Device"}
                          </p>
                        </>
                      )}
                      {isTracking && !useManualCoordinates && trackingHistory[0]?.deviceId === deviceId && (
                        <p
                          style={{
                            color: darkMode ? "#facc15" : "#3b82f6",
                            marginTop: "0.5rem",
                            fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
                            fontWeight: "500",
                          }}
                        >
                          ● Live tracking is active
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <h2
                    style={{
                      color: themeStyles.labelText,
                      fontSize: "clamp(1rem, 3vw, 1.125rem)",
                      fontWeight: "600",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Vehicle Location Map:
                  </h2>
                  <MapComponent />
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      <footer
        style={{
          background: darkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.9)",
          padding: "1rem",
          textAlign: "center",
          color: darkMode ? "#9ca3af" : "#6b7280",
          fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
          flexShrink: 0,
        }}
      >
        © {new Date().getFullYear()} FleetTraq
      </footer>
    </motion.div>
  );
};

export default Tracking;
