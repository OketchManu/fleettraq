import { haversineMeters } from "./vehicleMotion";

export const STOP_RADIUS_M = 50;
export const MIN_STOP_MS = 3 * 60 * 1000;

export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "0s";
  if (ms < 60 * 1000) return `${Math.round(ms / 1000)}s`;
  if (ms < 60 * 60 * 1000) {
    const m = Math.floor(ms / 60000);
    const s = Math.round((ms % 60000) / 1000);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function totalRouteDistanceMeters(points) {
  if (!points?.length || points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    total += haversineMeters(prev.lat, prev.lng, curr.lat, curr.lng);
  }
  return total;
}

export function formatDistance(meters) {
  if (!Number.isFinite(meters) || meters < 1) return "0 m";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Group route points into stop events where the vehicle stayed within STOP_RADIUS_M
 * for at least MIN_STOP_MS.
 */
export function detectStops(points, options = {}) {
  const radiusM = options.radiusM ?? STOP_RADIUS_M;
  const minStopMs = options.minStopMs ?? MIN_STOP_MS;

  if (!points?.length) return [];

  const sorted = [...points].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const stops = [];
  let cluster = [sorted[0]];

  const flushCluster = () => {
    if (cluster.length < 2) {
      cluster = [];
      return;
    }
    const startMs = new Date(cluster[0].timestamp).getTime();
    const endMs = new Date(cluster[cluster.length - 1].timestamp).getTime();
    const durationMs = endMs - startMs;
    if (durationMs < minStopMs) {
      cluster = [];
      return;
    }

    const lat =
      cluster.reduce((sum, p) => sum + Number(p.lat), 0) / cluster.length;
    const lng =
      cluster.reduce((sum, p) => sum + Number(p.lng), 0) / cluster.length;

    stops.push({
      lat,
      lng,
      startTime: cluster[0].timestamp,
      endTime: cluster[cluster.length - 1].timestamp,
      durationMs,
      pointCount: cluster.length,
    });
    cluster = [];
  };

  for (let i = 1; i < sorted.length; i += 1) {
    const point = sorted[i];
    const anchor = cluster[0];
    const dist = haversineMeters(anchor.lat, anchor.lng, point.lat, point.lng);
    if (dist <= radiusM) {
      cluster.push(point);
    } else {
      flushCluster();
      cluster = [point];
    }
  }
  flushCluster();

  return stops;
}

export function groupPointsByVehicle(points) {
  const map = new Map();
  for (const point of points || []) {
    if (!point?.vehicleId) continue;
    const list = map.get(point.vehicleId) || [];
    list.push(point);
    map.set(point.vehicleId, list);
  }
  for (const [vehicleId, list] of map.entries()) {
    list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    map.set(vehicleId, list);
  }
  return map;
}

export function getTimeRangeStart(rangeKey) {
  const now = Date.now();
  switch (rangeKey) {
    case "24h":
      return new Date(now - 24 * 60 * 60 * 1000).toISOString();
    case "7d":
      return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "today":
    default: {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
  }
}
