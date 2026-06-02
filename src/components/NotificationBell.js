import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, Check, CheckCheck, X } from "lucide-react";
import { useFleet } from "../context/FleetContext";

const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    deleteNotification,
    clearAllNotifications,
    darkMode,
  } = useFleet();
  const [showDropdown, setShowDropdown] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!showDropdown) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowDropdown(false);
    };

    document.addEventListener("keydown", onKeyDown);
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [showDropdown]);

  useEffect(() => {
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", onPointerDown);
      document.addEventListener("touchstart", onPointerDown);
    }

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [showDropdown]);

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter((n) => !n.read);
    for (const notif of unreadNotifs) {
      await markNotificationAsRead(notif.id);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "alert":
        return "🔔";
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "📢";
    }
  };

  return (
    <div ref={rootRef} className="relative overflow-visible">
      <button
        type="button"
        onClick={() => setShowDropdown((open) => !open)}
        className={`relative p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
          unreadCount > 0 ? "" : darkMode ? "text-gray-200" : "text-gray-800"
        } ${darkMode ? "hover:bg-white/10" : "hover:bg-gray-200/80"}`}
        aria-label="Notifications"
        aria-expanded={showDropdown}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-yellow-500 animate-pulse" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[1.125rem] h-[1.125rem] px-0.5 bg-red-500 text-white text-[10px] leading-none rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/40 md:hidden"
              aria-label="Close notifications"
              onClick={() => setShowDropdown(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={`fixed z-[90] left-3 right-3 top-[calc(3.75rem+env(safe-area-inset-top,0px))] max-h-[min(70vh,calc(100dvh-5rem-env(safe-area-inset-top,0px)))] flex flex-col rounded-2xl shadow-2xl overflow-hidden border md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-[min(24rem,calc(100vw-1.5rem))] md:max-h-[min(24rem,calc(100dvh-6rem))] ${
                darkMode ? "bg-slate-900 border-slate-600" : "bg-white border-gray-200"
              }`}
            >
              <div
                className={`flex flex-wrap justify-between items-center gap-2 p-3 sm:p-4 border-b shrink-0 ${
                  darkMode ? "border-slate-600" : "border-gray-200"
                }`}
              >
                <h3 className={`font-semibold text-sm sm:text-base ${darkMode ? "text-white" : "text-gray-900"}`}>
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 text-xs text-yellow-500">({unreadCount} unread)</span>
                  )}
                </h3>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck size={14} />
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllNotifications}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowDropdown(false)}
                    className={`p-1 rounded-lg md:hidden ${darkMode ? "hover:bg-white/10 text-slate-300" : "hover:bg-gray-100 text-gray-600"}`}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                {notifications.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center">
                    <Bell
                      className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50 ${
                        darkMode ? "text-slate-500" : "text-gray-400"
                      }`}
                    />
                    <p className={`text-sm ${darkMode ? "text-slate-300" : "text-gray-600"}`}>
                      No notifications yet
                    </p>
                    <p className={`text-xs mt-1 ${darkMode ? "text-slate-500" : "text-gray-500"}`}>
                      When you get notifications, they&apos;ll appear here
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 sm:p-4 border-b transition-all ${
                        darkMode ? "border-slate-600 hover:bg-slate-800/80" : "border-gray-100 hover:bg-gray-50"
                      } ${!notif.read ? "bg-yellow-500/10" : ""}`}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="text-lg sm:text-xl shrink-0">{getNotificationIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm break-words ${!notif.read ? "font-semibold" : ""} ${
                              darkMode ? "text-slate-100" : "text-gray-900"
                            }`}
                          >
                            {notif.message}
                          </p>
                          {notif.createdAt && (
                            <p className={`text-xs mt-1 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                              {new Date(notif.createdAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {!notif.read && (
                            <button
                              type="button"
                              onClick={() => markNotificationAsRead(notif.id)}
                              className={`p-1 rounded transition-colors ${
                                darkMode ? "hover:bg-green-500/20" : "hover:bg-green-50"
                              }`}
                              title="Mark as read"
                            >
                              <Check size={14} className="text-green-500" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteNotification(notif.id)}
                            className={`p-1 rounded transition-colors ${
                              darkMode ? "hover:bg-red-500/20" : "hover:bg-red-50"
                            }`}
                            title="Delete"
                          >
                            <X size={14} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div
                  className={`hidden md:block p-3 border-t shrink-0 ${
                    darkMode ? "border-slate-600 bg-slate-950/60" : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setShowDropdown(false)}
                    className={`w-full text-center text-xs transition-colors ${
                      darkMode ? "text-slate-400 hover:text-slate-200" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
