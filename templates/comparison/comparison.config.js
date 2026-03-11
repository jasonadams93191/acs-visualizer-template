// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACS VENDOR COMPARISON CONFIG
// Fill this out, then run: node build-comparison.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {

  // ── User / Client Context ──────────────────────────
  context: {
    client:   "Client Name",             // e.g. "EOL Companies"
    title:    "Vendor Comparison Title", // e.g. "AI Litigation Tools"
    subtitle: "Brief description",       // shown in italic under title
    date:     "March 2026",
    analyst:  "ACS",
  },

  // ── Vendor Types ───────────────────────────────────
  // Define the categories vendors can belong to.
  // Each has a label, accent color, and badge style.
  vendorTypes: {
    current:     { label: "Current Vendor",  color: "#E8572A", badge: "warning" },
    proposed:    { label: "Proposed",         color: "#0070D2", badge: "primary" },
    recommended: { label: "✦ Recommended",   color: "#7C3AED", badge: "success" },
    incumbent:   { label: "Incumbent",        color: "#6B7280", badge: "neutral" },
  },

  // ── Vendors ────────────────────────────────────────
  // Add 2–4 vendors. Each needs: id, name, type (from vendorTypes), tagline,
  // description, strengths[], weaknesses[], and optionally cost.
  vendors: [
    {
      id:          "vendor_a",
      name:        "Vendor A",
      type:        "current",           // must match a key in vendorTypes above
      tagline:     "Short positioning statement",
      description: "One paragraph describing what this vendor is and its core limitations or strengths in this context.",
      cost: {
        annual: 0,                      // set to null if unknown
        note:   "e.g. per-seat pricing",
      },
      strengths: [
        "Strength one",
        "Strength two",
      ],
      weaknesses: [
        "Weakness one",
        "Weakness two",
      ],
    },
    {
      id:          "vendor_b",
      name:        "Vendor B",
      type:        "recommended",
      tagline:     "Short positioning statement",
      description: "One paragraph describing what this vendor is and why it is recommended.",
      cost: {
        annual: 0,
        note:   "e.g. flat annual license",
      },
      strengths: [
        "Strength one",
        "Strength two",
      ],
      weaknesses: [
        "Weakness one",
        "Weakness two",
      ],
    },
  ],

  // ── Feature Categories ─────────────────────────────
  // Each category has a name and a list of features.
  // For each feature, set vendor id keys to: true | false | "build" | "partial"
  features: [
    {
      category: "Category One",
      items: [
        {
          name:     "Feature name",
          vendor_a: true,
          vendor_b: false,
          severity: "Critical",  // "Critical" | "High" | "Medium" | null
        },
      ],
    },
  ],

  // ── Tabs to show ───────────────────────────────────
  // Remove any tabs you don't need for this comparison.
  tabs: [
    "overview",    // Platform / vendor cards with strengths & weaknesses
    "cost",        // Cost comparison table (requires cost on vendors)
    "features",    // Feature matrix table
    "risks",       // Risk register (optional — add risks[] below if using)
    "roadmap",     // Phased migration path (optional — add roadmap[] below)
  ],

  // ── Risks (optional — used if "risks" tab is enabled) ──
  risks: [
    // { vendor: "Vendor A", risk: "Description of the risk", severity: "Critical" | "High" | "Medium" },
  ],

  // ── Roadmap (optional — used if "roadmap" tab is enabled) ──
  roadmap: [
    // {
    //   phase: "Week 1–2",
    //   label: "Setup",
    //   color: "#7C3AED",
    //   items: ["Step one", "Step two"],
    // },
  ],

};
