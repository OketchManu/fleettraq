import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function notifyFleetAdmin(accountId, message, type = "warning", extra = {}) {
  if (!accountId || !message) return;
  await addDoc(collection(db, "notifications"), {
    userId: accountId,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
    ...extra,
  });
}
