import React, { useState } from "react";
import { Copy, Check, KeyRound, Share2, RefreshCw } from "lucide-react";
import Button from "./Button";

const FleetOrganizationIdCard = ({
  inviteCode,
  darkMode,
  className = "",
  compact = false,
  title = "Driver Invite Code",
  description = "Share this code with drivers when they sign up. It links them to your fleet without exposing your account ID.",
  onRegenerate,
  regenerating = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!inviteCode) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const shellClass = `rounded-xl border ${
    darkMode ? "bg-yellow-500/10 border-yellow-500/30" : "bg-yellow-50 border-yellow-200"
  } ${compact ? "p-2" : "p-3"} ${className}`;

  const codeClass = `font-mono font-bold tracking-wider rounded-md border ${
    darkMode
      ? "bg-gray-950 text-yellow-400 border-yellow-500/50"
      : "bg-white text-gray-900 border-yellow-300"
  } ${compact ? "text-sm px-2 py-0.5" : "text-base px-2.5 py-1"}`;

  const actions = (
    <div className={`flex items-center shrink-0 ${compact ? "gap-1" : "gap-1.5"}`}>
      <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copied" : compact ? "Copy" : "Copy code"}
      </Button>
      {onRegenerate && (
        <Button type="button" variant="outline" size="sm" onClick={onRegenerate} disabled={regenerating}>
          <RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />
          {regenerating ? "…" : "New code"}
        </Button>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className={shellClass}>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex items-center gap-1.5 min-w-0">
            <KeyRound className="w-3.5 h-3.5 shrink-0 text-yellow-500" />
            <span className={`text-xs font-medium truncate ${darkMode ? "text-yellow-100" : "text-yellow-900"}`}>
              {title}
            </span>
          </div>
          <code className={`${codeClass} w-fit max-w-full overflow-x-auto`}>{inviteCode}</code>
          <div className="flex flex-wrap items-center gap-1 sm:ml-auto">{actions}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <KeyRound className="w-3.5 h-3.5 shrink-0 text-yellow-500" />
          <span className={`text-sm font-medium ${darkMode ? "text-yellow-100" : "text-yellow-900"}`}>
            {title}
          </span>
        </div>
        <code className={codeClass}>{inviteCode}</code>
        <div className="ml-auto">{actions}</div>
      </div>
      {description && (
        <p className={`text-xs mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{description}</p>
      )}
      <p className={`text-xs mt-1.5 flex items-center gap-1 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
        <Share2 size={11} />
        Drivers enter this on the sign-up page under &quot;Fleet Invite Code&quot;.
      </p>
    </div>
  );
};

export default FleetOrganizationIdCard;
