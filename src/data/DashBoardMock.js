// `kpis` (the mock KPI set) used to live here and is deliberately gone: it was
// a silent fallback that rendered fabricated figures badged "Live" whenever
// the real metrics call (DashboardView.jsx) failed. Fetch failures now fail
// visibly instead of substituting this.

// No backend endpoint exists for a combined alerts/queue feed (vendor
// verification, payout expiry, disputes, low ratings each live in different
// tables with no combined query) -- DashboardView.jsx labels this "Sample
// data" in the UI. Wire a real endpoint and delete this export, rather than
// leaving both in place.
export const pendingActions = [
    { icon: "🏪", text: "2 new vendors awaiting verification", time: "Just now", type: "vendor", color: "#ff9944" },
    { icon: "🔴", text: "Payout KPX-2828 expires in 2 hours!", time: "2h left", type: "urgent", color: "#ff3d3d" },
    { icon: "⚖️", text: "Booking KPX-2835 has an open dispute", time: "4h ago", type: "dispute", color: "#ff3d3d" },
    { icon: "💸", text: "Payout KPX-2837 due in 6 hours", time: "6h left", type: "payout", color: "#ff9944" },
    { icon: "⭐", text: "Vendor 'Auto King Works' rated 2.1 — review needed", time: "1d ago", type: "quality", color: "#666677" },
];
