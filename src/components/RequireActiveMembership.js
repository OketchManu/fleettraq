import React from "react";
import { Navigate } from "react-router-dom";
import { useFleet } from "../context/FleetContext";
import MembershipBlockedScreen from "./MembershipBlockedScreen";
import { Shield } from "lucide-react";

export function RequireActiveMembership({ children }) {
  const { user, loading, membershipPending, membershipSuspended, darkMode } = useFleet();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (membershipPending || membershipSuspended) {
    return (
      <MembershipBlockedScreen
        darkMode={darkMode}
        membershipSuspended={membershipSuspended}
        icon={Shield}
        title={membershipSuspended ? "Account suspended" : "Awaiting approval"}
      />
    );
  }

  return children;
}

export default RequireActiveMembership;
