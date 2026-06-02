import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";

const MembershipBlockedScreen = ({
  darkMode,
  membershipSuspended,
  title = "Access limited",
  icon: Icon,
  children,
}) => {
  const navigate = useNavigate();

  return (
    <div className={`min-h-[60vh] flex items-center justify-center px-4 py-16 ${darkMode ? "text-white" : "text-gray-900"}`}>
      <div className="max-w-lg text-center">
        {Icon && <Icon className="w-14 h-14 text-yellow-500 mx-auto mb-4" />}
        <h1 className="text-xl sm:text-2xl font-bold mb-3">{title}</h1>
        <p className={`text-sm mb-6 leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
          {children ||
            (membershipSuspended
              ? "Your access has been suspended. Contact your fleet administrator to restore access."
              : "Your account is awaiting approval. Once your administrator approves you and assigns a vehicle, full access will unlock.")}
        </p>
        <Button variant="secondary" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default MembershipBlockedScreen;
