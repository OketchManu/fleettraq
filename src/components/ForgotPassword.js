import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!email) {
      setError("Please enter your email");
      setIsLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset link sent to your email.");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(
        err.message.includes("user-not-found")
          ? "No user found with this email."
          : "Failed to send reset link. Please try again."
      );
    } finally {
      setIsLoading(false);
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
          onClick={() => navigate("/login")}
          onMouseOver={(e) => (e.target.style.color = "#FFD700")}
          onMouseOut={(e) => (e.target.style.color = "white")}
          disabled={isLoading}
        >
          ←
        </button>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "30px", color: "#FFD700" }}>
          Forgot Password
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
              }}
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: "rgba(16, 185, 129, 0.2)",
                color: "#6ee7b7",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;