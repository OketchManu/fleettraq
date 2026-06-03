import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";

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

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setGeofences(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load geofences");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [fleetId, enabled]);

  return { geofences, loading, error };
}
