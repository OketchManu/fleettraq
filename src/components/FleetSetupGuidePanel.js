import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import FleetSetupGuide from "./FleetSetupGuide";
import { getSetupGuidePreference, setSetupGuidePreference, isSetupGuideVisible } from "../utils/setupGuidePrefs";

const FleetSetupGuidePanel = ({
  darkMode,
  variant = "full",
  className = "",
  userId,
  fleetSetupComplete = false,
  organizationId,
}) => {
  const [visible, setVisible] = useState(() =>
    isSetupGuideVisible(userId, fleetSetupComplete)
  );

  useEffect(() => {
    setVisible(isSetupGuideVisible(userId, fleetSetupComplete));
  }, [userId, fleetSetupComplete]);

  const toggle = () => {
    const next = !visible;
    setVisible(next);
    if (userId) setSetupGuidePreference(userId, next);
  };

  const pref = userId ? getSetupGuidePreference(userId) : null;
  const statusHint =
    fleetSetupComplete && pref === null
      ? "Setup looks complete — instructions are tucked away."
      : fleetSetupComplete
        ? "Setup complete. Open these steps anytime if you need a refresher."
        : "Follow these steps to connect drivers and live GPS tracking.";

  return (
    <div
      className={`rounded-2xl border ${
        darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
      } ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-start gap-2 min-w-0">
          <BookOpen className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
              Fleet setup instructions
            </h3>
            <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {statusHint}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
            darkMode
              ? "bg-white/10 text-yellow-400 hover:bg-white/15"
              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
          }`}
        >
          {visible ? (
            <>
              <ChevronUp size={16} />
              Hide instructions
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              Show instructions
            </>
          )}
        </button>
      </div>

      {visible && (
        <div className={`px-4 pb-4 border-t ${darkMode ? "border-white/10" : "border-gray-100"}`}>
          <FleetSetupGuide
            darkMode={darkMode}
            variant={variant}
            organizationId={organizationId}
            className="pt-4"
          />
        </div>
      )}
    </div>
  );
};

export default FleetSetupGuidePanel;
