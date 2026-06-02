/**
 * Derive a live "moving / parked / offline" state for a vehicle from its GPS
 * tracking feed. Tracking docs are updated in place, so movement is detected by
 * comparing the latest position against the last anchored position over time.
 */

// A vehicle is considered offline if its last GPS update is older than this.
export const OFFLINE_MS = 2 * 60 * 1000; // 2 minutes
// Minimum distance (metres) from the anchor before we count it as movement.
export const MOVE_THRESHOLD_M = 30;
// How long after the last real movement we keep showing "moving".
export const MOVING_WINDOW_MS = 90 * 1000; // 90 seconds

export function haversineMeters(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((n) => typeof n !== "number" || Number.isNaN(n))) {
    return 0;
  }
  const R = 6371000; // Earth radius in metres
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Compute the motion state for one vehicle and update the shared anchor map.
 *
 * @param {Map} anchors - persistent map of vehicleId -> { lat, lng, lastMovedAt }
 * @param {string} vehicleId
 * @param {{ lat:number, lng:number, timestamp:string|number }} current
 * @param {number} [now=Date.now()]
 * @returns {"moving"|"parked"|"offline"}
 */
export function computeMotionState(anchors, vehicleId, current, now = Date.now()) {
  const ts = current?.timestamp ? new Date(current.timestamp).getTime() : NaN;
  const lat = Number(current?.lat);
  const lng = Number(current?.lng);

  if (!Number.isFinite(ts) || now - ts > OFFLINE_MS) {
    return "offline";
  }

  const prev = anchors.get(vehicleId);
  let lastMovedAt = prev?.lastMovedAt ?? null;
  let anchorLat = prev?.lat ?? lat;
  let anchorLng = prev?.lng ?? lng;

  if (prev) {
    const dist = haversineMeters(prev.lat, prev.lng, lat, lng);
    if (dist > MOVE_THRESHOLD_M) {
      lastMovedAt = now;
      anchorLat = lat;
      anchorLng = lng;
    }
  }

  anchors.set(vehicleId, { lat: anchorLat, lng: anchorLng, lastMovedAt });

  if (lastMovedAt && now - lastMovedAt < MOVING_WINDOW_MS) {
    return "moving";
  }
  return "parked";
}

/** Display metadata (label + Tailwind classes) for a motion state. */
export function getMotionMeta(state) {
  switch (state) {
    case "moving":
      return {
        label: "Moving",
        badgeClass: "bg-green-500/20 text-green-400",
        dotClass: "bg-green-500",
      };
    case "offline":
      return {
        label: "Offline",
        badgeClass: "bg-gray-500/20 text-gray-400",
        dotClass: "bg-gray-500",
      };
    case "parked":
    default:
      return {
        label: "Parked",
        badgeClass: "bg-amber-500/20 text-amber-400",
        dotClass: "bg-amber-500",
      };
  }
}
