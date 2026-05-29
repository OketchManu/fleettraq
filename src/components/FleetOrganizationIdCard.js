import React, { useState } from "react";
import { Copy, Check, Shield, Share2 } from "lucide-react";
import Button from "./Button";

const FleetOrganizationIdCard = ({
  fleetId,
  darkMode,
  className = "",
  compact = false,
  title = "Fleet Organization ID",
  description = "Share this ID with drivers when they sign up so they join your fleet.",
}) => {
  const [copied, setCopied] = useState(false);

  if (!fleetId) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fleetId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border ${
        darkMode ? "bg-yellow-500/10 border-yellow-500/30" : "bg-yellow-50 border-yellow-200"
      } ${compact ? "p-3" : "p-4"} ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`font-medium flex items-center gap-2 ${
              compact ? "text-sm" : "text-sm mb-1"
            } ${darkMode ? "text-yellow-100" : "text-yellow-900"}`}
          >
            <Shield className="w-4 h-4 shrink-0 text-yellow-500" />
            {title}
          </p>
          {!compact && (
            <p className={`text-xs mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {description}
            </p>
          )}
          <code
            className={`block text-xs sm:text-sm break-all rounded-lg px-3 py-2 ${
              darkMode ? "bg-black/40 text-white" : "bg-white text-gray-900 border border-gray-200"
            }`}
          >
            {fleetId}
          </code>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy ID"}
        </Button>
      </div>
      {!compact && (
        <p className={`text-xs mt-2 flex items-center gap-1 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
          <Share2 size={12} />
          Drivers enter this on the sign-up page under &quot;Fleet Organization ID&quot;.
        </p>
      )}
    </div>
  );
};

export default FleetOrganizationIdCard;
