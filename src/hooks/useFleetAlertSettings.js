import { useEffect, useState } from "react";
import { doc } from "firebase/firestore";
import { db } from "../firebase";
import { subscribeDocPoll } from "../utils/firestorePoll";

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
    return subscribeDocPoll(ref, {
      onData: (snap) => {
        if (snap.exists()) {
          setSettings({ ...DEFAULTS, ...snap.data() });
        } else {
          setSettings(DEFAULTS);
        }
        setLoading(false);
      },
      onError: () => {
        setSettings(DEFAULTS);
        setLoading(false);
      },
    });
  }, [accountId, enabled]);

  return { settings, loading };
}
