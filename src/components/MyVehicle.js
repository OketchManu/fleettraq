import React from "react";
import { useNavigate } from "react-router-dom";
import { Car, MapPin, Gauge, Hash, Calendar, AlertCircle } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import PageHeader from "./PageHeader";
import Button from "./Button";
import { formatDeviceId } from "../utils/deviceId";

const statusColors = {
  Active: "text-green-400",
  Inactive: "text-gray-400",
  Maintenance: "text-yellow-400",
  "Out of Service": "text-red-400",
  "On Route": "text-cyan-400",
};

const MyVehicle = () => {
  const navigate = useNavigate();
  const { darkMode, vehicles, user, isDriver, membershipPending, membershipSuspended } = useFleet();
  const vehicle = vehicles[0] || null;

  const blocked = membershipPending || membershipSuspended;

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]" : "bg-gray-50"}`}>
      <PageHeader
        darkMode={darkMode}
        title="My vehicle"
        subtitle="Your assigned fleet vehicle"
        icon={Car}
        onBack={() => navigate("/dashboard")}
      />

      <main className="app-page-main py-4 sm:py-6">
        {blocked ? (
          <div
            className={`rounded-2xl border p-6 text-center ${
              darkMode ? "border-amber-500/30 bg-amber-500/10 text-amber-100" : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            <AlertCircle className="mx-auto mb-3 text-amber-500" size={32} />
            <p className="font-medium">Your fleet membership is not active yet.</p>
            <p className="text-sm mt-2 opacity-90">Contact your fleet administrator for access.</p>
          </div>
        ) : !isDriver ? (
          <div
            className={`rounded-2xl border p-6 text-center ${
              darkMode ? "border-white/10 bg-white/5 text-gray-200" : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            <p>This page is for driver accounts. Fleet admins manage vehicles under Vehicles.</p>
            <Button className="mt-4" onClick={() => navigate("/vehicle-management")}>
              Open vehicle management
            </Button>
          </div>
        ) : !vehicle ? (
          <div
            className={`rounded-2xl border p-8 text-center ${
              darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"
            }`}
          >
            <Car className={`mx-auto mb-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`} size={48} />
            <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
              No vehicle assigned
            </h2>
            <p className={`mt-2 text-sm max-w-md mx-auto ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Your fleet administrator has not assigned a vehicle to {user?.email || "your account"} yet. Once assigned,
              details and live tracking will appear here.
            </p>
            <Button variant="secondary" className="mt-6" onClick={() => navigate("/dashboard")}>
              Back to dashboard
            </Button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            <div
              className={`rounded-2xl border overflow-hidden ${
                darkMode ? "border-white/10 bg-white/5" : "border-gray-200 bg-white shadow-sm"
              }`}
            >
              <div className={`px-5 py-4 border-b ${darkMode ? "border-white/10 bg-white/5" : "border-gray-100 bg-gray-50"}`}>
                <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {vehicle.make} {vehicle.model}
                </h2>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {vehicle.year ? `${vehicle.year} · ` : ""}
                  {vehicle.licensePlate || "No plate on file"}
                </p>
              </div>

              <dl className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    Status
                  </dt>
                  <dd className={`mt-1 font-medium ${statusColors[vehicle.status] || "text-gray-400"}`}>
                    {vehicle.status || "Unknown"}
                  </dd>
                </div>
                <div>
                  <dt className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    <Gauge size={12} /> Mileage
                  </dt>
                  <dd className={`mt-1 font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {(vehicle.mileage ?? 0).toLocaleString()} mi
                  </dd>
                </div>
                <div>
                  <dt className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    <Hash size={12} /> VIN
                  </dt>
                  <dd className={`mt-1 font-mono text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                    {vehicle.vin || "—"}
                  </dd>
                </div>
                <div>
                  <dt className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    <Calendar size={12} /> Fuel efficiency
                  </dt>
                  <dd className={`mt-1 font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {vehicle.fuelEfficiency ?? "—"} mpg
                  </dd>
                </div>
                {vehicle.registeredDeviceId && (
                  <div className="sm:col-span-2">
                    <dt className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                      GPS device
                    </dt>
                    <dd className={`mt-1 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Registered ({formatDeviceId(vehicle.registeredDeviceId)})
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate("/tracking")} className="inline-flex items-center gap-2">
                <MapPin size={18} />
                Open live tracking
              </Button>
              <Button variant="secondary" onClick={() => navigate("/fuel-tracking")}>
                Log fuel
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyVehicle;
