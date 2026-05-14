import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs, onSnapshot, doc, getDoc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { fleetIdFromUser, filterVehiclesForDriver, canManageFleet as roleCanManageFleet, isDriver as roleIsDriver } from "../utils/fleetAccess";

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
  const [reports, setReports] = useState([]);
  const [trackingData, setTrackingData] = useState(null);
  const [darkMode, setDarkMode] = useState(readStoredDarkMode);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fleetId = fleetIdFromUser(user);

  const vehicles = useMemo(
    () => filterVehiclesForDriver(vehiclesAll, user, drivers),
    [vehiclesAll, user, drivers]
  );

  const maintenanceAlerts = useMemo(() => buildMaintenanceAlerts(vehicles), [vehicles]);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const data = userDoc.exists() ? userDoc.data() : {};
        const role = data.role || "user";
        const organizationId =
          data.organizationId != null && String(data.organizationId).trim() !== ""
            ? String(data.organizationId).trim()
            : firebaseUser.uid;
        const fid = organizationId;

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || data.name || "",
          role,
          organizationId: fid,
          fleetId: fid,
        });

        localStorage.setItem("role", role);

        const settingsRef = doc(db, "userSettings", `${firebaseUser.uid}_user`);
        const settingsDoc = await getDoc(settingsRef);
        if (settingsDoc.exists()) {
          setDarkMode(settingsDoc.data().darkMode ?? true);
        }
      } else {
        setUser(null);
        setVehiclesAll([]);
        setDrivers([]);
        setReports([]);
        setTrackingData(null);
        setNotifications([]);
        setUnreadCount(0);
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
    if (!fid || !user?.uid) return;

    const q = query(collection(db, "vehicles"), where("accountId", "==", fid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const vehiclesList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setVehiclesAll(vehiclesList);
      },
      (err) => {
        setError("Failed to subscribe to vehicles: " + err.message);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, user?.fleetId, user?.organizationId]);

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
    if (!fid || !user?.uid) return;

    const q = query(collection(db, "drivers"), where("accountId", "==", fid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const driversList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setDrivers(driversList);
      },
      (err) => {
        setError("Failed to subscribe to drivers: " + err.message);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, user?.fleetId, user?.organizationId]);

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
    if (!fid || !user?.uid) return;

    const q = query(collection(db, "reports"), where("accountId", "==", fid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reportsList = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setReports(reportsList);
      },
      (err) => {
        setError("Failed to subscribe to reports: " + err.message);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, user?.fleetId, user?.organizationId]);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "notifications"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        notifs.sort((a, b) => notificationTime(b.createdAt) - notificationTime(a.createdAt));
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.read).length);
      },
      (err) => {
        setError("Failed to subscribe to notifications: " + err.message);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const sendNotification = async (message, type = "info") => {
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, "notifications"), {
        userId: auth.currentUser.uid,
        message: message,
        type: type,
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
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
    vehicles,
    vehiclesAll,
    setVehiclesAll,
    drivers,
    setDrivers,
    reports,
    setReports,
    trackingData,
    setTrackingData,
    darkMode,
    setDarkMode,
    loading,
    error,
    notifications,
    unreadCount,
    maintenanceAlerts,
    canManageFleet: roleCanManageFleet(user?.role),
    isDriver: roleIsDriver(user?.role),
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
