import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff } from "lucide-react";
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!name || !email || !password || !confirmPassword || !role) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });
      
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        role,
        createdAt: new Date().toISOString()
      });

      const idToken = await user.getIdToken();
      localStorage.setItem("token", idToken);
      localStorage.setItem("role", role);
      localStorage.setItem("profilePicture", "https://via.placeholder.com/150");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Signup error:", err.message, err.code);
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setIsLoading(true);

    if (!role) {
      setError("Please select a role");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName || "Unknown",
        email: user.email,
        role,
        createdAt: new Date().toISOString()
      }, { merge: true });

      const idToken = await user.getIdToken();
      localStorage.setItem("token", idToken);
      localStorage.setItem("role", role);
      localStorage.setItem(
        "profilePicture",
        user.photoURL || "https://via.placeholder.com/150"
      );
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Google signup error:", err.message, err.code);
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const getFirebaseErrorMessage = (code) => {
    switch (code) {
      case "auth/email-already-in-use":
        return "Email already in use";
      case "auth/invalid-email":
        return "Invalid email format";
      case "auth/weak-password":
        return "Password should be at least 6 characters";
      case "auth/popup-closed-by-user":
        return "Google signup cancelled";
      case "auth/popup-blocked":
        return "Popup blocked by browser. Please allow popups";
      case "auth/network-request-failed":
        return "Network error. Please check your connection";
      case "auth/unauthorized-domain":
        return "This domain is not authorized for Google signup. Please contact support.";
      default:
        return "Signup failed. Please try again";
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "18px",
    marginBottom: "16px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    background: "rgba(255, 255, 255, 0.9)",
    color: "#333",
    fontSize: "16px",
    outline: "none",
    transition: "border-color 0.3s",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to right, #4A00E0, #8E2DE2)",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to right, #6a00f4, #ff0080, #ff8c00)",
          opacity: 0.3,
          filter: "blur(50px)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: "650px",
          padding: "60px",
          background: "rgba(20, 20, 20, 0.9)",
          borderRadius: "20px",
          boxShadow: "0px 6px 15px rgba(0, 0, 0, 0.4)",
          textAlign: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        <button
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            background: "none",
            border: "none",
            color: "white",
            fontSize: "24px",
            cursor: "pointer",
            transition: "color 0.3s",
          }}
          onClick={() => navigate("/")}
          onMouseOver={(e) => (e.target.style.color = "#FFD700")}
          onMouseOut={(e) => (e.target.style.color = "white")}
          disabled={isLoading}
        >
          ←
        </button>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "30px", color: "#FFD700" }}>
          Sign Up
        </h1>
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: "rgba(255, 0, 0, 0.2)",
                color: "#ff9999",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px",
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        <form onSubmit={handleSignup}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <input
              style={inputStyle}
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.3)")}
              disabled={isLoading}
              required
            />
            <input
              style={inputStyle}
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.3)")}
              disabled={isLoading}
              required
            />
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inputStyle, paddingRight: "48px" }}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.3)")}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#333",
                  padding: "0",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...inputStyle, paddingRight: "48px" }}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.3)")}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#333",
                  padding: "0",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.3)")}
              disabled={isLoading}
            >
              <option value="" disabled>
                Select Role
              </option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="driver">Driver</option>
            </select>
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "18px",
                fontSize: "18px",
                fontWeight: "bold",
                color: "white",
                background: "linear-gradient(to right, #4A00E0, #8E2DE2)",
                borderRadius: "8px",
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "transform 0.2s",
                opacity: isLoading ? 0.7 : 1,
              }}
              onMouseOver={(e) => !isLoading && (e.target.style.transform = "scale(1.05)")}
              onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
              disabled={isLoading}
            >
              {isLoading ? "Signing Up..." : "Sign Up with Email"}
            </button>
          </div>
        </form>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", margin: "20px 0" }}>
          <div style={{ height: "1px", width: "40%", background: "rgba(255, 255, 255, 0.3)" }}></div>
          <span style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)" }}>or Sign up with</span>
          <div style={{ height: "1px", width: "40%", background: "rgba(255, 255, 255, 0.3)" }}></div>
        </div>
        <button
          style={{
            width: "100%",
            padding: "18px",
            fontSize: "18px",
            fontWeight: "bold",
            color: "white",
            background: "linear-gradient(to right, #4285f4, #3267d6)",
            borderRadius: "8px",
            border: "none",
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            transition: "transform 0.2s",
            opacity: isLoading ? 0.7 : 1,
          }}
          onClick={handleGoogleSignup}
          onMouseOver={(e) => !isLoading && (e.target.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
          disabled={isLoading}
        >
          <FcGoogle style={{ fontSize: "24px" }} />
          Google
        </button>
        <p style={{ fontSize: "16px", marginTop: "20px", color: "white" }}>
          Already have an account?{" "}
          <button
            style={{ color: "#FFD700", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => navigate("/login")}
            disabled={isLoading}
          >
            Login
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
