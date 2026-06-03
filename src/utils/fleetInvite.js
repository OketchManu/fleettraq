import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  canAttemptInviteLookup,
  recordInviteLookupFailure,
  clearInviteLookupAttempts,
} from "./inviteRateLimit";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DEFAULT_MAX_USES = 100;
const DEFAULT_VALID_DAYS = 90;

export function generateInviteCode(length = 10) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join("");
}

function inviteMeta() {
  return {
    maxUses: DEFAULT_MAX_USES,
    useCount: 0,
    expiresAt: Timestamp.fromMillis(Date.now() + DEFAULT_VALID_DAYS * 24 * 60 * 60 * 1000),
  };
}

function inviteStillValid(data) {
  if (!data || data.active !== true) return false;
  if (typeof data.maxUses === "number" && typeof data.useCount === "number" && data.useCount >= data.maxUses) {
    return false;
  }
  if (data.expiresAt?.toMillis && data.expiresAt.toMillis() < Date.now()) {
    return false;
  }
  return true;
}

/** Look up an active invite code → organizationId (admin uid). */
export async function resolveInviteCode(rawCode) {
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code || code.length < 8) return null;

  if (!canAttemptInviteLookup()) {
    throw new Error("Too many invite attempts. Wait 15 minutes and try again.");
  }

  const snap = await getDoc(doc(db, "invites", code));
  if (!snap.exists() || !inviteStillValid(snap.data())) {
    recordInviteLookupFailure();
    return null;
  }

  const organizationId = snap.data().organizationId;
  if (!organizationId) {
    recordInviteLookupFailure();
    return null;
  }

  const adminSnap = await getDoc(doc(db, "users", organizationId));
  if (!adminSnap.exists() || adminSnap.data()?.role !== "admin") {
    recordInviteLookupFailure();
    return null;
  }

  clearInviteLookupAttempts();
  return { code, organizationId };
}

export async function incrementInviteUse(code) {
  if (!code) return;
  const ref = doc(db, "invites", code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const useCount = (snap.data()?.useCount || 0) + 1;
  await updateDoc(ref, { useCount });
}

/** Return the active invite code for a fleet admin (creates one if missing). */
export async function ensureFleetInvite(organizationId) {
  if (!organizationId) return null;

  const existing = await getDocs(
    query(
      collection(db, "invites"),
      where("organizationId", "==", organizationId),
      where("active", "==", true)
    )
  );

  const activeDoc = existing.docs.find((d) => inviteStillValid(d.data()));
  if (activeDoc) {
    return { code: activeDoc.id, organizationId, id: activeDoc.id };
  }

  const code = generateInviteCode();
  await setDoc(doc(db, "invites", code), {
    organizationId,
    active: true,
    createdAt: new Date().toISOString(),
    ...inviteMeta(),
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
    ...inviteMeta(),
  });

  return { code, organizationId, id: code };
}
