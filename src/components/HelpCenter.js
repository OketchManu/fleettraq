import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Monitor, Smartphone, MapPin, ChevronLeft, Shield, Users } from "lucide-react";
import { useFleet } from "../context/FleetContext";
import Button from "./Button";
import FleetOrganizationIdCard from "./FleetOrganizationIdCard";
import FleetSetupGuide from "./FleetSetupGuide";
import FleetSetupGuidePanel from "./FleetSetupGuidePanel";
import LegalFooterLinks from "./LegalFooterLinks";

const HelpCenter = () => {
  const navigate = useNavigate();
  const {
    darkMode,
    user,
    fleetId,
    canManageFleet,
    isDriver,
    fleetSetupComplete,
    inviteCode,
    inviteLoading,
    regenerateInvite,
  } = useFleet();

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a]" : "bg-gray-50"
      }`}
    >
      <header
        className={`border-b ${
          darkMode ? "border-white/10 bg-[#0a0a1a]/90" : "border-gray-200 bg-white"
        }`}
      >
        <div className="app-page-main max-w-5xl py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <BookOpen className="w-8 h-8 text-yellow-500 shrink-0" />
            <div className="min-w-0">
              <h1 className={`text-lg sm:text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                Help &amp; Setup
              </h1>
              <p className={`text-xs sm:text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Step-by-step guides for administrators and drivers
              </p>
            </div>
          </div>
          <Button variant="secondary" className="shrink-0 self-start sm:self-auto" onClick={() => navigate("/dashboard")}>
            <ChevronLeft size={18} />
            Back
          </Button>
        </div>
      </header>

      <main className="app-page-main max-w-5xl py-4 sm:py-6 space-y-6">
        {canManageFleet && inviteCode && (
          <FleetOrganizationIdCard
            inviteCode={inviteCode}
            darkMode={darkMode}
            title="Your Driver Invite Code"
            description="Share this code with every driver before they create an account. It links them to your fleet securely."
            onRegenerate={regenerateInvite}
            regenerating={inviteLoading}
          />
        )}

        <FleetSetupGuidePanel
          darkMode={darkMode}
          variant={isDriver ? "driver" : "full"}
          userId={user?.uid}
          fleetSetupComplete={fleetSetupComplete}
          inviteCode={canManageFleet ? inviteCode : undefined}
          organizationId={canManageFleet ? fleetId : undefined}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {canManageFleet && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-5 border ${
                darkMode ? "bg-cyan-500/5 border-cyan-500/20" : "bg-white border-cyan-200"
              }`}
            >
              <h2
                className={`text-lg font-semibold flex items-center gap-2 mb-4 ${
                  darkMode ? "text-cyan-100" : "text-cyan-900"
                }`}
              >
                <Monitor size={20} className="text-yellow-500" />
                Administrator checklist
              </h2>
              <FleetSetupGuide
                darkMode={darkMode}
                variant="admin-office"
                inviteCode={inviteCode}
              />
              <div className={`mt-4 pt-4 border-t ${darkMode ? "border-white/10" : "border-gray-100"}`}>
                <FleetSetupGuide darkMode={darkMode} variant="admin-track" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => navigate("/vehicle-management")}>
                  Manage vehicles
                </Button>
                <Button size="sm" variant="secondary" onClick={() => navigate("/drivers")}>
                  <Users size={16} />
                  Manage drivers
                </Button>
              </div>
            </motion.section>
          )}

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`rounded-2xl p-5 border ${
              darkMode ? "bg-amber-500/5 border-amber-500/20" : "bg-white border-amber-200"
            }`}
          >
            <h2
              className={`text-lg font-semibold flex items-center gap-2 mb-4 ${
                darkMode ? "text-amber-100" : "text-amber-900"
              }`}
            >
              <Smartphone size={20} className="text-yellow-500" />
              Driver checklist
            </h2>
            <FleetSetupGuide darkMode={darkMode} variant="driver" />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => navigate("/tracking")}>
                <MapPin size={16} />
                Open Tracking
              </Button>
              {!isDriver && (
                <p className={`text-xs w-full ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                  Share this section with drivers after giving them your invite code.
                </p>
              )}
            </div>
          </motion.section>
        </div>

        <section
          className={`rounded-2xl p-5 border ${
            darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
          }`}
        >
          <h2 className={`font-semibold flex items-center gap-2 mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
            <Shield size={18} className="text-yellow-500" />
            Quick answers
          </h2>
          <dl className={`space-y-3 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            <div>
              <dt className="font-medium text-yellow-500">Where is my invite code?</dt>
              <dd className="mt-0.5">
                Administrators see it on the Dashboard, this page, Drivers, Account, and Fleet Settings. Use &quot;New code&quot; to revoke an old one.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-yellow-500">Why must I pick a role before Google sign-in?</dt>
              <dd className="mt-0.5">
                FleetTraq separates administrator and driver access. Your role must match how your account was registered.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-yellow-500">Driver signed up but is not on the roster?</dt>
              <dd className="mt-0.5">
                Open Drivers and click <strong>Sync to roster</strong>, then assign them to a vehicle.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-yellow-500">GPS not showing on the map?</dt>
              <dd className="mt-0.5">
                On the driver phone, open Tracking, select the vehicle, and tap{" "}
                <strong>Start tracking on THIS device</strong>.
              </dd>
            </div>
          </dl>
        </section>
      </main>

      <footer className={`border-t py-6 ${darkMode ? "border-white/10" : "border-gray-200"}`}>
        <div className="app-page-main max-w-5xl text-center space-y-2">
          <LegalFooterLinks />
          <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>© 2026 FleetTraq</p>
        </div>
      </footer>
    </div>
  );
};

export default HelpCenter;
