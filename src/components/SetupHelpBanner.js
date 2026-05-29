import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";

const SetupHelpBanner = ({ darkMode, className = "" }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/help")}
      className={`w-full text-left rounded-2xl p-4 border flex items-center justify-between gap-3 transition-colors ${
        darkMode
          ? "bg-white/5 border-white/10 hover:bg-white/10 text-white"
          : "bg-white border-gray-200 hover:border-yellow-400 text-gray-900"
      } ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <BookOpen className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Need setup help?</p>
          <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Open Help &amp; Setup for organized administrator and driver checklists.
          </p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-yellow-500 shrink-0" />
    </button>
  );
};

export default SetupHelpBanner;
