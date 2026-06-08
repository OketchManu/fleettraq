/** Poll helpers — avoids constant onSnapshot reads on Spark plan. */

import { getDoc, getDocs } from "firebase/firestore";
import { fleetPollIntervalMs, isQuotaPaused } from "./firestoreQuota";

export const FLEET_POLL_MS = 3 * 60 * 1000;
export const FLEET_POLL_QUOTA_MS = 10 * 60 * 1000;

/** Live map views (Tracking, Route History) — still slower than onSnapshot. */
export function liveMapPollIntervalMs() {
  return isQuotaPaused() ? FLEET_POLL_QUOTA_MS : 60 * 1000;
}

function resolveIntervalMs(intervalMs) {
  return intervalMs ?? fleetPollIntervalMs();
}

/**
 * Poll a Firestore query. Returns cleanup function for useEffect.
 */
export function subscribeQueryPoll(queryRef, { enabled = true, intervalMs, onData, onError } = {}) {
  if (!enabled || !queryRef) return () => {};

  let cancelled = false;
  const pollMs = resolveIntervalMs(intervalMs);

  const load = async () => {
    if (cancelled || isQuotaPaused()) return;
    try {
      const snapshot = await getDocs(queryRef);
      if (cancelled) return;
      onData?.(snapshot);
    } catch (err) {
      if (!cancelled) onError?.(err);
    }
  };

  load();
  if (isQuotaPaused()) {
    return () => {
      cancelled = true;
    };
  }

  const timer = setInterval(load, pollMs);
  return () => {
    cancelled = true;
    clearInterval(timer);
  };
}

/**
 * Poll a single Firestore document. Returns cleanup function for useEffect.
 */
export function subscribeDocPoll(docRef, { enabled = true, intervalMs, onData, onError } = {}) {
  if (!enabled || !docRef) return () => {};

  let cancelled = false;
  const pollMs = resolveIntervalMs(intervalMs);

  const load = async () => {
    if (cancelled || isQuotaPaused()) return;
    try {
      const snap = await getDoc(docRef);
      if (cancelled) return;
      onData?.(snap);
    } catch (err) {
      if (!cancelled) onError?.(err);
    }
  };

  load();
  if (isQuotaPaused()) {
    return () => {
      cancelled = true;
    };
  }

  const timer = setInterval(load, pollMs);
  return () => {
    cancelled = true;
    clearInterval(timer);
  };
}
