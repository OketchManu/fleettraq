/**
 * Fleet locale: country → currency, distance/volume units, and formatting.
 * Fuel records store raw numbers in the fleet's chosen volume (L or gal) and currency.
 */

export const FLEET_COUNTRIES = {
  US: { label: "United States", currency: "USD", units: "imperial", locale: "en-US" },
  CA: { label: "Canada", currency: "CAD", units: "metric", locale: "en-CA" },
  GB: { label: "United Kingdom", currency: "GBP", units: "imperial", locale: "en-GB" },
  KE: { label: "Kenya", currency: "KES", units: "metric", locale: "en-KE" },
  TZ: { label: "Tanzania", currency: "TZS", units: "metric", locale: "en-TZ" },
  UG: { label: "Uganda", currency: "UGX", units: "metric", locale: "en-UG" },
  NG: { label: "Nigeria", currency: "NGN", units: "metric", locale: "en-NG" },
  ZA: { label: "South Africa", currency: "ZAR", units: "metric", locale: "en-ZA" },
  GH: { label: "Ghana", currency: "GHS", units: "metric", locale: "en-GH" },
  IN: { label: "India", currency: "INR", units: "metric", locale: "en-IN" },
  AE: { label: "United Arab Emirates", currency: "AED", units: "metric", locale: "en-AE" },
  SA: { label: "Saudi Arabia", currency: "SAR", units: "metric", locale: "ar-SA" },
  DE: { label: "Germany", currency: "EUR", units: "metric", locale: "de-DE" },
  FR: { label: "France", currency: "EUR", units: "metric", locale: "fr-FR" },
  AU: { label: "Australia", currency: "AUD", units: "metric", locale: "en-AU" },
};

export const DEFAULT_FLEET_LOCALE_SETTINGS = {
  country: "KE",
  units: "metric",
  currency: "KES",
};

/** Resolve display + calculation locale from fleet settings. */
export function resolveFleetLocale(settings = {}) {
  const country = settings.country || DEFAULT_FLEET_LOCALE_SETTINGS.country;
  const preset = FLEET_COUNTRIES[country];
  const units = settings.units || preset?.units || DEFAULT_FLEET_LOCALE_SETTINGS.units;
  const isMetric = units === "metric";
  const currency =
    settings.currency || preset?.currency || (isMetric ? "KES" : "USD");
  const localeTag = preset?.locale || (isMetric ? "en-KE" : "en-US");

  return {
    country,
    units,
    currency,
    locale: localeTag,
    isMetric,
    volumeLabel: isMetric ? "Liters" : "Gallons",
    volumeShort: isMetric ? "L" : "gal",
    distanceLabel: isMetric ? "km" : "mi",
    distanceWord: isMetric ? "kilometers" : "miles",
    efficiencyLabel: isMetric ? "L/100km" : "MPG",
    efficiencyShort: isMetric ? "L/100km" : "MPG",
    costPerVolumeLabel: isMetric ? `/${"L"}` : "/gal",
  };
}

export function fleetSettingsDocId(fleetId) {
  return fleetId ? `${fleetId}_fleet` : null;
}

export function formatCurrency(amount, locale) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(locale.locale, {
      style: "currency",
      currency: locale.currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${locale.currency} ${value.toFixed(2)}`;
  }
}

export function formatNumber(value, locale, options = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(locale.locale, options);
}

export function formatVolume(value, locale) {
  return `${formatNumber(value, locale, { maximumFractionDigits: 2 })} ${locale.volumeShort}`;
}

export function formatOdometer(value, locale) {
  return `${formatNumber(value, locale, { maximumFractionDigits: 0 })} ${locale.distanceLabel}`;
}

export function formatEfficiency(value, locale) {
  if (value == null || !Number.isFinite(Number(value)) || Number(value) <= 0) return "—";
  const n = Math.round(Number(value) * 10) / 10;
  return `${n} ${locale.efficiencyShort}`;
}
