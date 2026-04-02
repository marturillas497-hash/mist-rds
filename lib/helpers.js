// lib/helpers.js
// Shared frontend helper functions

import { RISK_COLORS } from "@/lib/constants";

/**
 * Map a risk_level string (e.g. "RED", "GREEN") to the corresponding
 * Tailwind class set from RISK_COLORS.
 */
export function getRiskStyle(risk_level) {
  const key = risk_level?.toUpperCase();
  return RISK_COLORS[key] ?? { bg: "bg-gray-100", text: "text-gray-600", label: risk_level };
}

/**
 * Format an ISO date string for display.
 * @param {string} iso  - ISO 8601 date string
 * @param {object} [extra] - additional Intl options (e.g. { hour: "2-digit", minute: "2-digit" })
 */
export function formatDate(iso, extra = {}) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
    ...extra,
  });
}
