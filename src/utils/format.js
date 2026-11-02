/**
 * `₹` amount formatting, coerced to a real Number first.
 *
 * Found live in a browser pass: the dashboard's "Platform Revenue" tile
 * rendered as "₹24206.70000000000012". The API returns money fields as
 * STRINGS (serialized Prisma Decimal values), and `.toLocaleString()` was
 * being called directly on them — `String.prototype.toLocaleString` is a
 * no-op that returns the string unchanged, so a backend floating-point
 * artifact reached the screen untouched. The same pattern existed in
 * BookingsView and FinanceView. `Number(value).toLocaleString(...)` is what
 * every call site actually needed.
 *
 * @param {unknown} value
 * @returns {string} e.g. "₹24,206.70", or "₹0" for anything non-numeric.
 */
export const formatINR = (value) => {
  const n = Number(value);
  return `₹${Number.isFinite(n) ? n.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "0"}`;
};

/**
 * Date + time for an ISO timestamp from the API (e.g. Booking.disputed_at).
 * Falls back to the raw value rather than rendering "Invalid Date".
 *
 * @param {unknown} value
 * @returns {string} e.g. "20 Oct 2026, 2:30 pm", or "" for null/undefined.
 */
export const formatDateTime = (value) => {
  if (value == null || value === "") return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};
