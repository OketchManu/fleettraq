import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Shield, ArrowLeft, Home, Sun, Moon } from "lucide-react";
import { createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, updateProfile, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { useFleet } from "../context/FleetContext";
import { friendlyAuthError } from "../utils/authErrors";
import { resolveInviteCode, ensureFleetInvite, incrementInviteUse } from "../utils/fleetInvite";
import GoogleSignInButton from "./GoogleSignInButton";
import AuthLegalNotice from "./AuthLegalNotice";
import LegalFooterLinks from "./LegalFooterLinks";

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
  const [fleetInviteCode, setFleetInviteCode] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);


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
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    if (role !== "admin" && role !== "driver") {
      setError("Please select Administrator or Driver");
      setIsLoading(false);
      return;
    }

    if (role === "driver" && !fleetInviteCode.trim()) {
      setError("Drivers must enter the invite code provided by their fleet administrator.");
      setIsLoading(false);
      return;
    }

    if (!acceptedLegal) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const isDriverRole = role === "driver";

      let organizationId = user.uid;
      let inviteCodeUsed = null;

      if (isDriverRole) {
        const invite = await resolveInviteCode(fleetInviteCode);
        if (!invite) {
          await signOut(auth);
          throw new Error("Invalid or expired invite code. Ask your fleet administrator for a current code.");
        }
        organizationId = invite.organizationId;
        inviteCodeUsed = invite.code;
      }

      await updateProfile(user, { displayName: name });

      const profile = {
        name,
        email,
        role,
        organizationId,
        membershipStatus: isDriverRole ? "pending" : "active",
        createdAt: new Date().toISOString(),
      };
      if (inviteCodeUsed) {
        profile.inviteCodeUsed = inviteCodeUsed;
      }

      await setDoc(doc(db, "users", user.uid), profile);

      if (inviteCodeUsed) {
        await incrementInviteUse(inviteCodeUsed);
      }

      if (!isDriverRole) {
        await ensureFleetInvite(user.uid);
      }

      await setDoc(doc(db, "userSettings", `${user.uid}_user`), { darkMode }, { merge: true });

      localStorage.setItem("role", role);
      localStorage.setItem("profilePicture", `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`);
      
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Signup error:", err.code, err.message);
      setError(err.message && !err.code ? err.message : friendlyAuthError(err, "signup"));
    } finally {
      setIsLoading(false);
    }
  };

  const completeGoogleSignup = async (user, roleArg, orgIdArg, inviteCodeUsedArg = null) => {
    const isDriverRole = roleArg === "driver";
    const organizationId = isDriverRole ? orgIdArg : user.uid;

    const profile = {
      name: user.displayName,
      email: user.email,
      role: roleArg,
      organizationId,
      membershipStatus: isDriverRole ? "pending" : "active",
      createdAt: new Date().toISOString(),
    };
    if (inviteCodeUsedArg) {
      profile.inviteCodeUsed = inviteCodeUsedArg;
    }

    await setDoc(doc(db, "users", user.uid), profile, { merge: true });

    if (inviteCodeUsedArg) {
      await incrementInviteUse(inviteCodeUsedArg);
    }

    if (!isDriverRole) {
      await ensureFleetInvite(user.uid);
    }

    await setDoc(doc(db, "userSettings", `${user.uid}_user`), { darkMode }, { merge: true });

    localStorage.setItem("role", roleArg);
    localStorage.setItem("profilePicture", user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "User")}`);

    navigate("/dashboard", { replace: true });
  };

  // Complete a Google sign-up that fell back to a full-page redirect.
  useEffect(() => {
    const finishRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!result?.user) return;
        const pendingRole = sessionStorage.getItem("pendingGoogleRole");
        const pendingInviteRaw = sessionStorage.getItem("pendingGoogleInviteCode") || "";
        sessionStorage.removeItem("pendingGoogleRole");
        sessionStorage.removeItem("pendingGoogleOrgId");
        sessionStorage.removeItem("pendingGoogleInviteCode");
        if (!pendingRole) return;
        setIsLoading(true);
        if (pendingRole === "driver") {
          const invite = await resolveInviteCode(pendingInviteRaw);
          if (!invite) {
            await signOut(auth);
            setError("Invalid or expired invite code. Ask your fleet administrator for a current code.");
            setIsLoading(false);
            return;
          }
          await completeGoogleSignup(result.user, pendingRole, invite.organizationId, invite.code);
        } else {
          await completeGoogleSignup(result.user, pendingRole, result.user.uid, null);
        }
      } catch (err) {
        console.error("Google redirect signup error:", err.code, err.message);
        setError(friendlyAuthError(err, "signup"));
        setIsLoading(false);
      }
    };
    finishRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleSignup = async () => {
    setError("");

    if (!role) {
      setError("Please select a role");
      return;
    }

    if (role !== "admin" && role !== "driver") {
      setError("Please select Administrator or Driver");
      return;
    }

    if (role === "driver" && !fleetInviteCode.trim()) {
      setError("Drivers must enter the fleet invite code before signing up with Google.");
      return;
    }

    if (!acceptedLegal) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (role === "driver") {
        const invite = await resolveInviteCode(fleetInviteCode);
        if (!invite) {
          await signOut(auth);
          throw new Error("Invalid or expired invite code. Ask your fleet administrator for a current code.");
        }
        await completeGoogleSignup(result.user, role, invite.organizationId, invite.code);
      } else {
        await completeGoogleSignup(result.user, role, result.user.uid, null);
      }
    } catch (err) {
      console.error("Google signup error:", err.code, err.message);
      // If the popup was blocked/closed by the browser, fall back to a redirect.
      if (
        err.code === "auth/popup-blocked" ||
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        try {
          sessionStorage.setItem("pendingGoogleRole", role);
          sessionStorage.setItem("pendingGoogleInviteCode", fleetInviteCode.trim().toUpperCase());
          sessionStorage.removeItem("pendingGoogleOrgId");
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          console.error("Google redirect signup error:", redirectErr.code, redirectErr.message);
          setError(friendlyAuthError(redirectErr, "signup"));
        }
      } else {
        setError(friendlyAuthError(err, "signup"));
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
          className={`backdrop-blur-xl rounded-2xl p-4 sm:p-8 border shadow-2xl ${
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
                <option value="driver" className="text-gray-800">
                  Driver
                </option>
              </select>
              <p className={`text-xs mt-1.5 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                Required before creating an account or using Google sign-up.
              </p>
            </div>

            {role === "driver" && (
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Fleet Invite Code *
                </label>
                <input
                  type="text"
                  value={fleetInviteCode}
                  onChange={(e) => setFleetInviteCode(e.target.value.toUpperCase())}
                  className={`w-full px-4 py-3 border rounded-xl font-mono text-sm tracking-widest uppercase focus:outline-none focus:border-yellow-500 transition-all ${
                    darkMode
                      ? "bg-white/10 border-white/20 text-white placeholder-gray-500"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  }`}
                  placeholder="e.g. X7K9MP2R"
                  disabled={isLoading}
                  required
                />
                <p className={`text-xs mt-1.5 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                  Ask your fleet administrator for this code. Your account will be pending until they approve you.
                </p>
              </div>
            )}

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

            <label className={`flex items-start gap-3 cursor-pointer text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              <input
                type="checkbox"
                checked={acceptedLegal}
                onChange={(e) => setAcceptedLegal(e.target.checked)}
                className="mt-1 w-4 h-4 rounded accent-yellow-500 shrink-0"
                disabled={isLoading}
              />
              <span>
                I agree to the{" "}
                <button type="button" onClick={() => navigate("/terms")} className="text-yellow-600 dark:text-yellow-400 underline">
                  Terms of Service
                </button>{" "}
                and{" "}
                <button type="button" onClick={() => navigate("/privacy")} className="text-yellow-600 dark:text-yellow-400 underline">
                  Privacy Policy
                </button>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading || !acceptedLegal}
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

          <GoogleSignInButton
            onClick={handleGoogleSignup}
            isLoading={isLoading}
            role={role}
            darkMode={darkMode}
            label="Sign up with Google"
            driverNeedsInviteCode={role === "driver" && !fleetInviteCode.trim()}
          />

          <p className={`mt-6 text-center text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-yellow-600 dark:text-yellow-400 font-semibold hover:underline"
            >
              Sign in
            </button>
          </p>

          <AuthLegalNotice darkMode={darkMode} className="mt-4" />
          <LegalFooterLinks className="mt-3" />
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;