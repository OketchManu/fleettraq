import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Truck, Users, Clock } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import Button from "./Button";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from "chart.js";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const Analytics = () => {
  const navigate = useNavigate();
  const { darkMode, vehicles, drivers, fetchVehicles, fetchDrivers } = useFleet();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    totalMileage: 0,
    activeVehicles: 0,
    avgUtilization: 0,
  });

  const themeStyles = {
    background: darkMode
      ? "linear-gradient(135deg, #080016 0%, #150025 100%)"
      : "linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)",
    color: darkMode ? "#fff" : "#000",
    cardBg: darkMode ? "rgba(255, 255, 255, 0.1)" : "#fff",
    cardBorder: darkMode ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid #e5e7eb",
    chartBg: darkMode ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        if (!vehicles.length) await fetchVehicles();
        if (!drivers.length) await fetchDrivers();

        const totalMileage = vehicles.reduce((sum, v) => sum + (parseInt(v.mileage) || 0), 0);
        const activeVehicles = vehicles.filter((v) => v.status === "Active").length;
        const avgUtilization = vehicles.length
          ? vehicles.reduce((sum, v) => sum + (v.utilizationRate || 0), 0) / vehicles.length
          : 0;

        setAnalyticsData({
          totalMileage,
          activeVehicles,
          avgUtilization,
        });
      } catch (error) {
        console.error("Error loading analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [vehicles, drivers, fetchVehicles, fetchDrivers]);

  const mileageChartData = {
    labels: vehicles.length ? vehicles.map((v) => `${v.make} ${v.model}`) : ["No Data"],
    datasets: [
      {
        label: "Mileage",
        data: vehicles.length ? vehicles.map((v) => v.mileage || 0) : [0],
        backgroundColor: darkMode ? "rgba(250, 204, 21, 0.7)" : "rgba(59, 130, 246, 0.7)",
        borderColor: darkMode ? "#facc15" : "#3b82f6",
        borderWidth: 1,
      },
    ],
  };

  const statusChartData = {
    labels: ["Active", "Inactive"],
    datasets: [
      {
        data: vehicles.length
          ? [analyticsData.activeVehicles, vehicles.length - analyticsData.activeVehicles]
          : [0, 0],
        backgroundColor: [darkMode ? "#22c55e" : "#16a34a", darkMode ? "#ef4444" : "#dc2626"],
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: darkMode ? "#fff" : "#000", font: { size: "clamp(10px, 2vw, 14px)" } } },
      tooltip: { backgroundColor: darkMode ? "#1f2937" : "#fff" },
    },
    scales: darkMode
      ? {
          x: { ticks: { color: "#fff" }, grid: { color: "rgba(255, 255, 255, 0.1)" } },
          y: { ticks: { color: "#fff" }, grid: { color: "rgba(255, 255, 255, 0.1)" } },
        }
      : {},
  };

  return (
    <motion.div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        ...themeStyles,
        padding: "0 1rem", // Responsive padding
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <header
        style={{
          background: darkMode ? "rgba(0, 0, 0, 0.5)" : "#e5e7eb",
          padding: "0.75rem 1rem",
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
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap", // Allow wrapping on small screens
            gap: "0.5rem",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(1.25rem, 4vw, 1.5rem)", // Responsive font size
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              color: darkMode ? "#facc15" : "#1f2937",
            }}
          >
            <BarChart style={{ marginRight: "0.5rem", width: "clamp(1rem, 3vw, 1.5rem)", height: "clamp(1rem, 3vw, 1.5rem)" }} /> Fleet Analytics
          </h1>
          <Button
            onClick={() => navigate("/dashboard")}
            style={{ padding: "0.5rem 1rem", fontSize: "clamp(0.875rem, 2.5vw, 1rem)" }}
          >
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main style={{ padding: "1rem", flexGrow: 1 }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          {loading ? (
            <motion.div
              style={{
                textAlign: "center",
                padding: "1.5rem",
                fontSize: "clamp(1rem, 3vw, 1.125rem)",
              }}
            >
              <p>Loading analytics data...</p>
            </motion.div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", // Responsive grid
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <motion.div
                  style={{
                    background: themeStyles.cardBg,
                    padding: "1rem",
                    borderRadius: "0.5rem",
                    border: themeStyles.cardBorder,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <Truck size={20} />
                    <h3 style={{ color: darkMode ? "#facc15" : "#1f2937", fontSize: "clamp(0.875rem, 2.5vw, 1rem)" }}>
                      Fleet Size
                    </h3>
                  </div>
                  <p style={{ fontSize: "clamp(1.25rem, 4vw, 1.5rem)", fontWeight: "bold" }}>{vehicles.length}</p>
                  <p style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}>
                    Active: {analyticsData.activeVehicles}
                  </p>
                </motion.div>

                <motion.div
                  style={{
                    background: themeStyles.cardBg,
                    padding: "1rem",
                    borderRadius: "0.5rem",
                    border: themeStyles.cardBorder,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <Users size={20} />
                    <h3 style={{ color: darkMode ? "#facc15" : "#1f2937", fontSize: "clamp(0.875rem, 2.5vw, 1rem)" }}>
                      Drivers
                    </h3>
                  </div>
                  <p style={{ fontSize: "clamp(1.25rem, 4vw, 1.5rem)", fontWeight: "bold" }}>{drivers.length}</p>
                  <p style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}>
                    Assigned: {drivers.filter((d) => d.vehicleId).length}
                  </p>
                </motion.div>

                <motion.div
                  style={{
                    background: themeStyles.cardBg,
                    padding: "1rem",
                    borderRadius: "0.5rem",
                    border: themeStyles.cardBorder,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <Clock size={20} />
                    <h3 style={{ color: darkMode ? "#facc15" : "#1f2937", fontSize: "clamp(0.875rem, 2.5vw, 1rem)" }}>
                      Avg Utilization
                    </h3>
                  </div>
                  <p style={{ fontSize: "clamp(1.25rem, 4vw, 1.5rem)", fontWeight: "bold" }}>
                    {Math.round(analyticsData.avgUtilization)}%
                  </p>
                  <p style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}>Fleet usage rate</p>
                </motion.div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "1fr 1fr", // Stack charts on small screens
                  gap: "1.5rem",
                }}
              >
                <motion.div
                  style={{
                    background: themeStyles.chartBg,
                    padding: "1rem",
                    borderRadius: "0.5rem",
                    border: themeStyles.cardBorder,
                  }}
                >
                  <h3
                    style={{
                      color: darkMode ? "#facc15" : "#1f2937",
                      marginBottom: "1rem",
                      fontSize: "clamp(1rem, 3vw, 1.125rem)",
                    }}
                  >
                    Vehicle Mileage Distribution
                  </h3>
                  <div style={{ height: "calc(40vh - 2rem)", minHeight: "200px" }}>
                    <Bar data={mileageChartData} options={{ ...chartOptions, responsive: true }} />
                  </div>
                </motion.div>

                <motion.div
                  style={{
                    background: themeStyles.chartBg,
                    padding: "1rem",
                    borderRadius: "0.5rem",
                    border: themeStyles.cardBorder,
                  }}
                >
                  <h3
                    style={{
                      color: darkMode ? "#facc15" : "#1f2937",
                      marginBottom: "1rem",
                      fontSize: "clamp(1rem, 3vw, 1.125rem)",
                    }}
                  >
                    Fleet Status
                  </h3>
                  <div style={{ height: "calc(40vh - 2rem)", minHeight: "200px" }}>
                    <Pie data={statusChartData} options={{ ...chartOptions, responsive: true }} />
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </div>
      </main>

      <footer
        style={{
          background: darkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.9)",
          padding: "1rem",
          textAlign: "center",
          color: darkMode ? "#9ca3af" : "#6b7280",
          fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
          flexShrink: 0,
        }}
      >
        © {new Date().getFullYear()} FleetTraq • Data as of {new Date().toLocaleDateString()}
      </footer>
    </motion.div>
  );
};

export default Analytics;
