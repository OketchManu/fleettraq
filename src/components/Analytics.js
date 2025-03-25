import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Truck, Users, Clock } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import Button from "./Button";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from "chart.js";

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
    background: darkMode ? "linear-gradient(135deg, #080016 0%, #150025 100%)" : "linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)",
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
        const activeVehicles = vehicles.filter(v => v.status === "Active").length;
        const avgUtilization = vehicles.length ? (vehicles.reduce((sum, v) => sum + (v.utilizationRate || 0), 0) / vehicles.length) : 0;

        setAnalyticsData({ totalMileage, activeVehicles, avgUtilization });
      } catch (error) {
        console.error("Error loading analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [vehicles, drivers, fetchVehicles, fetchDrivers]);

  const mileageChartData = {
    labels: vehicles.length ? vehicles.map(v => `${v.make} ${v.model}`) : ["No Data"],
    datasets: [{
      label: "Mileage",
      data: vehicles.length ? vehicles.map(v => v.mileage || 0) : [0],
      backgroundColor: darkMode ? "rgba(250, 204, 21, 0.7)" : "rgba(59, 130, 246, 0.7)",
      borderColor: darkMode ? "#facc15" : "#3b82f6",
      borderWidth: 1,
    }]
  };

  const statusChartData = {
    labels: ["Active", "Inactive"],
    datasets: [{
      data: vehicles.length ? [analyticsData.activeVehicles, vehicles.length - analyticsData.activeVehicles] : [0, 0],
      backgroundColor: [darkMode ? "#22c55e" : "#16a34a", darkMode ? "#ef4444" : "#dc2626"],
    }]
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: darkMode ? "#fff" : "#000" } },
      tooltip: { backgroundColor: darkMode ? "#1f2937" : "#fff" },
    },
    scales: darkMode ? {
      x: { ticks: { color: "#fff" }, grid: { color: "rgba(255, 255, 255, 0.1)" } },
      y: { ticks: { color: "#fff" }, grid: { color: "rgba(255, 255, 255, 0.1)" } }
    } : {}
  };

  return (
    <motion.div 
      style={{ 
        minHeight: "100vh", 
        ...themeStyles,
        display: "flex",
        flexDirection: "column"
      }} 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
    >
      <header 
        style={{ 
          background: darkMode ? "rgba(0, 0, 0, 0.5)" : "#e5e7eb", 
          padding: "10px 15px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)", 
          position: "sticky", 
          top: 0, 
          zIndex: 10 
        }}
      >
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px"
          }}
        >
          <h1 
            style={{ 
              fontSize: "20px", 
              fontWeight: "bold", 
              display: "flex", 
              alignItems: "center", 
              color: darkMode ? "#facc15" : "#1f2937",
              margin: 0
            }}
          >
            <BarChart style={{ marginRight: "6px", width: "20px", height: "20px" }} /> 
            Fleet Analytics
          </h1>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </header>

      <main 
        style={{ 
          padding: "15px", 
          flexGrow: 1,
          overflowX: "hidden"
        }}
      >
        <div style={{ width: "100%" }}>
          {loading ? (
            <motion.div style={{ textAlign: "center", padding: "20px" }}>
              <p>Loading analytics data...</p>
            </motion.div>
          ) : (
            <>
              <div 
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                  gap: "15px", 
                  marginBottom: "20px" 
                }}
              >
                <motion.div 
                  style={{ 
                    background: themeStyles.cardBg, 
                    padding: "15px", 
                    borderRadius: "8px", 
                    border: themeStyles.cardBorder 
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <Truck size={18} />
                    <h3 style={{ color: darkMode ? "#facc15" : "#1f2937", fontSize: "16px", margin: 0 }}>Fleet Size</h3>
                  </div>
                  <p style={{ fontSize: "22px", fontWeight: "bold", margin: "5px 0" }}>{vehicles.length}</p>
                  <p style={{ fontSize: "12px", margin: 0 }}>Active: {analyticsData.activeVehicles}</p>
                </motion.div>

                <motion.div 
                  style={{ 
                    background: themeStyles.cardBg, 
                    padding: "15px", 
                    borderRadius: "8px", 
                    border: themeStyles.cardBorder 
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <Users size={18} />
                    <h3 style={{ color: darkMode ? "#facc15" : "#1f2937", fontSize: "16px", margin: 0 }}>Drivers</h3>
                  </div>
                  <p style={{ fontSize: "22px", fontWeight: "bold", margin: "5px 0" }}>{drivers.length}</p>
                  <p style={{ fontSize: "12px", margin: 0 }}>Assigned: {drivers.filter(d => d.vehicleId).length}</p>
                </motion.div>

                <motion.div 
                  style={{ 
                    background: themeStyles.cardBg, 
                    padding: "15px", 
                    borderRadius: "8px", 
                    border: themeStyles.cardBorder 
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <Clock size={18} />
                    <h3 style={{ color: darkMode ? "#facc15" : "#1f2937", fontSize: "16px", margin: 0 }}>Avg Utilization</h3>
                  </div>
                  <p style={{ fontSize: "22px", fontWeight: "bold", margin: "5px 0" }}>{Math.round(analyticsData.avgUtilization)}%</p>
                  <p style={{ fontSize: "12px", margin: 0 }}>Fleet usage rate</p>
                </motion.div>
              </div>

              <div 
                style={{ 
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  '@media (min-width: 768px)': { 
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr" 
                  }
                }}
              >
                <motion.div 
                  style={{ 
                    background: themeStyles.chartBg, 
                    padding: "15px", 
                    borderRadius: "8px", 
                    border: themeStyles.cardBorder 
                  }}
                >
                  <h3 
                    style={{ 
                      color: darkMode ? "#facc15" : "#1f2937", 
                      marginBottom: "15px",
                      fontSize: "16px"
                    }}
                  >
                    Vehicle Mileage Distribution
                  </h3>
                  <div style={{ height: "250px", width: "100%" }}>
                    <Bar data={mileageChartData} options={{ ...chartOptions, responsive: true }} />
                  </div>
                </motion.div>

                <motion.div 
                  style={{ 
                    background: themeStyles.chartBg, 
                    padding: "15px", 
                    borderRadius: "8px", 
                    border: themeStyles.cardBorder 
                  }}
                >
                  <h3 
                    style={{ 
                      color: darkMode ? "#facc15" : "#1f2937", 
                      marginBottom: "15px",
                      fontSize: "16px"
                    }}
                  >
                    Fleet Status
                  </h3>
                  <div style={{ height: "250px", width: "100%" }}>
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
          padding: "15px", 
          textAlign: "center", 
          color: darkMode ? "#9ca3af" : "#6b7280", 
          fontSize: "12px" 
        }}
      >
        © {new Date().getFullYear()} FleetTraq • Data as of {new Date().toLocaleDateString()}
      </footer>
    </motion.div>
  );
};

export default Analytics;
