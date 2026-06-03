import { haversineMeters } from "./vehicleMotion";

export const ALERT_COOLDOWN_MS = {
  speed: 5 * 60 * 1000,
  idle: 15 * 60 * 1000,
  geofence: 2 * 60 * 1000,
};

export function msToKmh(speedMs) {
  if (typeof speedMs !== "number" || Number.isNaN(speedMs) || speedMs < 0) return null;
  return speedMs * 3.6;
}

export function speedFromPoints(prev, current) {
  if (!prev || !current) return null;
  const dtMs =
    new Date(current.timestamp || current.at).getTime() -
    new Date(prev.timestamp || prev.at).getTime();
  if (!Number.isFinite(dtMs) || dtMs < 1000) return null;
  const distM = haversineMeters(prev.lat, prev.lng, current.lat, current.lng);
  return (distM / dtMs) * 3600;
}

export function shouldFireAlert(cooldownRef, key, cooldownMs) {
  const now = Date.now();
  const last = cooldownRef.get(key) || 0;
  if (now - last < cooldownMs) return false;
  cooldownRef.set(key, now);
  return true;
}

export function evaluateSpeedAlert({
  speedKmh,
  speedLimitKmh,
  vehicleLabel,
  cooldownRef,
}) {
  if (!speedLimitKmh || speedLimitKmh <= 0 || speedKmh == null) return null;
  if (speedKmh <= speedLimitKmh) return null;
  const key = `speed:${vehicleLabel}`;
  if (!shouldFireAlert(cooldownRef, key, ALERT_COOLDOWN_MS.speed)) return null;
  return `${vehicleLabel} exceeded speed limit: ${Math.round(speedKmh)} km/h (limit ${speedLimitKmh} km/h)`;
}

export function evaluateIdleAlert({
  idleMs,
  idleLimitMinutes,
  vehicleLabel,
  cooldownRef,
}) {
  if (!idleLimitMinutes || idleLimitMinutes <= 0 || idleMs == null) return null;
  const limitMs = idleLimitMinutes * 60 * 1000;
  if (idleMs < limitMs) return null;
  const key = `idle:${vehicleLabel}`;
  if (!shouldFireAlert(cooldownRef, key, ALERT_COOLDOWN_MS.idle)) return null;
  const minutes = Math.floor(idleMs / 60000);
  return `${vehicleLabel} idle for ${minutes}+ minutes`;
}
