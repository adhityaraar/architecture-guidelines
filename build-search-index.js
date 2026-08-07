#!/usr/bin/env node
/**
 * build-search-index.js
 * Crawls every content HTML page under architecture/ and emits
 * architecture/search-index.json — a compact array of objects:
 *
 *   { label, tab, tabLabel, badgeColor, badgeBg, href?, db2page?,
 *     headings: [string], body: string }
 *
 * Run from the repo root:  node architecture/build-search-index.js
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname);   // architecture/

// ── Page manifest ──────────────────────────────────────────────────────
// Same list as the JS search INDEX but with file paths added.
const PAGES = [
  // General
  { label:'HA & DR Principles',        file:'general/general-principles.html',  tab:'tab-general',    tabLabel:'General',       badgeColor:'#343a40', badgeBg:'#f0f1f3' },
  { label:'IBM Licensing Guide',       file:'general/general-licensing.html',   tab:'tab-general',    tabLabel:'General',       badgeColor:'#343a40', badgeBg:'#f0f1f3' },
  { label:'IBM Severity Guide',        file:'general/general-severity.html',    tab:'tab-general',    tabLabel:'General',       badgeColor:'#343a40', badgeBg:'#f0f1f3' },
  // DB2 (SPA pages)
  { label:'HADR Benefits',             file:'db2/hadrBenefits.html',    tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/hadrBenefits.html' },
  { label:'Feature History',           file:'db2/featureHistory.html',  tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/featureHistory.html' },
  { label:'HADR Tutorial',             file:'db2/hadrTutorial.html',    tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/hadrTutorial.html' },
  { label:'HADR Config',               file:'db2/hadrConfig.html',      tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/hadrConfig.html' },
  { label:'HADR Sync Mode',            file:'db2/hadrSyncMode.html',    tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/hadrSyncMode.html' },
  { label:'HADR Takeover',             file:'db2/hadrTakeover.html',    tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/hadrTakeover.html' },
  { label:'HADR Log Shipping',         file:'db2/hadrLogShipping.html', tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/hadrLogShipping.html' },
  { label:'HADR Monitoring',           file:'db2/hadrMonitoring.html',  tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/hadrMonitoring.html' },
  { label:'HADR Commands',             file:'db2/hadrCommands.html',    tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/hadrCommands.html' },
  { label:'HADR Perf',                 file:'db2/hadrPerf.html',        tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/hadrPerf.html' },
  { label:'Client Reroute',            file:'db2/clientReroute.html',   tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/clientReroute.html' },
  { label:'Cluster Managers',          file:'db2/clusterManagers.html', tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/clusterManagers.html' },
  { label:'TCP Tuning',                file:'db2/tcpTuning.html',       tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/tcpTuning.html' },
  { label:'Perf Tuning',               file:'db2/perfTuning.html',      tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/perfTuning.html' },
  { label:'HADR Simulator',            file:'db2/hadrSimulator.html',   tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/hadrSimulator.html' },
  { label:'Simulator Options',         file:'db2/simulatorOptions.html',tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/simulatorOptions.html' },
  { label:'Simulator Output',          file:'db2/simulatorOutput.html', tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/simulatorOutput.html' },
  { label:'Simulator Params',          file:'db2/simulatorParams.html', tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/simulatorParams.html' },
  { label:'HADR on PureScale',         file:'db2/hadrPureScale.html',   tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/hadrPureScale.html' },
  { label:'db2logscan',                file:'db2/db2logscan.html',      tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/db2logscan.html' },
  { label:'Diag Connect',              file:'db2/diagConnect.html',     tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/diagConnect.html' },
  { label:'db2diag.log',               file:'db2/db2diag.html',         tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/db2diag.html' },
  { label:'db2fmtlog replayonlywindow',file:'db2/db2fmtlog.html',       tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/db2fmtlog.html' },
  { label:'FAQ',                       file:'db2/faq.html',             tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/faq.html' },
  { label:'Sizing',                    file:'db2/sizing.html',          tab:'tab-db2', tabLabel:'DB2', badgeColor:'#7c5cd8', badgeBg:'#ede9fb', db2page:'db2/sizing.html' },
  // InfoSphere / DataStage
  { label:'DataStage Overview',               file:'InfoSphere/DataStage/ds-overview.html',    tab:'tab-infosphere', tabLabel:'InfoSphere', badgeColor:'#0f7b5e', badgeBg:'#e6f4ee', href:'InfoSphere/DataStage/ds-overview.html' },
  { label:'DataStage HA Topology',            file:'InfoSphere/DataStage/ds-topology.html',    tab:'tab-infosphere', tabLabel:'InfoSphere', badgeColor:'#0f7b5e', badgeBg:'#e6f4ee', href:'InfoSphere/DataStage/ds-topology.html' },
  { label:'Parallel Engine Resilience',       file:'InfoSphere/DataStage/ds-engine.html',      tab:'tab-infosphere', tabLabel:'InfoSphere', badgeColor:'#0f7b5e', badgeBg:'#e6f4ee', href:'InfoSphere/DataStage/ds-engine.html' },
  { label:'Repository & Metadata HA',         file:'InfoSphere/DataStage/ds-repo.html',        tab:'tab-infosphere', tabLabel:'InfoSphere', badgeColor:'#0f7b5e', badgeBg:'#e6f4ee', href:'InfoSphere/DataStage/ds-repo.html' },
  { label:'DataStage Monitoring',             file:'InfoSphere/DataStage/ds-monitoring.html',  tab:'tab-infosphere', tabLabel:'InfoSphere', badgeColor:'#0f7b5e', badgeBg:'#e6f4ee', href:'InfoSphere/DataStage/ds-monitoring.html' },
  { label:'DataStage Recovery',               file:'InfoSphere/DataStage/ds-recovery.html',    tab:'tab-infosphere', tabLabel:'InfoSphere', badgeColor:'#0f7b5e', badgeBg:'#e6f4ee', href:'InfoSphere/DataStage/ds-recovery.html' },
  { label:'DataStage Pre-Production Checklist',file:'InfoSphere/DataStage/ds-checklist.html',  tab:'tab-infosphere', tabLabel:'InfoSphere', badgeColor:'#0f7b5e', badgeBg:'#e6f4ee', href:'InfoSphere/DataStage/ds-checklist.html' },
  // InfoSphere / CDC
  { label:'CDC Overview',                      file:'InfoSphere/Change Data Capture/cdc-overview.html',       tab:'tab-infosphere', tabLabel:'InfoSphere', badgeColor:'#b45309', badgeBg:'#fef3e2', href:'InfoSphere/Change Data Capture/cdc-overview.html' },
  { label:'CDC HA Topology',                   file:'InfoSphere/Change Data Capture/cdc-topology.html',       tab:'tab-infosphere', tabLabel:'InfoSphere', badgeColor:'#b45309', badgeBg:'#fef3e2', href:'InfoSphere/Change Data Capture/cdc-topology.html' },
  { label:'CDC Subscriptions & Replication',   file:'InfoSphere/Change Data Capture/cdc-subscriptions.html',  tab:'tab-infosphere', tabLabel:'InfoSphere', badgeColor:'#b45309', badgeBg:'#fef3e2', href:'InfoSphere/Change Data Capture/cdc-subscriptions.html' },
  { label:'CDC Monitoring',                    file:'InfoSphere/Change Data Capture/cdc-monitoring.html',     tab:'tab-infosphere', tabLabel:'InfoSphere', badgeColor:'#b45309', badgeBg:'#fef3e2', href:'InfoSphere/Change Data Capture/cdc-monitoring.html' },
  { label:'CDC Recovery',                      file:'InfoSphere/Change Data Capture/cdc-recovery.html',       tab:'tab-infosphere', tabLabel:'InfoSphere', badgeColor:'#b45309', badgeBg:'#fef3e2', href:'InfoSphere/Change Data Capture/cdc-recovery.html' },
  { label:'CDC Pre-Production Checklist',      file:'InfoSphere/Change Data Capture/cdc-checklist.html',      tab:'tab-infosphere', tabLabel:'InfoSphere', badgeColor:'#b45309', badgeBg:'#fef3e2', href:'InfoSphere/Change Data Capture/cdc-checklist.html' },
  // watsonx.data Lakehouse
  { label:'watsonx.data Overview & HA',        file:'watsonx.data/wxdata-overview.html',                      tab:'tab-watsonx', tabLabel:'watsonx.data', badgeColor:'#0550ae', badgeBg:'#e6f0fb', href:'watsonx.data/wxdata-overview.html' },
  // watsonx.data Integration
  { label:'Integration Overview',              file:'watsonx.data Integration/wxi-overview.html',             tab:'tab-watsonx', tabLabel:'watsonx.data', badgeColor:'#1d4ed8', badgeBg:'#eef2fd', href:'watsonx.data Integration/wxi-overview.html' },
  { label:'Integration HA Topology',           file:'watsonx.data Integration/wxi-topology.html',             tab:'tab-watsonx', tabLabel:'watsonx.data', badgeColor:'#1d4ed8', badgeBg:'#eef2fd', href:'watsonx.data Integration/wxi-topology.html' },
  { label:'Integration Connectors',            file:'watsonx.data Integration/wxi-connectors.html',           tab:'tab-watsonx', tabLabel:'watsonx.data', badgeColor:'#1d4ed8', badgeBg:'#eef2fd', href:'watsonx.data Integration/wxi-connectors.html' },
  { label:'Integration Monitoring',            file:'watsonx.data Integration/wxi-monitoring.html',           tab:'tab-watsonx', tabLabel:'watsonx.data', badgeColor:'#1d4ed8', badgeBg:'#eef2fd', href:'watsonx.data Integration/wxi-monitoring.html' },
  { label:'Integration Recovery',              file:'watsonx.data Integration/wxi-recovery.html',             tab:'tab-watsonx', tabLabel:'watsonx.data', badgeColor:'#1d4ed8', badgeBg:'#eef2fd', href:'watsonx.data Integration/wxi-recovery.html' },
  { label:'Integration Checklist',             file:'watsonx.data Integration/wxi-checklist.html',            tab:'tab-watsonx', tabLabel:'watsonx.data', badgeColor:'#1d4ed8', badgeBg:'#eef2fd', href:'watsonx.data Integration/wxi-checklist.html' },
  // watsonx.data Intelligence
  { label:'Intelligence Overview',             file:'watsonx.data Intelligence/wxn-overview.html',            tab:'tab-watsonx', tabLabel:'watsonx.data', badgeColor:'#0369a1', badgeBg:'#e6f3fa', href:'watsonx.data Intelligence/wxn-overview.html' },
  { label:'Intelligence HA Topology',          file:'watsonx.data Intelligence/wxn-topology.html',            tab:'tab-watsonx', tabLabel:'watsonx.data', badgeColor:'#0369a1', badgeBg:'#e6f3fa', href:'watsonx.data Intelligence/wxn-topology.html' },
  { label:'Knowledge Catalog HA',              file:'watsonx.data Intelligence/wxn-catalog.html',             tab:'tab-watsonx', tabLabel:'watsonx.data', badgeColor:'#0369a1', badgeBg:'#e6f3fa', href:'watsonx.data Intelligence/wxn-catalog.html' },
  { label:'Intelligence Monitoring',           file:'watsonx.data Intelligence/wxn-monitoring.html',          tab:'tab-watsonx', tabLabel:'watsonx.data', badgeColor:'#0369a1', badgeBg:'#e6f3fa', href:'watsonx.data Intelligence/wxn-monitoring.html' },
  { label:'Intelligence Recovery',             file:'watsonx.data Intelligence/wxn-recovery.html',            tab:'tab-watsonx', tabLabel:'watsonx.data', badgeColor:'#0369a1', badgeBg:'#e6f3fa', href:'watsonx.data Intelligence/wxn-recovery.html' },
  { label:'Intelligence Checklist',            file:'watsonx.data Intelligence/wxn-checklist.html',           tab:'tab-watsonx', tabLabel:'watsonx.data', badgeColor:'#0369a1', badgeBg:'#e6f3fa', href:'watsonx.data Intelligence/wxn-checklist.html' },
  // Guardium
  { label:'Guardium Data Protection',          file:'Guardium/Guardium Data Protection/gdp-overview.html',          tab:'tab-guardium', tabLabel:'Guardium', badgeColor:'#b91c1c', badgeBg:'#fde8e8', href:'Guardium/Guardium Data Protection/gdp-overview.html' },
  { label:'Guardium Discover & Classify',      file:'Guardium/Guardium Discover and Classify/gdc-overview.html',    tab:'tab-guardium', tabLabel:'Guardium', badgeColor:'#be185d', badgeBg:'#fde8f3', href:'Guardium/Guardium Discover and Classify/gdc-overview.html' },
  { label:'Guardium Cryptography Manager',     file:'Guardium/Guardium Crytography Manager/gcm-overview.html',      tab:'tab-guardium', tabLabel:'Guardium', badgeColor:'#6d28d9', badgeBg:'#ede9fb', href:'Guardium/Guardium Crytography Manager/gcm-overview.html' },
];

// ── HTML → plain text ──────────────────────────────────────────────────
function extractContent(html) {
  // Drop <script> and <style> blocks entirely
  let t = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  t = t.replace(/<style[\s\S]*?<\/style>/gi, '');
  // Drop sidebar, navbar, footer — keep only .container-fluid body content
  t = t.replace(/<div[^>]*id=["']sidebar-wrapper["'][\s\S]*?(?=<div[^>]*id=["']page-content-wrapper["'])/i, '');
  t = t.replace(/<nav[\s\S]*?<\/nav>/gi, '');
  t = t.replace(/<footer[\s\S]*?<\/footer>/gi, '');
  // Extract headings for weighted matching
  const headingRe = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  const headings = [];
  let m;
  while ((m = headingRe.exec(t)) !== null) {
    const h = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (h) headings.push(h);
  }
  // Strip all remaining tags
  t = t.replace(/<[^>]+>/g, ' ');
  // Decode common entities
  t = t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
       .replace(/&nbsp;/g, ' ').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
       .replace(/&rsaquo;/g, '›').replace(/&#[0-9]+;/g, '').replace(/&[a-z]+;/g, ' ');
  // Collapse whitespace
  t = t.replace(/\s+/g, ' ').trim();
  // Truncate body to 8 000 chars (enough for in-browser matching)
  return { headings, body: t.slice(0, 8000) };
}

// ── Build index ────────────────────────────────────────────────────────
const index = [];

for (const page of PAGES) {
  const filePath = path.join(ROOT, page.file);
  if (!fs.existsSync(filePath)) {
    console.warn('MISSING:', page.file);
    continue;
  }
  const html = fs.readFileSync(filePath, 'utf8');
  const { headings, body } = extractContent(html);

  const entry = {
    label:      page.label,
    tab:        page.tab,
    tabLabel:   page.tabLabel,
    badgeColor: page.badgeColor,
    badgeBg:    page.badgeBg,
    headings,
    body,
  };
  if (page.db2page) entry.db2page = page.db2page;
  if (page.href)    entry.href    = page.href;

  index.push(entry);
}

const outPath = path.join(ROOT, 'search-index.json');
fs.writeFileSync(outPath, JSON.stringify(index));
console.log(`Wrote ${index.length} entries → ${outPath}`);
