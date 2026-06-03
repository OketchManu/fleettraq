import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const DEFAULTS = {
  notifications: true,
  enableGeofencing: false,
  speedLimitAlert: 80,
  idleTimeAlert: 15,
  routeRetentionDays: 30,
};

export function useFleetAlertSettings(accountId, enabled = true) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId || !enabled) {
      setSettings(DEFAULTS);
      setLoading(false);
      return undefined;
    }

    const ref = doc(db, "fleetSettings", `${accountId}_fleet`);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setSettings({ ...DEFAULTS, ...snap.data() });
        } else {
          setSettings(DEFAULTS);
        }
        setLoading(false);
      },
      () => {
        setSettings(DEFAULTS);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [accountId, enabled]);

  return { settings, loading };
}
