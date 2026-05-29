import React from "react";
import { Monitor, Smartphone, MapPin } from "lucide-react";

const stepClass = (darkMode) =>
  `text-sm space-y-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`;

const FleetSetupGuide = ({ darkMode, variant = "full", className = "", organizationId }) => {
  const showAdminOffice = variant === "full" || variant === "admin-office";
  const showDriver = variant === "full" || variant === "driver";
  const showAdminTrack = variant === "full" || variant === "admin-track";

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className={`font-semibold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
          How to set up your fleet
        </h3>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          Complete this once for each driver and vehicle. After setup, live GPS appears on the Dashboard
          while the driver&apos;s phone sends location from the Tracking page.
        </p>
      </div>

      {showAdminOffice && (
        <section
          className={`rounded-2xl p-4 border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}
        >
          <h4 className={`font-semibold flex items-center gap-2 mb-2 ${darkMode ? "text-cyan-200" : "text-cyan-900"}`}>
            <Monitor size={18} className="text-yellow-500" />
            Step 1 — Administrator (office or laptop)
          </h4>
          <ol className={`${stepClass(darkMode)} list-decimal list-inside space-y-1.5`}>
            <li>
              Copy your <strong>Fleet Organization ID</strong>
              {organizationId ? (
                <> (<code className="text-xs break-all">{organizationId}</code>)</>
              ) : (
                <> (shown at the top of the Dashboard and under <strong>More → Account</strong>)</>
              )}{" "}
              and send it to each driver.
            </li>
            <li>
              Add your vehicles under <strong>More → Vehicles</strong> (you can do this from a laptop).
            </li>
            <li>
              When a driver has signed up, open <strong>More → Drivers</strong> and click{" "}
              <strong>Sync to roster</strong>.
            </li>
            <li>
              Assign each driver to a vehicle on the <strong>Drivers</strong> page or under{" "}
              <strong>Vehicles → Assigned driver</strong>.
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
            Step 2 — Driver (phone in the vehicle)
          </h4>
          <ol className={`${stepClass(darkMode)} list-decimal list-inside space-y-1.5`}>
            <li>
              Sign up or log in as <strong>Driver</strong> and paste the administrator&apos;s{" "}
              <strong>Fleet Organization ID</strong>.
            </li>
            <li>
              Open <strong>Tracking</strong>, select your assigned vehicle, then tap{" "}
              <strong>Start tracking on THIS device</strong>.
            </li>
            <li>
              If the vehicle was first added on the admin laptop, tap <strong>Use this device instead</strong>{" "}
              once on <strong>Tracking</strong> or <strong>Vehicles</strong> so this phone becomes the GPS source.
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
            Step 3 — View live locations (any admin device)
          </h4>
          <ol className={`${stepClass(darkMode)} list-decimal list-inside space-y-1.5`}>
            <li>
              Open <strong>Dashboard → Live Fleet Location</strong>.
            </li>
            <li>
              Each vehicle appears where the assigned driver&apos;s phone is reporting — you do not need to be on
              that phone to view the map.
            </li>
          </ol>
        </section>
      )}
    </div>
  );
};

export default FleetSetupGuide;
