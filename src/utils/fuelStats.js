/**
 * Fuel record helpers — efficiency, totals, and validation.
 * Volume is stored in the fleet unit (liters or gallons); odometer in km or miles.
 */

import { resolveFleetLocale } from "./fleetLocale";

export function sortFuelRecords(records) {
  return [...records].sort((a, b) => {
    const da = new Date(a.date || 0).getTime();
    const db = new Date(b.date || 0).getTime();
    if (db !== da) return db - da;
    return (Number(b.odometer) || 0) - (Number(a.odometer) || 0);
  });
}

/** Compute fleet-wide and per-vehicle fuel statistics. */
export function computeFuelStats(records, fleetSettings = {}) {
  const locale = resolveFleetLocale(fleetSettings);
  const sorted = sortFuelRecords(records);
  const totalVolume = sorted.reduce((s, r) => s + (parseFloat(r.gallons) || 0), 0);
  const totalCost = sorted.reduce((s, r) => s + (parseFloat(r.cost) || 0), 0);
  const avgCostPerVolume = totalVolume > 0 ? totalCost / totalVolume : 0;

  const byVehicle = {};
  sorted.forEach((r) => {
    if (!r.vehicleId) return;
    if (!byVehicle[r.vehicleId]) byVehicle[r.vehicleId] = [];
    byVehicle[r.vehicleId].push(r);
  });

  let efficiencySum = 0;
  let efficiencyCount = 0;
  Object.values(byVehicle).forEach((list) => {
    const asc = [...list].sort(
      (a, b) => (Number(a.odometer) || 0) - (Number(b.odometer) || 0)
    );
    for (let i = 1; i < asc.length; i += 1) {
      const prev = asc[i - 1];
      const curr = asc[i];
      const distance = (Number(curr.odometer) || 0) - (Number(prev.odometer) || 0);
      const volume = parseFloat(curr.gallons) || 0;
      if (distance > 0 && volume > 0) {
        const efficiency = locale.isMetric
          ? (volume / distance) * 100
          : distance / volume;
        const maxEff = locale.isMetric ? 50 : 200;
        if (efficiency > 0 && efficiency < maxEff) {
          efficiencySum += efficiency;
          efficiencyCount += 1;
        }
      }
    }
  });

  return {
    totalVolume: Math.round(totalVolume * 10) / 10,
    totalCost: Math.round(totalCost * 100) / 100,
    avgEfficiency: efficiencyCount > 0 ? Math.round((efficiencySum / efficiencyCount) * 10) / 10 : 0,
    avgCostPerVolume: Math.round(avgCostPerVolume * 100) / 100,
    fillCount: sorted.length,
    locale,
  };
}

/** Last odometer reading for a vehicle (for validation hints). */
export function lastOdometerForVehicle(records, vehicleId) {
  const vehicleRecords = records.filter((r) => r.vehicleId === vehicleId);
  if (!vehicleRecords.length) return null;
  return Math.max(...vehicleRecords.map((r) => Number(r.odometer) || 0));
}

export function friendlyFuelError(err) {
  const msg = err?.message || String(err);
  if (/insufficient permissions/i.test(msg)) {
    return "Could not access fuel records. Your fleet administrator may need to publish the latest Firestore security rules in the Firebase console, or approve your driver account if you just signed up.";
  }
  if (/network/i.test(msg)) {
    return "Network error while saving fuel data. Check your connection and try again.";
  }
  return msg || "Something went wrong. Please try again.";
}
