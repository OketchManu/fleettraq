/** Date/time display using the visitor's browser locale (country where the site is opened). */

export function getVisitorLocale() {
  if (typeof navigator !== "undefined") {
    return navigator.language || navigator.languages?.[0] || "en-GB";
  }
  return "en-GB";
}

export function parseDisplayDate(value) {
  if (value == null || value === "") return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function formatWithIntl(value, locale, options) {
  const d = parseDisplayDate(value);
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat(locale || getVisitorLocale(), options).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

/** Short date, e.g. 05/06/2026 (US) or 05/06/2026 (UK) depending on locale. */
export function formatDisplayDate(value, locale) {
  return formatWithIntl(value, locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Date and time, e.g. 5 Jun 2026, 14:30. */
export function formatDisplayDateTime(value, locale) {
  return formatWithIntl(value, locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Time only, e.g. 14:30. */
export function formatDisplayTime(value, locale) {
  return formatWithIntl(value, locale, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** For `<input type="date">` value attribute (always ISO yyyy-mm-dd). */
export function toInputDateValue(value) {
  const d = parseDisplayDate(value);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
