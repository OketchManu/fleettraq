import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Truck,
  Settings,
  Users,
  Activity,
  FileText,
  Car,
  Menu,
  X,
  Moon,
  Sun,
  Fuel,
  Shield,
  ChevronDown,
  LayoutGrid,
  BookOpen,
  LogOut,
} from "lucide-react";
import NotificationBell from "./NotificationBell";

const FleetNavBar = ({ darkMode, onToggleDark, onLogout, user, canManageFleet, isDriver }) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  const role = user?.role || "";

  useEffect(() => {
    const close = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const quickLinks = [
    { label: "Tracking", path: "/tracking", icon: MapPin },
    { label: "Fuel", path: "/fuel-tracking", icon: Fuel },
    { label: "Help", path: "/help", icon: BookOpen },
  ];

  const moreSections = [
    {
      title: "Insights",
      items: [
        { label: "Analytics", path: "/analytics", icon: Activity },
        { label: "Reports", path: "/reports", icon: FileText },
      ],
    },
    {
      title: "Fleet",
      items: [
        { label: "Vehicles", path: "/vehicle-management", icon: Car },
        ...(canManageFleet ? [{ label: "Drivers", path: "/drivers", icon: Users }] : []),
      ],
    },
    {
      title: "Account",
      items: [
        { label: "Help & setup", path: "/help", icon: BookOpen },
        { label: "Account", path: "/user-settings", icon: Shield },
        ...(canManageFleet ? [{ label: "Fleet settings", path: "/settings", icon: Settings }] : []),
      ],
    },
  ];

  const go = (path) => {
    navigate(path);
    setMobileOpen(false);
    setMoreOpen(false);
  };

  const pillClass = (active) =>
    `flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
      active
        ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-md"
        : darkMode
          ? "bg-white/10 text-gray-100 hover:bg-white/15 border border-white/10"
          : "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200"
    }`;

  return (
    <>
      <header
        className={`sticky top-0 z-40 overflow-visible ${
          darkMode ? "bg-black/60 backdrop-blur-xl border-b border-white/10" : "bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-h-[48px] sm:min-h-[52px]">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 shrink-0 mr-0.5 sm:mr-1 min-w-0"
            >
              <Truck className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-500 shrink-0" />
              <span className={`font-bold text-base sm:text-xl hidden sm:inline truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
                Fleet<span className="text-yellow-500">Traq</span>
              </span>
            </button>

            {/* Desktop / tablet */}
            <div className="hidden md:flex flex-1 items-center justify-center min-w-0 gap-1.5 px-2">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className={pillClass(false)}
                title="Dashboard"
              >
                <LayoutGrid size={17} />
                <span className="hidden lg:inline">Home</span>
              </button>
              {quickLinks.map((item) => (
                <button key={item.path} type="button" onClick={() => go(item.path)} className={pillClass(false)}>
                  <item.icon size={17} />
                  <span className="hidden lg:inline">{item.label}</span>
                </button>
              ))}

              <div className="relative" ref={moreRef}>
                <button
                  type="button"
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    darkMode
                      ? "bg-white/10 text-gray-100 border-white/15 hover:bg-white/15"
                      : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50 shadow-sm"
                  }`}
                >
                  More
                  <ChevronDown size={16} className={moreOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                </button>
                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className={`absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl shadow-2xl border overflow-hidden z-[70] ${
                        darkMode ? "bg-slate-900 border-slate-600" : "bg-white border-gray-200"
                      }`}
                    >
                      {isDriver && (
                        <div
                          className={`px-3 py-2 text-xs border-b ${darkMode ? "bg-amber-500/10 border-slate-600 text-amber-200" : "bg-amber-50 border-gray-200 text-amber-900"}`}
                        >
                          Driver view: assigned vehicle and fleet activity only.
                        </div>
                      )}
                      {moreSections.map((section) => (
                        <div key={section.title} className={`py-2 ${darkMode ? "border-slate-700" : ""}`}>
                          <p
                            className={`px-4 pb-1 text-[10px] font-bold uppercase tracking-wider ${
                              darkMode ? "text-slate-500" : "text-gray-400"
                            }`}
                          >
                            {section.title}
                          </p>
                          {section.items.map((item) => (
                            <button
                              key={item.path}
                              type="button"
                              onClick={() => go(item.path)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                                darkMode ? "text-slate-100 hover:bg-slate-800" : "text-gray-800 hover:bg-gray-50"
                              }`}
                            >
                              <item.icon size={18} className="text-yellow-500 shrink-0" />
                              {item.label}
                            </button>
                          ))}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex-1 md:hidden" />

            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 overflow-visible">
              <NotificationBell />
              <button
                type="button"
                onClick={onToggleDark}
                className={`p-2 rounded-xl ${darkMode ? "bg-white/10 text-yellow-400" : "bg-gray-200 text-gray-800"}`}
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={onLogout}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  darkMode
                    ? "bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25"
                    : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                }`}
                title="Sign out"
              >
                <LogOut size={16} />
                <span className="hidden lg:inline">Logout</span>
              </button>
              <button
                type="button"
                className={`md:hidden p-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-200 text-gray-800"}`}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden border-b shadow-lg ${darkMode ? "bg-slate-950 border-slate-700" : "bg-white border-gray-200"}`}
          >
            <div className="p-3 space-y-4 max-h-[70vh] overflow-y-auto">
              {isDriver && (
                <p className={`text-xs px-1 ${darkMode ? "text-amber-200/90" : "text-amber-800"}`}>
                  Signed in as driver ({role}). Some fleet admin tools are hidden.
                </p>
              )}
              <div>
                <p className={`text-[10px] font-bold uppercase px-1 mb-1 ${darkMode ? "text-slate-500" : "text-gray-400"}`}>
                  Quick
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => go("/dashboard")} className={pillClass(false)}>
                    <LayoutGrid size={16} /> Home
                  </button>
                  {quickLinks.map((item) => (
                    <button key={item.path} type="button" onClick={() => go(item.path)} className={pillClass(false)}>
                      <item.icon size={16} /> {item.label}
                    </button>
                  ))}
                </div>
              </div>
              {moreSections.map((section) => (
                <div key={section.title}>
                  <p className={`text-[10px] font-bold uppercase px-1 mb-1 ${darkMode ? "text-slate-500" : "text-gray-400"}`}>
                    {section.title}
                  </p>
                  <div className="flex flex-col gap-1">
                    {section.items.map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => go(item.path)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left font-medium ${
                          darkMode ? "bg-white/5 text-white border border-white/10" : "bg-gray-50 text-gray-900 border border-gray-200"
                        }`}
                      >
                        <item.icon size={18} className="text-yellow-500" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  onLogout?.();
                  setMobileOpen(false);
                }}
                className={`mt-2 flex items-center justify-center gap-2 w-full px-3 py-3 rounded-xl font-semibold ${
                  darkMode
                    ? "bg-red-500/15 text-red-300 border border-red-500/30"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FleetNavBar;
