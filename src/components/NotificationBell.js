import React, { useState } from "react";
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
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className={`relative p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
          unreadCount > 0 ? "" : darkMode ? "text-gray-200" : "text-gray-800"
        } ${darkMode ? "hover:bg-white/10" : "hover:bg-gray-200/80"}`}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-yellow-500 animate-pulse" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl z-[100] overflow-hidden border ${
              darkMode ? "bg-slate-900 border-slate-600" : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`flex justify-between items-center p-4 border-b ${
                darkMode ? "border-slate-600" : "border-gray-200"
              }`}
            >
              <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs text-yellow-500">({unreadCount} unread)</span>
                )}
              </h3>
              <div className="flex gap-2 shrink-0">
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
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell
                    className={`w-12 h-12 mx-auto mb-3 opacity-50 ${
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
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 border-b transition-all ${
                      darkMode ? "border-slate-600 hover:bg-slate-800/80" : "border-gray-100 hover:bg-gray-50"
                    } ${!notif.read ? "bg-yellow-500/10" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-xl shrink-0">{getNotificationIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${!notif.read ? "font-semibold" : ""} ${
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
                className={`p-3 border-t ${darkMode ? "border-slate-600 bg-slate-950/60" : "border-gray-200 bg-gray-50"}`}
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
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
