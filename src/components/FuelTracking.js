import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Fuel, Plus, Trash2, Edit, Gauge, TrendingUp, Download, AlertCircle, X, Car, Coins } from "lucide-react";
import { db, auth } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from "firebase/firestore";
import { useFleet } from "../context/FleetContext";
import { computeFuelStats, lastOdometerForVehicle, friendlyFuelError } from "../utils/fuelStats";
import { formatCurrency, formatVolume, formatOdometer } from "../utils/fleetLocale";
import Button from "./Button";

const FuelTracking = () => {
  const navigate = useNavigate();
  const {
    darkMode,
    vehicles,
    sendNotification,
    user,
    fleetId,
    canManageFleet,
    isDriver,
    membershipPending,
    membershipSuspended,
    fleetSettings,
    fleetLocale,
    formatDate,
    formatDateTime,
    formatTime,
  } = useFleet();

  const [fuelRecords, setFuelRecords] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [newRecord, setNewRecord] = useState({
    vehicleId: "",
    gallons: "",
    cost: "",
    odometer: "",
    date: new Date().toISOString().split("T")[0],
    location: "",
    notes: "",
  });
  const [error, setError] = useState(null);

  const accessBlocked = membershipPending || membershipSuspended;

  // Pre-select vehicle when a driver has exactly one assigned vehicle.
  useEffect(() => {
    if (vehicles.length === 1 && !newRecord.vehicleId && !editingRecord) {
      setNewRecord((prev) => ({ ...prev, vehicleId: vehicles[0].id }));
    }
  }, [vehicles, newRecord.vehicleId, editingRecord]);

  useEffect(() => {
    if (accessBlocked) {
      setLoading(false);
      setFuelRecords([]);
      return undefined;
    }

    const fid = fleetId || user?.uid;
    if (!fid) {
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const q = query(collection(db, "fuelRecords"), where("accountId", "==", fid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const records = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setFuelRecords(records);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(friendlyFuelError(err));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [fleetId, user?.uid, accessBlocked]);

  const allowedVehicleIds = useMemo(() => new Set(vehicles.map((v) => v.id)), [vehicles]);

  const visibleRecords = useMemo(() => {
    let list = fuelRecords.filter((r) => allowedVehicleIds.has(r.vehicleId));
    if (vehicleFilter !== "all") {
      list = list.filter((r) => r.vehicleId === vehicleFilter);
    }
    return list;
  }, [fuelRecords, allowedVehicleIds, vehicleFilter]);

  const stats = useMemo(() => computeFuelStats(visibleRecords, fleetSettings), [visibleRecords, fleetSettings]);
  const locale = stats.locale || fleetLocale;

  const odometerHint = useMemo(() => {
    if (!newRecord.vehicleId) return null;
    const last = lastOdometerForVehicle(fuelRecords, newRecord.vehicleId);
    if (last == null) return `First fill-up for this vehicle — enter the current odometer (${locale.distanceWord}).`;
    if (editingRecord) {
      return `Previous reading for this vehicle: ${formatOdometer(last, locale)}`;
    }
    return `Last reading: ${formatOdometer(last, locale)} — odometer should be equal or higher.`;
  }, [newRecord.vehicleId, fuelRecords, editingRecord, locale]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (accessBlocked) {
      setError(
        membershipSuspended
          ? "Your account is suspended. Contact your fleet administrator."
          : "Your account is awaiting approval. You can log fuel once your administrator approves you."
      );
      return;
    }

    if (!auth.currentUser) {
      setError("You must be logged in to add fuel records.");
      return;
    }

    if (!newRecord.vehicleId || !newRecord.gallons || !newRecord.cost || !newRecord.odometer) {
      setError(`Please fill in vehicle, ${locale.volumeLabel.toLowerCase()}, cost, and odometer.`);
      return;
    }

    const gallons = parseFloat(newRecord.gallons);
    const cost = parseFloat(newRecord.cost);
    const odometer = parseFloat(newRecord.odometer);

    if (!Number.isFinite(gallons) || gallons <= 0) {
      setError(`${locale.volumeLabel} must be greater than zero.`);
      return;
    }
    if (!Number.isFinite(cost) || cost <= 0) {
      setError("Cost must be greater than zero.");
      return;
    }
    if (!Number.isFinite(odometer) || odometer < 0) {
      setError("Enter a valid odometer reading.");
      return;
    }

    const fid = fleetId || user?.uid;
    if (!fid) {
      setError("Fleet context is not ready. Please try again.");
      return;
    }

    if (!allowedVehicleIds.has(newRecord.vehicleId)) {
      setError("You can only log fuel for vehicles assigned to your account.");
      return;
    }

    const prevOdometer = lastOdometerForVehicle(
      fuelRecords.filter((r) => r.id !== editingRecord?.id),
      newRecord.vehicleId
    );
    if (prevOdometer != null && odometer < prevOdometer) {
      setError(`Odometer cannot be lower than the last recorded value (${formatOdometer(prevOdometer, locale)}).`);
      return;
    }

    try {
      const recordData = {
        vehicleId: newRecord.vehicleId,
        gallons,
        cost,
        odometer,
        date: newRecord.date,
        location: (newRecord.location || "").trim(),
        notes: (newRecord.notes || "").trim(),
        accountId: fid,
        updatedAt: new Date().toISOString(),
      };

      if (editingRecord) {
        await updateDoc(doc(db, "fuelRecords", editingRecord.id), {
          ...recordData,
          recordedByUid: editingRecord.recordedByUid || auth.currentUser.uid,
        });
        sendNotification("Fuel record updated successfully", "success");
      } else {
        await addDoc(collection(db, "fuelRecords"), {
          ...recordData,
          recordedByUid: auth.currentUser.uid,
          recordedByEmail: auth.currentUser.email || user?.email || "",
          createdAt: new Date().toISOString(),
        });
        sendNotification("Fuel record added successfully", "success");
      }

      resetForm();
      setShowAddForm(false);
    } catch (err) {
      console.error("Error saving fuel record:", err);
      setError(friendlyFuelError(err));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this fuel record?")) return;
    if (!auth.currentUser || accessBlocked) return;

    const rec = fuelRecords.find((r) => r.id === id);
    if (!rec || !allowedVehicleIds.has(rec.vehicleId)) {
      setError("You cannot delete this fuel record.");
      return;
    }

    try {
      await deleteDoc(doc(db, "fuelRecords", id));
      sendNotification("Fuel record deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting fuel record:", err);
      setError(friendlyFuelError(err));
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setNewRecord({
      vehicleId: record.vehicleId || "",
      gallons: record.gallons?.toString() || "",
      cost: record.cost?.toString() || "",
      odometer: record.odometer?.toString() || "",
      date: record.date || new Date().toISOString().split("T")[0],
      location: record.location || "",
      notes: record.notes || "",
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingRecord(null);
    setNewRecord({
      vehicleId: vehicles.length === 1 ? vehicles[0].id : "",
      gallons: "",
      cost: "",
      odometer: "",
      date: new Date().toISOString().split("T")[0],
      location: "",
      notes: "",
    });
    setError(null);
  };

  const exportToCSV = () => {
    const headers = ["Date", "Vehicle", locale.volumeLabel, "Cost", "Odometer", "Location", "Notes"];
    const rows = visibleRecords.map((record) => {
      const vehicle = vehicles.find((v) => v.id === record.vehicleId);
      return [
        record.date,
        vehicle ? `${vehicle.make} ${vehicle.model}` : "Unknown",
        record.gallons,
        record.cost,
        record.odometer,
        record.location || "",
        record.notes || "",
      ];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fuel-records-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputClass = darkMode
    ? "bg-white/10 text-white border-white/20 placeholder:text-gray-500"
    : "bg-gray-100 text-gray-900 border-gray-300";
  const selectClass = `${inputClass} w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500`;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-[#0a0a1a]" : "bg-gray-50"}`}>
        <div className="text-center px-4">
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>Loading fuel data...</p>
        </div>
      </div>
    );
  }

  if (accessBlocked) {
    return (
      <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]" : "bg-gray-50"}`}>
        <main className="max-w-lg mx-auto px-4 py-24 text-center">
          <Fuel className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className={`text-2xl font-bold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
            Fuel tracking unavailable
          </h1>
          <p className={`text-sm mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            {membershipSuspended
              ? "Your access has been suspended. Contact your fleet administrator to restore access."
              : "Your account is awaiting approval. Once your administrator approves you and assigns a vehicle, you can log fuel here."}
          </p>
          <Button variant="secondary" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </main>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]" : "bg-gray-50"}`}>
        <main className="max-w-lg mx-auto px-4 py-24 text-center">
          <Car className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className={`text-2xl font-bold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
            No vehicles available
          </h1>
          <p className={`text-sm mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            {isDriver
              ? "You don't have a vehicle assigned yet. Ask your fleet administrator to assign one before logging fuel."
              : "Add a vehicle under Manage Fleet before logging fuel records."}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {canManageFleet && (
              <Button onClick={() => navigate("/vehicle-management")}>Manage Fleet</Button>
            )}
            <Button variant="secondary" onClick={() => navigate("/dashboard")}>
              Back
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]" : "bg-gray-50"}`}>
      <header className={`border-b ${darkMode ? "border-white/10 bg-[#0a0a1a]/90" : "border-gray-200 bg-white"}`}>
        <div className="app-page-main py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Fuel className="w-8 h-8 text-yellow-500 shrink-0" />
              <div className="min-w-0">
                <h1 className={`text-lg sm:text-xl font-bold truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
                  Fuel Tracking
                </h1>
                {isDriver && (
                  <p className={`text-xs truncate ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                    Log fill-ups for your assigned vehicle{vehicles.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button onClick={() => setShowAddForm(true)}>
                <Plus size={18} />
                Add Record
              </Button>
              <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                Back
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="app-page-main py-4 sm:py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-800 dark:text-red-200 text-sm flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { icon: Fuel, value: formatVolume(stats.totalVolume, locale), label: `Total ${locale.volumeLabel}`, color: "text-yellow-500" },
            { icon: Coins, value: formatCurrency(stats.totalCost, locale), label: "Total Cost", color: "text-green-400" },
            { icon: TrendingUp, value: stats.avgEfficiency || "—", label: `Avg ${locale.efficiencyLabel}`, color: "text-cyan-400" },
            { icon: Gauge, value: formatCurrency(stats.avgCostPerVolume, locale), label: `Avg cost${locale.costPerVolumeLabel}`, color: "text-purple-400" },
            { icon: Fuel, value: stats.fillCount, label: "Fill-ups", color: "text-amber-400" },
          ].map((s) => (
            <div
              key={s.label}
              className={`p-5 rounded-2xl border shadow-lg ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}
            >
              <s.icon className={`w-8 h-8 ${s.color} mb-2`} />
              <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{s.value}</p>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {vehicles.length > 1 && (
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-sm ${selectClass} max-w-xs`}
            >
              <option value="all" className={darkMode ? "bg-slate-900" : "bg-white"}>
                All vehicles
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} className={darkMode ? "bg-slate-900" : "bg-white"}>
                  {v.make} {v.model}
                </option>
              ))}
            </select>
          )}
          {visibleRecords.length > 0 && (
            <Button onClick={exportToCSV} variant="secondary" size="sm" className="ml-auto">
              <Download size={16} />
              Export CSV
            </Button>
          )}
        </div>

        {visibleRecords.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
            <Fuel className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className={`text-xl font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              No Fuel Records Yet
            </h3>
            <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Log each fill-up with {locale.volumeLabel.toLowerCase()}, cost in {locale.currency}, and odometer ({locale.distanceLabel}) to track efficiency over time.
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus size={18} />
              Add First Fuel Record
            </Button>
          </div>
        ) : (
          <div className={`rounded-2xl overflow-hidden border shadow-lg ${darkMode ? "border-white/10" : "border-gray-200"}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={darkMode ? "bg-black/30" : "bg-gray-50"}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Date</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Vehicle</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{locale.volumeLabel}</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Cost ({locale.currency})</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Odometer</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Location</th>
                    <th className={`px-4 py-3 text-left text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRecords.map((record) => {
                    const vehicle = vehicles.find((v) => v.id === record.vehicleId);
                    return (
                      <tr key={record.id} className={`border-t ${darkMode ? "border-white/10" : "border-gray-200"}`}>
                        <td className={`px-4 py-3 text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                          {record.date ? formatDate(record.date) : "—"}
                        </td>
                        <td className={`px-4 py-3 text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : "Unknown"}
                        </td>
                        <td className={`px-4 py-3 text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                          {formatVolume(record.gallons, locale)}
                        </td>
                        <td className={`px-4 py-3 text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                          {formatCurrency(record.cost, locale)}
                        </td>
                        <td className={`px-4 py-3 text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                          {formatOdometer(record.odometer, locale)}
                        </td>
                        <td className={`px-4 py-3 text-sm max-w-[140px] truncate ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {record.location || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(record)}
                              className={`p-1 rounded ${darkMode ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                              aria-label="Edit fuel record"
                            >
                              <Edit size={16} className="text-yellow-500" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(record.id)}
                              className={`p-1 rounded ${darkMode ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                              aria-label="Delete fuel record"
                            >
                              <Trash2 size={16} className="text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl ${darkMode ? "bg-[#1a1a2e]" : "bg-white"} border shadow-2xl`}>
            <div className={`p-5 border-b flex justify-between items-center sticky top-0 ${darkMode ? "bg-[#1a1a2e] border-white/10" : "bg-white border-gray-200"}`}>
              <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {editingRecord ? "Edit Fuel Record" : "Add Fuel Record"}
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className={darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className={`block text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Vehicle *</label>
                <select
                  value={newRecord.vehicleId}
                  onChange={(e) => setNewRecord({ ...newRecord, vehicleId: e.target.value })}
                  className={selectClass}
                  required
                >
                  <option value="" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>
                    Select vehicle
                  </option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id} className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>
                      {vehicle.make} {vehicle.model}
                      {vehicle.licensePlate ? ` (${vehicle.licensePlate})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Date *</label>
                  <input
                    type="date"
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                    className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputClass}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{locale.volumeLabel} *</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={newRecord.gallons}
                    onChange={(e) => setNewRecord({ ...newRecord, gallons: e.target.value })}
                    placeholder={locale.isMetric ? "e.g. 45" : "e.g. 12.5"}
                    className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputClass}`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Total cost ({locale.currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newRecord.cost}
                    onChange={(e) => setNewRecord({ ...newRecord, cost: e.target.value })}
                    placeholder="e.g. 45.00"
                    className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputClass}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Odometer ({locale.distanceLabel}) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={newRecord.odometer}
                    onChange={(e) => setNewRecord({ ...newRecord, odometer: e.target.value })}
                    placeholder={`Current ${locale.distanceWord}`}
                    className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputClass}`}
                    required
                  />
                </div>
              </div>

              {odometerHint && (
                <p className={`text-xs ${darkMode ? "text-amber-400/90" : "text-amber-700"}`}>{odometerHint}</p>
              )}

              {newRecord.gallons && newRecord.cost && (
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Price per {locale.volumeShort}:{" "}
                  {formatCurrency(parseFloat(newRecord.cost) / parseFloat(newRecord.gallons), locale)}
                </p>
              )}

              <div>
                <label className={`block text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Station / location</label>
                <input
                  type="text"
                  value={newRecord.location}
                  onChange={(e) => setNewRecord({ ...newRecord, location: e.target.value })}
                  placeholder="e.g. Shell, Westlands"
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${inputClass}`}
                />
              </div>

              <div>
                <label className={`block text-sm mb-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Notes</label>
                <textarea
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                  placeholder="Optional notes"
                  rows={2}
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none ${inputClass}`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit">{editingRecord ? "Update" : "Save Record"}</Button>
                <Button variant="secondary" type="button" onClick={resetForm}>
                  Reset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className={`mt-12 py-6 text-center border-t ${darkMode ? "border-white/10" : "border-gray-200"}`}>
        <p>© 2026 FleetTraq. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default FuelTracking;
