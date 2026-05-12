import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, Check, CheckCheck, X } from "lucide-react";
import { useFleet } from "../context/FleetContext";

const NotificationBell = () => {
  const { notifications, unreadCount, markNotificationAsRead, deleteNotification, clearAllNotifications } = useFleet();
  const [showDropdown, setShowDropdown] = useState(false);

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.read);
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
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
            className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs text-yellow-500">({unreadCount} unread)</span>
                )}
              </h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs text-red-500 hover:text-red-400 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications yet</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                    When you get notifications, they'll appear here
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all ${
                      !notif.read ? "bg-yellow-500/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-xl">{getNotificationIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.read ? "font-semibold" : ""} text-gray-900 dark:text-white`}>
                          {notif.message}
                        </p>
                        {notif.createdAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notif.createdAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {!notif.read && (
                          <button
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="p-1 rounded hover:bg-green-500/20 transition-colors"
                            title="Mark as read"
                          >
                            <Check size={14} className="text-green-500" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="p-1 rounded hover:bg-red-500/20 transition-colors"
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

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <button
                  onClick={() => setShowDropdown(false)}
                  className="w-full text-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
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