import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Plus, Edit, Trash2, X, Check, AlertCircle, Gauge, Calendar, Hash, Car } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { db, auth } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import Button from "./Button";

const VehicleManagement = () => {
  const navigate = useNavigate();
  const { darkMode, vehicles, fetchVehicles, user, fleetId, canManageFleet } = useFleet();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    licensePlate: "",
    mileage: "",
    status: "Active",
    fuelEfficiency: "",
    vin: "",
  });
  const [error, setError] = useState(null);

  const statusOptions = ["Active", "Inactive", "Maintenance", "Out of Service", "On Route"];
  const statusColors = {
    Active: "text-green-400",
    Inactive: "text-gray-400",
    Maintenance: "text-yellow-400",
    "Out of Service": "text-red-400",
    "On Route": "text-cyan-400"
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!auth.currentUser) {
      setError("You must be logged in to manage vehicles.");
      return;
    }

    if (!canManageFleet) {
      setError("Only fleet administrators or managers can add or edit vehicles.");
      return;
    }

    const fid = fleetId || user?.uid;
    if (!fid) {
      setError("Fleet context is not ready. Please try again.");
      return;
    }

    try {
      const mileage = parseInt(formData.mileage, 10) || 0;
      const fuelEfficiency = parseFloat(formData.fuelEfficiency) || 15;
      const vehicleData = {
        ...formData,
        mileage,
        fuelEfficiency,
        accountId: fid,
        updatedAt: new Date().toISOString(),
      };

      if (editingVehicle) {
        const vehicleRef = doc(db, "vehicles", editingVehicle.id);
        await updateDoc(vehicleRef, vehicleData);
      } else {
        await addDoc(collection(db, "vehicles"), {
          ...vehicleData,
          createdAt: new Date().toISOString(),
        });
      }

      await fetchVehicles();
      resetForm();
      setShowAddForm(false);
    } catch (err) {
      console.error("Error saving vehicle:", err);
      setError("Failed to save vehicle. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vehicle? This action cannot be undone.")) return;
    
    if (!auth.currentUser) {
      setError("You must be logged in to delete vehicles.");
      return;
    }

    if (!canManageFleet) {
      setError("Only fleet administrators or managers can remove vehicles.");
      return;
    }

    try {
      const vehicleRef = doc(db, "vehicles", id);
      await deleteDoc(vehicleRef);
      await fetchVehicles();
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      setError("Failed to delete vehicle. Please try again.");
    }
  };

  const handleEdit = (vehicle) => {
    if (!canManageFleet) return;
    setEditingVehicle(vehicle);
    setFormData({
      make: vehicle.make || "",
      model: vehicle.model || "",
      year: vehicle.year || "",
      licensePlate: vehicle.licensePlate || "",
      mileage: vehicle.mileage ? vehicle.mileage.toString() : "",
      status: vehicle.status || "Active",
      fuelEfficiency: vehicle.fuelEfficiency ? vehicle.fuelEfficiency.toString() : "",
      vin: vehicle.vin || "",
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingVehicle(null);
    setFormData({
      make: "",
      model: "",
      year: "",
      licensePlate: "",
      mileage: "",
      status: "Active",
      fuelEfficiency: "",
      vin: "",
    });
    setError(null);
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]" : "bg-gray-50"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-20 ${darkMode ? "bg-black/50 backdrop-blur-xl border-b border-white/10" : "bg-white shadow-lg"}`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Truck className="w-8 h-8 text-yellow-500" />
              <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                Vehicle Management
              </h1>
            </div>
            <div className="flex gap-2">
              {canManageFleet && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus size={18} />
                  Add Vehicle
                </Button>
              )}
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

        {vehicles.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"}`}>
            <Truck className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"} mb-2`}>
              {canManageFleet ? "No Vehicles Yet" : "No Vehicle Assigned"}
            </h3>
            <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} mb-4 max-w-md mx-auto`}>
              {canManageFleet
                ? "Get started by adding your first vehicle to the fleet."
                : "Your fleet administrator can assign a vehicle to your account, or link your driver profile to a vehicle."}
            </p>
            {canManageFleet && (
              <Button onClick={() => setShowAddForm(true)}>
                <Plus size={18} />
                Add Your First Vehicle
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {vehicles.map((vehicle, index) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className={`group rounded-2xl overflow-hidden ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"} border shadow-lg transition-all`}
              >
                <div className="relative h-32 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 p-4">
                  <Car className="w-12 h-12 text-yellow-500" />
                  {canManageFleet && (
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(vehicle)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                      >
                        <Edit size={16} className="text-yellow-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(vehicle.id)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {vehicle.make} {vehicle.model}
                      </h3>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {vehicle.year} • {vehicle.licensePlate}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[vehicle.status]} ${darkMode ? "bg-white/10" : "bg-gray-100"}`}>
                      {vehicle.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Gauge size={14} className="text-gray-500" />
                      <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Mileage:</span>
                      <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {vehicle.mileage?.toLocaleString() || 0} miles
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-500" />
                      <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Added:</span>
                      <span className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                    {vehicle.vin && (
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-gray-500" />
                        <span className={darkMode ? "text-gray-400" : "text-gray-600"}>VIN:</span>
                        <span className={`text-xs font-mono ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {vehicle.vin}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddForm && canManageFleet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl ${darkMode ? "bg-[#0f0f2a] border-white/20" : "bg-white border-gray-200"} border shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-5 border-b ${darkMode ? "border-white/10" : "border-gray-200"} flex justify-between items-center`}>
                <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
                </h2>
                <button onClick={() => setShowAddForm(false)} className="p-1 rounded-lg hover:bg-white/10">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Make"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className={`px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className={`px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Year"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className={`px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                    required
                  />
                  <input
                    type="text"
                    placeholder="License Plate"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    className={`px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Mileage"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    className={`px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                  />
                  <input
                    type="text"
                    placeholder="VIN (Optional)"
                    value={formData.vin}
                    onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                    className={`px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Fuel Efficiency (MPG)"
                    value={formData.fuelEfficiency}
                    onChange={(e) => setFormData({ ...formData, fuelEfficiency: e.target.value })}
                    className={`px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                  />
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={`px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                      darkMode ? "bg-white/10 text-white border-white/20" : "bg-gray-100 text-gray-800 border-gray-300"
                    }`}
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt} value={opt} className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button type="submit">
                    <Check size={16} />
                    {editingVehicle ? "Update Vehicle" : "Add Vehicle"}
                  </Button>
                  <Button variant="secondary" type="button" onClick={resetForm}>
                    Reset
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className={`mt-12 py-6 text-center border-t ${darkMode ? "border-white/10 text-gray-500" : "border-gray-200 text-gray-600"}`}>
        <p>© 2024 FleetTraq. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default VehicleManagement;