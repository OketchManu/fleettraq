import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, onSnapshot, doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const FleetContext = createContext();

const FuturisticLoadingScreen = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #050014 0%, #0c0033 30%, #140052 70%, #1a0066 100%)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Stars background */}
      <div style={{ position: "absolute", width: "100%", height: "100%", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            width: "200%",
            height: "4px",
            background: "rgba(255, 255, 255, 0.2)",
            top: "50%",
            left: "-50%",
            borderRadius: "2px",
            transform: "translateY(-50%)",
            animation: "roadMove 10s infinite linear",
          }}
        />
      </div>
      
      {/* Space highway */}
      <div style={{ position: "absolute", width: "100%", height: "100%", perspective: "1000px", zIndex: 1 }}>
        <div
          style={{
            position: "absolute",
            width: "200%",
            height: "4px",
            background: "linear-gradient(to right, rgba(0, 0, 0, 0), rgba(120, 0, 255, 0.5), rgba(0, 200, 255, 0.5), rgba(0, 0, 0, 0))",
            top: "50%",
            left: "-50%",
            borderRadius: "2px",
            transform: "translateY(-50%) rotateX(60deg)",
            boxShadow: "0 0 20px rgba(120, 0, 255, 0.5), 0 0 40px rgba(0, 200, 255, 0.3)",
            animation: "roadMove 10s infinite linear",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "200%",
            height: "4px",
            background: "linear-gradient(to right, rgba(0, 0, 0, 0), rgba(120, 0, 255, 0.3), rgba(0, 200, 255, 0.3), rgba(0, 0, 0, 0))",
            top: "60%",
            left: "-50%",
            borderRadius: "2px",
            transform: "translateY(-50%) rotateX(60deg)",
            boxShadow: "0 0 15px rgba(120, 0, 255, 0.4), 0 0 30px rgba(0, 200, 255, 0.2)",
            animation: "roadMove 12s infinite linear",
          }}
        />
      </div>
      
      {/* Fleet vehicles */}
      <div style={{ position: "relative", display: "flex", gap: "40px", zIndex: 2 }}>
        {[1, 2, 3].map((car) => (
          <div
            key={car}
            style={{
              width: "50px",
              height: "24px",
              background: `linear-gradient(90deg, #6b21a8, #8b5cf6)`,
              borderRadius: "6px",
              boxShadow: "0 0 15px rgba(139, 92, 246, 0.8), 0 0 30px rgba(107, 33, 168, 0.6)",
              position: "relative",
              animation: `carMove${car} 2.5s infinite ease-in-out`,
              transformOrigin: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: "-4px",
                left: "10%",
                width: "80%",
                height: "4px",
                background: "rgba(139, 92, 246, 0.5)",
                borderRadius: "50%",
                filter: "blur(4px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "15%",
                left: "10%",
                width: "80%",
                height: "30%",
                background: "rgba(255, 255, 255, 0.7)",
                borderRadius: "3px",
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Loading text */}
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          color: "#a78bfa",
          fontSize: "28px",
          fontWeight: "bold",
          textShadow: "0 0 10px rgba(167, 139, 250, 0.8), 0 0 20px rgba(139, 92, 246, 0.6)",
          animation: "pulse 1.5s infinite",
          letterSpacing: "2px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading Fleet...
      </div>
      
      {/* Animated styles */}
      <style>
        {`
          @keyframes roadMove {
            0% { transform: translateX(-50%) translateY(-50%) rotateX(60deg) rotate(0deg); }
            25% { transform: translateX(-40%) translateY(-50%) rotateX(60deg) rotate(5deg); }
            50% { transform: translateX(-30%) translateY(-50%) rotateX(60deg) rotate(0deg); }
            75% { transform: translateX(-40%) translateY(-50%) rotateX(60deg) rotate(-5deg); }
            100% { transform: translateX(-50%) translateY(-50%) rotateX(60deg) rotate(0deg); }
          }
          @keyframes carMove1 {
            0%, 100% { transform: translateX(0) translateY(0); }
            50% { transform: translateX(20px) translateY(-10px); }
          }
          @keyframes carMove2 {
            0%, 100% { transform: translateX(0) translateY(0); }
            50% { transform: translateX(-15px) translateY(15px); }
          }
          @keyframes carMove3 {
            0%, 100% { transform: translateX(0) translateY(0); }
            50% { transform: translateX(25px) translateY(-5px); }
          }
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}
      </style>
    </div>
  );
};

export const FleetProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [reports, setReports] = useState([]);
  const [trackingData, setTrackingData] = useState({ lat: -1.2864, lng: 36.8172 });
  const [darkMode, setDarkMode] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const fetchDrivers = useCallback(async () => {
    if (!user) return;
    try {
      const querySnapshot = await getDocs(collection(db, "drivers"));
      setDrivers(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching drivers:", err.message);
    }
  }, [user]);

  const fetchVehicles = useCallback(async () => {
    if (!user) return;
    try {
      const querySnapshot = await getDocs(collection(db, "vehicles"));
      setVehicles(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching vehicles:", err.message);
    }
  }, [user]);

  const fetchReports = useCallback(async () => {
    if (!user) return;
    try {
      const querySnapshot = await getDocs(collection(db, "reports"));
      setReports(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching reports:", err.message);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoadingAuth(true);
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem("token", await currentUser.getIdToken());
        // Force token refresh to ensure auth is fully propagated
        await currentUser.getIdToken(true);
        await Promise.all([fetchDrivers(), fetchVehicles(), fetchReports()]);
        try {
          const userDoc = await getDocs(collection(db, "users"));
          const userData = userDoc.docs.find((doc) => doc.id === currentUser.uid);
          if (userData) localStorage.setItem("role", userData.data().role || "driver");
        } catch (err) {
          console.error("Error fetching user role:", err.message);
        }
      } else {
        setUser(null);
        setDrivers([]);
        setVehicles([]);
        setReports([]);
        setTrackingData({ lat: -1.2864, lng: 36.8172 });
        localStorage.clear();
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [fetchDrivers, fetchVehicles, fetchReports]);

  useEffect(() => {
    if (loadingAuth || !user || !auth.currentUser) return;

    const unsubTracking = onSnapshot(collection(db, "tracking"), (snapshot) => {
      const tracking = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      if (tracking.length > 0) {
        const latest = tracking[tracking.length - 1];
        setTrackingData({ lat: Number(latest.lat) || -1.2864, lng: Number(latest.lng) || 36.8172 });
      }
    }, (err) => {
      console.error("Tracking snapshot error:", err.message);
    });

    const settingsRef = doc(db, "userSettings", `${user.uid}_user`);
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setDarkMode(docSnap.data().darkMode ?? true);
      } else {
        setDoc(settingsRef, { darkMode: true }, { merge: true }).catch((err) =>
          console.error("Error setting default settings:", err.message)
        );
      }
    }, (err) => {
      console.error("Settings snapshot error:", err.message);
    });

    return () => {
      unsubTracking();
      unsubSettings();
    };
  }, [user, loadingAuth]);

  if (loadingAuth) {
    return <FuturisticLoadingScreen />;
  }

  return (
    <FleetContext.Provider
      value={{
        user,
        drivers,
        vehicles,
        reports,
        trackingData,
        setTrackingData,
        darkMode,
        setDarkMode,
        fetchDrivers,
        fetchVehicles,
        fetchReports,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) throw new Error("useFleet must be used within a FleetProvider");
  return context;
};
