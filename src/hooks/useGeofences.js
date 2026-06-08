import { useEffect, useState } from "react";
import { collection, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { subscribeQueryPoll } from "../utils/firestorePoll";

export function useGeofences(fleetId, enabled = true) {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fleetId || !enabled) {
      setGeofences([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const q = query(collection(db, "geofences"), where("accountId", "==", fleetId));

    return subscribeQueryPoll(q, {
      onData: (snapshot) => {
        setGeofences(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
        setError(null);
        setLoading(false);
      },
      onError: (err) => {
        setError(err.message || "Failed to load geofences");
        setLoading(false);
      },
    });
  }, [fleetId, enabled]);

  return { geofences, loading, error };
}
