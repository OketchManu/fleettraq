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
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [analyticsData, setAnalyticsData] = useState({
    totalMileage: 0,
    activeVehicles: 0,
    avgUtilization: 0,
  });

  // Update screen width on resize
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        const activeVehicles = vehicles.filter(v => v.status === "Active").length;
        const avgUtilization = vehicles.length 
          ? (vehicles.reduce((sum, v) => sum + (v.utilizationRate || 0), 0) / vehicles.length) 
          : 0;

        setAnalyticsData({
          totalMileage,
          activeVehicles,
          avgUtilization
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
      data: vehicles.length 
        ? [analyticsData.activeVehicles, vehicles.length - analyticsData.activeVehicles] 
        : [0, 0],
      backgroundColor: [
        darkMode ? "#22c55e" : "#16a34a", 
        darkMode ? "#ef4444" : "#dc2626"
      ],
    }]
  };

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { 
        labels: { 
          color: darkMode ? "#fff" : "#000",
          font: {
            size: screenWidth < 640 ? 10 : 12
          }
        } 
      },
      tooltip: { 
        backgroundColor: darkMode ? "#1f2937" : "#fff",
        titleFont: {
          size: screenWidth < 640 ? 10 : 12
        },
        bodyFont: {
          size: screenWidth < 640 ? 10 : 12
        }
      },
    },
    scales: darkMode ? {
      x: { 
        ticks: { 
          color: "#fff",
          font: {
            size: screenWidth < 640 ? 8 : 10
          }
        }, 
        grid: { color: "rgba(255, 255, 255, 0.1)" } 
      },
      y: { 
        ticks: { 
          color: "#fff",
          font: {
            size: screenWidth < 640 ? 8 : 10
          }
        }, 
        grid: { color: "rgba(255, 255, 255, 0.1)" } 
      }
    } : {}
  };

  // Responsive container styles
  const responsiveStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100vw',
      maxWidth: '100%',
      ...themeStyles
    },
    header: {
      position: 'sticky',
      top: 0,
      zIndex: 10,
      padding: '12px 16px',
      background: darkMode ? "rgba(0, 0, 0, 0.5)" : "#e5e7eb",
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: screenWidth < 640 ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px'
    },
    headerTitle: {
      fontSize: screenWidth < 640 ? '18px' : '24px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      color: darkMode ? "#facc15" : "#1f2937",
      marginBottom: screenWidth < 640 ? '10px' : '0'
    },
    mainContent: {
      flex: 1,
      padding: '16px',
      width: '100%',
      overflowX: 'hidden'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: screenWidth < 640 ? '1fr' : screenWidth < 1024 ? '1fr 1fr' : '1fr 1fr 1fr',
      gap: '16px',
      marginBottom: '24px'
    },
    statsCard: {
      background: themeStyles.cardBg,
      padding: '16px',
      borderRadius: '8px',
      border: themeStyles.cardBorder,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    chartsGrid: {
      display: 'grid',
      gridTemplateColumns: screenWidth < 1024 ? '1fr' : '1fr 1fr',
      gap: '24px'
    },
    chartContainer: {
      background: themeStyles.chartBg,
      padding: '16px',
      borderRadius: '8px',
      border: themeStyles.cardBorder,
      height: screenWidth < 640 ? '250px' : '300px'
    },
    footer: {
      background: darkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.9)",
      padding: '16px',
      textAlign: 'center',
      color: darkMode ? "#9ca3af" : "#6b7280",
      fontSize: screenWidth < 640 ? '12px' : '14px'
    }
  };

  return (
    <motion.div 
      style={responsiveStyles.container}
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <header style={responsiveStyles.header}>
        <h1 style={responsiveStyles.headerTitle}>
          <BarChart style={{ marginRight: '8px', width: screenWidth < 640 ? '20px' : '24px', height: screenWidth < 640 ? '20px' : '24px' }} /> 
          Fleet Analytics
        </h1>
        <Button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </header>

      {/* Main Content */}
      <main style={responsiveStyles.mainContent}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <p>Loading analytics data...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div style={responsiveStyles.statsGrid}>
              {/* Fleet Size Card */}
              <div style={responsiveStyles.statsCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Truck size={20} />
                  <h3 style={{ color: darkMode ? "#facc15" : "#1f2937", fontSize: '16px' }}>
                    Fleet Size
                  </h3>
                </div>
                <p style={{ fontSize: '20px', fontWeight: 'bold' }}>{vehicles.length}</p>
                <p style={{ fontSize: '12px' }}>Active: {analyticsData.activeVehicles}</p>
              </div>

              {/* Drivers Card */}
              <div style={responsiveStyles.statsCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Users size={20} />
                  <h3 style={{ color: darkMode ? "#facc15" : "#1f2937", fontSize: '16px' }}>
                    Drivers
                  </h3>
                </div>
                <p style={{ fontSize: '20px', fontWeight: 'bold' }}>{drivers.length}</p>
                <p style={{ fontSize: '12px' }}>Assigned: {drivers.filter(d => d.vehicleId).length}</p>
              </div>

              {/* Utilization Card */}
              <div style={responsiveStyles.statsCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Clock size={20} />
                  <h3 style={{ color: darkMode ? "#facc15" : "#1f2937", fontSize: '16px' }}>
                    Avg Utilization
                  </h3>
                </div>
                <p style={{ fontSize: '20px', fontWeight: 'bold' }}>{Math.round(analyticsData.avgUtilization)}%</p>
                <p style={{ fontSize: '12px' }}>Fleet usage rate</p>
              </div>
            </div>

            {/* Charts */}
            <div style={{
              display: 'flex', 
              flexDirection: screenWidth < 1024 ? 'column' : 'row',
              gap: '24px'
            }}>
              {/* Mileage Chart */}
              <div style={{
                ...responsiveStyles.chartContainer,
                flex: 1,
                width: screenWidth < 1024 ? '100%' : '50%'
              }}>
                <h3 style={{ color: darkMode ? "#facc15" : "#1f2937", marginBottom: '16px', fontSize: '16px' }}>
                  Vehicle Mileage Distribution
                </h3>
                <div style={{ height: '100%' }}>
                  <Bar 
                    data={mileageChartData} 
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          ...chartOptions.plugins.legend,
                          display: screenWidth >= 640
                        }
                      }
                    }} 
                  />
                </div>
              </div>

              {/* Status Chart */}
              <div style={{
                ...responsiveStyles.chartContainer,
                flex: 1,
                width: screenWidth < 1024 ? '100%' : '50%'
              }}>
                <h3 style={{ color: darkMode ? "#facc15" : "#1f2937", marginBottom: '16px', fontSize: '16px' }}>
                  Fleet Status
                </h3>
                <div style={{ height: '100%' }}>
                  <Pie 
                    data={statusChartData} 
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          ...chartOptions.plugins.legend,
                          position: screenWidth < 640 ? 'bottom' : 'right'
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={responsiveStyles.footer}>
        © {new Date().getFullYear()} FleetTraq • Data as of {new Date().toLocaleDateString()}
      </footer>
    </motion.div>
  );
};

export default Analytics;
