import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, LogOut, Trash2 } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { signOut, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import Button from "./Button";
import { v4 as uuidv4 } from "uuid";

const Profile = () => {
  const navigate = useNavigate();
  const { darkMode, user } = useFleet();
  const [deviceId] = useState(() => localStorage.getItem("deviceId") || uuidv4());
  const [activeSessions, setActiveSessions] = useState([]);
  const [deletionRequest, setDeletionRequest] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState(""); 

  localStorage.setItem("deviceId", deviceId);

  const themeStyles = {
    background: darkMode
      ? "linear-gradient(135deg, #080016 0%, #150025 100%)"
      : "linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)",
    color: darkMode ? "#fff" : "#000",
    cardBg: darkMode ? "rgba(20, 10, 40, 0.7)" : "rgba(255, 255, 255, 0.9)",
    cardBorder: darkMode ? "2px solid rgba(250, 204, 21, 0.5)" : "2px solid rgba(59, 130, 246, 0.5)",
    cardGlow: darkMode ? "0 0 15px rgba(250, 204, 21, 0.3)" : "0 0 15px rgba(59, 130, 246, 0.2)",
  };

  useEffect(() => {
    if (!user) return;

    const registerSession = async () => {
      const sessionsRef = collection(db, "sessions");
      const q = query(sessionsRef, where("accountId", "==", user.uid), where("deviceId", "==", deviceId));
      const existingSessions = await getDocs(q);

      if (existingSessions.empty) {
        await addDoc(sessionsRef, {
          accountId: user.uid,
          deviceId,
          lastActive: new Date().toISOString(),
          approvedDeletion: false,
        });
      } else {
        const sessionDoc = existingSessions.docs[0];
        await updateDoc(doc(db, "sessions", sessionDoc.id), {
          lastActive: new Date().toISOString(),
        });
      }
    };

    registerSession();

    const sessionsQuery = query(collection(db, "sessions"), where("accountId", "==", user.uid));
    const unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
      const sessions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setActiveSessions(sessions);
    }, (err) => setError("Failed to fetch sessions: " + err.message));

    const deletionQuery = query(collection(db, "deletionRequests"), where("accountId", "==", user.uid));
    const unsubscribeDeletion = onSnapshot(deletionQuery, (snapshot) => {
      const requests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDeletionRequest(requests[0] || null);
    }, (err) => setError("Failed to fetch deletion requests: " + err.message));

    return () => {
      unsubscribeSessions();
      unsubscribeDeletion();
    };
  }, [user, deviceId]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate("/login");
    } catch (err) {
      setError("Failed to log out: " + err.message);
    }
  };

  const initiateAccountDeletion = async () => {
    if (!user) {
      setError("You must be logged in to delete the account.");
      return;
    }

    if (activeSessions.length === 0) {
      setError("No active sessions found.");
      return;
    }

    try {
      await addDoc(collection(db, "deletionRequests"), {
        accountId: user.uid,
        initiatedBy: deviceId,
        initiatedAt: new Date().toISOString(),
        approvals: [{ deviceId, approved: true }],
      });

      const currentSession = activeSessions.find((s) => s.deviceId === deviceId);
      if (currentSession) {
        await updateDoc(doc(db, "sessions", currentSession.id), { approvedDeletion: true });
      }

      setShowDeleteModal(false);
      setError(null);
    } catch (err) {
      setError("Failed to initiate account deletion: " + err.message);
    }
  };

  const approveDeletion = async () => {
    if (!deletionRequest || !user) return;

    try {
      const currentSession = activeSessions.find((s) => s.deviceId === deviceId);
      if (!currentSession) {
        setError("Your session is not recognized.");
        return;
      }

      const updatedApprovals = [
        ...deletionRequest.approvals.filter((a) => a.deviceId !== deviceId),
        { deviceId, approved: true },
      ];
      await updateDoc(doc(db, "deletionRequests", deletionRequest.id), { approvals: updatedApprovals });

      await updateDoc(doc(db, "sessions", currentSession.id), { approvedDeletion: true });

      setError(null);
    } catch (err) {
      setError("Failed to approve deletion: " + err.message);
    }
  };

  const deleteAccount = useCallback(async () => {
    if (!user || !deletionRequest) {
      setError("No user or deletion request found.");
      return;
    }

    const allApproved = activeSessions.every((session) => session.approvedDeletion);
    if (!allApproved) {
      setError("Not all active sessions have approved the deletion.");
      return;
    }

    try {
      // Delete all user-related data from Firestore
      const collections = ["vehicles", "drivers", "reports", "tracking", "sessions", "deletionRequests"];
      for (const coll of collections) {
        const q = query(collection(db, coll), where("accountId", "==", user.uid));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map((docSnapshot) =>
          deleteDoc(doc(db, coll, docSnapshot.id))
        );
        await Promise.all(deletePromises); // Wait for all deletions to complete
      }

      // Reauthenticate user if needed (Firebase requires recent sign-in for deleteUser)
      if (password) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }

      // Delete the Firebase Auth user
      await deleteUser(auth.currentUser);

      localStorage.clear();
      navigate("/login");
      setError(null);
    } catch (err) {
      console.error("Deletion error:", err);
      if (err.code === "auth/requires-recent-login") {
        setError("Please provide your password to confirm account deletion (recent login required).");
        setShowDeleteModal(true); // Show modal again to prompt for password
      } else {
        setError("Failed to delete account: " + err.message);
      }
    }
  }, [user, deletionRequest, activeSessions, navigate, password]);

  useEffect(() => {
    if (deletionRequest && activeSessions.length > 0) {
      const allApproved = activeSessions.every((session) => session.approvedDeletion);
      if (allApproved) {
        deleteAccount();
      }
    }
  }, [deletionRequest, activeSessions, deleteAccount]);

  return (
    <motion.div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column", ...themeStyles }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <header
        style={{
          background: darkMode ? "rgba(0, 0, 0, 0.5)" : "#e5e7eb",
          padding: "12px 16px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", display: "flex", alignItems: "center", color: darkMode ? "#facc15" : "#1f2937" }}>
            <User style={{ marginRight: "8px" }} /> Profile
          </h1>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button onClick={() => navigate("/dashboard")}>Back</Button>
            <Button onClick={handleLogout} className="bg-gradient-to-r from-red-500 to-red-700 border-red-300">
              <LogOut size={16} style={{ marginRight: "4px" }} /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main style={{ flexGrow: 1, padding: "16px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <motion.div style={{ background: themeStyles.cardBg, padding: "24px", borderRadius: "8px", border: themeStyles.cardBorder, boxShadow: themeStyles.cardGlow }}>
            <h2 style={{ color: darkMode ? "#facc15" : "#1f2937", marginBottom: "16px" }}>User Info</h2>
            {error && <p style={{ color: "#ef4444", marginBottom: "12px" }}>{error}</p>}
            <p>Email: {user?.email || "N/A"}</p>
            <p>Role: {localStorage.getItem("role") || "N/A"}</p>
            <div style={{ marginTop: "16px" }}>
              <Button
                onClick={() => setShowDeleteModal(true)}
                className="bg-gradient-to-r from-red-600 to-red-800 border-red-400"
                disabled={deletionRequest}
              >
                <Trash2 size={16} style={{ marginRight: "4px" }} /> Delete Account
              </Button>
            </div>

            {deletionRequest && (
              <div style={{ marginTop: "16px" }}>
                <h3 style={{ color: darkMode ? "#facc15" : "#1f2937", marginBottom: "8px" }}>Account Deletion Request</h3>
                <p>Waiting for approval from all active sessions ({activeSessions.length} total):</p>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {activeSessions.map((session) => (
                    <li key={session.id} style={{ marginBottom: "8px" }}>
                      Device {session.deviceId === deviceId ? "(This Device)" : ""}:{" "}
                      {session.approvedDeletion ? "Approved" : "Pending"}
                    </li>
                  ))}
                </ul>
                {!activeSessions.find((s) => s.deviceId === deviceId)?.approvedDeletion && (
                  <Button onClick={approveDeletion} className="bg-gradient-to-r from-green-500 to-green-700 border-green-300">
                    Approve Deletion
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {showDeleteModal && (
        <motion.div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 20 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div
            style={{
              background: themeStyles.cardBg,
              maxWidth: "500px",
              margin: "40px auto",
              padding: "24px",
              borderRadius: "8px",
              border: themeStyles.cardBorder,
              boxShadow: themeStyles.cardGlow,
            }}
          >
            <h2 style={{ color: darkMode ? "#facc15" : "#1f2937", marginBottom: "16px" }}>Confirm Account Deletion</h2>
            <p style={{ marginBottom: "16px" }}>
              Deleting your account will remove all associated data permanently. This action requires approval from all active sessions ({activeSessions.length} total). Are you sure you want to proceed?
            </p>
            {error?.includes("recent login") && (
              <div style={{ marginBottom: "16px" }}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: themeStyles.cardBorder,
                    background: darkMode ? "#1a0033" : "#fff",
                    color: darkMode ? "#fff" : "#000",
                    width: "100%",
                  }}
                />
              </div>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <Button onClick={initiateAccountDeletion} className="bg-gradient-to-r from-red-600 to-red-800 border-red-400">
                Yes, Initiate Deletion
              </Button>
              <Button onClick={() => {
                setShowDeleteModal(false);
                setPassword("");
                setError(null);
              }}>Cancel</Button>
            </div>
          </div>
        </motion.div>
      )}

      <footer
        style={{
          background: darkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.9)",
          padding: "16px",
          textAlign: "center",
          color: darkMode ? "#9ca3af" : "#6b7280",
          fontSize: "14px",
        }}
      >
        © {new Date().getFullYear()} FleetTraq
      </footer>
    </motion.div>
  );
};

export default Profile;
