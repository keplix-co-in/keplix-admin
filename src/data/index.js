// `payoutQueue`, `vendors`, `bookings` and `usersData` mock arrays that used
// to live here were removed: every list view (FinanceView, VendorsView,
// BookingsView, UsersView) and GlobalSearch already moved to real API data
// (see GlobalSearch.jsx's own history note), so these had become dead code
// nothing imported -- keeping them around risked someone reaching for a
// "quick" import here instead of the real API, the exact bug GlobalSearch
// itself hit before it was fixed.
//
// The four arrays still exported below (revenueData, cityData, funnelData,
// serviceData) ARE still used, by DashboardView and AnalyticsView, because no
// backend aggregation endpoint exists yet for time-series revenue, city
// breakdowns, the booking funnel or service-mix -- both views label every
// chart fed by these as "Sample data" in the UI so they can't be mistaken for
// real business figures. Wire a real endpoint and delete the export it
// replaces, rather than leaving both in place.

export const revenueData = [
  { day: "Feb 7",  gmv: 42000, rev: 6300 },
  { day: "Feb 8",  gmv: 58000, rev: 8700 },
  { day: "Feb 9",  gmv: 35000, rev: 5250 },
  { day: "Feb 10", gmv: 71000, rev: 10650 },
  { day: "Feb 11", gmv: 63000, rev: 9450 },
  { day: "Feb 12", gmv: 89000, rev: 13350 },
  { day: "Feb 13", gmv: 94000, rev: 14100 },
];

export const cityData = [
  { city: "Delhi",   bookings: 312, gmv: 187000 },
  { city: "Mumbai",  bookings: 278, gmv: 163000 },
  { city: "Pune",    bookings: 196, gmv: 108000 },
  { city: "Noida",   bookings: 143, gmv: 84000 },
  { city: "Bengaluru", bookings: 121, gmv: 71000 },
  { city: "Hyderabad", bookings: 98,  gmv: 56000 },
];

export const funnelData = [
  { stage: "Searched",   users: 4200 },
  { stage: "Viewed",     users: 2800 },
  { stage: "Initiated",  users: 1100 },
  { stage: "Completed",  users: 780  },
];

export const serviceData = [
  { name: "Full Service", value: 34, color: "#ff6b00" },
  { name: "Car Wash",     value: 28, color: "#ff9944" },
  { name: "Repairs",      value: 22, color: "#ffcc77" },
  { name: "SOS",          value: 10, color: "#ff3d3d" },
  { name: "Others",       value: 6,  color: "#444455" },
];
