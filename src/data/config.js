// pending, service_completed, user_confirmed, refunded and rejected were
// missing, so those bookings rendered as a plain white raw-string pill.
// These are the Booking.status values the backend actually writes.
// service_completed is labelled from the operator's point of view: the
// vendor is done, and the booking now waits for the customer to confirm or
// dispute (or for the 48h auto-confirm).
export const bookingStatusConfig = {
  pending:           { label: "Pending",           color: "#ff9944", bg: "rgba(255,153,68,0.1)",   border: "rgba(255,153,68,0.2)" },
  confirmed:         { label: "Confirmed",         color: "#9C27B0", bg: "rgba(156,39,176,0.1)",   border: "rgba(156,39,176,0.2)" },
  in_progress:       { label: "In Progress",       color: "#2196F3", bg: "rgba(33,150,243,0.1)",   border: "rgba(33,150,243,0.2)" },
  service_completed: { label: "Awaiting customer", color: "#00BCD4", bg: "rgba(0,188,212,0.1)",    border: "rgba(0,188,212,0.2)" },
  user_confirmed:    { label: "Completed",         color: "#4CAF50", bg: "rgba(76,175,80,0.1)",    border: "rgba(76,175,80,0.2)" },
  completed:         { label: "Completed",         color: "#4CAF50", bg: "rgba(76,175,80,0.1)",    border: "rgba(76,175,80,0.2)" },
  disputed:          { label: "Disputed",          color: "#ff3d3d", bg: "rgba(255,61,61,0.1)",    border: "rgba(255,61,61,0.2)" },
  cancelled:         { label: "Cancelled",         color: "#666677", bg: "rgba(100,100,120,0.1)",  border: "rgba(100,100,120,0.2)" },
  rejected:          { label: "Rejected",          color: "#b0607a", bg: "rgba(176,96,122,0.1)",   border: "rgba(176,96,122,0.2)" },
  refunded:          { label: "Refunded",          color: "#8BC34A", bg: "rgba(139,195,74,0.1)",   border: "rgba(139,195,74,0.2)" },
};

/**
 * Filter chips for BookingsView: `label` is what the chip shows (and what
 * App.jsx keeps as the selected filter), `type` is the `?type=` value sent
 * to GET /admin/bookings. Was a hardcoded label list plus a separate keyMap
 * in BookingsView, which had no way to reach pending, awaiting-customer,
 * rejected or refunded bookings at all.
 *
 * Note the backend's "completed" type covers BOTH service_completed and
 * user_confirmed; "Awaiting customer" narrows to service_completed only.
 */
export const bookingFilters = [
  { label: "All",               type: "all" },
  { label: "Pending",           type: "pending" },
  { label: "Confirmed",         type: "confirmed" },
  { label: "In Progress",       type: "inprogress" },
  { label: "Awaiting customer", type: "service_completed" },
  { label: "Completed",         type: "completed" },
  { label: "Disputed",          type: "disputed" },
  { label: "Cancelled",         type: "cancelled" },
  { label: "Rejected",          type: "rejected" },
  { label: "Refunded",          type: "refunded" },
];

/**
 * Found live: every approved vendor showed a plain white "approved" pill
 * instead of a coloured badge. `VendorProfile.status` (the backend's real
 * column — see prisma/schema.prisma) is only ever written as "pending" or
 * "approved" (grep confirms no controller writes "active" anywhere, and
 * "suspended" has no writer either -- there is no suspend endpoint). This
 * config used "active" as the key, which the backend never sends, so its
 * lookup always missed and fell through to VendorsView's raw-string fallback.
 * "suspended" is kept even though nothing produces it today, so the label is
 * ready the moment a suspend endpoint exists rather than silently reverting
 * to the same bug.
 */
export const vendorStatusConfig = {
  approved:  { label: "Approved",  color: "#4CAF50", bg: "rgba(76,175,80,0.1)",   border: "rgba(76,175,80,0.2)" },
  pending:   { label: "Pending",   color: "#ff9944", bg: "rgba(255,153,68,0.1)",  border: "rgba(255,153,68,0.2)" },
  suspended: { label: "Suspended", color: "#ff3d3d", bg: "rgba(255,61,61,0.1)",   border: "rgba(255,61,61,0.2)" },
};

export const walkInJobStatusConfig = {
  open:        { label: "Checked in",  color: "#ff9944", bg: "rgba(255,153,68,0.1)",  border: "rgba(255,153,68,0.2)" },
  in_progress: { label: "In Progress", color: "#2196F3", bg: "rgba(33,150,243,0.1)",  border: "rgba(33,150,243,0.2)" },
  completed:   { label: "Completed",   color: "#4CAF50", bg: "rgba(76,175,80,0.1)",   border: "rgba(76,175,80,0.2)" },
  cancelled:   { label: "Cancelled",   color: "#666677", bg: "rgba(100,100,120,0.1)", border: "rgba(100,100,120,0.2)" },
};

export const healthStatusConfig = {
  GOOD:      { label: "Good",             color: "#4CAF50", bg: "rgba(76,175,80,0.1)",  border: "rgba(76,175,80,0.2)" },
  ATTENTION: { label: "Attention needed", color: "#ff9944", bg: "rgba(255,153,68,0.1)", border: "rgba(255,153,68,0.2)" },
  REPLACE:   { label: "Replace",          color: "#ff3d3d", bg: "rgba(255,61,61,0.1)",  border: "rgba(255,61,61,0.2)" },
};

export const userStatusConfig = {
  active:    { label: "Active",    color: "#4CAF50", bg: "rgba(76,175,80,0.1)",   border: "rgba(76,175,80,0.2)" },
  inactive:  { label: "Inactive",  color: "#ff9944", bg: "rgba(255,153,68,0.1)",  border: "rgba(255,153,68,0.2)" },
  banned:    { label: "Banned",    color: "#ff3d3d", bg: "rgba(255,61,61,0.1)",   border: "rgba(255,61,61,0.2)" },
};

// Was defined locally in BlogsView.jsx -- centralized here alongside the
// other status configs so this file is the one place to look for any of
// them, rather than some living here and some scattered across view files.
export const postStatusConfig = {
  published: { label: 'Published', color: '#4CAF50', bg: 'rgba(76,175,80,0.1)', border: 'rgba(76,175,80,0.2)' },
  draft:     { label: 'Draft',     color: '#ff9944', bg: 'rgba(255,153,68,0.1)', border: 'rgba(255,153,68,0.2)' },
  archived:  { label: 'Archived',  color: '#666677', bg: 'rgba(100,100,120,0.1)', border: 'rgba(100,100,120,0.2)' },
};

// Was defined locally in HealthComponentsView.jsx -- same reason as
// postStatusConfig above. Distinct from userStatusConfig's "Active"/"Inactive"
// (different domain, different colour for "inactive": neutral grey here vs.
// amber there, intentionally -- a deactivated health-sheet component isn't a
// problem the way an inactive user account is).
export const activeStatusConfig = {
  active:   { label: 'Active',   color: '#4CAF50', bg: 'rgba(76,175,80,0.1)',   border: 'rgba(76,175,80,0.2)' },
  inactive: { label: 'Inactive', color: '#666677', bg: 'rgba(100,100,120,0.1)', border: 'rgba(100,100,120,0.2)' },
};

// Was defined locally in OffersView.jsx -- same reason as postStatusConfig
// above.
export const offerStatusConfig = {
  live:      { label: 'Live',      color: '#4CAF50', bg: 'rgba(76,175,80,0.1)',   border: 'rgba(76,175,80,0.2)' },
  scheduled: { label: 'Scheduled', color: '#ff9944', bg: 'rgba(255,153,68,0.1)',  border: 'rgba(255,153,68,0.2)' },
  off:       { label: 'Off',       color: '#666677', bg: 'rgba(100,100,120,0.1)', border: 'rgba(100,100,120,0.2)' },
  unset:     { label: 'Not set',   color: '#666677', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
};