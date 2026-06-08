import { useEffect, useMemo, useState } from "react";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import {
  detectStops,
  getTimeRangeStart,
  groupPointsByVehicle,
  totalRouteDistanceMeters,
} from "../utils/routeAnalysis";
import { subscribeQueryPoll } from "../utils/firestorePoll";

const MAX_POINTS = 3000;

export function useRouteHistory(fleetId, rangeKey, selectedVehicleIds, enabled = true) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const startTime = useMemo(() => getTimeRangeStart(rangeKey), [rangeKey]);

  useEffect(() => {
    if (!fleetId || !enabled) {
      setPoints([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    setLoading(true);
    const q = query(
      collection(db, "routePoints"),
      where("accountId", "==", fleetId),
      where("timestamp", ">=", startTime),
      orderBy("timestamp", "asc"),
      limit(MAX_POINTS)
    );

    return subscribeQueryPoll(q, {
      intervalMs: undefined,
      onData: (snapshot) => {
        const rows = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setPoints(rows);
        setError(null);
        setLoading(false);
      },
      onError: (err) => {
        setError(err.message || "Failed to load route history");
        setLoading(false);
      },
    });
  }, [fleetId, startTime, enabled]);

  const filteredPoints = useMemo(() => {
    if (!enabled) return [];
    if (!selectedVehicleIds?.length) return points;
    const allowed = new Set(selectedVehicleIds);
    return points.filter((p) => allowed.has(p.vehicleId));
  }, [points, selectedVehicleIds, enabled]);

  const routesByVehicle = useMemo(
    () => groupPointsByVehicle(filteredPoints),
    [filteredPoints]
  );

  const stopsByVehicle = useMemo(() => {
    const map = new Map();
    for (const [vehicleId, routePoints] of routesByVehicle.entries()) {
      map.set(vehicleId, detectStops(routePoints));
    }
    return map;
  }, [routesByVehicle]);

  const summaryByVehicle = useMemo(() => {
    const map = new Map();
    for (const [vehicleId, routePoints] of routesByVehicle.entries()) {
      const stops = stopsByVehicle.get(vehicleId) || [];
      map.set(vehicleId, {
        pointCount: routePoints.length,
        distanceM: totalRouteDistanceMeters(routePoints),
        stopCount: stops.length,
        longestStopMs: stops.reduce((max, s) => Math.max(max, s.durationMs), 0),
      });
    }
    return map;
  }, [routesByVehicle, stopsByVehicle]);

  const allStops = useMemo(() => {
    const list = [];
    for (const [vehicleId, stops] of stopsByVehicle.entries()) {
      for (const stop of stops) {
        list.push({ ...stop, vehicleId });
      }
    }
    return list.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }, [stopsByVehicle]);

  return {
    points: filteredPoints,
    routesByVehicle,
    stopsByVehicle,
    summaryByVehicle,
    allStops,
    loading,
    error,
    startTime,
    truncated: points.length >= MAX_POINTS,
  };
}
