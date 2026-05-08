import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Edit, Trash2, X, Check, AlertCircle, Calendar, Download, Eye } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import { db, auth } from "../firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import Button from "./Button";

const Reports = () => {
  const navigate = useNavigate();
  const { darkMode, reports, fetchReports } = useFleet();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    description: "",
    type: "Maintenance",
    status: "Pending",
  });
  const [error, setError] = useState(null);

  const reportTypes = ["Maintenance", "Fuel", "Incident", "Performance", "Driver", "Monthly Summary"];
  const statusOptions = ["Pending", "Completed", "In Progress", "Archived"];
  const statusColors = {
    Pending: "text-yellow-400",
    Completed: "text-green-400",
    "In Progress": "text-cyan-400",
    Archived: "text-gray-400"
  };
  const typeColors = {
    Maintenance: "bg-blue-500/20 text-blue-400",
    Fuel: "bg-green-500/20 text-green-400",
    Incident: "bg-red-500/20 text-red-400",
    Performance: "bg-purple-500/20 text-purple-400",
    Driver: "bg-orange-500/20 text-orange-400",
    "Monthly Summary": "bg-pink-500/20 text-pink-400"
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!auth.currentUser) {
      setError("You must be logged in to manage reports.");
      return;
    }

    try {
      const reportData = {
        ...formData,
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
        accountId: auth.currentUser.uid,
        updatedAt: new Date().toISOString(),
      };

      if (editingReport) {
        const reportRef = doc(db, "reports", editingReport.id);
        await updateDoc(reportRef, reportData);
      } else {
        await addDoc(collection(db, "reports"), {
          ...reportData,
          createdAt: new Date().toISOString(),
        });
      }

      await fetchReports();
      resetForm();
      setShowAddForm(false);
    } catch (err) {
      console.error("Error saving report:", err);
      setError("Failed to save report. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;

    if (!auth.currentUser) {
      setError("You must be logged in to delete reports.");
      return;
    }

    try {
      const reportRef = doc(db, "reports", id);
      await deleteDoc(reportRef);
      await fetchReports();
    } catch (err) {
      console.error("Error deleting report:", err);
      setError("Failed to delete report. Please try again.");
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setFormData({
      title: report.title || "",
      date: report.date ? new Date(report.date).toISOString().split("T")[0] : "",
      description: report.description || "",
      type: report.type || "Maintenance",
      status: report.status || "Pending",
    });
    setShowAddForm(true);
  };

  const handleView = (report) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };

  const handleExportPDF = (report) => {
    // Create a simple text export of the report
    const reportContent = `
      FLEETRAQ REPORT
      ================
      Title: ${report.title}
      Type: ${report.type}
      Date: ${new Date(report.date).toLocaleDateString()}
      Status: ${report.status}
      
      Description:
      ${report.description}
      
      Generated: ${new Date().toLocaleString()}
    `;
    
    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setEditingReport(null);
    setFormData({
      title: "",
      date: "",
      description: "",
      type: "Maintenance",
      status: "Pending",
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
              <FileText className="w-8 h-8 text-yellow-500" />
              <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                Report Management
              </h1>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowAddForm(true)}>
                <Plus size={18} />
                Create Report
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

        {reports.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl ${darkMode ? "bg-white/5" : "bg-white"} border ${darkMode ? "border-white/10" : "border-gray-200"}`}>
            <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"} mb-2`}>No Reports Yet</h3>
            <p className={`${darkMode ? "text-gray-400" : "text-gray-600"} mb-4`}>Create your first report to track fleet activities.</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus size={18} />
              Create First Report
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className={`group rounded-2xl overflow-hidden ${darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"} border shadow-lg transition-all cursor-pointer`}
                onClick={() => handleView(report)}
              >
                <div className="relative h-28 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 p-4">
                  <FileText className="w-12 h-12 text-yellow-500 opacity-50" />
                  <div className="absolute top-4 right-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(report)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                    >
                      <Edit size={16} className="text-yellow-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {report.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[report.type] || "bg-gray-500/20 text-gray-400"}`}>
                          {report.type}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[report.status]}`}>
                          {report.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-500" />
                      <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
                        {report.date ? new Date(report.date).toLocaleDateString() : "No date"}
                      </span>
                    </div>
                    {report.description && (
                      <p className={`text-xs line-clamp-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {report.description.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-white/10 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportPDF(report);
                      }}
                      className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1"
                    >
                      <Download size={12} />
                      Export
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* View Report Modal */}
      <AnimatePresence>
        {showViewModal && selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowViewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-2xl rounded-2xl ${darkMode ? "bg-[#0f0f2a] border-white/20" : "bg-white border-gray-200"} border shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-5 border-b ${darkMode ? "border-white/10" : "border-gray-200"} flex justify-between items-center`}>
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                    {selectedReport.title}
                  </h2>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[selectedReport.type] || "bg-gray-500/20 text-gray-400"}`}>
                      {selectedReport.type}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[selectedReport.status]}`}>
                      {selectedReport.status}
                    </span>
                  </div>
                </div>
                <button onClick={() => setShowViewModal(false)} className="p-1 rounded-lg hover:bg-white/10">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-500" />
                    <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                      Date: {new Date(selectedReport.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h3 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>Description</h3>
                  <div className={`p-4 rounded-xl ${darkMode ? "bg-white/5" : "bg-gray-50"} text-sm`}>
                    <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
                      {selectedReport.description || "No description provided."}
                    </p>
                  </div>
                </div>
                
                <div className={`p-4 rounded-xl ${darkMode ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-yellow-50 border border-yellow-200"}`}>
                  <p className={`text-sm ${darkMode ? "text-yellow-400" : "text-yellow-700"}`}>
                    📄 Report generated on {new Date(selectedReport.createdAt || selectedReport.date).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => handleExportPDF(selectedReport)}>
                    <Download size={16} />
                    Export Report
                  </Button>
                  <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className={`w-full max-w-md rounded-2xl ${darkMode ? "bg-[#0f0f2a] border-white/20" : "bg-white border-gray-200"} border shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-5 border-b ${darkMode ? "border-white/10" : "border-gray-200"} flex justify-between items-center`}>
                <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {editingReport ? "Edit Report" : "Create New Report"}
                </h2>
                <button onClick={() => setShowAddForm(false)} className="p-1 rounded-lg hover:bg-white/10">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <input
                  type="text"
                  placeholder="Report Title *"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                  required
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className={`px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                  >
                    {reportTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={`px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                    required
                  />
                </div>
                
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                
                <textarea
                  placeholder="Description *"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className={`w-full px-4 py-2 rounded-xl ${darkMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none`}
                  required
                />
                
                <div className="flex gap-3 pt-2">
                  <Button type="submit">
                    <Check size={16} />
                    {editingReport ? "Update Report" : "Create Report"}
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

export default Reports;