import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from "firebase/firestore";

const FleetContext = createContext();

export const useFleet = () => useContext(FleetContext);

export const FleetProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [reports, setReports] = useState([]);
  const [trackingData, setTrackingData] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Load user role from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const role = userDoc.exists() ? userDoc.data().role : "user";
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: role
        });
        
        localStorage.setItem("role", role);
        
        // Load user settings
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
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch vehicles for current user only
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

  // Subscribe to real-time vehicles updates for current user
  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, "vehicles"),
      where("accountId", "==", auth.currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vehiclesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVehicles(vehiclesList);
    }, (err) => {
      setError("Failed to subscribe to vehicles: " + err.message);
    });
    
    return () => unsubscribe();
  }, []);

  // Fetch drivers for current user only
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

  // Subscribe to real-time drivers updates
  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, "drivers"),
      where("accountId", "==", auth.currentUser.uid)
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
  }, []);

  // Fetch reports for current user only
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

  // Subscribe to real-time reports updates
  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, "reports"),
      where("accountId", "==", auth.currentUser.uid)
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
  }, []);

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
    fetchVehicles,
    fetchDrivers,
    fetchReports,
  };

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
};