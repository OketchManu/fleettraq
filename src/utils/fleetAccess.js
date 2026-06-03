/** Only fleet administrators can manage fleet data. Legacy manager accounts are treated as admin. */
export const normalizeRole = (role) => (role === "manager" ? "admin" : role);

export const canManageFleet = (role) => normalizeRole(role) === "admin";

export const isDriver = (role) => role === "driver";

/** Firestore accountId / organization for fleet-scoped collections. */
export const fleetIdFromUser = (user) => {
  if (!user) return null;
  return user.fleetId || user.organizationId || user.uid || null;
};

/**
 * Drivers only see vehicles explicitly assigned (or linked via drivers doc).
 * @param {object[]} vehicles - all vehicles for the fleet (accountId match)
 * @param {object} user - { uid, email, role }
 * @param {object[]} drivers - fleet driver roster
 */
export function filterVehiclesForDriver(vehicles, user, drivers = []) {
  if (!user || user.role !== "driver") return vehicles;
  const uid = user.uid;
  const em = (user.email || "").toLowerCase();

  const driverRecord = drivers.find(
    (d) =>
      (d.authUid && d.authUid === uid) ||
      (d.email && String(d.email).toLowerCase() === em)
  );

  return vehicles.filter((v) => {
    const linkedOnVehicle =
      v.assignedDriverUid === uid ||
      (v.assignedDriverEmail && String(v.assignedDriverEmail).toLowerCase() === em);

    if (driverRecord) {
      return Boolean(driverRecord.assignedVehicleId) && driverRecord.assignedVehicleId === v.id && linkedOnVehicle;
    }

    return linkedOnVehicle;
  });
}

export const isAdminRole = (role) => normalizeRole(role) === "admin";
