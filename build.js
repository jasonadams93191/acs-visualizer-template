#!/usr/bin/env node
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACS Visualizer Build Script
// Compiles all source files into a single self-contained HTML
// Usage: node build.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const config = require(path.join(ROOT, 'visualizer.config.js'));

console.log('━━━ ACS Visualizer Build ━━━');
console.log('Project:', config.project);
console.log('Layout:', config.layout);

// ── Read source files ──
function readFile(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { console.warn('  WARN: Missing', rel); return ''; }
  return fs.readFileSync(p, 'utf-8');
}

const shellHtml = readFile('src/shell.html');
const brandCss = readFile('src/brand.css');
const authJs = readFile('src/auth.js');
const coreJs = readFile('src/core.js');

// Layout JS
const layoutMap = {
  'tabbed': 'src/layouts/tabbed.js',
  'dashboard': 'src/layouts/dashboard.js',
  'matrix': 'src/layouts/matrix.js',
  'canvas-diagram': 'src/layouts/canvas-diagram.js'
};
const layoutFile = layoutMap[config.layout];
if (!layoutFile) { console.error('ERROR: Unknown layout "' + config.layout + '"'); process.exit(1); }
const layoutJs = readFile(layoutFile);

// Data
const dataPath = path.join(ROOT, config.dataFile || 'data/data.json');
let dataJson = '{}';
if (fs.existsSync(dataPath)) {
  dataJson = fs.readFileSync(dataPath, 'utf-8');
  console.log('Data:', config.dataFile, '(' + Math.round(dataJson.length / 1024) + 'KB)');
} else {
  console.warn('  WARN: No data file at', config.dataFile);
}

// Logo
let logoDataUri = '';
const logoB64Path = path.join(ROOT, 'assets/acs-logo-base64.txt');
const logoPngPath = path.join(ROOT, 'assets/acs-logo.png');
if (fs.existsSync(logoB64Path)) {
  const b64 = fs.readFileSync(logoB64Path, 'utf-8').trim();
  logoDataUri = 'data:image/png;base64,' + b64;
} else if (fs.existsSync(logoPngPath)) {
  const buf = fs.readFileSync(logoPngPath);
  logoDataUri = 'data:image/png;base64,' + buf.toString('base64');
}

// ── Build config JSON (only safe fields) ──
const configJson = JSON.stringify({
  project: config.project,
  client: config.client,
  layout: config.layout,
  accentColor: config.accentColor,
  credentials: config.credentials,
  tabs: config.tabs,
  features: config.features
});

// ── Generate tab bar HTML ──
function buildTabBar() {
  if (config.layout === 'dashboard' || config.layout === 'matrix') return '';
  if (config.layout === 'canvas-diagram') {
    return '<div class="tab-bar" style="padding:8px 16px;gap:12px"></div>';
  }
  // Tabbed layout - tabs are rendered dynamically by the layout JS
  return '<div class="tab-bar"></div>';
}

// ── Generate toolbar HTML ──
function buildToolbar() {
  if (config.layout === 'canvas-diagram') return '';
  return ''; // Toolbars are rendered per-panel by layout JS
}

// ── Assemble ──
let output = shellHtml;

// Replace CSS (strip the @import for Google Fonts and put it before the <style> tag)
const fontImport = brandCss.match(/@import url\([^)]+\);/);
let cssContent = brandCss.replace(/@import url\([^)]+\);/, '').trim();
// Add accent color override
cssContent = ':root{--accent:' + (config.accentColor || '#1956A6') + '}\n' + cssContent;
if (fontImport) {
  const fontLink = fontImport[0].replace(/@import url\(['"]?/, '<link href="').replace(/['"]?\);/, '" rel="stylesheet">');
  output = output.replace('<style>', fontLink + '\n<style>');
}

// Replace placeholders
output = output.replace('{{CSS}}', cssContent);
output = output.replace(/\{\{PROJECT\}\}/g, escHtml(config.project));
output = output.replace(/\{\{CLIENT\}\}/g, escHtml(config.client));
output = output.replace(/\{\{LOGO_DATA_URI\}\}/g, logoDataUri);
output = output.replace('{{TAB_BAR}}', buildTabBar());
output = output.replace('{{TOOLBAR}}', buildToolbar());
output = output.replace('{{PANELS}}', '');
output = output.replace('{{CONFIG_JSON}}', configJson);
output = output.replace('{{DATA_JSON}}', dataJson);
output = output.replace('{{AUTH_JS}}', authJs);
output = output.replace('{{CORE_JS}}', coreJs);
output = output.replace('{{LAYOUT_JS}}', layoutJs);

// ── Write output ──
const distDir = path.join(ROOT, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
const outPath = path.join(distDir, 'index.html');
fs.writeFileSync(outPath, output, 'utf-8');
const sizeKB = Math.round(output.length / 1024);
console.log('\n✓ Built dist/index.html (' + sizeKB + 'KB)');

// ── Generate Teams manifest ──
if (config.vercelUrl) {
  const teamsDir = path.join(ROOT, 'teams');
  if (!fs.existsSync(teamsDir)) fs.mkdirSync(teamsDir, { recursive: true });

  // Generate a deterministic GUID from project name
  const guid = generateGuid(config.project);

  const manifest = {
    "$schema": "https://developer.microsoft.com/json-schemas/teams/v1.24/MicrosoftTeams.schema.json",
    "manifestVersion": "1.24",
    "version": "1.0.0",
    "id": guid,
    "name": { "short": config.project.substring(0, 30), "full": config.project },
    "description": {
      "short": config.project + " Visualizer",
      "full": config.project + " - Interactive business visualization by Advocate Cloud Solutions"
    },
    "icons": { "color": "teams-color.png", "outline": "teams-outline.png" },
    "accentColor": config.accentColor || "#1956A6",
    "staticTabs": [{
      "entityId": "visualizer",
      "name": config.project,
      "contentUrl": config.vercelUrl,
      "websiteUrl": config.vercelUrl,
      "scopes": ["personal", "team"]
    }],
    "validDomains": [new URL(config.vercelUrl).hostname],
    "permissions": ["identity"]
  };
  fs.writeFileSync(path.join(teamsDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('✓ Generated teams/manifest.json');
}

// ── Generate Slack Canvas markdown ──
const slackMd = generateSlackCanvas(config, dataJson);
fs.writeFileSync(path.join(distDir, 'slack-canvas.md'), slackMd);
console.log('✓ Generated dist/slack-canvas.md');

console.log('\n━━━ Build complete ━━━');

// ── Helpers ──
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateGuid(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return hex.slice(0,8) + '-' + hex.slice(0,4) + '-4' + hex.slice(1,4) + '-8' + hex.slice(0,3) + '-' + hex.padEnd(12, '0').slice(0,12);
}

function generateSlackCanvas(cfg, rawData) {
  let data;
  try { data = JSON.parse(rawData); } catch(e) { data = {}; }
  let md = '# ' + cfg.project + '\n\n';
  md += '**Client:** ' + cfg.client + '\n';
  md += '**Prepared by:** Advocate Cloud Solutions\n';
  md += '**Layout:** ' + cfg.layout + '\n\n';
  if (cfg.vercelUrl) {
    md += '**[Open Interactive Visualizer](' + cfg.vercelUrl + ')**\n\n';
  }
  md += '---\n\n';

  // Data summary based on layout
  if (cfg.layout === 'tabbed' && data.tabs) {
    md += '## Contents\n\n';
    data.tabs.forEach(function(tab) {
      const name = typeof tab === 'string' ? tab : tab.name;
      const count = typeof tab === 'object' && tab.items ? ' (' + tab.items.length + ' items)' : '';
      md += '- **' + name + '**' + count + '\n';
    });
  } else if (cfg.layout === 'dashboard' && data.kpis) {
    md += '## Key Metrics\n\n';
    data.kpis.forEach(function(kpi) {
      md += '- **' + kpi.label + ':** ' + kpi.value + '\n';
    });
  } else if (cfg.layout === 'matrix' && data.rows) {
    md += '## Comparison Matrix\n';
    md += data.rows.length + ' items across ' + (data.columns || []).length + ' categories\n';
  } else if (cfg.layout === 'canvas-diagram' && data.plans) {
    md += '## Plans\n\n';
    data.plans.forEach(function(plan) {
      const stages = (plan.stages || []).length;
      let tasks = 0;
      (plan.stages || []).forEach(function(s) { tasks += (s.tasks || []).length; });
      md += '- **' + plan.name + '** - ' + stages + ' stages, ' + tasks + ' tasks\n';
    });
  }

  md += '\n---\n*Generated by ACS Visualizer Template*\n';
  return md;
}
