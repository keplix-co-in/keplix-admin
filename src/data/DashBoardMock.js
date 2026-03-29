export const pendingActions = [
    { icon: "🏪", text: "2 new vendors awaiting verification", time: "Just now", type: "vendor", color: "#ff9944" },
    { icon: "🔴", text: "Payout KPX-2828 expires in 2 hours!", time: "2h left", type: "urgent", color: "#ff3d3d" },
    { icon: "⚖️", text: "Booking KPX-2835 has an open dispute", time: "4h ago", type: "dispute", color: "#ff3d3d" },
    { icon: "💸", text: "Payout KPX-2837 due in 6 hours", time: "6h left", type: "payout", color: "#ff9944" },
    { icon: "⭐", text: "Vendor 'Auto King Works' rated 2.1 — review needed", time: "1d ago", type: "quality", color: "#666677" },
];

export const kpis = [
    { label: "Today's GMV",       value: "₹94,000",   delta: "+18.2%", icon: "💰", color: "#ff3d3d" },
    { label: "Platform Revenue",  value: "₹14,100",   delta: "+18.2%", icon: "📈", color: "#4CAF50" },
    { label: "Bookings Today",    value: "52",         delta: "+8",     icon: "📋", color: "#2196F3" },
    { label: "Active Vendors",    value: "284",        delta: "+12",    icon: "🏪", color: "#9C27B0" },
    { label: "New Users Today",   value: "137",        delta: "+23",    icon: "👥", color: "#ff9944" },
    { label: "Pending Payouts",   value: "₹9,333",    delta: "6 items", icon: "⏳", color: "#ff3d3d", alert: true },
];