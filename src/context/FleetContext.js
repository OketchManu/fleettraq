import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs, onSnapshot, doc, getDoc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

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

export const FleetProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [reports, setReports] = useState([]);
  const [trackingData, setTrackingData] = useState(null);
  const [darkMode, setDarkMode] = useState(readStoredDarkMode);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const role = userDoc.exists() ? userDoc.data().role : "user";
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: role
        });
        
        localStorage.setItem("role", role);
        
        const settingsRef = doc(db, "userSettings", `${firebaseUser.uid}_user`);
        const settingsDoc = await getDoc(settingsRef);
        if (settingsDoc.exists()) {
          setDarkMode(settingsDoc.data().darkMode ?? true);
        }
      } else {
        setUser(null);
        setVehicles([]);
        setDrivers([]);
        setReports([]);
        setTrackingData(null);
        setNotifications([]);
        setMaintenanceAlerts([]);
        setUnreadCount(0);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem("fleettraq-dark", darkMode ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, [darkMode]);

  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    if (!auth.currentUser) return [];
    try {
      const q = query(
        collection(db, "vehicles"),
        where("accountId", "==", auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const vehiclesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVehicles(vehiclesList);
      return vehiclesList;
    } catch (err) {
      setError("Failed to fetch vehicles: " + err.message);
      return [];
    }
  }, []);

  // Real-time vehicles subscription (depends on user so it attaches after auth resolves)
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "vehicles"),
      where("accountId", "==", user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vehiclesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVehicles(vehiclesList);
      
      // Check for maintenance alerts
      const alerts = [];
      vehiclesList.forEach(vehicle => {
        const lastService = vehicle.lastService ? new Date(vehicle.lastService) : (vehicle.createdAt ? new Date(vehicle.createdAt) : new Date());
        const daysSince = (Date.now() - lastService) / (1000 * 3600 * 24);
        
        if (daysSince > 90) {
          alerts.push({
            vehicleId: vehicle.id,
            vehicle: `${vehicle.make} ${vehicle.model}`,
            message: "Service overdue by 90+ days",
            severity: "high"
          });
        } else if (daysSince > 60) {
          alerts.push({
            vehicleId: vehicle.id,
            vehicle: `${vehicle.make} ${vehicle.model}`,
            message: "Service due soon",
            severity: "medium"
          });
        }
      });
      setMaintenanceAlerts(alerts);
    }, (err) => {
      setError("Failed to subscribe to vehicles: " + err.message);
    });
    
    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch drivers
  const fetchDrivers = useCallback(async () => {
    if (!auth.currentUser) return [];
    try {
      const q = query(
        collection(db, "drivers"),
        where("accountId", "==", auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const driversList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDrivers(driversList);
      return driversList;
    } catch (err) {
      setError("Failed to fetch drivers: " + err.message);
      return [];
    }
  }, []);

  // Real-time drivers subscription
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "drivers"),
      where("accountId", "==", user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const driversList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDrivers(driversList);
    }, (err) => {
      setError("Failed to subscribe to drivers: " + err.message);
    });
    
    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    if (!auth.currentUser) return [];
    try {
      const q = query(
        collection(db, "reports"),
        where("accountId", "==", auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const reportsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(reportsList);
      return reportsList;
    } catch (err) {
      setError("Failed to fetch reports: " + err.message);
      return [];
    }
  }, []);

  // Real-time reports subscription
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "reports"),
      where("accountId", "==", user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(reportsList);
    }, (err) => {
      setError("Failed to subscribe to reports: " + err.message);
    });
    
    return () => unsubscribe();
  }, [user?.uid]);

  // Real-time notifications subscription
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

  // Send notification function
  const sendNotification = async (message, type = "info") => {
    if (!auth.currentUser) return;
    
    try {
      await addDoc(collection(db, "notifications"), {
        userId: auth.currentUser.uid,
        message: message,
        type: type,
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    if (!auth.currentUser) return;
    
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
        readAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    if (!auth.currentUser) return;
    
    try {
      await deleteDoc(doc(db, "notifications", notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!auth.currentUser) return;
    
    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const value = {
    user,
    setUser,
    vehicles,
    setVehicles,
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