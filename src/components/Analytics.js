import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Truck, Users, Clock, TrendingUp, Fuel, Calendar, Download } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import Button from "./Button";
import { Bar, Pie, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, PointElement, LineElement } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, PointElement, LineElement);

const Analytics = () => {
  const navigate = useNavigate();
  const { darkMode, vehicles, drivers, trackingData } = useFleet();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    totalMileage: 0,
    activeVehicles: 0,
    avgUtilization: 0,
    totalDrivers: 0,
    avgFuelEfficiency: 0,
    maintenanceVehicles: 0,
  });
  const [timeRange, setTimeRange] = useState("week");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const totalMileage = vehicles.reduce((sum, v) => sum + (parseInt(v.mileage) || 0), 0);
        const activeVehicles = vehicles.filter(v => v.status === "Active").length;
        const maintenanceVehicles = vehicles.filter(v => v.status === "Maintenance").length;
        const avgUtilization = vehicles.length ? (vehicles.reduce((sum, v) => sum + (v.utilizationRate || 85), 0) / vehicles.length) : 0;
        const avgFuelEfficiency = vehicles.length ? (vehicles.reduce((sum, v) => sum + (v.fuelEfficiency || 15), 0) / vehicles.length) : 0;

        setAnalyticsData({
          totalMileage,
          activeVehicles,
          avgUtilization,
          totalDrivers: drivers.length,
          avgFuelEfficiency: Math.round(avgFuelEfficiency),
          maintenanceVehicles,
        });
      } catch (error) {
        console.error("Error loading analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [vehicles, drivers]);

  // Sample weekly mileage data
  const weeklyData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Mileage (miles)",
        data: [1240, 980, 1560, 1420, 1890, 560, 320],
        backgroundColor: darkMode ? "rgba(250, 204, 21, 0.7)" : "rgba(59, 130, 246, 0.7)",
        borderColor: darkMode ? "#facc15" : "#3b82f6",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const monthlyData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Mileage (miles)",
        data: [6840, 7120, 6980, 7450],
        backgroundColor: darkMode ? "rgba(250, 204, 21, 0.7)" : "rgba(59, 130, 246, 0.7)",
        borderColor: darkMode ? "#facc15" : "#3b82f6",
        borderWidth: 2,
      },
    ],
  };

  const mileageChartData = {
    labels: timeRange === "week" ? weeklyData.labels : monthlyData.labels,
    datasets: timeRange === "week" ? weeklyData.datasets : monthlyData.datasets,
  };

  const statusChartData = {
    labels: ["Active", "Maintenance", "Inactive", "On Route"],
    datasets: [
      {
        data: [
          analyticsData.activeVehicles,
          analyticsData.maintenanceVehicles,
          vehicles.filter(v => v.status === "Inactive").length,
          vehicles.filter(v => v.status === "On Route").length,
        ],
        backgroundColor: ["#22c55e", "#facc15", "#ef4444", "#06b6d4"],
        borderWidth: 0,
      },
    ],
  };

  const utilizationData = {
    labels: vehicles.slice(0, 8).map(v => `${v.make} ${v.model}`.substring(0, 15)),
    datasets: [
      {
        label: "Utilization Rate (%)",
        data: vehicles.slice(0, 8).map(v => v.utilizationRate || Math.floor(Math.random() * 40) + 60),
        backgroundColor: darkMode ? "rgba(232, 121, 249, 0.7)" : "rgba(139, 92, 246, 0.7)",
        borderColor: darkMode ? "#e879f9" : "#8b5cf6",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: darkMode ? "#fff" : "#000", font: { size: 12 } },
      },
      tooltip: { backgroundColor: darkMode ? "#1f2937" : "#fff", titleColor: darkMode ? "#fff" : "#000", bodyColor: darkMode ? "#ccc" : "#666" },
    },
    scales: darkMode ? {
      x: { ticks: { color: "#fff" }, grid: { color: "rgba(255, 255, 255, 0.1)" } },
      y: { ticks: { color: "#fff" }, grid: { color: "rgba(255, 255, 255, 0.1)" } }
    } : {},
  };

  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      fleetStats: analyticsData,
      vehicles: vehicles.map(v => ({ make: v.make, model: v.model, mileage: v.mileage, status: v.status })),
      drivers: drivers.map(d => ({ name: d.name, status: d.status })),
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fleet-report-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a1a] to-[#0f0f2a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading analytics...</p>
        </div>
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
              <BarChart className="w-8 h-8 text-yellow-500" />
              <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                Fleet Analytics
              </h1>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportReport}>
                <Download size={18} />
                Export Report
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
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-lg`}
          >
            <Truck className="w-8 h-8 text-yellow-500 mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{vehicles.length}</p>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Vehicles</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-5 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-lg`}
          >
            <Users className="w-8 h-8 text-cyan-400 mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{analyticsData.totalDrivers}</p>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Drivers</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-5 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-lg`}
          >
            <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{Math.round(analyticsData.avgUtilization)}%</p>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Avg Utilization</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-5 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-lg`}
          >
            <Fuel className="w-8 h-8 text-purple-400 mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{analyticsData.avgFuelEfficiency}</p>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Avg MPG</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`p-5 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-lg`}
          >
            <Clock className="w-8 h-8 text-orange-400 mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{Math.round(analyticsData.totalMileage / 1000)}k</p>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Miles (k)</p>
          </motion.div>
        </div>

        {/* Time Range Selector */}
        <div className="flex justify-end mb-4">
          <div className={`inline-flex rounded-xl overflow-hidden border ${darkMode ? "border-white/10" : "border-gray-200"}`}>
            <button
              onClick={() => setTimeRange("week")}
              className={`px-4 py-2 text-sm font-medium transition-all ${timeRange === "week" 
                ? "bg-yellow-500 text-black" 
                : darkMode ? "bg-white/10 text-gray-300 hover:bg-white/20" : "bg-white text-gray-600 hover:bg-gray-100"}`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeRange("month")}
              className={`px-4 py-2 text-sm font-medium transition-all ${timeRange === "month" 
                ? "bg-yellow-500 text-black" 
                : darkMode ? "bg-white/10 text-gray-300 hover:bg-white/20" : "bg-white text-gray-600 hover:bg-gray-100"}`}
            >
              This Month
            </button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mileage Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl p-5 ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-lg`}
          >
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Truck size={18} className="text-yellow-500" />
              Mileage Overview ({timeRange === "week" ? "Weekly" : "Monthly"})
            </h3>
            <div className="h-80">
              <Bar data={mileageChartData} options={chartOptions} />
            </div>
          </motion.div>

          {/* Fleet Status Pie Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`rounded-2xl p-5 ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-lg`}
          >
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Calendar size={18} className="text-yellow-500" />
              Fleet Status Distribution
            </h3>
            <div className="h-80 flex items-center justify-center">
              <Pie data={statusChartData} options={chartOptions} />
            </div>
          </motion.div>

          {/* Vehicle Utilization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`rounded-2xl p-5 ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-lg lg:col-span-2`}
          >
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <TrendingUp size={18} className="text-yellow-500" />
              Vehicle Utilization Rates
            </h3>
            <div className="h-80">
              <Bar data={utilizationData} options={{ ...chartOptions, indexAxis: 'y' }} />
            </div>
          </motion.div>
        </div>

        {/* Key Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`mt-6 rounded-2xl p-5 ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"} shadow-lg`}
        >
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
            <TrendingUp size={18} className="text-yellow-500" />
            Key Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl ${darkMode ? "bg-black/30" : "bg-gray-50"}`}>
              <p className="text-green-400 font-semibold">↑ 12%</p>
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Fleet utilization increased this month</p>
            </div>
            <div className={`p-4 rounded-xl ${darkMode ? "bg-black/30" : "bg-gray-50"}`}>
              <p className="text-yellow-400 font-semibold">↓ 5%</p>
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Average fuel consumption decreased</p>
            </div>
            <div className={`p-4 rounded-xl ${darkMode ? "bg-black/30" : "bg-gray-50"}`}>
              <p className="text-cyan-400 font-semibold">+8 vehicles</p>
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Fleet size growth this quarter</p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className={`mt-12 py-6 text-center border-t ${darkMode ? "border-white/10 text-gray-500" : "border-gray-200 text-gray-600"}`}>
        <p>© 2024 FleetTraq. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Analytics;