import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Edit, Trash2, X, Check, AlertCircle, Phone, Mail, Calendar } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { db, auth } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch } from "firebase/firestore";
import Button from "./Button";

const Drivers = () => {
  const navigate = useNavigate();
  const { darkMode, drivers, fetchDrivers, user, fleetId, vehiclesAll } = useFleet();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    licenseNumber: "",
    phone: "",
    email: "",
    address: "",
    status: "Active",
    hireDate: "",
    authUid: "",
    assignedVehicleId: "",
  });
  const [error, setError] = useState(null);

  const statusOptions = ["Active", "Inactive", "On Leave", "Suspended", "Training"];
  const statusColors = {
    Active: "text-green-400",
    Inactive: "text-gray-400",
    "On Leave": "text-yellow-400",
    Suspended: "text-red-400",
    Training: "text-cyan-400"
  };

  const syncVehicleAssignment = async (previousDriver, nextForm) => {
    const batch = writeBatch(db);
    const oldVid = (previousDriver?.assignedVehicleId || "").trim();
    const newVid = (nextForm.assignedVehicleId || "").trim();
    const uid = (nextForm.authUid || "").trim() || null;
    const em = (nextForm.email || "").trim() || null;
    let hasWrites = false;

    if (oldVid && (!newVid || newVid !== oldVid)) {
      batch.update(doc(db, "vehicles", oldVid), {
        assignedDriverUid: null,
        assignedDriverEmail: null,
        updatedAt: new Date().toISOString(),
      });
      hasWrites = true;
    }
    if (newVid) {
      batch.update(doc(db, "vehicles", newVid), {
        assignedDriverUid: uid,
        assignedDriverEmail: em,
        updatedAt: new Date().toISOString(),
      });
      hasWrites = true;
    }
    if (hasWrites) await batch.commit();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!auth.currentUser) {
      setError("You must be logged in to manage drivers.");
      return;
    }

    const fid = fleetId || user?.uid;
    if (!fid) {
      setError("Fleet context is not ready. Please try again.");
      return;
    }

    try {
      const driverData = {
        name: formData.name,
        licenseNumber: formData.licenseNumber,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        status: formData.status,
        hireDate: formData.hireDate,
        authUid: (formData.authUid || "").trim() || null,
        assignedVehicleId: (formData.assignedVehicleId || "").trim() || null,
        accountId: fid,
        updatedAt: new Date().toISOString(),
      };

      if (editingDriver) {
        const driverRef = doc(db, "drivers", editingDriver.id);
        await updateDoc(driverRef, driverData);
        await syncVehicleAssignment(editingDriver, formData);
      } else {
        await addDoc(collection(db, "drivers"), {
          ...driverData,
          createdAt: new Date().toISOString(),
        });
        await syncVehicleAssignment(null, formData);
      }

      await fetchDrivers();
      resetForm();
      setShowAddForm(false);
    } catch (err) {
      console.error("Error saving driver:", err);
      setError("Failed to save driver. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this driver?")) return;

    if (!auth.currentUser) {
      setError("You must be logged in to delete drivers.");
      return;
    }

    try {
      const driver = drivers.find((d) => d.id === id);
      if (driver?.assignedVehicleId) {
        await syncVehicleAssignment(driver, {
          email: driver.email || "",
          authUid: driver.authUid || "",
          assignedVehicleId: "",
        });
      }
      const driverRef = doc(db, "drivers", id);
      await deleteDoc(driverRef);
      await fetchDrivers();
    } catch (err) {
      console.error("Error deleting driver:", err);
      setError("Failed to delete driver. Please try again.");
    }
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name || "",
      licenseNumber: driver.licenseNumber || "",
      phone: driver.phone || "",
      email: driver.email || "",
      address: driver.address || "",
      status: driver.status || "Active",
      hireDate: driver.hireDate || "",
      authUid: driver.authUid || "",
      assignedVehicleId: driver.assignedVehicleId || "",
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingDriver(null);
    setFormData({
      name: "",
      licenseNumber: "",
      phone: "",
      email: "",
      address: "",
      status: "Active",
      hireDate: "",
      authUid: "",
      assignedVehicleId: "",
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
              <Users className="w-8 h-8 text-yellow-500" />
              <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                Driver Management
              </h1>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowAddForm(true)}>
                <Plus size={18} />
                Add Driver
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

        {drivers.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"}`}>
            <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"} mb-2`}>No Drivers Yet</h3>
            <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} mb-4`}>Add drivers to start managing your team.</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus size={18} />
              Add Your First Driver
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {drivers.map((driver, index) => (
              <motion.div
                key={driver.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className={`group rounded-2xl overflow-hidden ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"} border shadow-lg transition-all`}
              >
                <div className="relative h-28 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 p-4">
                  <Users className="w-12 h-12 text-yellow-500 opacity-50" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(driver)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                    >
                      <Edit size={16} className="text-yellow-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(driver.id)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {driver.name}
                      </h3>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        License: {driver.licenseNumber || "N/A"}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[driver.status]} ${darkMode ? "bg-white/10" : "bg-gray-100"}`}>
                      {driver.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {driver.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-500" />
                        <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Phone:</span>
                        <span className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>{driver.phone}</span>
                      </div>
                    )}
                    {driver.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-500" />
                        <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Email:</span>
                        <span className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{driver.email}</span>
                      </div>
                    )}
                    {driver.hireDate && (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-500" />
                        <span className={darkMode ? "text-gray-400" : "text-gray-600"}>Hired:</span>
                        <span className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {new Date(driver.hireDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {driver.assignedVehicleId && (
                      <div className={`text-xs ${darkMode ? "text-cyan-300/90" : "text-cyan-700"}`}>
                        Vehicle:{" "}
                        {(() => {
                          const v = vehiclesAll.find((x) => x.id === driver.assignedVehicleId);
                          return v ? `${v.make} ${v.model}` : driver.assignedVehicleId;
                        })()}
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
        {showAddForm && (
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
              className={`w-full max-w-md rounded-2xl ${darkMode ? "bg-[#1a1a2e] border-yellow-500/30" : "bg-white border-gray-200"} border shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-5 border-b ${darkMode ? "border-white/10" : "border-gray-200"} flex justify-between items-center`}>
                <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {editingDriver ? "Edit Driver" : "Add New Driver"}
                </h2>
                <button onClick={() => setShowAddForm(false)} className="p-1 rounded-lg hover:bg-white/10">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white placeholder-gray-400" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                  required
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="License Number *"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className={`px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white placeholder-gray-400" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white placeholder-gray-400" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                  />
                </div>
                
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white placeholder-gray-400" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                />
                
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white placeholder-gray-400" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                />
                
                <div className="grid grid-cols-2 gap-3">
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
                  <input
                    type="date"
                    placeholder="Hire Date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className={`px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                  />
                </div>

                <input
                  type="text"
                  placeholder="Linked account UID (Firebase user id when they sign up)"
                  value={formData.authUid}
                  onChange={(e) => setFormData({ ...formData, authUid: e.target.value })}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white placeholder-gray-400" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                />

                <select
                  value={formData.assignedVehicleId}
                  onChange={(e) => setFormData({ ...formData, assignedVehicleId: e.target.value })}
                  className={`w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                    darkMode ? "bg-white/10 text-white border-white/20" : "bg-gray-100 text-gray-800 border-gray-300"
                  }`}
                >
                  <option value="" className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>
                    No vehicle assignment
                  </option>
                  {vehiclesAll.map((v) => (
                    <option key={v.id} value={v.id} className={darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}>
                      {v.make} {v.model} ({v.licensePlate || v.id.slice(0, 6)})
                    </option>
                  ))}
                </select>
                
                <div className="flex gap-3 pt-2">
                  <Button type="submit">
                    <Check size={16} />
                    {editingDriver ? "Update Driver" : "Add Driver"}
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
        <p>© 2025 FleetTraq. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Drivers;