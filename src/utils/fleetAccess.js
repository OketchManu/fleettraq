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
 * All roster rows that belong to this signed-in driver (authUid preferred, then email).
 */
export function findDriverRecordsForUser(drivers, user) {
  if (!user || !drivers?.length) return [];
  const uid = user.uid;
  const em = (user.email || "").toLowerCase();
  const byUid = drivers.filter((d) => d.authUid && d.authUid === uid);
  if (byUid.length) return byUid;
  if (!em) return [];
  return drivers.filter((d) => d.email && String(d.email).toLowerCase() === em);
}

/**
 * Drivers only see a vehicle when roster and vehicle assignment both agree.
 */
export function filterVehiclesForDriver(vehicles, user, drivers = []) {
  if (!user || user.role !== "driver") return vehicles;
  const uid = user.uid;
  const em = (user.email || "").toLowerCase();

  const matches = findDriverRecordsForUser(drivers, user);
  if (!matches.length) return [];

  const assignedIds = [
    ...new Set(matches.map((m) => (m.assignedVehicleId || "").trim()).filter(Boolean)),
  ];
  if (assignedIds.length !== 1) return [];

  const assignedId = assignedIds[0];

  return vehicles.filter((v) => {
    if (v.id !== assignedId) return false;
    return (
      v.assignedDriverUid === uid ||
      (v.assignedDriverEmail && String(v.assignedDriverEmail).toLowerCase() === em)
    );
  });
}

export const isAdminRole = (role) => normalizeRole(role) === "admin";
