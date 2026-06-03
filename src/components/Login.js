/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Shield, ArrowLeft, Home, Sun, Moon } from "lucide-react";
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button";
import GoogleSignInButton from "./GoogleSignInButton";

import { useFleet } from "../context/FleetContext";
import { normalizeRole } from "../utils/fleetAccess";
import { friendlyAuthError } from "../utils/authErrors";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, setDarkMode } = useFleet();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const msg = location.state?.authError;
    if (typeof msg === "string" && msg) {
      setError(msg);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email || !password) {
      setError("Please enter your email and password");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await auth.signOut();
        setError(
          "This email is not registered with FleetTraq yet. Please create an account on the sign-up page, or ask your fleet administrator for your invite code."
        );
        setIsLoading(false);
        return;
      }

      const registeredRole = normalizeRole(userDoc.data().role);
      if (role && registeredRole !== role) {
        const roleLabel = registeredRole === "admin" ? "Administrator" : "Driver";
        setError(`This account is registered as ${roleLabel}. Please select ${roleLabel} above and try again.`);
        setIsLoading(false);
        return;
      }

      localStorage.setItem("role", registeredRole);
      localStorage.setItem(
        "profilePicture",
        user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}`
      );

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login error:", err.code, err.message);
      setError(friendlyAuthError(err, "login"));
    } finally {
      setIsLoading(false);
    }
  };

  const completeGoogleLogin = async (user, roleArg) => {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      await auth.signOut();
      setError(
        "This Google account is not registered with FleetTraq yet. Please sign up first on the sign-up page."
      );
      setIsLoading(false);
      return;
    }

    const registeredRole = normalizeRole(userDoc.data().role);
    if (roleArg && registeredRole !== roleArg) {
      const roleLabel = registeredRole === "admin" ? "Administrator" : "Driver";
      await auth.signOut();
      setError(`This account is registered as ${roleLabel}. Please select ${roleLabel} above and try again.`);
      setIsLoading(false);
      return;
    }

    localStorage.setItem("role", registeredRole);
    localStorage.setItem("profilePicture", user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "User")}`);

    navigate("/dashboard", { replace: true });
  };

  // Complete a Google login that fell back to a full-page redirect.
  useEffect(() => {
    const finishRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!result?.user) return;
        const pendingRole = sessionStorage.getItem("pendingGoogleRole");
        sessionStorage.removeItem("pendingGoogleRole");
        setIsLoading(true);
        if (!pendingRole) {
          await completeGoogleLogin(result.user, null);
          return;
        }
        await completeGoogleLogin(result.user, pendingRole);
      } catch (err) {
        console.error("Google redirect login error:", err.code, err.message);
        setError(friendlyAuthError(err, "login"));
        setIsLoading(false);
      }
    };
    finishRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      await completeGoogleLogin(result.user, role || null);
    } catch (err) {
      console.error("Google login error:", err.code, err.message);
      if (
        err.code === "auth/popup-blocked" ||
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        try {
          sessionStorage.setItem("pendingGoogleRole", role);
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          console.error("Google redirect login error:", redirectErr.code, redirectErr.message);
          setError(friendlyAuthError(redirectErr, "login"));
        }
      } else {
        setError(friendlyAuthError(err, "login"));
      }
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`relative min-h-screen flex items-center justify-center p-4 overflow-hidden ${
        darkMode
          ? "bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900"
          : "bg-gradient-to-br from-slate-100 via-gray-50 to-amber-50"
      }`}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-20 left-10 w-72 h-72 rounded-full filter blur-3xl animate-pulse ${
            darkMode ? "bg-purple-500 opacity-20" : "bg-amber-300 opacity-30"
          }`}
        />
        <div
          className={`absolute bottom-20 right-10 w-96 h-96 rounded-full filter blur-3xl animate-pulse delay-1000 ${
            darkMode ? "bg-blue-500 opacity-20" : "bg-violet-300 opacity-25"
          }`}
        />
        <div
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full filter blur-3xl ${
            darkMode ? "bg-yellow-500 opacity-10" : "bg-yellow-200 opacity-40"
          }`}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md z-10"
      >
        {/* Top bar */}
        <div className="mb-4 flex justify-between items-center gap-2">
          <button
            onClick={() => navigate("/")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all group border ${
              darkMode
                ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                : "bg-white hover:bg-gray-50 text-gray-800 border-gray-300 shadow-sm"
            }`}
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg border transition-all ${
                darkMode
                  ? "bg-white/10 border-white/20 text-yellow-400"
                  : "bg-white border-gray-300 text-gray-800 shadow-sm"
              }`}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-600 flex items-center justify-center shrink-0">
              <Home className="w-5 h-5 text-black" />
            </div>
          </div>
        </div>

        <div
          className={`backdrop-blur-xl rounded-2xl p-8 border shadow-2xl ${
            darkMode ? "bg-black/40 border-white/10" : "bg-white/95 border-gray-200"
          }`}
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-black" />
            </div>
            <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Welcome Back</h1>
            <p className={`mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Sign in to your FleetTraq account</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-800 dark:text-red-200 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Select Role <span className="text-xs font-normal opacity-70">(optional — we detect it from your account)</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-yellow-500 transition-all ${
                  darkMode
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                disabled={isLoading}
              >
                <option value="" disabled className="text-gray-800">
                  Select your role
                </option>
                <option value="admin" className="text-gray-800">
                  Administrator
                </option>
                <option value="driver" className="text-gray-800">
                  Driver
                </option>
              </select>
              <p className={`text-xs mt-1.5 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                Optional. Leave blank and we&apos;ll detect Administrator or Driver from your account.
              </p>
            </div>

            <div>
              <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-all ${
                    darkMode
                      ? "bg-white/10 border-white/20 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  placeholder="you@example.com"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-all ${
                    darkMode
                      ? "bg-white/10 border-white/20 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    darkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold hover:shadow-lg hover:shadow-yellow-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${darkMode ? "border-white/20" : "border-gray-200"}`} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-4 ${darkMode ? "bg-transparent text-gray-400" : "bg-white text-gray-500"}`}>Or continue with</span>
            </div>
          </div>

          <GoogleSignInButton
            onClick={handleGoogleLogin}
            isLoading={isLoading}
            role={role}
            darkMode={darkMode}
            label="Continue with Google"
          />

          <div className="mt-6 text-center space-y-2">
            <button
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-yellow-600 dark:text-yellow-400 hover:underline transition-colors"
            >
              Forgot password?
            </button>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-yellow-600 dark:text-yellow-400 font-semibold hover:underline"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;