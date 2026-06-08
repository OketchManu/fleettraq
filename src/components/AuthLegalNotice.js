import React from "react";
import { Link } from "react-router-dom";

/** Short legal notice for login and signup screens. */
const AuthLegalNotice = ({ darkMode, className = "" }) => (
  <p className={`text-xs leading-relaxed text-center ${darkMode ? "text-gray-500" : "text-gray-500"} ${className}`}>
    By continuing, you agree to our{" "}
    <Link to="/terms" className="text-yellow-600 dark:text-yellow-400 underline hover:no-underline">
      Terms of Service
    </Link>{" "}
    and{" "}
    <Link to="/privacy" className="text-yellow-600 dark:text-yellow-400 underline hover:no-underline">
      Privacy Policy
    </Link>
    .
  </p>
);

export default AuthLegalNotice;
