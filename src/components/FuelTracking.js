import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Fuel, Plus, Trash2, Edit, DollarSign, Gauge, TrendingUp, Download, AlertCircle } from "lucide-react";
import { db, auth } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useFleet } from "../context/FleetContext";
import Button from "./Button";

const FuelTracking = () => {
  const navigate = useNavigate();
  const { darkMode, vehicles, addNotification } = useFleet();
  const [fuelRecords, setFuelRecords] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGallons: 0,
    totalCost: 0,
    avgMPG: 0,
    avgCostPerGallon: 0
  });
  const [newRecord, setNewRecord] = useState({
    vehicleId: "",
    gallons: "",
    cost: "",
    odometer: "",
    date: new Date().toISOString().split("T")[0],
    location: "",
    notes: ""
  });
  const [error, setError] = useState(null);

  // Fetch fuel records
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "fuelRecords"),
      where("accountId", "==", auth.currentUser.uid),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFuelRecords(records);
      calculateStats(records);
      setLoading(false);
    }, (err) => {
      setError("Failed to load fuel records: " + err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calculate statistics
  const calculateStats = (records) => {
    const totalGallons = records.reduce((sum, r) => sum + (parseFloat(r.gallons) || 0), 0);
    const totalCost = records.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);
    const avgCostPerGallon = totalGallons > 0 ? totalCost / totalGallons : 0;
    
    // Calculate average MPG
    let mpgSum = 0;
    let mpgCount = 0;
    records.forEach((record, index) => {
      if (index < records.length - 1 && record.odometer && records[index + 1]?.odometer) {
        const distance = record.odometer - records[index + 1].odometer;
        const mpg = distance / (parseFloat(record.gallons) || 1);
        if (mpg > 0 && mpg < 100) {
          mpgSum += mpg;
          mpgCount++;
        }
      }
    });
    const avgMPG = mpgCount > 0 ? mpgSum / mpgCount : 0;

    setStats({
      totalGallons: Math.round(totalGallons * 10) / 10,
      totalCost: Math.round(totalCost * 100) / 100,
      avgMPG: Math.round(avgMPG * 10) / 10,
      avgCostPerGallon: Math.round(avgCostPerGallon * 100) / 100
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!auth.currentUser) {
      setError("You must be logged in to add fuel records.");
      return;
    }

    if (!newRecord.vehicleId || !newRecord.gallons || !newRecord.cost || !newRecord.odometer) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const recordData = {
        ...newRecord,
        gallons: parseFloat(newRecord.gallons),
        cost: parseFloat(newRecord.cost),
        odometer: parseFloat(newRecord.odometer),
        accountId: auth.currentUser.uid,
        updatedAt: new Date().toISOString()
      };

      if (editingRecord) {
        const recordRef = doc(db, "fuelRecords", editingRecord.id);
        await updateDoc(recordRef, recordData);
        if (addNotification) addNotification("Fuel record updated successfully", "success");
      } else {
        await addDoc(collection(db, "fuelRecords"), {
          ...recordData,
          createdAt: new Date().toISOString()
        });
        if (addNotification) addNotification("Fuel record added successfully", "success");
      }

      resetForm();
      setShowAddForm(false);
    } catch (err) {
      console.error("Error saving fuel record:", err);
      setError("Failed to save fuel record. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this fuel record?")) return;

    if (!auth.currentUser) return;

    try {
      const recordRef = doc(db, "fuelRecords", id);
      await deleteDoc(recordRef);
      if (addNotification) addNotification("Fuel record deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting fuel record:", err);
      setError("Failed to delete fuel record. Please try again.");
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
      notes: record.notes || ""
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingRecord(null);
    setNewRecord({
      vehicleId: "",
      gallons: "",
      cost: "",
      odometer: "",
      date: new Date().toISOString().split("T")[0],
      location: "",
      notes: ""
    });
    setError(null);
  };

  const exportToCSV = () => {
    const headers = ["Date", "Vehicle", "Gallons", "Cost", "Odometer", "Location", "Notes"];
    const rows = fuelRecords.map(record => {
      const vehicle = vehicles.find(v => v.id === record.vehicleId);
      return [
        record.date,
        vehicle ? `${vehicle.make} ${vehicle.model}` : "Unknown",
        record.gallons,
        `$${record.cost}`,
        record.odometer,
        record.location || "",
        record.notes || ""
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fuel-records-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]" : "bg-gray-50"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-20 ${darkMode ? "bg-black/50 backdrop-blur-xl border-b border-white/10" : "bg-white shadow-lg"}`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Fuel className="w-8 h-8 text-yellow-500" />
              <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                Fuel Tracking
              </h1>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowAddForm(true)}>
                <Plus size={18} />
                Add Fuel Record
              </Button>
              <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                Back
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-lg`}
          >
            <Fuel className="w-8 h-8 text-yellow-500 mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{stats.totalGallons}</p>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Gallons</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-5 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-lg`}
          >
            <DollarSign className="w-8 h-8 text-green-400 mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>${stats.totalCost}</p>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Cost</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-5 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-lg`}
          >
            <TrendingUp className="w-8 h-8 text-cyan-400 mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{stats.avgMPG}</p>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Avg MPG</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-5 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-lg`}
          >
            <Gauge className="w-8 h-8 text-purple-400 mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>${stats.avgCostPerGallon}</p>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Avg $/Gallon</p>
          </motion.div>
        </div>

        {/* Export Button */}
        {fuelRecords.length > 0 && (
          <div className="flex justify-end mb-4">
            <Button onClick={exportToCSV} variant="secondary" size="sm">
              <Download size={16} />
              Export to CSV
            </Button>
          </div>
        )}

        {/* Fuel Records Table */}
        {fuelRecords.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"}`}>
            <Fuel className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"} mb-2`}>No Fuel Records Yet</h3>
            <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} mb-4`}>Add your first fuel record to start tracking efficiency.</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus size={18} />
              Add First Fuel Record
            </Button>
          </div>
        ) : (
          <div className={`rounded-2xl overflow-hidden border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-lg`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={darkMode ? "bg-black/30" : "bg-gray-50"}>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Vehicle</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Gallons</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Cost</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Odometer</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Location</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelRecords.map((record, index) => {
                    const vehicle = vehicles.find(v => v.id === record.vehicleId);
                    return (
                      <tr key={record.id} className={`border-t ${darkMode ? "border-white/10 hover:bg-white/5" : "border-gray-200 hover:bg-gray-50"}`}>
                        <td className="px-4 py-3 text-sm">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm">
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-sm">{record.gallons} gal</td>
                        <td className="px-4 py-3 text-sm">${record.cost}</td>
                        <td className="px-4 py-3 text-sm">{record.odometer.toLocaleString()} mi</td>
                        <td className="px-4 py-3 text-sm">{record.location || "-"}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(record)}
                              className="p-1 rounded hover:bg-white/10 transition-colors"
                            >
                              <Edit size={16} className="text-yellow-500" />
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="p-1 rounded hover:bg-white/10 transition-colors"
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

      {/* Add/Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl ${darkMode ? "bg-[#1a1a2e] border-yellow-500/30" : "bg-white border-gray-200"} border shadow-2xl`}>
            <div className={`p-5 border-b ${darkMode ? "border-white/10" : "border-gray-200"} flex justify-between items-center`}>
              <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                {editingRecord ? "Edit Fuel Record" : "Add Fuel Record"}
              </h2>
              <button onClick={() => {
                setShowAddForm(false);
                resetForm();
              }} className="p-1 rounded-lg hover:bg-white/10">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Vehicle *</label>
                <select
                  value={newRecord.vehicleId}
                  onChange={(e) => setNewRecord({ ...newRecord, vehicleId: e.target.value })}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                  required
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} - {vehicle.licensePlate}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Date *</label>
                  <input
                    type="date"
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                    className={`w-full px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Gallons *</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newRecord.gallons}
                    onChange={(e) => setNewRecord({ ...newRecord, gallons: e.target.value })}
                    placeholder="0.000"
                    className={`w-full px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Cost ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRecord.cost}
                    onChange={(e) => setNewRecord({ ...newRecord, cost: e.target.value })}
                    placeholder="0.00"
                    className={`w-full px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Odometer (miles) *</label>
                  <input
                    type="number"
                    value={newRecord.odometer}
                    onChange={(e) => setNewRecord({ ...newRecord, odometer: e.target.value })}
                    placeholder="0"
                    className={`w-full px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Location</label>
                <input
                  type="text"
                  value={newRecord.location}
                  onChange={(e) => setNewRecord({ ...newRecord, location: e.target.value })}
                  placeholder="Gas station location"
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                />
              </div>

              <div>
                <label className={`block text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Notes</label>
                <textarea
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit">
                  {editingRecord ? "Update Record" : "Add Record"}
                </Button>
                <Button variant="secondary" type="button" onClick={resetForm}>
                  Reset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`mt-12 py-6 text-center border-t ${darkMode ? "border-white/10 text-gray-500" : "border-gray-200 text-gray-600"}`}>
        <p>© 2025 FleetTraq. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default FuelTracking;