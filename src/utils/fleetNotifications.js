import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

const ALLOWED_ALERT_TYPES = new Set(["speed", "idle", "geofence"]);
const ALLOWED_TYPES = new Set(["warning", "info"]);

/**
 * Send a structured fleet alert to the admin notification inbox.
 * Fields must match Firestore notification rules for driver-created alerts.
 */
export async function notifyFleetAdmin(accountId, message, type = "warning", extra = {}) {
  if (!accountId || !message) return;

  const alertType = extra.alertType;
  if (!ALLOWED_ALERT_TYPES.has(alertType)) return;

  const safeType = ALLOWED_TYPES.has(type) ? type : "warning";
  const trimmed = String(message).trim().slice(0, 280);

  const payload = {
    userId: accountId,
    message: trimmed,
    type: safeType,
    read: false,
    createdAt: new Date().toISOString(),
    alertType,
    vehicleId: extra.vehicleId,
  };

  if (extra.geofenceId) payload.geofenceId = extra.geofenceId;
  if (extra.event) payload.event = extra.event;
  if (typeof extra.speedKmh === "number") payload.speedKmh = extra.speedKmh;

  await addDoc(collection(db, "notifications"), payload);
}
