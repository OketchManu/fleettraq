import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { Info } from "lucide-react";

const GoogleSignInButton = ({
  onClick,
  disabled = false,
  isLoading = false,
  role,
  darkMode,
  label = "Google",
  driverNeedsOrgId = false,
}) => {
  const [hovered, setHovered] = useState(false);

  const roleLabel = role === "admin" ? "Administrator" : role === "driver" ? "Driver" : null;
  const needsRole = !role;
  const needsOrgId = role === "driver" && driverNeedsOrgId;
  const showHint = hovered && (needsRole || needsOrgId);

  let hintText = "";
  if (needsRole) {
    hintText = "Select Administrator or Driver above before signing in with Google.";
  } else if (needsOrgId) {
    hintText = "Enter your Fleet Organization ID above before signing up with Google.";
  } else {
    hintText = `Continue with Google as ${roleLabel}.`;
  }

  const blocked = disabled || isLoading || needsRole || needsOrgId;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showHint && (
        <div
          role="tooltip"
          className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[min(100%,280px)] px-3 py-2 rounded-xl text-xs text-center shadow-lg border z-20 ${
            needsRole || needsOrgId
              ? darkMode
                ? "bg-amber-500/20 border-amber-500/40 text-amber-100"
                : "bg-amber-50 border-amber-300 text-amber-900"
              : darkMode
                ? "bg-slate-800 border-slate-600 text-gray-200"
                : "bg-white border-gray-200 text-gray-700"
          }`}
        >
          <Info size={14} className="inline mr-1 -mt-0.5" />
          {hintText}
        </div>
      )}

      <button
        type="button"
        onClick={onClick}
        disabled={blocked}
        title={hintText}
        aria-describedby={showHint ? "google-signin-hint" : undefined}
        className={`w-full py-3 rounded-xl border font-semibold flex items-center justify-center gap-3 transition-all ${
          blocked ? "opacity-50 cursor-not-allowed" : ""
        } ${
          darkMode
            ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
            : "bg-white border-gray-300 text-gray-800 hover:bg-gray-50 shadow-sm"
        }`}
      >
        <FcGoogle className="w-5 h-5" />
        {label}
      </button>

      {(needsRole || needsOrgId) && (
        <p className={`text-xs text-center mt-2 ${darkMode ? "text-amber-300/90" : "text-amber-700"}`}>
          {needsRole
            ? "Choose your role above, then use Google sign-in."
            : "Paste your Fleet Organization ID above, then use Google sign-up."}
        </p>
      )}
    </div>
  );
};

export default GoogleSignInButton;
