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
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setScreenWidth(newWidth);
      console.log("Screen width updated:", newWidth); // Debug log
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call to set width
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
            size: screenWidth < 480 ? 8 : 12 // Smaller font for very small screens
          }
        },
        position: screenWidth < 480 ? 'bottom' : 'right', // Move legend to bottom on small screens
      },
      tooltip: { 
        backgroundColor: darkMode ? "#1f2937" : "#fff",
        titleFont: {
          size: screenWidth < 480 ? 8 : 12
        },
        bodyFont: {
          size: screenWidth < 480 ? 8 : 12
        }
      },
    },
    scales: darkMode ? {
      x: { 
        ticks: { 
          color: "#fff",
          font: {
            size: screenWidth < 480 ? 6 : 10
          }
        }, 
        grid: { color: "rgba(255, 255, 255, 0.1)" } 
      },
      y: { 
        ticks: { 
          color: "#fff",
          font: {
            size: screenWidth < 480 ? 6 : 10
          }
        }, 
        grid: { color: "rgba(255, 255, 255, 0.1)" } 
      }
    } : {
      x: { 
        ticks: { 
          font: {
            size: screenWidth < 480 ? 6 : 10
          }
        }
      },
      y: { 
        ticks: { 
          font: {
            size: screenWidth < 480 ? 6 : 10
          }
        }
      }
    }
  };

  // Responsive container styles
  const responsiveStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100vw',
      maxWidth: '100%',
      overflowX: 'hidden',
      ...themeStyles
    },
    header: {
      position: 'sticky',
      top: 0,
      zIndex: 10,
      padding: screenWidth < 480 ? '6px 10px' : '12px 16px',
      background: darkMode ? "rgba(0, 0, 0, 0.5)" : "#e5e7eb",
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: screenWidth < 480 ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px'
    },
    headerTitle: {
      fontSize: screenWidth < 480 ? '14px' : '24px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      color: darkMode ? "#facc15" : "#1f2937",
      marginBottom: screenWidth < 480 ? '6px' : '0'
    },
    mainContent: {
      flex: 1,
      padding: screenWidth < 480 ? '10px' : '16px',
      width: '100%',
      overflowX: 'hidden'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: screenWidth < 480 ? '1fr' : screenWidth < 1024 ? '1fr 1fr' : '1fr 1fr 1fr',
      gap: screenWidth < 480 ? '10px' : '16px',
      marginBottom: screenWidth < 480 ? '12px' : '24px'
    },
    statsCard: {
      background: themeStyles.cardBg,
      padding: screenWidth < 480 ? '10px' : '16px',
      borderRadius: '8px',
      border: themeStyles.cardBorder,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    chartsContainer: {
      display: 'flex',
      flexDirection: screenWidth < 480 ? 'column' : 'row', // Stack on phones (< 480px)
      gap: screenWidth < 480 ? '12px' : '24px',
      width: '100%',
      maxWidth: '100%',
      overflowX: 'hidden'
    },
    chartContainer: {
      background: themeStyles.chartBg,
      padding: screenWidth < 480 ? '10px' : '16px',
      borderRadius: '8px',
      border: themeStyles.cardBorder,
      height: screenWidth < 480 ? '180px' : '300px', // Smaller height on phones
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden'
    },
    chartTitle: {
      color: darkMode ? "#facc15" : "#1f2937",
      marginBottom: screenWidth < 480 ? '10px' : '16px',
      fontSize: screenWidth < 480 ? '12px' : '16px'
    },
    footer: {
      background: darkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.9)",
      padding: screenWidth < 480 ? '10px' : '16px',
      textAlign: 'center',
      color: darkMode ? "#9ca3af" : "#6b7280",
      fontSize: screenWidth < 480 ? '10px' : '14px'
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
          <BarChart style={{ marginRight: '8px', width: screenWidth < 480 ? '16px' : '24px', height: screenWidth < 480 ? '16px' : '24px' }} /> 
          Fleet Analytics
        </h1>
        <Button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </header>

      {/* Main Content */}
      <main style={responsiveStyles.mainContent}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: screenWidth < 480 ? '12px' : '24px' }}>
            <p style={{ fontSize: screenWidth < 480 ? '12px' : '16px' }}>Loading analytics data...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div style={responsiveStyles.statsGrid}>
              {/* Fleet Size Card */}
              <div style={responsiveStyles.statsCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Truck size={screenWidth < 480 ? 16 : 20} />
                  <h3 style={{ color: darkMode ? "#facc15" : "#1f2937", fontSize: screenWidth < 480 ? '12px' : '16px' }}>
                    Fleet Size
                  </h3>
                </div>
                <p style={{ fontSize: screenWidth < 480 ? '16px' : '20px', fontWeight: 'bold' }}>{vehicles.length}</p>
                <p style={{ fontSize: screenWidth < 480 ? '10px' : '12px' }}>Active: {analyticsData.activeVehicles}</p>
              </div>

              {/* Drivers Card */}
              <div style={responsiveStyles.statsCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Users size={screenWidth < 480 ? 16 : 20} />
                  <h3 style={{ color: darkMode ? "#facc15" : "#1f2937", fontSize: screenWidth < 480 ? '12px' : '16px' }}>
                    Drivers
                  </h3>
                </div>
                <p style={{ fontSize: screenWidth < 480 ? '16px' : '20px', fontWeight: 'bold' }}>{drivers.length}</p>
                <p style={{ fontSize: screenWidth < 480 ? '10px' : '12px' }}>Assigned: {drivers.filter(d => d.vehicleId).length}</p>
              </div>

              {/* Utilization Card */}
              <div style={responsiveStyles.statsCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Clock size={screenWidth < 480 ? 16 : 20} />
                  <h3 style={{ color: darkMode ? "#facc15" : "#1f2937", fontSize: screenWidth < 480 ? '12px' : '16px' }}>
                    Avg Utilization
                  </h3>
                </div>
                <p style={{ fontSize: screenWidth < 480 ? '16px' : '20px', fontWeight: 'bold' }}>{Math.round(analyticsData.avgUtilization)}%</p>
                <p style={{ fontSize: screenWidth < 480 ? '10px' : '12px' }}>Fleet usage rate</p>
              </div>
            </div>

            {/* Charts */}
            <div style={responsiveStyles.chartsContainer}>
              {/* Mileage Chart */}
              <div style={responsiveStyles.chartContainer}>
                <h3 style={responsiveStyles.chartTitle}>
                  Vehicle Mileage Distribution
                </h3>
                <div style={{ height: '100%', width: '100%' }}>
                  <Bar 
                    data={mileageChartData} 
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          ...chartOptions.plugins.legend,
                          display: screenWidth >= 480
                        }
                      }
                    }} 
                  />
                </div>
              </div>

              {/* Status Chart */}
              <div style={responsiveStyles.chartContainer}>
                <h3 style={responsiveStyles.chartTitle}>
                  Fleet Status
                </h3>
                <div style={{ height: '100%', width: '100%' }}>
                  <Pie 
                    data={statusChartData} 
                    options={chartOptions} 
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
