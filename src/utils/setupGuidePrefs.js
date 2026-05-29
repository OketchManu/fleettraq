const storageKey = (uid) => `fleettraq_setup_guide_${uid}`;

/** @returns {boolean | null} null = use default (visible until setup complete) */
export function getSetupGuidePreference(uid) {
  if (!uid) return null;
  const value = localStorage.getItem(storageKey(uid));
  if (value === "shown") return true;
  if (value === "hidden") return false;
  return null;
}

export function setSetupGuidePreference(uid, visible) {
  if (!uid) return;
  localStorage.setItem(storageKey(uid), visible ? "shown" : "hidden");
}

export function isSetupGuideVisible(uid, fleetSetupComplete) {
  const pref = getSetupGuidePreference(uid);
  if (pref !== null) return pref;
  return !fleetSetupComplete;
}
