import React from "react";
import { ChevronLeft } from "lucide-react";

/**
 * Standard page header for AppLayout pages (non-sticky — FleetNavBar is the sticky chrome).
 */
const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  iconClassName = "text-yellow-500",
  darkMode,
  onBack,
  backLabel = "Go back",
  actions,
  className = "",
}) => (
  <header
    className={`border-b ${
      darkMode ? "border-white/10 bg-[#0a0a1a]/90" : "border-gray-200 bg-white"
    } ${className}`}
  >
    <div className="app-page-main py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className={`p-2 rounded-xl shrink-0 ${
              darkMode ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-800"
            }`}
            aria-label={backLabel}
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <div className="min-w-0">
          <h1
            className={`text-base sm:text-lg md:text-xl font-bold flex items-center gap-2 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {Icon && <Icon className={`shrink-0 ${iconClassName}`} size={22} />}
            <span className="truncate">{title}</span>
          </h1>
          {subtitle && (
            <p className={`text-xs mt-0.5 line-clamp-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  </header>
);

export default PageHeader;
