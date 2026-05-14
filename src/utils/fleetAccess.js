/** Roles that can manage fleet data (vehicles, drivers, org settings). */
export const canManageFleet = (role) => role === "admin" || role === "manager";

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

  let list = vehicles.filter(
    (v) =>
      v.assignedDriverUid === uid ||
      (v.assignedDriverEmail && String(v.assignedDriverEmail).toLowerCase() === em)
  );

  if (list.length === 0 && drivers.length) {
    const dr = drivers.find(
      (d) =>
        (d.authUid && d.authUid === uid) ||
        (d.email && String(d.email).toLowerCase() === em)
    );
    if (dr?.assignedVehicleId) {
      list = vehicles.filter((v) => v.id === dr.assignedVehicleId);
    }
  }

  return list;
}
