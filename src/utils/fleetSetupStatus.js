import { canDeviceTrackVehicle } from "./deviceId";
import { canManageFleet, isDriver, normalizeRole } from "./fleetAccess";

function driverLinkedToAccount(driver, account) {
  if (!driver || !account) return false;
  if (driver.authUid && driver.authUid === account.uid) return true;
  const de = (driver.email || "").toLowerCase();
  const ae = (account.email || "").toLowerCase();
  return de && ae && de === ae;
}

/** Admin office setup: vehicles + synced & assigned drivers (if any signed up). */
export function isAdminFleetSetupComplete({ vehiclesAll, drivers, fleetDriverAccounts }) {
  if (!vehiclesAll?.length) return false;

  if (!fleetDriverAccounts?.length) {
    return true;
  }

  const allSynced = fleetDriverAccounts.every((account) =>
    drivers.some((d) => driverLinkedToAccount(d, account))
  );
  if (!allSynced) return false;

  const linkedDrivers = drivers.filter((d) =>
    fleetDriverAccounts.some((a) => driverLinkedToAccount(d, a))
  );
  if (!linkedDrivers.length) return false;

  return linkedDrivers.every((d) => Boolean(d.assignedVehicleId));
}

/** Driver setup: assigned vehicle + live GPS from this device. */
export function isDriverFleetSetupComplete({ vehicles, deviceId, activeTracking }) {
  if (!vehicles?.length || !deviceId) return false;

  return vehicles.some((vehicle) => {
    if (!canDeviceTrackVehicle(vehicle, deviceId)) return false;
    return activeTracking.some(
      (t) =>
        t.vehicleId === vehicle.id &&
        t.deviceId === deviceId &&
        t.isTracking === true
    );
  });
}

export function shouldShowFleetSetupGuide({ user, fleetSetupComplete }) {
  if (!user) return false;
  if (fleetSetupComplete) return false;
  const role = normalizeRole(user.role);
  return canManageFleet(role) || isDriver(role);
}
