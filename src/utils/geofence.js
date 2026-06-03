import { haversineMeters } from "./vehicleMotion";

export function isInsideGeofence(lat, lng, geofence) {
  if (!geofence || lat == null || lng == null) return false;
  const centerLat = Number(geofence.lat);
  const centerLng = Number(geofence.lng);
  const radiusM = Number(geofence.radiusM) || 200;
  if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng)) return false;
  return haversineMeters(centerLat, centerLng, Number(lat), Number(lng)) <= radiusM;
}

export function geofenceAppliesToVehicle(geofence, vehicleId) {
  if (!geofence?.vehicleIds?.length) return true;
  return geofence.vehicleIds.includes(vehicleId);
}
