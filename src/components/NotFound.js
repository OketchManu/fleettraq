import React from "react";
import { Link } from "react-router-dom";
import { Home, LogIn } from "lucide-react";
import { useFleet } from "../context/FleetContext";

const NotFound = () => {
  const { darkMode, user } = useFleet();

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-6 text-center ${
        darkMode ? "bg-[#0a0a1a] text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <p className="text-7xl font-black text-yellow-500 mb-2">404</p>
      <h1 className={`text-xl font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
        Page not found
      </h1>
      <p className={`max-w-md mb-8 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        The address may be wrong or the page was removed. Use the links below to continue.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold shadow-lg hover:shadow-yellow-500/25 transition-all"
        >
          <Home className="w-4 h-4" />
          Home
        </Link>
        {user ? (
          <Link
            to="/dashboard"
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border font-semibold transition-all ${
              darkMode
                ? "border-white/20 text-white hover:bg-white/10"
                : "border-gray-300 text-gray-800 hover:bg-gray-100"
            }`}
          >
            Dashboard
          </Link>
        ) : (
          <Link
            to="/login"
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border font-semibold transition-all ${
              darkMode
                ? "border-white/20 text-white hover:bg-white/10"
                : "border-gray-300 text-gray-800 hover:bg-gray-100"
            }`}
          >
            <LogIn className="w-4 h-4" />
            Log in
          </Link>
        )}
      </div>
    </div>
  );
};

export default NotFound;
