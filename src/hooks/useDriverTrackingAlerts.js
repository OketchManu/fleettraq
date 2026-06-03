import { useEffect, useRef } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { isInsideGeofence, geofenceAppliesToVehicle } from "../utils/geofence";
import { notifyFleetAdmin } from "../utils/fleetNotifications";
import {
  msToKmh,
  speedFromPoints,
  evaluateSpeedAlert,
  evaluateIdleAlert,
  shouldFireAlert,
  ALERT_COOLDOWN_MS,
} from "../utils/trackingAlerts";

function vehicleLabelFrom(vehicle) {
  if (!vehicle) return "Vehicle";
  const plate = vehicle.licensePlate || vehicle.plateNumber;
  return plate ? `${vehicle.make} ${vehicle.model} (${plate})` : `${vehicle.make} ${vehicle.model}`;
}

/**
 * Runs speed, idle, and geofence alerts on the driver's device and notifies the fleet admin.
 */
export function useDriverTrackingAlerts({ vehicle, accountId, enabled }) {
  const settingsRef = useRef({
    notifications: true,
    enableGeofencing: false,
    speedLimitAlert: 80,
    idleTimeAlert: 15,
  });
  const geofencesRef = useRef([]);
  const geofenceStateRef = useRef(new Map());
  const cooldownRef = useRef(new Map());
  const lastMoveAtRef = useRef(Date.now());
  const lastPointRef = useRef(null);
  const idleAlertSentRef = useRef(false);

  useEffect(() => {
    if (!accountId || !enabled) return undefined;

    const settingsDoc = doc(db, "fleetSettings", `${accountId}_fleet`);
    const unsubSettings = onSnapshot(settingsDoc, (snap) => {
      if (snap.exists()) {
        settingsRef.current = { ...settingsRef.current, ...snap.data() };
      }
    });

    const q = query(collection(db, "geofences"), where("accountId", "==", accountId));
    const unsubGeofences = onSnapshot(q, (snapshot) => {
      geofencesRef.current = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    });

    return () => {
      unsubSettings();
      unsubGeofences();
    };
  }, [accountId, enabled]);

  const processPosition = async (lat, lng, speedMs) => {
    if (!enabled || !accountId || !vehicle?.id) return;

    const settings = settingsRef.current;
    if (settings.notifications === false) return;

    const label = vehicleLabelFrom(vehicle);
    const now = Date.now();
    const current = { lat, lng, timestamp: new Date().toISOString(), at: now };

    let speedKmh = msToKmh(speedMs);
    if (speedKmh == null && lastPointRef.current) {
      speedKmh = speedFromPoints(lastPointRef.current, current);
    }

    const moved =
      !lastPointRef.current ||
      Math.abs(lat - lastPointRef.current.lat) > 0.00005 ||
      Math.abs(lng - lastPointRef.current.lng) > 0.00005;

    if (moved) {
      lastMoveAtRef.current = now;
      idleAlertSentRef.current = false;
    }

    lastPointRef.current = current;

    const speedMsg = evaluateSpeedAlert({
      speedKmh,
      speedLimitKmh: settings.speedLimitAlert,
      vehicleLabel: label,
      cooldownRef: cooldownRef.current,
    });
    if (speedMsg) {
      await notifyFleetAdmin(accountId, speedMsg, "warning", {
        alertType: "speed",
        vehicleId: vehicle.id,
        speedKmh: Math.round(speedKmh),
      }).catch(() => {});
    }

    const idleMs = now - lastMoveAtRef.current;
    if (!idleAlertSentRef.current && settings.idleTimeAlert > 0) {
      const idleMsg = evaluateIdleAlert({
        idleMs,
        idleLimitMinutes: settings.idleTimeAlert,
        vehicleLabel: label,
        cooldownRef: cooldownRef.current,
      });
      if (idleMsg) {
        idleAlertSentRef.current = true;
        await notifyFleetAdmin(accountId, idleMsg, "warning", {
          alertType: "idle",
          vehicleId: vehicle.id,
        }).catch(() => {});
      }
    }

    if (settings.enableGeofencing && geofencesRef.current.length) {
      for (const fence of geofencesRef.current) {
        if (fence.active === false) continue;
        if (!geofenceAppliesToVehicle(fence, vehicle.id)) continue;

        const inside = isInsideGeofence(lat, lng, fence);
        const prev = geofenceStateRef.current.get(fence.id);

        if (prev === undefined) {
          geofenceStateRef.current.set(fence.id, inside);
          continue;
        }

        if (prev === inside) continue;
        geofenceStateRef.current.set(fence.id, inside);

        const event = inside ? "enter" : "leave";
        if (inside && fence.alertOnEnter === false) continue;
        if (!inside && fence.alertOnLeave === false) continue;

        const key = `geofence:${vehicle.id}:${fence.id}:${event}`;
        if (!shouldFireAlert(cooldownRef.current, key, ALERT_COOLDOWN_MS.geofence)) continue;

        const action = inside ? "entered" : "left";
        const msg = `${label} ${action} geofence "${fence.name || "Zone"}"`;
        await notifyFleetAdmin(accountId, msg, inside ? "info" : "warning", {
          alertType: "geofence",
          geofenceId: fence.id,
          vehicleId: vehicle.id,
          event,
        }).catch(() => {});
      }
    }
  };

  return { processPosition };
}
