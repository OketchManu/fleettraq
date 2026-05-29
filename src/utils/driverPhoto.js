import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function validateDriverPhotoFile(file) {
  if (!file) return null;
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Please choose a JPG, PNG, WebP, or GIF image.";
  }
  if (file.size > MAX_BYTES) {
    return "Photo must be 2 MB or smaller.";
  }
  return null;
}

export async function uploadDriverPhoto({ file, fleetId, driverId }) {
  const err = validateDriverPhotoFile(file);
  if (err) throw new Error(err);
  if (!fleetId || !driverId) throw new Error("Missing fleet or driver id.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const path = `driver-photos/${fleetId}/${driverId}.${safeExt}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}
