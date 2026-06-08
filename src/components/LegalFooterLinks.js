import React from "react";
import { Link } from "react-router-dom";

const LegalFooterLinks = ({ className = "", inline = false }) => {
  const linkClass = "text-yellow-600 dark:text-yellow-400 hover:underline underline-offset-2";
  const mutedClass = "text-gray-500 dark:text-gray-500";

  if (inline) {
    return (
      <span className={className}>
        <Link to="/terms" className={linkClass}>
          Terms of Service
        </Link>
        <span className={mutedClass}> · </span>
        <Link to="/privacy" className={linkClass}>
          Privacy Policy
        </Link>
      </span>
    );
  }

  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm ${className}`}>
      <Link to="/terms" className={linkClass}>
        Terms of Service
      </Link>
      <span className={mutedClass} aria-hidden="true">
        ·
      </span>
      <Link to="/privacy" className={linkClass}>
        Privacy Policy
      </Link>
    </div>
  );
};

export default LegalFooterLinks;
