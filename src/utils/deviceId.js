import { v4 as uuidv4 } from "uuid";
import { normalizeTimestamp } from "./vehicleMotion";

const STORAGE_KEY = "fleettraq_device_id";

/** Persistent ID for this browser / device (survives logout). */
export function getDeviceId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      const legacy = localStorage.getItem("trackingDeviceId");
      if (legacy) {
        id = legacy;
        localStorage.setItem(STORAGE_KEY, legacy);
      }
    }
    if (!id) {
      id = uuidv4();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return uuidv4();
  }
}

export function formatDeviceId(id) {
  if (!id) return "unknown";
  return `${String(id).slice(0, 8)}…`;
}

/** True when this device is allowed to send GPS updates for the vehicle. */
export function canDeviceTrackVehicle(vehicle, deviceId) {
  if (!vehicle || !deviceId) return false;
  if (!vehicle.registeredDeviceId) return false;
  return vehicle.registeredDeviceId === deviceId;
}

/** Driver may complete one-time device registration when admin enabled it. */
export function canRegisterDeviceOnVehicle(vehicle) {
  return Boolean(vehicle?.awaitingDeviceRegistration);
}

/** Pick the tracking row that belongs to the vehicle's registered GPS device. */
export function pickAuthoritativeTrack(tracks, vehicle) {
  if (!tracks?.length || !vehicle) return null;
  const sorted = [...tracks].sort(
    (a, b) => normalizeTimestamp(b.timestamp) - normalizeTimestamp(a.timestamp)
  );
  if (vehicle.registeredDeviceId) {
    const registered = sorted.filter((t) => t.deviceId === vehicle.registeredDeviceId);
    if (registered.length) return registered[0];
  }
  return sorted.find((t) => t.isTracking !== false) || sorted[0] || null;
}
