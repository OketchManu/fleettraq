/** User-facing message for Firestore failures (quota, blocked network, permissions). */
export function friendlyFirestoreError(err) {
  const msg = err?.message || String(err);
  const code = err?.code || "";

  if (code === "resource-exhausted" || /quota exceeded/i.test(msg)) {
    return (
      "Firebase daily limit reached (Spark plan). Writes like unassign may not have saved. " +
      "Wait until tomorrow, upgrade the Firebase plan, or ask your developer to reduce live listeners. " +
      "Then unassign the driver again."
    );
  }
  if (/ERR_BLOCKED_BY_CLIENT/i.test(msg) || /blocked/i.test(msg)) {
    return "A browser extension (ad blocker) is blocking Firebase. Disable it for this site and refresh.";
  }
  if (/insufficient permissions/i.test(msg)) {
    return "Permission denied. Your fleet administrator may need to publish the latest Firestore security rules.";
  }
  if (/network/i.test(msg)) {
    return "Network error. Check your connection and try again.";
  }
  return msg || "Something went wrong. Please try again.";
}

export function isQuotaError(err) {
  const code = err?.code || "";
  const msg = err?.message || "";
  return code === "resource-exhausted" || /quota exceeded/i.test(msg);
}
