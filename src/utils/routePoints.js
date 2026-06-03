import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function appendRoutePoint({
  accountId,
  vehicleId,
  deviceId,
  lat,
  lng,
  method = "gps",
  speedKmh = null,
}) {
  if (!accountId || !vehicleId || !deviceId) return;
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return;

  const payload = {
    accountId,
    vehicleId,
    deviceId,
    lat: Number(lat),
    lng: Number(lng),
    timestamp: new Date().toISOString(),
    method,
  };
  if (speedKmh != null && Number.isFinite(Number(speedKmh))) {
    payload.speedKmh = Number(speedKmh);
  }

  await addDoc(collection(db, "routePoints"), payload);
}
