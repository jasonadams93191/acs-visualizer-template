#!/usr/bin/env node
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACS Comparison Builder
// Usage: node build-comparison.js
// Output: dist/index.html (ready to deploy to Vercel)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const fs   = require("fs");
const path = require("path");
const cfg  = require("./comparison.config.js");

const { context, vendorTypes, vendors, features, tabs, risks = [], roadmap = [] } = cfg;

// Serialize config data for injection into HTML
const DATA_JSON = JSON.stringify({ context, vendorTypes, vendors, features, tabs, risks, roadmap }, null, 2);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${context.client} – ${context.title}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js"><\/script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #FAFAF8; font-family: Georgia, "Times New Roman", serif; color: #1C1917; }
    button:focus { outline: none; }
  </style>
</head>
<body>
<div id="root"></div>
<script>window.__ACS_DATA__ = ${DATA_JSON};<\/script>
<script type="text/babel">
  const { useState } = React;
  const data = window.__ACS_DATA__;
  const { context, vendorTypes, vendors, features, tabs: enabledTabs, risks, roadmap } = data;

  const severityColors = {
    Critical: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
    High:     { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
    Medium:   { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
  };

  const TAB_LABELS = {
    overview: "Platform Overview",
    cost:     "Cost Analysis",
    features: "Feature Matrix",
    risks:    "Risk Register",
    roadmap:  "Roadmap",
  };

  const recommendedVendor = vendors.find(v => v.type === "recommended");
  const accentColor = recommendedVendor
    ? vendorTypes[recommendedVendor.type]?.color
    : vendorTypes[vendors[0]?.type]?.color || "#7C3AED";

  const fmt = (n) => n != null ? "$" + Number(n).toLocaleString() : "TBD";

  const renderCell = (val) => {
    if (val === true)     return <span style={{ fontSize: 16, color: "#059669", fontWeight: 700 }}>✓<\/span>;
    if (val === false)    return <span style={{ fontSize: 16, color: "#E5E7EB", fontWeight: 700 }}>✗<\/span>;
    if (val === "build")  return <span style={{ fontSize: 12, color: accentColor, fontWeight: 700, fontFamily: "monospace", background: "#F5F3FF", padding: "2px 7px", borderRadius: 3, border: "1px solid #DDD6FE" }}>BUILD<\/span>;
    if (val === "partial") return <span style={{ fontSize: 12, color: "#D97706", fontWeight: 700, fontFamily: "monospace", background: "#FFFBEB", padding: "2px 7px", borderRadius: 3, border: "1px solid #FDE68A" }}>PARTIAL<\/span>;
    return null;
  };

  function App() {
    const [activeTab, setActiveTab]     = useState(enabledTabs[0] || "overview");
    const [expandedCat, setExpandedCat] = useState(null);

    return (
      <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", background: "#FAFAF8", minHeight: "100vh", color: "#1C1917" }}>

        {/* Header */}
        <div style={{ background: "#1C1917", padding: "28px 32px 22px", borderBottom: \`3px solid \${accentColor}\` }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#9CA3AF", textTransform: "uppercase", marginBottom: 6, fontFamily: "monospace" }}>
                  {context.client} · {context.analyst} · {context.date}
                <\/div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#FAFAF8", lineHeight: 1.2 }}>{context.title}<\/h1>
                <p style={{ margin: "6px 0 0", fontSize: 14, color: "#9CA3AF", fontStyle: "italic" }}>{context.subtitle}<\/p>
              <\/div>
              {recommendedVendor && (
                <div style={{ background: accentColor, color: "#fff", padding: "8px 16px", borderRadius: 6, fontSize: 12, fontFamily: "monospace", alignSelf: "center" }}>
                  {vendorTypes[recommendedVendor.type]?.label}: {recommendedVendor.name}
                <\/div>
              )}
            <\/div>
          <\/div>
        <\/div>

        {/* Tabs */}
        <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "0 32px", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ maxWidth: 960, margin: "0 auto", display: "flex" }}>
            {enabledTabs.map(tabId => (
              <button key={tabId} onClick={() => setActiveTab(tabId)} style={{
                padding: "12px 16px", border: "none", background: "none", cursor: "pointer",
                fontSize: 13, fontFamily: "Georgia, serif",
                color: activeTab === tabId ? "#1C1917" : "#6B7280",
                borderBottom: activeTab === tabId ? \`2px solid \${accentColor}\` : "2px solid transparent",
                fontWeight: activeTab === tabId ? 700 : 400,
                transition: "all 0.15s", marginBottom: -1,
              }}>{TAB_LABELS[tabId] || tabId}<\/button>
            ))}
          <\/div>
        <\/div>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 32px 60px" }}>

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {vendors.map(v => {
                const vType = vendorTypes[v.type] || {};
                return (
                  <div key={v.id} style={{ background: "#fff", border: \`1px solid \${v.type === "recommended" ? accentColor : "#E5E7EB"}\`, borderLeft: \`4px solid \${vType.color || "#6B7280"}\`, borderRadius: 8, padding: 22, boxShadow: v.type === "recommended" ? \`0 2px 12px \${accentColor}22\` : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: vType.color }}>{v.name}<\/h3>
                        <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, fontFamily: "monospace", background: "#F5F3FF", color: vType.color }}>{vType.label}<\/span>
                      <\/div>
                      {v.cost?.annual != null && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: vType.color }}>{fmt(v.cost.annual)}/yr<\/div>
                          {v.cost.note && <div style={{ fontSize: 10, color: "#9CA3AF" }}>{v.cost.note}<\/div>}
                        <\/div>
                      )}
                    <\/div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 14, fontStyle: "italic" }}>{v.tagline}<\/div>
                    <p style={{ margin: "0 0 16px", fontSize: 13, color: "#374151", lineHeight: 1.7, borderLeft: "3px solid #E5E7EB", paddingLeft: 14 }}>{v.description}<\/p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.08em", color: "#059669", marginBottom: 8, textTransform: "uppercase" }}>✓ Strengths<\/div>
                        {v.strengths.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#374151", lineHeight: 1.5, marginBottom: 5, paddingLeft: 12, borderLeft: "2px solid #D1FAE5" }}>{s}<\/div>)}
                      <\/div>
                      <div>
                        <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.08em", color: "#DC2626", marginBottom: 8, textTransform: "uppercase" }}>✗ Weaknesses<\/div>
                        {v.weaknesses.map((w, i) => <div key={i} style={{ fontSize: 13, color: "#374151", lineHeight: 1.5, marginBottom: 5, paddingLeft: 12, borderLeft: "2px solid #FEE2E2" }}>{w}<\/div>)}
                      <\/div>
                    <\/div>
                  <\/div>
                );
              })}
            <\/div>
          )}

          {/* COST */}
          {activeTab === "cost" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {vendors.map(v => {
                  const vType = vendorTypes[v.type] || {};
                  return (
                    <div key={v.id} style={{ flex: 1, minWidth: 180, background: "#fff", border: \`1px solid \${vType.color}44\`, borderRadius: 8, padding: 20, textAlign: "center" }}>
                      <div style={{ fontSize: 11, fontFamily: "monospace", color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>{v.name}<\/div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: vType.color }}>{v.cost?.annual != null ? fmt(v.cost.annual) : "TBD"}<\/div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{v.cost?.note || "per year"}<\/div>
                    <\/div>
                  );
                })}
              <\/div>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", border: "1px solid #E5E7EB", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#1C1917" }}>
                    <th style={{ padding: "12px 18px", textAlign: "left", color: "#9CA3AF", fontWeight: 400, fontFamily: "monospace", fontSize: 10 }}>VENDOR<\/th>
                    <th style={{ padding: "12px 14px", textAlign: "left", color: "#9CA3AF", fontWeight: 400, fontFamily: "monospace", fontSize: 10 }}>TYPE<\/th>
                    <th style={{ padding: "12px 18px", textAlign: "right", color: "#9CA3AF", fontWeight: 400, fontFamily: "monospace", fontSize: 10 }}>ANNUAL COST<\/th>
                    <th style={{ padding: "12px 14px", color: "#9CA3AF", fontWeight: 400, fontFamily: "monospace", fontSize: 10 }}>NOTE<\/th>
                  <\/tr>
                <\/thead>
                <tbody>
                  {vendors.map((v, i) => {
                    const vType = vendorTypes[v.type] || {};
                    return (
                      <tr key={v.id} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                        <td style={{ padding: "12px 18px", fontWeight: 600 }}>
                          <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: vType.color, marginRight: 8 }} />
                          {v.name}
                        <\/td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ fontSize: 10, fontFamily: "monospace", background: "#F5F3FF", color: vType.color, padding: "2px 8px", borderRadius: 3 }}>{vType.label}<\/span>
                        <\/td>
                        <td style={{ padding: "12px 18px", textAlign: "right", fontWeight: 600, color: vType.color }}>{v.cost?.annual != null ? fmt(v.cost.annual) : "TBD"}<\/td>
                        <td style={{ padding: "12px 14px", fontSize: 12, color: "#9CA3AF" }}>{v.cost?.note || ""}<\/td>
                      <\/tr>
                    );
                  })}
                <\/tbody>
              <\/table>
            <\/div>
          )}

          {/* FEATURES */}
          {activeTab === "features" && (
            <div>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", border: "1px solid #E5E7EB", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#1C1917" }}>
                    <th style={{ padding: "12px 18px", textAlign: "left", color: "#9CA3AF", fontWeight: 400, fontFamily: "monospace", fontSize: 10, width: "40%" }}>CAPABILITY<\/th>
                    {vendors.map(v => (
                      <th key={v.id} style={{ padding: "12px 14px", textAlign: "center", color: vendorTypes[v.type]?.color || "#9CA3AF", fontWeight: 700, fontSize: 12 }}>{v.name}<\/th>
                    ))}
                    <th style={{ padding: "12px 14px", color: "#9CA3AF", fontWeight: 400, fontFamily: "monospace", fontSize: 10 }}>GAP<\/th>
                  <\/tr>
                <\/thead>
                <tbody>
                  {features.map((cat, ci) => (
                    <>
                      <tr key={\`cat-\${ci}\`} style={{ background: "#F9FAFB", cursor: "pointer" }} onClick={() => setExpandedCat(expandedCat === ci ? null : ci)}>
                        <td colSpan={vendors.length + 2} style={{ padding: "9px 18px", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#374151", fontFamily: "monospace" }}>
                          {expandedCat === ci ? "▾" : "▸"} {cat.category}
                        <\/td>
                      <\/tr>
                      {(expandedCat === null || expandedCat === ci) && cat.items.map((item, ii) => (
                        <tr key={\`item-\${ci}-\${ii}\`} style={{ borderTop: "1px solid #F3F4F6", background: ii % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                          <td style={{ padding: "10px 18px", color: "#374151" }}>{item.name}<\/td>
                          {vendors.map(v => (
                            <td key={v.id} style={{ padding: "10px 14px", textAlign: "center" }}>{renderCell(item[v.id])}<\/td>
                          ))}
                          <td style={{ padding: "10px 14px" }}>
                            {item.severity ? (
                              <span style={{ fontSize: 10, padding: "3px 7px", borderRadius: 4, fontFamily: "monospace", background: severityColors[item.severity]?.bg, color: severityColors[item.severity]?.text, border: \`1px solid \${severityColors[item.severity]?.border}\` }}>{item.severity}<\/span>
                            ) : <span style={{ color: "#D1D5DB" }}>–<\/span>}
                          <\/td>
                        <\/tr>
                      ))}
                    </>
                  ))}
                <\/tbody>
              <\/table>
              <div style={{ fontSize: 12, color: "#6B7280", fontFamily: "monospace", marginTop: 10 }}>
                Click a category row to isolate · <span style={{ color: "#059669" }}>✓<\/span> Available &nbsp; <span style={{ color: "#D1D5DB" }}>✗<\/span> Not Available &nbsp; <span style={{ color: accentColor }}>BUILD<\/span> To Be Built
              <\/div>
            <\/div>
          )}

          {/* RISKS */}
          {activeTab === "risks" && risks.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {["Critical", "High", "Medium"].map(sev => {
                const items = risks.filter(r => r.severity === sev);
                if (!items.length) return null;
                return (
                  <div key={sev}>
                    <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.1em", color: severityColors[sev]?.text, marginBottom: 8, textTransform: "uppercase" }}>{sev} Severity<\/div>
                    {items.map((r, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, background: "#fff", border: \`1px solid \${severityColors[sev]?.border}\`, borderLeft: \`3px solid \${severityColors[sev]?.text}\`, borderRadius: 6, padding: "12px 18px", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontFamily: "monospace", background: severityColors[sev]?.bg, color: severityColors[sev]?.text, padding: "3px 10px", borderRadius: 4, whiteSpace: "nowrap", minWidth: 72, textAlign: "center" }}>{r.vendor}<\/span>
                        <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{r.risk}<\/span>
                      <\/div>
                    ))}
                  <\/div>
                );
              })}
            <\/div>
          )}

          {/* ROADMAP */}
          {activeTab === "roadmap" && roadmap.length > 0 && (
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 104, top: 12, bottom: 80, width: 2, background: "#E5E7EB" }} />
              {roadmap.map((phase, i) => (
                <div key={i} style={{ display: "flex", gap: 28, marginBottom: 32, position: "relative" }}>
                  <div style={{ width: 76, textAlign: "right", flexShrink: 0, paddingTop: 2 }}>
                    <div style={{ fontSize: 10, fontFamily: "monospace", color: "#9CA3AF" }}>{phase.phase}<\/div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginTop: 2 }}>{phase.label}<\/div>
                  <\/div>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: phase.color || accentColor, flexShrink: 0, marginTop: 2, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>{i + 1}<\/div>
                  <div style={{ flex: 1 }}>
                    {phase.items.map((item, j) => (
                      <div key={j} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 6, padding: "11px 16px", marginBottom: 8, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{item}<\/div>
                    ))}
                  <\/div>
                <\/div>
              ))}
            <\/div>
          )}

        <\/div>
      <\/div>
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
<\/script>
<\/body>
<\/html>`;

const outDir = path.join(__dirname, "dist");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
console.log("✓ Built: dist/index.html");
console.log(`  Client:  ${context.client}`);
console.log(`  Title:   ${context.title}`);
console.log(`  Vendors: ${vendors.map(v => v.name).join(", ")}`);
console.log("\nDeploy with:");
console.log("  vercel deploy --prod --token YOUR_TOKEN --yes --scope YOUR_SCOPE");
