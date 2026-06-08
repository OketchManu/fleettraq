/** Circuit breaker when Firestore Spark daily quota is hit — pauses GPS and heavy polling. */

const PAUSE_KEY = "fleettraq_quota_pause";
const PAUSE_MS = 6 * 60 * 60 * 1000; // 6 hours
export const QUOTA_EVENT = "fleettraq-quota";

export function markQuotaExceeded() {
  try {
    sessionStorage.setItem(PAUSE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(QUOTA_EVENT));
  }
}

export function clearQuotaPause() {
  try {
    sessionStorage.removeItem(PAUSE_KEY);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(QUOTA_EVENT));
  }
}

export function isQuotaPaused() {
  try {
    const raw = sessionStorage.getItem(PAUSE_KEY);
    if (!raw) return false;
    const started = Number(raw);
    if (!Number.isFinite(started) || Date.now() - started > PAUSE_MS) {
      sessionStorage.removeItem(PAUSE_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Poll interval — longer when quota pause is active. */
export function fleetPollIntervalMs() {
  return isQuotaPaused() ? 5 * 60 * 1000 : 2 * 60 * 1000;
}

export function shouldSkipBackgroundWrites() {
  return isQuotaPaused();
}
