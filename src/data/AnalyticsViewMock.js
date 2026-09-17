// No backend analytics-aggregation endpoint exists for weekly retention yet.
// AnalyticsView.jsx labels this whole page "Sample data" in the UI so it
// can't be mistaken for real numbers. Wire a real endpoint and delete this
// export, rather than leaving both in place.
export const retentionData = [
    { week: "W1", rate: 28 }, { week: "W2", rate: 34 }, { week: "W3", rate: 41 },
    { week: "W4", rate: 38 }, { week: "W5", rate: 47 }, { week: "W6", rate: 52 },
    { week: "W7", rate: 49 },
];
