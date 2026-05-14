import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff, Mail, Lock, User, Shield, ArrowLeft, Home, Sun, Moon } from "lucide-react";
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { useFleet } from "../context/FleetContext";

const Signup = () => {
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useFleet();
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
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
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

      await setDoc(doc(db, "userSettings", `${user.uid}_user`), { darkMode }, { merge: true });

      const idToken = await user.getIdToken();
      localStorage.setItem("token", idToken);
      localStorage.setItem("role", role);
      localStorage.setItem("profilePicture", `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`);
      
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Signup error:", err.message);
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
        name: user.displayName,
        email: user.email,
        role,
        createdAt: new Date().toISOString()
      }, { merge: true });

      await setDoc(doc(db, "userSettings", `${user.uid}_user`), { darkMode }, { merge: true });

      const idToken = await user.getIdToken();
      localStorage.setItem("token", idToken);
      localStorage.setItem("role", role);
      localStorage.setItem("profilePicture", user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "User")}`);
      
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Google signup error:", err.message);
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const getFirebaseErrorMessage = (code) => {
    switch (code) {
      case "auth/email-already-in-use":
        return "Email already in use. Please login instead.";
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
      default:
        return "Signup failed. Please try again";
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
            <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Create Account</h1>
            <p className={`mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Start managing your fleet today</p>
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

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-all ${
                    darkMode
                      ? "bg-white/10 border-white/20 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  placeholder="John Doe"
                  disabled={isLoading}
                  required
                />
              </div>
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
              <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Select Role</label>
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
                <option value="manager" className="text-gray-800">
                  Fleet Manager
                </option>
                <option value="driver" className="text-gray-800">
                  Driver
                </option>
              </select>
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

            <div>
              <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    darkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold hover:shadow-lg hover:shadow-yellow-500/25 transition-all disabled:opacity-50"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${darkMode ? "border-white/20" : "border-gray-200"}`} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-4 ${darkMode ? "bg-transparent text-gray-400" : "bg-white text-gray-500"}`}>
                Or sign up with
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={isLoading || !role}
            className={`w-full py-3 rounded-xl border font-semibold flex items-center justify-center gap-3 transition-all disabled:opacity-50 ${
              darkMode
                ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                : "bg-white border-gray-300 text-gray-800 hover:bg-gray-50 shadow-sm"
            }`}
          >
            <FcGoogle className="w-5 h-5" />
            Google
          </button>

          <p className={`mt-6 text-center text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-yellow-600 dark:text-yellow-400 font-semibold hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;