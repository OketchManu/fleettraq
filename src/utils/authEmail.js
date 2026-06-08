/**
 * Firebase Auth email settings.
 *
 * Branded copy and sender name are configured in Firebase Console:
 * Authentication → Templates → Password reset
 * Optional custom domain: Authentication → Templates → Customize domain (Blaze).
 *
 * Set REACT_APP_AUTH_CONTINUE_URL to your production URL (e.g. https://fleettraq.vercel.app/login).
 */

export function passwordResetActionSettings() {
  const origin =
    process.env.REACT_APP_AUTH_CONTINUE_URL ||
    (typeof window !== "undefined" ? `${window.location.origin}/login` : "https://fleettraq.vercel.app/login");

  return {
    url: origin,
    handleCodeInApp: false,
  };
}

export const PASSWORD_RESET_FROM_LABEL = "FleetTraq";
