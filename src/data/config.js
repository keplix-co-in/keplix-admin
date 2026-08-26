export const bookingStatusConfig = {
  completed:    { label: "Completed",    color: "#4CAF50", bg: "rgba(76,175,80,0.1)",    border: "rgba(76,175,80,0.2)" },
  in_progress:  { label: "In Progress",  color: "#2196F3", bg: "rgba(33,150,243,0.1)",   border: "rgba(33,150,243,0.2)" },
  confirmed:    { label: "Confirmed",    color: "#9C27B0", bg: "rgba(156,39,176,0.1)",   border: "rgba(156,39,176,0.2)" },
  disputed:     { label: "Disputed",     color: "#ff3d3d", bg: "rgba(255,61,61,0.1)",    border: "rgba(255,61,61,0.2)" },
  cancelled:    { label: "Cancelled",    color: "#666677", bg: "rgba(100,100,120,0.1)",  border: "rgba(100,100,120,0.2)" },
};

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