import React from "react";
import { Monitor, Smartphone, MapPin } from "lucide-react";

const stepClass = (darkMode) =>
  `text-sm space-y-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`;

const FleetSetupGuide = ({ darkMode, variant = "full", className = "" }) => {
  const showAdminOffice = variant === "full" || variant === "admin-office";
  const showDriver = variant === "full" || variant === "driver";
  const showAdminTrack = variant === "full" || variant === "admin-track";

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className={`font-semibold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
          Recommended setup (most common)
        </h3>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Follow these steps once per driver and vehicle. Admin views live GPS on the Dashboard; the driver&apos;s phone sends location from Tracking.
        </p>
      </div>

      {showAdminOffice && (
        <section
          className={`rounded-2xl p-4 border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}
        >
          <h4 className={`font-semibold flex items-center gap-2 mb-2 ${darkMode ? "text-cyan-200" : "text-cyan-900"}`}>
            <Monitor size={18} className="text-yellow-500" />
            Admin (office / laptop)
          </h4>
          <ol className={`${stepClass(darkMode)} list-decimal list-inside space-y-1.5`}>
            <li>
              Share your <strong>Organization ID</strong> (<strong>More → Account</strong> settings).
            </li>
            <li>
              Add vehicles in <strong>More → Vehicles</strong> (optional on laptop).
            </li>
            <li>
              After the driver signs up: <strong>More → Drivers → Sync to roster</strong>.
            </li>
            <li>
              Assign the driver to the vehicle (<strong>Drivers</strong> page or <strong>Vehicles → Assigned driver</strong>).
            </li>
          </ol>
        </section>
      )}

      {showDriver && (
        <section
          className={`rounded-2xl p-4 border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}
        >
          <h4 className={`font-semibold flex items-center gap-2 mb-2 ${darkMode ? "text-amber-200" : "text-amber-900"}`}>
            <Smartphone size={18} className="text-yellow-500" />
            Driver (phone in the vehicle)
          </h4>
          <ol className={`${stepClass(darkMode)} list-decimal list-inside space-y-1.5`}>
            <li>
              Sign up or log in with role <strong>Driver</strong> + your admin&apos;s <strong>Organization ID</strong>.
            </li>
            <li>
              Open <strong>Tracking</strong> → select their assigned vehicle → <strong>Start tracking on THIS device</strong>.
            </li>
            <li>
              If the vehicle was added on the admin laptop, tap <strong>Use this device instead</strong> on <strong>Tracking</strong> or <strong>Vehicles</strong> first (once), so that phone becomes the GPS source.
            </li>
          </ol>
        </section>
      )}

      {showAdminTrack && (
        <section
          className={`rounded-2xl p-4 border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}
        >
          <h4 className={`font-semibold flex items-center gap-2 mb-2 ${darkMode ? "text-green-200" : "text-green-900"}`}>
            <MapPin size={18} className="text-yellow-500" />
            Admin (any device, admin login)
          </h4>
          <ol className={`${stepClass(darkMode)} list-decimal list-inside space-y-1.5`}>
            <li>
              Open <strong>Dashboard → Live Fleet Location</strong> map.
            </li>
            <li>
              You see the vehicle where the driver&apos;s phone is reporting from — no need to be on the driver&apos;s phone.
            </li>
          </ol>
        </section>
      )}
    </div>
  );
};

export default FleetSetupGuide;
