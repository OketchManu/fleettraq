const STORAGE_KEY = "fleettraq_invite_attempts";
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

function readAttempts() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, resetAt: Date.now() + WINDOW_MS };
    const parsed = JSON.parse(raw);
    if (Date.now() > parsed.resetAt) {
      return { count: 0, resetAt: Date.now() + WINDOW_MS };
    }
    return parsed;
  } catch {
    return { count: 0, resetAt: Date.now() + WINDOW_MS };
  }
}

export function canAttemptInviteLookup() {
  const state = readAttempts();
  return state.count < MAX_ATTEMPTS;
}

export function recordInviteLookupFailure() {
  const state = readAttempts();
  const count = Date.now() > state.resetAt ? 1 : state.count + 1;
  const resetAt = Date.now() > state.resetAt ? Date.now() + WINDOW_MS : state.resetAt;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ count, resetAt }));
  return Math.max(0, MAX_ATTEMPTS - count);
}

export function clearInviteLookupAttempts() {
  sessionStorage.removeItem(STORAGE_KEY);
}
