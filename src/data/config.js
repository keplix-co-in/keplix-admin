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