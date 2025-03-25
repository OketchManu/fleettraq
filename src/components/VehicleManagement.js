import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Truck, Plus, Edit, Trash2 } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { db, auth } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import Button from "./Button";

const Vehicles = () => {
  const navigate = useNavigate();
  const { darkMode, vehicles, fetchVehicles } = useFleet();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: "",
    licensePlate: "",
    mileage: "",
    status: "Active",
  });
  const [error, setError] = useState(null);

  const themeStyles = {
    background: darkMode ? "linear-gradient(135deg, #080016 0%, #150025 100%)" : "linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)",
    color: darkMode ? "#fff" : "#000",
    cardBg: darkMode ? "rgba(20, 10, 40, 0.7)" : "rgba(255, 255, 255, 0.9)",
    cardBorder: darkMode ? "2px solid rgba(250, 204, 21, 0.5)" : "2px solid rgba(59, 130, 246, 0.5)",
    cardGlow: darkMode ? "0 0 15px rgba(250, 204, 21, 0.3)" : "0 0 15px rgba(59, 130, 246, 0.2)",
  };

  const statusOptions = ["Active", "Inactive", "Maintenance", "Out of Service"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const mileage = parseInt(formData.mileage, 10) || 0;
      const vehicleData = {
        ...formData,
        mileage,
        userId: auth.currentUser.uid, // Add userId
      };

      if (editingVehicle) {
        const vehicleRef = doc(db, "vehicles", editingVehicle.id);
        await updateDoc(vehicleRef, vehicleData);
        setEditingVehicle(null);
      } else {
        await addDoc(collection(db, "vehicles"), vehicleData);
      }

      await fetchVehicles();
      setFormData({ make: "", model: "", year: "", licensePlate: "", mileage: "", status: "Active" });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error saving vehicle:", error.message);
      setError("Failed to save vehicle. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const vehicleRef = doc(db, "vehicles", id);
      await deleteDoc(vehicleRef);
      await fetchVehicles();
    } catch (error) {
      console.error("Error deleting vehicle:", error.message);
      setError("Failed to delete vehicle. Please try again.");
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      make: vehicle.make || "",
      model: vehicle.model || "",
      year: vehicle.year || "",
      licensePlate: vehicle.licensePlate || "",
      mileage: vehicle.mileage ? vehicle.mileage.toString() : "",
      status: vehicle.status || "Active",
    });
    setShowAddForm(true);
  };

  return (
    <motion.div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        ...themeStyles,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ flex: "1 0 auto" }}>
        <header
          style={{
            background: darkMode ? "rgba(0, 0, 0, 0.5)" : "#e5e7eb",
            padding: "12px 16px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                color: darkMode ? "#facc15" : "#1f2937",
              }}
            >
              <Truck style={{ marginRight: "8px" }} /> Vehicle Fleet
            </h1>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus size={16} /> Add Vehicle
              </Button>
              <Button onClick={() => navigate("/dashboard")}>Back</Button>
            </div>
          </div>
        </header>

        {showAddForm && (
          <motion.div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 20 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div
              style={{
                background: themeStyles.cardBg,
                maxWidth: "500px",
                margin: "40px auto",
                padding: "24px",
                borderRadius: "8px",
                border: themeStyles.cardBorder,
                boxShadow: themeStyles.cardGlow,
              }}
            >
              <h2 style={{ color: darkMode ? "#facc15" : "#1f2937", marginBottom: "16px" }}>
                {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
              </h2>
              {error && <p style={{ color: "#ef4444", marginBottom: "12px" }}>{error}</p>}
              <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
                <input
                  style={{ padding: "8px", borderRadius: "4px", border: themeStyles.cardBorder, background: darkMode ? "#1a0033" : "#fff" }}
                  placeholder="Make"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  required
                />
                <input
                  style={{ padding: "8px", borderRadius: "4px", border: themeStyles.cardBorder, background: darkMode ? "#1a0033" : "#fff" }}
                  placeholder="Model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                />
                <input
                  style={{ padding: "8px", borderRadius: "4px", border: themeStyles.cardBorder, background: darkMode ? "#1a0033" : "#fff" }}
                  placeholder="Year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  required
                />
                <input
                  style={{ padding: "8px", borderRadius: "4px", border: themeStyles.cardBorder, background: darkMode ? "#1a0033" : "#fff" }}
                  placeholder="License Plate"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                  required
                />
                <input
                  style={{ padding: "8px", borderRadius: "4px", border: themeStyles.cardBorder, background: darkMode ? "#1a0033" : "#fff" }}
                  placeholder="Mileage"
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  required
                />
                <select
                  style={{ padding: "8px", borderRadius: "4px", border: themeStyles.cardBorder, background: darkMode ? "#1a0033" : "#fff", color: darkMode ? "#fff" : "#000" }}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status} style={{ color: darkMode ? "#fff" : "#000" }}>
                      {status}
                    </option>
                  ))}
                </select>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button type="submit">{editingVehicle ? "Update" : "Add"} Vehicle</Button>
                  <Button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingVehicle(null);
                      setFormData({ make: "", model: "", year: "", licensePlate: "", mileage: "", status: "Active" });
                      setError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        <main style={{ padding: "16px", flexGrow: 1 }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            {vehicles.length ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                {vehicles.map((vehicle) => (
                  <motion.div
                    key={vehicle.id}
                    style={{
                      background: darkMode
                        ? "linear-gradient(135deg, #1a0033 0%, #330066 70%)"
                        : "linear-gradient(135deg, #e5e7eb 0%, #ffffff 100%)",
                      border: themeStyles.cardBorder,
                      borderRadius: "12px",
                      padding: "20px",
                      boxShadow: themeStyles.cardGlow,
                      position: "relative",
                      overflow: "hidden",
                    }}
                    whileHover={{ scale: 1.05, boxShadow: darkMode ? "0 0 25px rgba(250, 204, 21, 0.5)" : "0 0 25px rgba(59, 130, 246, 0.4)" }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: darkMode ? "rgba(250, 204, 21, 0.1)" : "rgba(59, 130, 246, 0.1)",
                        clipPath: "polygon(0 0, 100% 0, 85% 100%, 0% 100%)",
                        opacity: 0.3,
                      }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", position: "relative", zIndex: 1 }}>
                      <h3 style={{ color: darkMode ? "#facc15" : "#1f2937", fontWeight: "700", fontSize: "18px", textShadow: darkMode ? "0 0 5px rgba(250, 204, 21, 0.5)" : "none" }}>
                        {vehicle.make} {vehicle.model}
                      </h3>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <Edit size={22} style={{ cursor: "pointer", color: darkMode ? "#facc15" : "#3b82f6" }} onClick={() => handleEdit(vehicle)} />
                        <Trash2 size={22} style={{ cursor: "pointer", color: "#dc2626" }} onClick={() => handleDelete(vehicle.id)} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gap: "10px", fontSize: "14px", position: "relative", zIndex: 1 }}>
                      <p style={{ color: darkMode ? "#d1d5db" : "#4b5563" }}>Year: <span style={{ color: darkMode ? "#fff" : "#000" }}>{vehicle.year || "N/A"}</span></p>
                      <p style={{ color: darkMode ? "#d1d5db" : "#4b5563" }}>License: <span style={{ color: darkMode ? "#fff" : "#000" }}>{vehicle.licensePlate || "N/A"}</span></p>
                      <p style={{ color: darkMode ? "#d1d5db" : "#4b5563" }}>Mileage: <span style={{ color: darkMode ? "#fff" : "#000" }}>{vehicle.mileage ? vehicle.mileage.toLocaleString() : "0"} miles</span></p>
                      <p style={{ color: darkMode ? "#d1d5db" : "#4b5563" }}>
                        Status:{" "}
                        <span
                          style={{
                            color:
                              vehicle.status === "Active"
                                ? "#22c55e"
                                : vehicle.status === "Inactive"
                                ? "#ef4444"
                                : vehicle.status === "Maintenance"
                                ? "#facc15"
                                : "#6b7280",
                            fontWeight: "600",
                            textShadow: darkMode ? "0 0 3px rgba(255, 255, 255, 0.2)" : "none",
                          }}
                        >
                          {vehicle.status || "N/A"}
                        </span>
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div style={{ background: themeStyles.cardBg, padding: "24px", borderRadius: "8px", textAlign: "center", border: themeStyles.cardBorder }}>
                <p style={{ color: darkMode ? "#facc15" : "#1f2937" }}>No vehicles available. Click "Add Vehicle" to start managing your fleet!</p>
              </motion.div>
            )}
          </div>
        </main>
      </div>

      <footer
        style={{
          background: darkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.9)",
          padding: "16px",
          textAlign: "center",
          color: darkMode ? "#9ca3af" : "#6b7280",
          fontSize: "14px",
          flexShrink: 0,
        }}
      >
        © {new Date().getFullYear()} FleetTraq
      </footer>
    </motion.div>
  );
};

export default Vehicles;
