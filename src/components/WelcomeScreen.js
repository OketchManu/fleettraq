import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Truck, Map, BarChart, Clock, Users, 
  Fuel, Shield, Zap, ArrowRight, Menu, X, Sun, Moon
} from "lucide-react";

import { useFleet } from "../context/FleetContext";

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useFleet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    { icon: <Map className="w-6 h-6" />, title: "Real-Time GPS Tracking", description: "Monitor vehicle locations with pinpoint accuracy and live updates.", color: "#22D3EE", gradient: "from-cyan-500 to-blue-500" },
    { icon: <BarChart className="w-6 h-6" />, title: "Advanced Analytics", description: "Get deep insights into fleet performance and operational efficiency.", color: "#E879F9", gradient: "from-pink-500 to-purple-500" },
    { icon: <Clock className="w-6 h-6" />, title: "Predictive Maintenance", description: "Prevent breakdowns with AI-powered maintenance alerts.", color: "#34D399", gradient: "from-green-500 to-emerald-500" },
    { icon: <Users className="w-6 h-6" />, title: "Driver Management", description: "Track driver performance, behavior, and compliance.", color: "#FBBF24", gradient: "from-yellow-500 to-amber-500" },
    { icon: <Fuel className="w-6 h-6" />, title: "Fuel Efficiency", description: "Optimize fuel consumption and reduce operational costs.", color: "#10B981", gradient: "from-teal-500 to-green-500" },
    { icon: <Shield className="w-6 h-6" />, title: "Security & Compliance", description: "Enterprise-grade security with full compliance tracking.", color: "#818CF8", gradient: "from-indigo-500 to-blue-500" },
  ];

  const stats = [
    { value: "500+", label: "Fleets Tracked", color: "#22D3EE" },
    { value: "1M+", label: "Miles Optimized", color: "#E879F9" },
    { value: "99.9%", label: "Uptime", color: "#34D399" },
    { value: "24/7", label: "Support", color: "#FBBF24" },
  ];

  return (
    <div className={`min-h-screen relative overflow-x-hidden transition-colors duration-300 ${
      !darkMode 
        ? "bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200" 
        : "bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]"
    }`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 rounded-full filter blur-3xl animate-pulse ${
          !darkMode ? "bg-cyan-300 opacity-20" : "bg-cyan-500 opacity-10"
        }`}></div>
        <div className={`absolute bottom-20 right-10 w-96 h-96 rounded-full filter blur-3xl animate-pulse delay-1000 ${
          !darkMode ? "bg-purple-300 opacity-20" : "bg-purple-500 opacity-10"
        }`}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full filter blur-3xl ${
          !darkMode ? "bg-yellow-300 opacity-10" : "bg-yellow-500 opacity-5"
        }`}></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? !darkMode 
            ? "bg-white/80 backdrop-blur-lg shadow-lg" 
            : "bg-black/80 backdrop-blur-lg shadow-lg"
          : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Truck className="w-8 h-8 text-yellow-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
                FleetTraq
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className={`transition-colors ${
                !darkMode ? "text-gray-700 hover:text-yellow-600" : "text-gray-300 hover:text-yellow-400"
              }`}>Features</a>
              <a href="#stats" className={`transition-colors ${
                !darkMode ? "text-gray-700 hover:text-yellow-600" : "text-gray-300 hover:text-yellow-400"
              }`}>Stats</a>
              <a href="#about" className={`transition-colors ${
                !darkMode ? "text-gray-700 hover:text-yellow-600" : "text-gray-300 hover:text-yellow-400"
              }`}>About</a>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-all ${
                  !darkMode 
                    ? "bg-gray-200 hover:bg-gray-300 text-gray-700" 
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                {!darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-400" />}
              </button>
              
              <div className="hidden md:flex gap-3">
                <button
                  onClick={() => navigate("/login")}
                  className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all ${
                    !darkMode
                      ? "border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"
                      : "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold hover:shadow-lg hover:shadow-yellow-500/25 transition-all"
                >
                  Get Started
                </button>
              </div>
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`md:hidden p-2 rounded-lg ${
                  !darkMode ? "bg-gray-200" : "bg-white/10"
                }`}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`md:hidden ${
                !darkMode 
                  ? "bg-white/95 backdrop-blur-lg border-b border-gray-200" 
                  : "bg-black/95 backdrop-blur-lg border-b border-gray-800"
              }`}
            >
              <div className="flex flex-col p-4 gap-3">
                <a href="#features" className={`py-2 transition-colors ${
                  !darkMode ? "text-gray-700 hover:text-yellow-600" : "text-gray-300 hover:text-yellow-400"
                }`} onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#stats" className={`py-2 transition-colors ${
                  !darkMode ? "text-gray-700 hover:text-yellow-600" : "text-gray-300 hover:text-yellow-400"
                }`} onClick={() => setMobileMenuOpen(false)}>Stats</a>
                <a href="#about" className={`py-2 transition-colors ${
                  !darkMode ? "text-gray-700 hover:text-yellow-600" : "text-gray-300 hover:text-yellow-400"
                }`} onClick={() => setMobileMenuOpen(false)}>About</a>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => navigate("/login")} className={`flex-1 px-4 py-2 rounded-lg border-2 font-semibold ${
                    !darkMode
                      ? "border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"
                      : "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                  }`}>Login</button>
                  <button onClick={() => navigate("/signup")} className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold">Sign Up</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 border ${
              !darkMode
                ? "bg-yellow-100 border-yellow-300"
                : "bg-yellow-500/20 backdrop-blur-sm border-yellow-500/30"
            }`}>
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className={`text-sm ${!darkMode ? "text-yellow-700" : "text-yellow-400"}`}>
                Enterprise Fleet Management
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                Command Your Fleet
              </span>
              <br />
              <span className={!darkMode ? "text-gray-800" : "text-white"}>
                With Precision
              </span>
            </h1>
            
            <p className={`text-xl max-w-3xl mx-auto mb-10 ${
              !darkMode ? "text-gray-600" : "text-gray-400"
            }`}>
              Harness the power of advanced fleet tracking to optimize operations, 
              enhance safety, and drive efficiency across your entire vehicle network.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/signup")}
                className="group px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-yellow-500/25 transition-all"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/login")}
                className={`px-8 py-3 rounded-xl border-2 font-semibold text-lg transition-all ${
                  !darkMode
                    ? "border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"
                    : "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                }`}
              >
                View Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-6 text-center border transition-all ${
                  !darkMode
                    ? "bg-white shadow-lg border-gray-200 hover:border-yellow-400"
                    : "bg-white/5 backdrop-blur-sm border-white/10 hover:border-yellow-500/50"
                }`}
              >
                <h3 className="text-3xl md:text-4xl font-bold" style={{ color: stat.color }}>{stat.value}</h3>
                <p className={`mt-2 ${!darkMode ? "text-gray-600" : "text-gray-400"}`}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${!darkMode ? "text-gray-600" : "text-gray-400"}`}>
              Everything you need to manage your fleet efficiently in one platform
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`group rounded-2xl p-6 border transition-all cursor-pointer ${
                  !darkMode
                    ? "bg-white shadow-lg border-gray-200 hover:border-yellow-400"
                    : "bg-white/5 backdrop-blur-sm border-white/10 hover:border-yellow-500/50"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <div className="text-white">{feature.icon}</div>
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${!darkMode ? "text-gray-800" : "text-white"}`}>
                  {feature.title}
                </h3>
                <p className={!darkMode ? "text-gray-600" : "text-gray-400"}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`text-center rounded-2xl p-8 border ${
              !darkMode
                ? "bg-white shadow-lg border-gray-200"
                : "bg-white/5 backdrop-blur-sm border-white/10"
            }`}
          >
            <h2 className={`text-3xl font-bold mb-4 ${!darkMode ? "text-gray-800" : "text-white"}`}>
              Why Choose FleetTraq?
            </h2>
            <p className={`text-lg mb-6 ${!darkMode ? "text-gray-600" : "text-gray-400"}`}>
              Join thousands of satisfied customers who have transformed their fleet operations with our cutting-edge technology.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className={`font-semibold mb-1 ${!darkMode ? "text-gray-800" : "text-white"}`}>Lightning Fast</h3>
                <p className={`text-sm ${!darkMode ? "text-gray-500" : "text-gray-400"}`}>Real-time updates and instant insights</p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className={`font-semibold mb-1 ${!darkMode ? "text-gray-800" : "text-white"}`}>Enterprise Security</h3>
                <p className={`text-sm ${!darkMode ? "text-gray-500" : "text-gray-400"}`}>Bank-grade encryption and compliance</p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className={`font-semibold mb-1 ${!darkMode ? "text-gray-800" : "text-white"}`}>24/7 Support</h3>
                <p className={`text-sm ${!darkMode ? "text-gray-500" : "text-gray-400"}`}>Dedicated support team always ready</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className={`rounded-3xl p-12 border ${
              !darkMode
                ? "bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300"
                : "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 backdrop-blur-sm border-yellow-500/30"
            }`}
          >
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${!darkMode ? "text-gray-800" : "text-white"}`}>
              Ready to Transform Your Fleet?
            </h2>
            <p className={`text-lg mb-8 ${!darkMode ? "text-gray-600" : "text-gray-300"}`}>
              Join thousands of companies that trust FleetTraq for their fleet management needs
            </p>
            <button
              onClick={() => navigate("/signup")}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold text-lg inline-flex items-center gap-2 hover:shadow-xl hover:shadow-yellow-500/25 transition-all"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 px-4 border-t ${
        !darkMode ? "border-gray-200" : "border-white/10"
      }`}>
        <div className="max-w-7xl mx-auto text-center">
          <p className={`text-sm ${!darkMode ? "text-gray-500" : "text-gray-500"}`}>
            © 2025 FleetTraq. All rights reserved. Built for modern fleet operations.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default WelcomeScreen;