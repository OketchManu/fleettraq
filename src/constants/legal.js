/** Legal metadata — set operator and contact in Vercel env for production. */

export const LEGAL_EFFECTIVE_DATE = "2 June 2026";

export const LEGAL_SERVICE_NAME = "FleetTraq";

export const LEGAL_OPERATOR_NAME =
  process.env.REACT_APP_LEGAL_OPERATOR || "FleetTraq";

export const LEGAL_CONTACT_EMAIL =
  process.env.REACT_APP_LEGAL_CONTACT_EMAIL || "";

export const LEGAL_WEBSITE_URL =
  process.env.REACT_APP_LEGAL_WEBSITE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "https://fleettraq.vercel.app");

export function legalContactDisplay() {
  return LEGAL_CONTACT_EMAIL || "the contact email configured for this deployment";
}
