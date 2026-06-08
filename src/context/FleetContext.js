import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { fleetIdFromUser, filterVehiclesForDriver, canManageFleet as roleCanManageFleet, isDriver as roleIsDriver, isAdminRole, normalizeRole } from "../utils/fleetAccess";
import { friendlyFirestoreError, isQuotaError } from "../utils/firestoreErrors";
import { markQuotaExceeded, fleetPollIntervalMs, QUOTA_EVENT, isQuotaPaused } from "../utils/firestoreQuota";
import { ensureFleetInvite, regenerateFleetInvite } from "../utils/fleetInvite";
import { resolveFleetLocale, fleetSettingsDocId } from "../utils/fleetLocale";
import { formatDisplayDate, formatDisplayDateTime, formatDisplayTime } from "../utils/dateFormat";
import { getDeviceId } from "../utils/deviceId";
import { isAdminFleetSetupComplete, isDriverFleetSetupComplete } from "../utils/fleetSetupStatus";
import { useDriverGpsTracker } from "../hooks/useDriverGpsTracker";

const FleetContext = createContext();

export const useFleet = () => useContext(FleetContext);

const readStoredDarkMode = () => {
  try {
    const s = localStorage.getItem("fleettraq-dark");
    if (s === null) return true;
    return s === "true";
  } catch {
    return true;
  }
};

const notificationTime = (createdAt) => {
  if (!createdAt) return 0;
  if (typeof createdAt?.toDate === "function") return createdAt.toDate().getTime();
  const t = new Date(createdAt).getTime();
  return Number.isFinite(t) ? t : 0;
};

const buildMaintenanceAlerts = (vehicleList) => {
  const alerts = [];
  vehicleList.forEach((vehicle) => {
    const lastService = vehicle.lastService
      ? new Date(vehicle.lastService)
      : vehicle.createdAt
        ? new Date(vehicle.createdAt)
        : new Date();
    const daysSince = (Date.now() - lastService) / (1000 * 3600 * 24);

    if (daysSince > 90) {
      alerts.push({
        vehicleId: vehicle.id,
        vehicle: `${vehicle.make} ${vehicle.model}`,
        message: "Service overdue by 90+ days",
        severity: "high",
      });
    } else if (daysSince > 60) {
      alerts.push({
        vehicleId: vehicle.id,
        vehicle: `${vehicle.make} ${vehicle.model}`,
        message: "Service due soon",
        severity: "medium",
      });
    }
  });
  return alerts;
};

export const FleetProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [vehiclesAll, setVehiclesAll] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [fleetDriverAccounts, setFleetDriverAccounts] = useState([]);
  const [activeTracking, setActiveTracking] = useState([]);
  const [reports, setReports] = useState([]);
  const [trackingData, setTrackingData] = useState(null);
  const [darkMode, setDarkMode] = useState(readStoredDarkMode);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inviteCode, setInviteCode] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [fleetSettings, setFleetSettings] = useState({});
  const [quotaPaused, setQuotaPaused] = useState(() => isQuotaPaused());

  const pollMs = fleetPollIntervalMs();

  useEffect(() => {
    const sync = () => setQuotaPaused(isQuotaPaused());
    window.addEventListener(QUOTA_EVENT, sync);
    return () => window.removeEventListener(QUOTA_EVENT, sync);
  }, []);

  const reportFirestoreError = useCallback((err) => {
    setError(friendlyFirestoreError(err));
    if (isQuotaError(err)) markQuotaExceeded();
  }, []);

  const fleetId = fleetIdFromUser(user);
  const fleetLocale = useMemo(() => resolveFleetLocale(fleetSettings), [fleetSettings]);

  const driverGpsEnabled =
    !quotaPaused &&
    roleIsDriver(user?.role) &&
    user?.membershipStatus !== "pending" &&
    user?.membershipStatus !== "suspended";

  const vehicles = useMemo(
    () => filterVehiclesForDriver(vehiclesAll, user, drivers),
    [vehiclesAll, user, drivers]
  );

  useDriverGpsTracker({
    user,
    vehicles: vehiclesAll,
    drivers,
    enabled: driverGpsEnabled,
  });

  const maintenanceAlerts = useMemo(() => buildMaintenanceAlerts(vehicles), [vehicles]);

  const fleetSetupComplete = useMemo(() => {
    if (!user) return false;
    if (roleIsDriver(user.role)) {
      return isDriverFleetSetupComplete({
        vehicles,
        deviceId: getDeviceId(),
        activeTracking,
      });
    }
    if (roleCanManageFleet(user.role)) {
      return isAdminFleetSetupComplete({
        vehiclesAll,
        drivers,
        fleetDriverAccounts,
      });
    }
    return true;
  }, [user, vehicles, vehiclesAll, drivers, fleetDriverAccounts, activeTracking]);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const data = userDoc.exists() ? userDoc.data() : {};
        const rawRole = data.role || "user";
        const role = normalizeRole(rawRole);
        const organizationId =
          data.organizationId != null && String(data.organizationId).trim() !== ""
            ? String(data.organizationId).trim()
            : firebaseUser.uid;
        const fid = organizationId;
        const membershipStatus = data.membershipStatus || "active";

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || data.name || "",
          role,
          organizationId: fid,
          fleetId: fid,
          membershipStatus,
        });

        // Roster entries are created when the admin approves or syncs drivers.
        localStorage.setItem("role", role);

        const settingsRef = doc(db, "userSettings", `${firebaseUser.uid}_user`);
        getDoc(settingsRef)
          .then((settingsDoc) => {
            if (settingsDoc.exists()) {
              setDarkMode(settingsDoc.data().darkMode ?? true);
            }
          })
          .catch(() => {});
      } else {
        setUser(null);
        setVehiclesAll([]);
        setDrivers([]);
        setFleetDriverAccounts([]);
        setReports([]);
        setTrackingData(null);
        setNotifications([]);
        setUnreadCount(0);
        setInviteCode(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem("fleettraq-dark", darkMode ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, [darkMode]);

  const fetchVehicles = useCallback(async () => {
    const fid = fleetIdFromUser(user) || auth.currentUser?.uid;
    if (!fid) return [];
    try {
      const q = query(collection(db, "vehicles"), where("accountId", "==", fid));
      const snapshot = await getDocs(q);
      const vehiclesList = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setVehiclesAll(vehiclesList);
      return vehiclesList;
    } catch (err) {
      setError("Failed to fetch vehicles: " + err.message);
      return [];
    }
  }, [user]);

  useEffect(() => {
    const fid = fleetIdFromUser(user);
    if (!fid || !user?.uid) return undefined;

    const q = query(collection(db, "vehicles"), where("accountId", "==", fid));
    let cancelled = false;

    const load = async () => {
      try {
        const snapshot = await getDocs(q);
        if (cancelled) return;
        setVehiclesAll(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      } catch (err) {
        if (!cancelled) reportFirestoreError(err);
      }
    };

    load();
    if (quotaPaused) return () => { cancelled = true; };
    const timer = setInterval(load, pollMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user?.uid, user?.fleetId, user?.organizationId, quotaPaused, pollMs, reportFirestoreError]);

  const fetchDrivers = useCallback(async () => {
    const fid = fleetIdFromUser(user) || auth.currentUser?.uid;
    if (!fid) return [];
    try {
      const q = query(collection(db, "drivers"), where("accountId", "==", fid));
      const snapshot = await getDocs(q);
      const driversList = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setDrivers(driversList);
      return driversList;
    } catch (err) {
      setError("Failed to fetch drivers: " + err.message);
      return [];
    }
  }, [user]);

  useEffect(() => {
    const fid = fleetIdFromUser(user);
    if (!fid || !user?.uid) return undefined;

    const q = query(collection(db, "drivers"), where("accountId", "==", fid));
    let cancelled = false;

    const load = async () => {
      try {
        const snapshot = await getDocs(q);
        if (cancelled) return;
        setDrivers(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      } catch (err) {
        if (!cancelled) reportFirestoreError(err);
      }
    };

    load();
    if (quotaPaused) return () => { cancelled = true; };
    const timer = setInterval(load, pollMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user?.uid, user?.fleetId, user?.organizationId, quotaPaused, pollMs, reportFirestoreError]);

  const fetchReports = useCallback(async () => {
    const fid = fleetIdFromUser(user) || auth.currentUser?.uid;
    if (!fid) return [];
    try {
      const q = query(collection(db, "reports"), where("accountId", "==", fid));
      const snapshot = await getDocs(q);
      const reportsList = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setReports(reportsList);
      return reportsList;
    } catch (err) {
      setError("Failed to fetch reports: " + err.message);
      return [];
    }
  }, [user]);

  useEffect(() => {
    const fid = fleetIdFromUser(user);
    if (!fid || !user?.uid) return undefined;

    const q = query(collection(db, "reports"), where("accountId", "==", fid));
    let cancelled = false;

    const load = async () => {
      try {
        const snapshot = await getDocs(q);
        if (cancelled) return;
        setReports(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      } catch (err) {
        if (!cancelled) reportFirestoreError(err);
      }
    };

    load();
    if (quotaPaused) return () => { cancelled = true; };
    const timer = setInterval(load, pollMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user?.uid, user?.fleetId, user?.organizationId, quotaPaused, pollMs, reportFirestoreError]);

  // Fleet driver login accounts (for admin roster linking)
  useEffect(() => {
    const fid = fleetIdFromUser(user);
    if (!fid || !roleCanManageFleet(user?.role)) {
      setFleetDriverAccounts([]);
      return;
    }

    const q = query(collection(db, "users"), where("organizationId", "==", fid));
    let cancelled = false;

    const load = async () => {
      try {
        const snapshot = await getDocs(q);
        if (cancelled) return;
        const accounts = snapshot.docs
          .map((d) => ({ uid: d.id, ...d.data() }))
          .filter((row) => row.role === "driver");
        setFleetDriverAccounts(accounts);
      } catch (err) {
        if (!cancelled) reportFirestoreError(err);
      }
    };

    load();
    if (quotaPaused) return () => { cancelled = true; };
    const timer = setInterval(load, pollMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user?.uid, user?.role, user?.organizationId, user?.fleetId, quotaPaused, pollMs, reportFirestoreError]);

  // Ensure fleet admin has an invite code for driver onboarding.
  const loadInviteCode = useCallback(async () => {
    if (!roleCanManageFleet(user?.role) || !fleetIdFromUser(user)) {
      setInviteCode(null);
      setInviteError(null);
      return null;
    }
    setInviteLoading(true);
    setInviteError(null);
    try {
      const invite = await ensureFleetInvite(fleetIdFromUser(user));
      setInviteCode(invite?.code || null);
      if (!invite?.code) {
        setInviteError("Could not create a driver invite code. Try again.");
      }
      return invite?.code || null;
    } catch (err) {
      console.error("Failed to load invite code:", err);
      setInviteError(err?.message || "Failed to load driver invite code.");
      setInviteCode(null);
      return null;
    } finally {
      setInviteLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadInviteCode();
  }, [loadInviteCode]);

  const regenerateInvite = useCallback(async () => {
    const fid = fleetIdFromUser(user);
    if (!fid || !roleCanManageFleet(user?.role)) return null;
    setInviteLoading(true);
    try {
      const invite = await regenerateFleetInvite(fid);
      setInviteCode(invite?.code || null);
      return invite?.code;
    } finally {
      setInviteLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const fid = fleetIdFromUser(user);
    if (!fid) {
      setActiveTracking([]);
      return;
    }

    // Drivers do not need a fleet-wide active-tracking listener (saves Firestore reads).
    if (roleIsDriver(user?.role) || quotaPaused) {
      setActiveTracking([]);
      return undefined;
    }

    const q = query(
      collection(db, "tracking"),
      where("accountId", "==", fid),
      where("isTracking", "==", true)
    );

    let cancelled = false;
    const load = async () => {
      try {
        const snapshot = await getDocs(q);
        if (cancelled) return;
        setActiveTracking(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      } catch {
        if (!cancelled) setActiveTracking([]);
      }
    };

    load();
    const timer = setInterval(load, pollMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user?.uid, user?.fleetId, user?.organizationId, user?.role, quotaPaused, pollMs, reportFirestoreError]);

  useEffect(() => {
    const settingsId = fleetSettingsDocId(fleetId);
    if (!settingsId) {
      setFleetSettings({});
      return undefined;
    }

    const ref = doc(db, "fleetSettings", settingsId);
    let cancelled = false;

    const load = async () => {
      try {
        const snap = await getDoc(ref);
        if (cancelled) return;
        setFleetSettings(snap.exists() ? snap.data() : {});
      } catch (err) {
        if (!cancelled) reportFirestoreError(err);
      }
    };

    load();
    if (quotaPaused) return () => { cancelled = true; };
    const timer = setInterval(load, pollMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [fleetId, quotaPaused, pollMs, reportFirestoreError]);

  useEffect(() => {
    if (!user?.uid || quotaPaused) return undefined;

    const q = query(collection(db, "notifications"), where("userId", "==", user.uid));
    let cancelled = false;

    const load = async () => {
      try {
        const snapshot = await getDocs(q);
        if (cancelled) return;
        const notifs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        notifs.sort((a, b) => notificationTime(b.createdAt) - notificationTime(a.createdAt));
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.read).length);
      } catch (err) {
        if (!cancelled) reportFirestoreError(err);
      }
    };

    load();
    const timer = setInterval(load, pollMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user?.uid, quotaPaused, pollMs, reportFirestoreError]);

  const sendNotification = async (message, type = "info") => {
    if (!auth.currentUser || quotaPaused) return;

    try {
      await addDoc(collection(db, "notifications"), {
        userId: auth.currentUser.uid,
        message: message,
        type: type,
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      if (isQuotaError(error)) markQuotaExceeded();
      console.error("Error sending notification:", error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    if (!auth.currentUser) return;

    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
        readAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!auth.currentUser) return;

    try {
      await deleteDoc(doc(db, "notifications", notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const clearAllNotifications = async () => {
    if (!auth.currentUser) return;

    try {
      const qn = query(collection(db, "notifications"), where("userId", "==", auth.currentUser.uid));
      const snapshot = await getDocs(qn);
      const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const value = {
    user,
    setUser,
    fleetId,
    fleetSettings,
    fleetLocale,
    formatDate: formatDisplayDate,
    formatDateTime: formatDisplayDateTime,
    formatTime: formatDisplayTime,
    vehicles,
    vehiclesAll,
    setVehiclesAll,
    drivers,
    setDrivers,
    fleetDriverAccounts,
    activeTracking,
    fleetSetupComplete,
    reports,
    setReports,
    trackingData,
    setTrackingData,
    darkMode,
    setDarkMode,
    loading,
    error,
    quotaPaused,
    notifications,
    unreadCount,
    maintenanceAlerts,
    canManageFleet: roleCanManageFleet(user?.role),
    isDriver: roleIsDriver(user?.role),
    isAdmin: isAdminRole(user?.role),
    membershipPending: user?.membershipStatus === "pending",
    membershipSuspended: user?.membershipStatus === "suspended",
    inviteCode,
    inviteLoading,
    inviteError,
    loadInviteCode,
    regenerateInvite,
    fetchVehicles,
    fetchDrivers,
    fetchReports,
    sendNotification,
    markNotificationAsRead,
    deleteNotification,
    clearAllNotifications,
  };

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
};
