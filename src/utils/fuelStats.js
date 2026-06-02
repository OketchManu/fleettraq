/**
 * Fuel record helpers — MPG, totals, and validation.
 */

export function sortFuelRecords(records) {
  return [...records].sort((a, b) => {
    const da = new Date(a.date || 0).getTime();
    const db = new Date(b.date || 0).getTime();
    if (db !== da) return db - da;
    return (Number(b.odometer) || 0) - (Number(a.odometer) || 0);
  });
}

/** Compute fleet-wide and per-vehicle fuel statistics. */
export function computeFuelStats(records) {
  const sorted = sortFuelRecords(records);
  const totalGallons = sorted.reduce((s, r) => s + (parseFloat(r.gallons) || 0), 0);
  const totalCost = sorted.reduce((s, r) => s + (parseFloat(r.cost) || 0), 0);
  const avgCostPerGallon = totalGallons > 0 ? totalCost / totalGallons : 0;

  // MPG: group by vehicle, sort ascending by odometer, compare consecutive fill-ups.
  const byVehicle = {};
  sorted.forEach((r) => {
    if (!r.vehicleId) return;
    if (!byVehicle[r.vehicleId]) byVehicle[r.vehicleId] = [];
    byVehicle[r.vehicleId].push(r);
  });

  let mpgSum = 0;
  let mpgCount = 0;
  Object.values(byVehicle).forEach((list) => {
    const asc = [...list].sort(
      (a, b) => (Number(a.odometer) || 0) - (Number(b.odometer) || 0)
    );
    for (let i = 1; i < asc.length; i += 1) {
      const prev = asc[i - 1];
      const curr = asc[i];
      const miles = (Number(curr.odometer) || 0) - (Number(prev.odometer) || 0);
      const gallons = parseFloat(curr.gallons) || 0;
      if (miles > 0 && gallons > 0) {
        const mpg = miles / gallons;
        if (mpg > 0 && mpg < 200) {
          mpgSum += mpg;
          mpgCount += 1;
        }
      }
    }
  });

  return {
    totalGallons: Math.round(totalGallons * 10) / 10,
    totalCost: Math.round(totalCost * 100) / 100,
    avgMPG: mpgCount > 0 ? Math.round((mpgSum / mpgCount) * 10) / 10 : 0,
    avgCostPerGallon: Math.round(avgCostPerGallon * 100) / 100,
    fillCount: sorted.length,
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
