import { collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import app, { db } from "../firebase";
import { stopTrackingForVehicle } from "./vehicleTracking";

/** Create or update the fleet driver roster entry for a signed-in driver account. */
export async function ensureDriverRosterEntry({ uid, email, displayName, fleetId }) {
  if (!uid || !fleetId) return null;

  const rosterQuery = query(
    collection(db, "drivers"),
    where("accountId", "==", fleetId),
    where("authUid", "==", uid)
  );
  const existing = await getDocs(rosterQuery);

  const now = new Date().toISOString();
  const base = {
    name: displayName || email?.split("@")[0] || "Driver",
    email: email || "",
    authUid: uid,
    accountId: fleetId,
    status: "Active",
    updatedAt: now,
  };

  if (!existing.empty) {
    const ref = doc(db, "drivers", existing.docs[0].id);
    await updateDoc(ref, base);
    return existing.docs[0].id;
  }

  const created = await addDoc(collection(db, "drivers"), {
    ...base,
    licenseNumber: "",
    phone: "",
    address: "",
    hireDate: now.split("T")[0],
    assignedVehicleId: null,
    source: "account_signup",
    createdAt: now,
  });
  return created.id;
}

/** Link vehicle ↔ driver in both collections. */
export async function assignDriverToVehicle({ driver, vehicleId, fleetId, allDrivers = [] }) {
  if (!driver?.id || !vehicleId || !fleetId) return;

  const now = new Date().toISOString();
  const ops = [];

  for (const other of allDrivers) {
    if (other.id !== driver.id && other.assignedVehicleId === vehicleId) {
      ops.push(
        updateDoc(doc(db, "drivers", other.id), {
          assignedVehicleId: null,
          updatedAt: now,
        })
      );
    }
  }

  if (driver.assignedVehicleId && driver.assignedVehicleId !== vehicleId) {
    ops.push(
      updateDoc(doc(db, "vehicles", driver.assignedVehicleId), {
        assignedDriverUid: null,
        assignedDriverEmail: null,
        updatedAt: now,
      })
    );
  }

  ops.push(
    updateDoc(doc(db, "drivers", driver.id), {
      assignedVehicleId: vehicleId,
      authUid: driver.authUid || null,
      email: driver.email || null,
      updatedAt: now,
    })
  );

  ops.push(
    updateDoc(doc(db, "vehicles", vehicleId), {
      assignedDriverUid: driver.authUid || null,
      assignedDriverEmail: driver.email || null,
      updatedAt: now,
    })
  );

  await Promise.all(ops);

  const stopOps = [stopTrackingForVehicle(fleetId, vehicleId)];
  if (driver.assignedVehicleId && driver.assignedVehicleId !== vehicleId) {
    stopOps.push(stopTrackingForVehicle(fleetId, driver.assignedVehicleId));
  }
  await Promise.all(stopOps);
}

export async function clearVehicleDriverAssignment(vehicleId) {
  if (!vehicleId) return;
  await updateDoc(doc(db, "vehicles", vehicleId), {
    assignedDriverUid: null,
    assignedDriverEmail: null,
    updatedAt: new Date().toISOString(),
  });
}

function parseCallableError(err) {
  const code = err?.code || "";
  const message = err?.message || "Failed to delete driver account.";
  if (code === "functions/not-found") {
    return "Driver deletion service is not deployed yet. Ask your developer to run: firebase deploy --only functions";
  }
  if (code === "functions/unavailable") {
    return "Driver deletion service is temporarily unavailable. Please try again.";
  }
  return message;
}

/** Remove roster entry only (driver has no linked login). */
async function removeDriverRosterOnly({ driver, fleetId }) {
  const now = new Date().toISOString();

  if (driver.assignedVehicleId) {
    await updateDoc(doc(db, "vehicles", driver.assignedVehicleId), {
      assignedDriverUid: null,
      assignedDriverEmail: null,
      updatedAt: now,
    });
    await stopTrackingForVehicle(fleetId, driver.assignedVehicleId);
  }

  await deleteDoc(doc(db, "drivers", driver.id));
}

/**
 * Permanently delete a driver: roster, profile, settings, and Firebase Auth login.
 * Requires the permanentlyDeleteDriver Cloud Function to be deployed.
 */
export async function removeDriverAccount({ driver, fleetId }) {
  if (!driver?.id || !fleetId) return;

  if (driver.authUid) {
    try {
      const functions = getFunctions(app);
      const permanentlyDeleteDriver = httpsCallable(functions, "permanentlyDeleteDriver");
      await permanentlyDeleteDriver({ driverUid: driver.authUid });
      return;
    } catch (err) {
      throw new Error(parseCallableError(err));
    }
  }

  await removeDriverRosterOnly({ driver, fleetId });
}
