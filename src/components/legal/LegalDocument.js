import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useFleet } from "../../context/FleetContext";
import { LEGAL_EFFECTIVE_DATE, LEGAL_SERVICE_NAME } from "../../constants/legal";
import LegalFooterLinks from "../LegalFooterLinks";

const LegalDocument = ({ title, children }) => {
  const navigate = useNavigate();
  const { darkMode } = useFleet();

  const prose = darkMode ? "text-gray-300" : "text-gray-700";
  const heading = darkMode ? "text-white" : "text-gray-900";
  const muted = darkMode ? "text-gray-500" : "text-gray-500";
  const card = darkMode
    ? "bg-black/40 border-white/10 text-gray-200"
    : "bg-white border-gray-200 text-gray-800";

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950"
          : "bg-gradient-to-br from-slate-100 via-indigo-50 to-amber-50"
      }`}
    >
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`inline-flex items-center gap-2 text-sm mb-6 ${
            darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <article className={`rounded-2xl border p-6 sm:p-10 shadow-xl ${card}`}>
          <header className="mb-8 border-b border-current/10 pb-6">
            <p className={`text-sm ${muted}`}>{LEGAL_SERVICE_NAME}</p>
            <h1 className={`text-2xl sm:text-3xl font-bold mt-1 ${heading}`}>{title}</h1>
            <p className={`text-sm mt-2 ${muted}`}>Effective date: {LEGAL_EFFECTIVE_DATE}</p>
          </header>

          <div className={`space-y-6 text-sm sm:text-base leading-relaxed ${prose}`}>{children}</div>

          <footer className={`mt-10 pt-6 border-t border-current/10 text-sm ${muted}`}>
            <LegalFooterLinks className="justify-start" />
          </footer>
        </article>
      </div>
    </div>
  );
};

export function LegalSection({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-2 text-inherit">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function LegalList({ items }) {
  return (
    <ul className="list-disc pl-5 space-y-2">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function LegalLink({ to, children }) {
  return (
    <Link to={to} className="text-yellow-600 dark:text-yellow-400 underline hover:no-underline">
      {children}
    </Link>
  );
}

export default LegalDocument;
