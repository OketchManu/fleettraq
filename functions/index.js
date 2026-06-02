const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

function isFleetAdmin(profile) {
  if (!profile) return false;
  const role = profile.role === "manager" ? "admin" : profile.role;
  return role === "admin";
}

function memberStatusOk(profile) {
  const status = profile?.membershipStatus;
  return status !== "pending" && status !== "suspended";
}

async function deleteQueryBatch(query, batchSize = 100) {
  const snap = await query.limit(batchSize).get();
  if (snap.empty) return 0;
  const batch = getFirestore().batch();
  snap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
  await batch.commit();
  return snap.size;
}

async function deleteCollectionWhere(collectionName, field, value) {
  let deleted = 0;
  let count = batchSize => deleteQueryBatch(
    getFirestore().collection(collectionName).where(field, "==", value),
    batchSize
  );
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const n = await count(100);
    if (!n) break;
    deleted += n;
  }
  return deleted;
}

/**
 * Admin-only: permanently delete a driver from the fleet and Firebase Auth.
 * Callable data: { driverUid: string }
 */
exports.permanentlyDeleteDriver = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const adminUid = request.auth.uid;
  const driverUid = request.data?.driverUid;

  if (!driverUid || typeof driverUid !== "string") {
    throw new HttpsError("invalid-argument", "driverUid is required.");
  }

  if (driverUid === adminUid) {
    throw new HttpsError("invalid-argument", "You cannot delete your own account with this action.");
  }

  const db = getFirestore();
  const now = new Date().toISOString();

  const adminSnap = await db.collection("users").doc(adminUid).get();
  if (!adminSnap.exists) {
    throw new HttpsError("permission-denied", "Administrator profile not found.");
  }

  const adminProfile = adminSnap.data();
  if (!isFleetAdmin(adminProfile) || !memberStatusOk(adminProfile)) {
    throw new HttpsError("permission-denied", "Only active fleet administrators can delete drivers.");
  }

  const orgId = adminProfile.organizationId;
  if (!orgId) {
    throw new HttpsError("failed-precondition", "Your fleet organization is not configured.");
  }

  const driverSnap = await db.collection("users").doc(driverUid).get();
  if (!driverSnap.exists) {
    throw new HttpsError("not-found", "Driver account not found.");
  }

  const driverProfile = driverSnap.data();
  if (driverProfile.role !== "driver") {
    throw new HttpsError("permission-denied", "This account is not a driver.");
  }

  if (driverProfile.organizationId !== orgId) {
    throw new HttpsError("permission-denied", "This driver is not in your fleet.");
  }

  const rosterSnap = await db
    .collection("drivers")
    .where("accountId", "==", orgId)
    .where("authUid", "==", driverUid)
    .get();

  const assignedVehicleIds = new Set();
  for (const rosterDoc of rosterSnap.docs) {
    const assignedVehicleId = rosterDoc.data()?.assignedVehicleId;
    if (assignedVehicleId) {
      assignedVehicleIds.add(assignedVehicleId);
      await db.collection("vehicles").doc(assignedVehicleId).set(
        {
          assignedDriverUid: null,
          assignedDriverEmail: null,
          registeredDeviceId: null,
          registeredDeviceAt: null,
          registeredByUid: null,
          updatedAt: now,
        },
        { merge: true }
      );
    }
    await rosterDoc.ref.delete();
  }

  if (assignedVehicleIds.size > 0) {
    const trackingSnap = await db.collection("tracking").where("accountId", "==", orgId).get();
    for (const t of trackingSnap.docs) {
      if (assignedVehicleIds.has(t.data()?.vehicleId)) {
        await t.ref.delete();
      }
    }
  }

  await deleteCollectionWhere("fuelRecords", "recordedByUid", driverUid);
  await deleteCollectionWhere("notifications", "userId", driverUid);

  const settingsRef = db.collection("userSettings").doc(`${driverUid}_user`);
  const settingsSnap = await settingsRef.get();
  if (settingsSnap.exists) {
    await settingsRef.delete();
  }

  await db.collection("users").doc(driverUid).delete();

  try {
    await getAuth().deleteUser(driverUid);
  } catch (err) {
    if (err.code !== "auth/user-not-found") {
      throw new HttpsError(
        "internal",
        "Driver data was removed but login deletion failed. Try again or remove the user in Firebase Console."
      );
    }
  }

  return { success: true, driverUid };
});
