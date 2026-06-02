import { useEffect, useRef, useCallback } from "react";
import { collection, doc, addDoc, updateDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { getDeviceId } from "../utils/deviceId";
import { fleetIdFromUser } from "../utils/fleetAccess";
import { haversineMeters } from "../utils/vehicleMotion";

const WRITE_INTERVAL_MS = 45 * 1000;
const MIN_MOVE_M = 15;

function getAssignedVehicles(vehicles, user, drivers = []) {
  if (!user?.uid || !vehicles?.length) return [];
  const email = (user.email || "").toLowerCase();
  let list = vehicles.filter(
    (v) =>
      v.assignedDriverUid === user.uid ||
      (v.assignedDriverEmail && email && String(v.assignedDriverEmail).toLowerCase() === email)
  );

  if (list.length === 0 && drivers.length) {
    const dr = drivers.find(
      (d) =>
        (d.authUid && d.authUid === user.uid) ||
        (d.email && String(d.email).toLowerCase() === email)
    );
    if (dr?.assignedVehicleId) {
      list = vehicles.filter((v) => v.id === dr.assignedVehicleId);
    }
  }

  return list;
}

/**
 * Keeps the assigned driver's phone broadcasting GPS to Firestore so admins
 * see live Moving / Parked / Offline status without opening the Tracking page.
 */
export function useDriverGpsTracker({ user, vehicles, drivers, enabled }) {
  const deviceId = useRef(getDeviceId()).current;
  const trackingDocIdRef = useRef(null);
  const vehicleIdRef = useRef(null);
  const claimedRef = useRef(new Set());
  const lastWriteRef = useRef({ at: 0, lat: null, lng: null });

  useEffect(() => {
    if (!enabled || !user?.uid) return undefined;

    const assigned = getAssignedVehicles(vehicles, user, drivers);
    assigned.forEach(async (vehicle) => {
      if (vehicle.registeredDeviceId === deviceId) return;
      if (claimedRef.current.has(vehicle.id)) return;
      claimedRef.current.add(vehicle.id);
      try {
        await updateDoc(doc(db, "vehicles", vehicle.id), {
          registeredDeviceId: deviceId,
          registeredDeviceAt: new Date().toISOString(),
          registeredByUid: user.uid,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Could not register driver device for vehicle:", err);
        claimedRef.current.delete(vehicle.id);
      }
    });

    return undefined;
  }, [enabled, user?.uid, user?.email, vehicles, drivers, deviceId]);

  const savePosition = useCallback(
    async (vehicleId, lat, lng, accountId) => {
      const now = Date.now();
      const last = lastWriteRef.current;
      const moved =
        last.lat == null ? true : haversineMeters(last.lat, last.lng, lat, lng) >= MIN_MOVE_M;
      if (!moved && now - last.at < WRITE_INTERVAL_MS) return;

      const payload = {
        lat,
        lng,
        locationName: "Driver GPS",
        timestamp: new Date().toISOString(),
        method: "gps",
        isTracking: true,
      };

      if (!trackingDocIdRef.current || vehicleIdRef.current !== vehicleId) {
        const q = query(
          collection(db, "tracking"),
          where("vehicleId", "==", vehicleId),
          where("accountId", "==", accountId),
          where("deviceId", "==", deviceId)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const existing = [...snap.docs].sort(
            (a, b) =>
              new Date(b.data().timestamp || 0).getTime() -
              new Date(a.data().timestamp || 0).getTime()
          )[0];
          trackingDocIdRef.current = existing.id;
          vehicleIdRef.current = vehicleId;
          await updateDoc(doc(db, "tracking", existing.id), {
            ...payload,
            deviceId,
            vehicleId,
            accountId,
          });
        } else {
          const docRef = await addDoc(collection(db, "tracking"), {
            ...payload,
            vehicleId,
            deviceId,
            accountId,
          });
          trackingDocIdRef.current = docRef.id;
          vehicleIdRef.current = vehicleId;
        }
      } else {
        await updateDoc(doc(db, "tracking", trackingDocIdRef.current), payload);
      }

      lastWriteRef.current = { at: now, lat, lng };
    },
    [deviceId]
  );

  useEffect(() => {
    if (!enabled || !user?.uid || typeof navigator === "undefined" || !navigator.geolocation) {
      return undefined;
    }

    const accountId = fleetIdFromUser(user);
    if (!accountId) return undefined;

    const assigned = getAssignedVehicles(vehicles, user, drivers);
    if (!assigned.length) return undefined;

    const vehicle = assigned[0];
    let watchId = null;
    let cancelled = false;

    const pushLocation = (lat, lng) => {
      if (cancelled) return;
      savePosition(vehicle.id, lat, lng, accountId).catch((err) => {
        console.error("Driver GPS save failed:", err);
      });
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => pushLocation(pos.coords.latitude, pos.coords.longitude),
      (err) => console.warn("Initial driver GPS fix failed:", err.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );

    watchId = navigator.geolocation.watchPosition(
      (pos) => pushLocation(pos.coords.latitude, pos.coords.longitude),
      (err) => console.warn("Driver GPS watch error:", err.message),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 }
    );

    return () => {
      cancelled = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      const docId = trackingDocIdRef.current;
      trackingDocIdRef.current = null;
      vehicleIdRef.current = null;
      lastWriteRef.current = { at: 0, lat: null, lng: null };
      if (docId) {
        updateDoc(doc(db, "tracking", docId), { isTracking: false }).catch(() => {});
      }
    };
  }, [enabled, user, vehicles, drivers, deviceId, savePosition]);

  return { deviceId };
}
