import { deleteField, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

/** Fields to clear on a vehicle when its driver is unassigned. */
export function vehicleDriverClearedFields(now = new Date().toISOString()) {
  return {
    assignedDriverUid: deleteField(),
    assignedDriverEmail: deleteField(),
    registeredDeviceId: deleteField(),
    registeredDeviceAt: deleteField(),
    registeredByUid: deleteField(),
    awaitingDeviceRegistration: false,
    updatedAt: now,
  };
}

/** Clear assignment on a driver roster document. */
export function driverVehicleClearedFields(now = new Date().toISOString()) {
  return {
    assignedVehicleId: deleteField(),
    updatedAt: now,
  };
}

/** Admin-only: mark active tracking sessions for a vehicle as stopped. */
export async function stopTrackingForVehicle(accountId, vehicleId) {
  if (!accountId || !vehicleId) return;

  const q = query(
    collection(db, "tracking"),
    where("accountId", "==", accountId),
    where("vehicleId", "==", vehicleId),
    where("isTracking", "==", true)
  );
  const snap = await getDocs(q);
  const now = new Date().toISOString();
  await Promise.all(
    snap.docs.map((docSnap) =>
      updateDoc(docSnap.ref, { isTracking: false, updatedAt: now })
    )
  );
}
