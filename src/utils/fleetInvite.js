import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

// Avoid ambiguous characters (0/O, 1/I/L).
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 8) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join("");
}

/** Look up an active invite code → organizationId (admin uid). */
export async function resolveInviteCode(rawCode) {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code || code.length < 6) return null;

  const snap = await getDoc(doc(db, "invites", code));
  if (!snap.exists() || snap.data()?.active !== true) return null;

  const organizationId = snap.data().organizationId;
  if (!organizationId) return null;

  // Confirm the target org still has an admin account.
  const adminSnap = await getDoc(doc(db, "users", organizationId));
  if (!adminSnap.exists() || adminSnap.data()?.role !== "admin") return null;

  return { code, organizationId };
}

/** Return the active invite code for a fleet admin (creates one if missing). */
export async function ensureFleetInvite(organizationId) {
  if (!organizationId) return null;

  const existing = await getDocs(
    query(collection(db, "invites"), where("organizationId", "==", organizationId))
  );

  const activeDoc = existing.docs.find((d) => d.data()?.active === true);
  if (activeDoc) {
    return { code: activeDoc.id, organizationId, id: activeDoc.id };
  }

  const code = generateInviteCode();
  await setDoc(doc(db, "invites", code), {
    organizationId,
    active: true,
    createdAt: new Date().toISOString(),
  });

  return { code, organizationId, id: code };
}

/** Deactivate the old code and issue a new one. */
export async function regenerateFleetInvite(organizationId) {
  if (!organizationId) return null;

  const existing = await getDocs(
    query(collection(db, "invites"), where("organizationId", "==", organizationId))
  );

  await Promise.all(
    existing.docs.map((d) =>
      deleteDoc(d.ref).catch(() =>
        setDoc(d.ref, { ...d.data(), active: false, revokedAt: new Date().toISOString() }, { merge: true })
      )
    )
  );

  const code = generateInviteCode();
  await setDoc(doc(db, "invites", code), {
    organizationId,
    active: true,
    createdAt: new Date().toISOString(),
  });

  return { code, organizationId, id: code };
}
