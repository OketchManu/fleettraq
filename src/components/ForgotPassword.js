import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { ArrowLeft, Mail, Sun, Moon } from "lucide-react";
import { useFleet } from "../context/FleetContext";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useFleet();
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

  const fieldClass = `w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all ${
    darkMode
      ? "bg-white/10 border-white/20 text-white placeholder-gray-500"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
  }`;

  return (
    <div
      className={`relative min-h-screen flex items-center justify-center p-4 overflow-hidden ${
        darkMode
          ? "bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950"
          : "bg-gradient-to-br from-slate-100 via-indigo-50 to-amber-50"
      }`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-24 left-8 w-80 h-80 rounded-full blur-3xl ${
            darkMode ? "bg-purple-600/20" : "bg-indigo-200/60"
          }`}
        />
        <div
          className={`absolute bottom-16 right-8 w-96 h-96 rounded-full blur-3xl ${
            darkMode ? "bg-amber-500/10" : "bg-amber-200/50"
          }`}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative z-10 w-full max-w-md rounded-2xl border p-8 shadow-2xl backdrop-blur-xl ${
          darkMode ? "bg-black/50 border-white/10" : "bg-white/95 border-gray-200"
        }`}
      >
        <div className="flex justify-between items-start mb-6">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
            }`}
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </button>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg border ${
              darkMode
                ? "border-white/20 bg-white/10 text-yellow-400"
                : "border-gray-300 bg-white text-gray-800"
            }`}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <h1
          className={`text-2xl font-bold mb-2 ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Reset password
        </h1>
        <p className={`text-sm mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Enter the email for your FleetTraq account. We will send you a reset link.
        </p>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 p-3 rounded-xl text-sm border bg-red-500/15 border-red-500/40 text-red-800 dark:text-red-200"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 p-3 rounded-xl text-sm border bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-200"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${fieldClass} pl-11`}
              disabled={isLoading}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:shadow-lg hover:shadow-yellow-500/25 transition-all disabled:opacity-60"
          >
            {isLoading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
