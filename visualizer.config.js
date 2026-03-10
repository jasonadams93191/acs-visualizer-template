// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACS VISUALIZER CONFIG
// Edit this file for each new visualizer project.
// Then run: node build.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {

  // ── Project Identity ──
  project: "Sample Visualizer",           // Display title
  client:  "Demo Client",                 // Client organization name

  // ── Layout ──
  // Options: "tabbed" | "dashboard" | "matrix" | "canvas-diagram"
  layout: "tabbed",

  // ── Client accent color (used for highlights, accents) ──
  accentColor: "#1956A6",

  // ── Authentication ──
  credentials: [
    { email: "demo@example.com",                    pass: "Demo2026!" },
    { email: "jason@advocatecloudsolutions.com",    pass: "ACS2026!" }
  ],

  // ── Deployment ──
  vercelUrl: "",  // Fill in after first deploy (used for Teams manifest)

  // ── Data Source ──
  dataFile: "data/data.json",

  // ── Tab names (for tabbed layout only) ──
  tabs: ["Overview", "Details", "Summary"],

  // ── Features to enable ──
  features: {
    search:          true,
    export:          ["csv", "json"],     // Which export buttons to show
    expandCollapse:  true,                // Show expand/collapse all buttons
    editableFields:  true,                // Allow editing field values
    save:            "localStorage"       // "localStorage" | "download" | "both"
  }
};
