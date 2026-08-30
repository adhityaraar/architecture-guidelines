// ════════════════════════════════════════════════════════════════════════
// wiki.js — shared script for every page
// Responsibilities:
//   1. Inject search bar into the navbar
//   2. Drive global content search (loads search-index.json)
//   3. Toggle sidebar (hamburger)
//   4. Highlight current page & auto-expand sidebar section
//   5. Smooth accordion sidebar sections
// ════════════════════════════════════════════════════════════════════════

(function () {

  // ── 0. Compute root-relative prefix ──────────────────────────────────
  // Figures out how many levels deep this page is from architecture/
  // so all asset paths resolve correctly from any sub-page.
  var _path   = window.location.pathname;
  // Find the architecture root by walking up
  var _parts  = _path.split('/').filter(Boolean);
  var _rootIdx = -1;
  for (var _i = _parts.length - 1; _i >= 0; _i--) {
    if (_parts[_i] === 'architecture') { _rootIdx = _i; break; }
  }
  // prefix = number of '../' needed to reach architecture/
  var _lastPart = _parts[_parts.length - 1] || '';
  var _currentDirParts = /\.[^/]+$/.test(_lastPart) ? _parts.slice(0, -1) : _parts;
  var _levelsBelow = _rootIdx >= 0 ? Math.max(0, _currentDirParts.length - 1 - _rootIdx) : 0;
  var ROOT = '';
  for (var _j = 0; _j < _levelsBelow; _j++) ROOT += '../';
  // Prefer the loaded script URL so navigation also works when architecture/
  // is served as the web root instead of appearing in the browser path.
  if (document.currentScript && document.currentScript.src) {
    ROOT = new URL('../', document.currentScript.src).href;
  }

  // ── 1. Inject search bar CSS + HTML ──────────────────────────────────
  var _searchCSS = [
    '#global-search-wrap{position:relative;display:flex;align-items:center;}',
    '#global-search{width:200px;padding:.3rem 1.8rem .3rem .6rem;font-size:13px;',
      'border:1px solid #ced4da;border-radius:4px;outline:none;',
      'transition:border-color .15s,width .2s;}',
    '#global-search:focus{border-color:#86b7fe;width:260px;}',
    '#global-search-clear{position:absolute;right:7px;background:none;border:none;',
      'cursor:pointer;color:#adb5bd;font-size:14px;line-height:1;padding:0;display:none;}',
    '#search-results-dropdown{display:none;position:absolute;top:calc(100% + 4px);right:0;',
      'width:380px;background:#fff;border:1px solid #dee2e6;border-radius:6px;',
      'box-shadow:0 4px 14px rgba(0,0,0,.10);z-index:1050;max-height:440px;overflow-y:auto;}',
    '#search-results-dropdown.open{display:block;}',
    '.sr-empty{padding:12px 16px;font-size:13px;color:#57606a;}',
    '.sr-group-label{padding:7px 14px 4px;font-size:11px;font-weight:700;',
      'text-transform:uppercase;letter-spacing:.04em;color:#57606a;',
      'border-top:1px solid #f0f0f0;}',
    '.sr-group-label:first-child{border-top:none;}',
    '.sr-item{display:flex;align-items:flex-start;gap:8px;padding:8px 14px;',
      'font-size:13px;color:#1f2328;cursor:pointer;',
      'border-bottom:1px solid #f7f8fa;transition:background .1s;}',
    '.sr-item:last-child{border-bottom:none;}',
    '.sr-item:hover{background:#f0f5ff;color:#0d6efd;}',
    '.sr-item-badge{font-size:10.5px;padding:2px 6px;border-radius:10px;',
      'font-weight:600;flex-shrink:0;margin-top:1px;}',
    '.sr-item-title{flex:1;min-width:0;}',
    '.sr-snippet{display:block;font-size:11.5px;color:#57606a;margin-top:2px;',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:290px;}',
    'mark.sh{background:#fff3cd;color:inherit;padding:0;border-radius:2px;}',
  ].join('');

  var _styleEl = document.createElement('style');
  _styleEl.textContent = _searchCSS;
  document.head.appendChild(_styleEl);

  // Insert search wrap before the nav-links div inside the navbar
  // Skip injection if the page already has a search bar (e.g. index.html with inline search)
  var _navLinksDiv = document.querySelector('.navbar .ml-auto.navbar-nav');
  if (_navLinksDiv && !document.getElementById('global-search')) {
    var _wrap = document.createElement('div');
    _wrap.id = 'global-search-wrap';
    _wrap.className = 'mr-3';
    _wrap.innerHTML =
      '<input type="text" id="global-search" placeholder="Search pages\u2026" autocomplete="off" aria-label="Search pages"/>' +
      '<button id="global-search-clear" title="Clear">\u2715</button>' +
      '<div id="search-results-dropdown"></div>';
    _navLinksDiv.insertBefore(_wrap, _navLinksDiv.firstChild);
  }

  // ── 2. Content search ─────────────────────────────────────────────────
  var _INDEX      = null;
  var _idxLoaded  = false;
  var _input      = document.getElementById('global-search');
  var _clear      = document.getElementById('global-search-clear');
  var _drop       = document.getElementById('search-results-dropdown');
  var _EXTRA_SEARCH_ENTRIES = [
    {
      label: 'DB2 Must Gather Commands',
      tab: 'tab-db2',
      tabLabel: 'DB2',
      badgeColor: '#7c5cd8',
      badgeBg: '#ede9fb',
      headings: ['DB2 Must Gather Commands', 'Before you run', 'Command purpose', 'Collection commands', 'After collection'],
      body: 'DB2 must gather commands top db2pd -eve db2pd -stack all db2mon db2support database diagnostic collection package',
      db2page: 'db2/db2MustGather.html'
    },
    {
      label: 'General Monitoring',
      tab: 'tab-db2',
      tabLabel: 'DB2',
      badgeColor: '#7c5cd8',
      badgeBg: '#ede9fb',
      headings: ['General Monitoring', 'Capturing Short-Duration CPU Spikes', 'Interpreting a Post-Incident Snapshot', 'Runtime Data Collection Script (AIX)', 'Hang Capture — db2fodc -hang'],
      body: 'Db2 monitoring general high CPU AIX db2pd db2mon db2fodc hang runtime capture EDU latch direct write Topas Instana RUNSTATS REORG',
      db2page: 'db2/db2CpuMonitoring.html'
    },
    {
      label: 'CDC Sizing',
      tab: 'tab-infosphere',
      tabLabel: 'LEGACY',
      badgeColor: '#b45309',
      badgeBg: '#fef3e2',
      headings: ['CDC Sizing', 'Sizing Questions', 'Planning Notes'],
      body: 'InfoSphere Change Data Capture CDC sizing questionnaire source database target database source size tables transactions peak change rate rows per second record size replication type latency initial load transformations subscriptions data growth high availability network bandwidth',
      href: 'InfoSphere/Change Data Capture/cdc-sizing.html'
    },
    {
      label: 'CDC FAQ',
      tab: 'tab-infosphere',
      tabLabel: 'LEGACY',
      badgeColor: '#b45309',
      badgeBg: '#fef3e2',
      headings: ['CDC FAQ', 'Frequently Asked Questions'],
      body: 'InfoSphere Change Data Capture CDC FAQ sizing replication HADR diagnostics day to day operations source target latency subscriptions initial load capture apply network logs',
      href: 'InfoSphere/Change Data Capture/cdc-faq.html'
    },
    {
      label: 'Data Virtualization',
      tab: 'tab-infosphere',
      tabLabel: 'LEGACY',
      badgeColor: '#0f766e',
      badgeBg: '#e6f7f4',
      headings: ['Data Virtualization', 'Architecture Focus', 'Day-to-Day Checks'],
      body: 'Data Virtualization high availability virtualized data access query routing source connectivity metadata continuity coordinator services metadata store source connections workload monitoring recovery checks',
      href: 'InfoSphere/Data Virtualization/dv-overview.html'
    },
    {
      label: 'Product Hub',
      tab: 'tab-infosphere',
      tabLabel: 'LEGACY',
      badgeColor: '#7c2d12',
      badgeBg: '#fff1e8',
      headings: ['Product Hub', 'Availability Focus', 'Operational Checks'],
      body: 'Product Hub product information management PIM high availability workflow continuity repository database file assets search index integration queues operational checks',
      href: 'InfoSphere/Product Hub/ph-overview.html'
    },
    {
      label: 'watsonx.data Lakehouse Sizing',
      tab: 'tab-watsonx',
      tabLabel: 'watsonx.data',
      badgeColor: '#0550ae',
      badgeBg: '#e6f0fb',
      headings: ['watsonx.data Lakehouse Sizing', 'Sizing Questions', 'Planning Notes'],
      body: 'watsonx.data lakehouse sizing data volume annual growth ingestion volume sources datasets tables Presto Spark query rate QPS concurrent users workload query complexity caching acceleration governance Knowledge Catalog high availability multi-node cluster architecture',
      href: 'watsonx.data/wxdata-sizing.html'
    },
    {
      label: 'watsonx.data Integration Sizing',
      tab: 'tab-watsonx',
      tabLabel: 'watsonx.data',
      badgeColor: '#1d4ed8',
      badgeBg: '#eef2fd',
      headings: ['watsonx.data Integration Sizing', 'Generic Platform', 'Bulk and Batch DataStage', 'Real-Time Streaming and StreamSets', 'Data Replication', 'Data Observability', 'Unstructured Data Integration', 'Conversion Ratio Table', 'Planning Notes'],
      body: 'watsonx.data integration sizing deployment model environments air gapped high availability disaster recovery users technologies Oracle SQL Server SAP HANA Kafka S3 Snowflake workload growth ETL ELT DataStage job complexity data volume concurrent jobs batch window StreamSets streaming event rate message size pipelines replication tables initial load change data volume transaction rate observability executions alerts retention unstructured SharePoint OCR chunking embedding conversion ratio table stand alone metric RU VPC DataStage 1 VPC 30 RU Databand observed asset 1 RU StreamSets 1 VPC 20 RU Replication Cartridge 1 VPC 11 RU Unstructured Data 1 VPC 8 RU',
      href: 'watsonx.data Integration/wxi-sizing.html'
    },
    {
      label: 'StreamSets',
      tab: 'tab-watsonx',
      tabLabel: 'watsonx.data',
      badgeColor: '#1d4ed8',
      badgeBg: '#eef2fd',
      headings: ['StreamSets', 'Availability Focus', 'Operational Checks'],
      body: 'watsonx.data Integration StreamSets pipelines control hub execution engines collectors transformers offset storage checkpoint recovery connector resilience',
      href: 'watsonx.data Integration/wxi-streamsets.html'
    },
    {
      label: 'Manta',
      tab: 'tab-watsonx',
      tabLabel: 'watsonx.data',
      badgeColor: '#1d4ed8',
      badgeBg: '#eef2fd',
      headings: ['Manta', 'Availability Focus', 'Operational Checks'],
      body: 'watsonx.data Integration Manta lineage scanners metadata repository catalog synchronization scan jobs source code parsers scheduling recovery',
      href: 'watsonx.data Integration/wxi-manta.html'
    },
    {
      label: 'DataBand',
      tab: 'tab-watsonx',
      tabLabel: 'watsonx.data',
      badgeColor: '#1d4ed8',
      badgeBg: '#eef2fd',
      headings: ['DataBand', 'Availability Focus', 'Operational Checks'],
      body: 'watsonx.data Integration DataBand observability pipelines agents telemetry metadata store alerting SLA monitoring event collection recovery',
      href: 'watsonx.data Integration/wxi-databand.html'
    },
    {
      label: 'Lineage',
      tab: 'tab-watsonx',
      tabLabel: 'watsonx.data',
      badgeColor: '#0369a1',
      badgeBg: '#e6f3fa',
      headings: ['Lineage', 'Availability Focus', 'Operational Checks'],
      body: 'watsonx.data Intelligence Lineage metadata graph impact analysis catalog events capture enrichment repository recovery export snapshots',
      href: 'watsonx.data Intelligence/wxn-lineage.html'
    },
    {
      label: 'watsonx.data Intelligence Sizing',
      tab: 'tab-watsonx',
      tabLabel: 'watsonx.data',
      badgeColor: '#0369a1',
      badgeBg: '#e6f3fa',
      headings: ['watsonx.data Intelligence Sizing', 'Generic Platform', 'Data Lineage', 'Data Governance and Quality', 'Data Product Hub', 'Resource Unit Ratio Table', 'Planning Notes'],
      body: 'watsonx.data intelligence sizing deployment model air gapped region users concurrent data volume growth integrations pipeline size lineage data sources tables custom connectors BI reports ETL tools governance artifacts business glossary data classes enrichment data quality advanced AI semantic enrichment relationship explorer data product hub marketplace datasets user groups access policies resource unit ratio table RU CUH SaaS standard premium on-premises',
      href: 'watsonx.data Intelligence/wxn-sizing.html'
    },
    {
      label: 'Guardium Data Protection Sizing',
      tab: 'tab-guardium',
      tabLabel: 'Guardium',
      badgeColor: '#b91c1c',
      badgeBg: '#fde8e8',
      headings: ['Guardium Data Protection Sizing', 'HLD - Collector Specification', 'Target DB Inventory', 'Requirements for Sizing', 'Reference Links'],
      body: 'IBM Security Guardium Data Protection GDP sizing HLD collector specification virtual appliance VMware ESXi vCPU memory storage network interface DNS hostname static IP subnet gateway NTP target DB inventory operating system kernel database brand version IP DB port DB production development active passive communication DB server collector Windows Linux Unix GIM S-TAP ports 8443 8445 8081 9800 9500 8446 16016 16020 SSH GUI NTP',
      href: 'Guardium/Guardium Data Protection/gdp-sizing.html'
    },
    {
      label: 'Guardium Discover & Classify Sizing',
      tab: 'tab-guardium',
      tabLabel: 'Guardium',
      badgeColor: '#be185d',
      badgeBg: '#fde8f3',
      headings: ['Guardium Discover & Classify Sizing', 'Sizing Questions', 'Planning Notes'],
      body: 'Guardium Discover and Classify sizing data sources scanned databases file systems storage platforms connector requirements total data size tables files datasets sensitive data PII financial health classification rules scan frequency findings reports concurrent users retention annual growth SIEM data catalog high availability',
      href: 'Guardium/Guardium Discover and Classify/gdc-sizing.html'
    },
    {
      label: 'Guardium Cryptography Manager Installation Requirements',
      tab: 'tab-guardium',
      tabLabel: 'Guardium',
      badgeColor: '#6d28d9',
      badgeBg: '#ede9fb',
      headings: ['Guardium Cryptography Manager Installation Requirements', 'Single-Node Cluster Minimum', 'Browser Requirements', 'Resource Requirements', 'Container Image Repository', 'Prerequisite Tools for Helm Chart', 'Firewall Requirements', 'Implementation Notes'],
      body: 'Guardium Cryptography Manager GCM installation requirements single-node cluster minimum POC RHEL 9.4 K3s v1.33 browser Chrome Firefox container image repository icr.io guardium-cryptomgr Helm kubectl YQ CLI prerequisite tools firewall requirements GCM IP QSE VM DevOps server SMTP SIEM ITSM Jira ServiceNow external CA PKI external network scanner cloud provider AWS Azure GCP ports 31443 30443 CBOM code repository OIDC',
      href: 'Guardium/Guardium Crytography Manager/gcm-installation.html'
    },
    {
      label: 'Guardium Cryptography Manager Sizing',
      tab: 'tab-guardium',
      tabLabel: 'Guardium',
      badgeColor: '#6d28d9',
      badgeBg: '#ede9fb',
      headings: ['Guardium Cryptography Manager Sizing', 'Sizing Questionnaire', 'Certificate Lifecycle Detail', 'Resource Unit Metric', 'Product Capability and Ratio Table', 'Planning Notes'],
      body: 'Guardium Cryptography Manager crypto sizing questionnaire CBOM application scan line of code languages Java .NET GoLang Python C++ environments SIT UAT PROD DR servers external certificates internal certificates public CA DigiCert Entrust Sectigo GlobalSign Lets Encrypt private CA Microsoft ADCS EJBCA Venafi root CA intermediate CA CSR generation certificate deployment expiry tracking on-prem cloud TDE database key management resource unit metric RU client-managed software package orderable part number product capability ratio table base certificate lifecycle transparent database encryption Quantum Safe Explorer Quantum Safe Remediator Unique IP Port KMIP applications databases lines of code transactions',
      href: 'Guardium/Guardium Crytography Manager/gcm-sizing.html'
    },
    {
      label: 'EDB PostgreSQL',
      tab: 'tab-oem',
      tabLabel: 'OEM',
      badgeColor: '#4b5563',
      badgeBg: '#f3f4f6',
      headings: ['OEM - EDB PostgreSQL', 'Architecture Focus', 'Day-to-Day Checks', 'Useful Commands', 'Recovery Notes'],
      body: 'OEM EDB PostgreSQL Postgres EnterpriseDB database repository HA streaming replication Patroni WAL archive backups pg_isready pg_stat_replication pg_stat_wal_receiver recovery monitoring replication lag',
      href: 'Guardium/OEM/edb-postgresql.html'
    },
    {
      label: 'EDB PostgreSQL Migration & Sizing',
      tab: 'tab-oem',
      tabLabel: 'OEM',
      badgeColor: '#4b5563',
      badgeBg: '#f3f4f6',
      headings: ['EDB PostgreSQL Migration & Sizing', 'Assessment Contacts', 'Deployment Architecture', 'Environment & Infrastructure', 'Application Workload', 'Database Capacity & Target', 'Schema & Oracle Compatibility', 'ETL & Third-Party Tools', 'Oracle Assessment Queries', 'Planning Notes'],
      body: 'EDB PostgreSQL migration sizing Oracle EPAS Community PostgreSQL assessment application workload OLTP OLAP TPS RTO RPO database size growth connections backup retention infrastructure CPU RAM storage HA DR replication Active Data Guard schemas PL/SQL triggers encryption Spatial ETL drivers JDBC ODBC Oracle assessment queries code objects storage objects constraints LOB tables feature usage',
      href: 'Guardium/OEM/edb-postgresql-sizing.html'
    },
    {
      label: 'MongoDB',
      tab: 'tab-oem',
      tabLabel: 'OEM',
      badgeColor: '#4b5563',
      badgeBg: '#f3f4f6',
      headings: ['OEM - MongoDB', 'Architecture Focus', 'Day-to-Day Checks', 'Useful Commands', 'Recovery Notes'],
      body: 'OEM MongoDB replica set primary secondary election oplog WiredTiger backup mongosh rs.status replication lag serverStatus mongodump recovery monitoring',
      href: 'Guardium/OEM/mongodb.html'
    },
    {
      label: 'MongoDB Sizing',
      tab: 'tab-oem',
      tabLabel: 'OEM',
      badgeColor: '#4b5563',
      badgeBg: '#f3f4f6',
      headings: ['MongoDB Sizing', 'Project Description', 'Quick Workload Sizing', 'Detailed Workload Sizing', 'For Each Collection', 'General Deployment Requirements', 'Planning Notes'],
      body: 'MongoDB intake sizing questionnaire Atlas tier sharding raw data size read write database operations per second workload reads average document size total documents inserts deletes reads updates hot working set indexes WiredTiger compression cloud provider multi-region backups SQL BI auditing KMS LDAP archive purge relevance vector search',
      href: 'Guardium/OEM/mongodb-sizing.html'
    },
    {
      label: 'Optim',
      tab: 'tab-optim',
      tabLabel: 'Optim',
      badgeColor: '#525252',
      badgeBg: '#f3f4f6',
      headings: ['Optim', 'Availability Focus', 'Operational Checks'],
      body: 'IBM Optim archive test data management masking repository high availability archive services metadata scheduler recovery checks',
      href: 'Optim/optim-overview.html'
    },
    {
      label: 'Optim Sizing',
      tab: 'tab-optim',
      tabLabel: 'Optim',
      badgeColor: '#525252',
      badgeBg: '#f3f4f6',
      headings: ['Optim Sizing', 'Sizing Questions', 'Planning Notes'],
      body: 'IBM Optim sizing source databases production database size tables archiving masking archive size concurrent jobs operations annual data growth management console users retention archive database storage test data management high availability active passive',
      href: 'Optim/optim-sizing.html'
    },
    {
      label: 'Master Data Management',
      tab: 'tab-mdm',
      tabLabel: 'Master Data Management',
      badgeColor: '#0f766e',
      badgeBg: '#e6f7f4',
      headings: ['Master Data Management', 'Architecture Focus', 'Trade-Up to IBM MDM', 'Target IBM MDM Capabilities', 'Daily Checks'],
      body: 'Master Data Management MDM matching services stewardship workflow repository database event queues search index high availability disaster recovery trade-up next evolution modern MDM scalable performant architecture foundation modern AI InfoSphere BigMatch Global Name Management MDM Standard Edition MDM Advanced Edition Identity Insight Hadoop healthcare HIE IAA IFW Industry Models NORA multi-domain AI ML augmented cloud native no low code interconnected multi-style',
      href: 'Master Data Management/mdm-overview.html'
    },
    {
      label: 'Master Data Management Sizing',
      tab: 'tab-mdm',
      tabLabel: 'Master Data Management',
      badgeColor: '#0f766e',
      badgeBg: '#e6f7f4',
      headings: ['Master Data Management Sizing', 'Environment Inputs', 'Data Nature and Volume', 'Bulk Operations', 'Runtime Workload Inputs', 'Planning Notes'],
      body: 'IBM MDM CP4D sizing Customer Request From ClusterType VirtualMachine WKC Common DB Services Aspera profiling mdm-publisher Person Org Contract match required record count attributes entity types persisted entity record ratio history relationships bulk load derive match sync peak runtime TPS GET_Record GET_Entity HistoricalGET search probabilistic add update delete target utilization CPUs',
      href: 'Master Data Management/mdm-sizing.html'
    }
  ];

  function _mergeExtraSearchEntries(index) {
    if (!index) index = [];
    index.forEach(function (item) {
      if (!item) return;
      if (item.tab === 'tab-infosphere' || item.tabLabel === 'InfoSphere') item.tabLabel = 'LEGACY';
      if (item.label === 'Knowledge Catalog HA') item.label = 'Knowledge Catalog';
    });
    var legacyDb2Pages = ['db2/db2Snapshot.html', 'db2/mustGatherHighCpu.html'];
    for (var i = index.length - 1; i >= 0; i--) {
      var item = index[i] || {};
      if (legacyDb2Pages.indexOf(item.db2page) >= 0 ||
          legacyDb2Pages.indexOf(item.href) >= 0 ||
          item.label === 'DB2 Snapshot Command') {
        index.splice(i, 1);
      }
    }
    _EXTRA_SEARCH_ENTRIES.forEach(function (entry) {
      var exists = index.some(function (item) {
        return item.db2page === entry.db2page || item.href === entry.db2page || item.label === entry.label;
      });
      if (!exists) index.push(entry);
    });
    return index;
  }

  if (window.__SEARCH_INDEX) window.__SEARCH_INDEX = _mergeExtraSearchEntries(window.__SEARCH_INDEX);

  function _buildSidebarIndex() {
    // Fallback: build a minimal index from sidebar links on the current page
    var entries = [];
    document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(function (a) {
      var label = a.textContent.trim();
      var href  = a.getAttribute('href') || '';
      if (!href || href === '#') return;
      // Derive tabLabel from section
      var section = a.closest('.sidebar-section-items');
      var sectionId = section ? section.id : '';
      var tabLabel = 'General';
      var badgeColor = '#374151'; var badgeBg = '#f3f4f6';
      if (sectionId.indexOf('db2') >= 0)       { tabLabel = 'DB2';                    badgeColor = '#6d28d9'; badgeBg = '#ede9fb'; }
      else if (sectionId.indexOf('ds') >= 0)   { tabLabel = 'LEGACY';                 badgeColor = '#0f7b5e'; badgeBg = '#e6f4ee'; }
      else if (sectionId.indexOf('wx') >= 0)   { tabLabel = 'watsonx.data';           badgeColor = '#0550ae'; badgeBg = '#e6f0fb'; }
      else if (sectionId.indexOf('gdp') >= 0)  { tabLabel = 'Guardium';               badgeColor = '#b91c1c'; badgeBg = '#fde8e8'; }
      else if (sectionId.indexOf('optim') >= 0){ tabLabel = 'Optim';                  badgeColor = '#525252'; badgeBg = '#f3f4f6'; }
      else if (sectionId.indexOf('mdm') >= 0)  { tabLabel = 'Master Data Management'; badgeColor = '#0f766e'; badgeBg = '#e6f7f4'; }
      entries.push({ label: label, headings: [], body: label, tabLabel: tabLabel,
                     badgeColor: badgeColor, badgeBg: badgeBg, href: href, tab: sectionId });
    });
    return entries;
  }

  function _ensureIndex(cb) {
    if (_idxLoaded) { cb(); return; }
    // Use inline index if available (injected by build script, works on file://)
    if (window.__SEARCH_INDEX) {
      _INDEX = _mergeExtraSearchEntries(window.__SEARCH_INDEX); _idxLoaded = true; cb(); return;
    }
    if (_drop) { _drop.innerHTML = '<div class="sr-empty">Loading\u2026</div>'; _drop.classList.add('open'); }
    fetch(ROOT + 'search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { _INDEX = _mergeExtraSearchEntries(data); _idxLoaded = true; cb(); })
      .catch(function () {
        // fetch failed (e.g. file:// protocol) — fall back to sidebar links
        _INDEX = _mergeExtraSearchEntries(_buildSidebarIndex());
        _idxLoaded = true;
        cb();
      });
  }

  function _esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function _hl(text, re) { return text.replace(re, '<mark class="sh">$&</mark>'); }

  function _snippet(body, re) {
    re.lastIndex = 0;
    var m = re.exec(body);
    if (!m) return '';
    var s = Math.max(0, m.index - 50);
    var e = Math.min(body.length, m.index + 80);
    var t = (s > 0 ? '\u2026' : '') + body.slice(s, e) + (e < body.length ? '\u2026' : '');
    re.lastIndex = 0;
    return _hl(t, re);
  }

  function _score(entry, lq) {
    var s = 0;
    if (entry.label.toLowerCase().startsWith(lq))       s += 100;
    else if (entry.label.toLowerCase().indexOf(lq) >= 0) s += 60;
    entry.headings.forEach(function (h) { if (h.toLowerCase().indexOf(lq) >= 0) s += 30; });
    var bm = (entry.body.toLowerCase().match(new RegExp(_esc(lq), 'g')) || []).length;
    s += Math.min(bm, 10) * 3;
    return s;
  }

  function _resolveHref(entry) {
    // entry.href is relative to architecture/ root — make it relative to current page
    if (entry.href) return ROOT + entry.href;
    return null;
  }

  function _renderResults(q) {
    if (!q || !_drop) { if (_drop) { _drop.classList.remove('open'); _drop.innerHTML = ''; } return; }
    if (!_INDEX) return;
    var lq  = q.toLowerCase();
    var re  = new RegExp(_esc(q), 'gi');

    var matched = _INDEX.filter(function (e) {
      return e.label.toLowerCase().indexOf(lq) >= 0 ||
             e.headings.some(function (h) { return h.toLowerCase().indexOf(lq) >= 0; }) ||
             e.body.toLowerCase().indexOf(lq) >= 0;
    });

    if (!matched.length) {
      _drop.innerHTML = '<div class="sr-empty">No results for \u201c' + q + '\u201d</div>';
      _drop.classList.add('open');
      return;
    }

    matched.sort(function (a, b) { return _score(b, lq) - _score(a, lq); });

    var groupOrder = [], groups = {};
    matched.forEach(function (e) {
      if (!groups[e.tabLabel]) { groups[e.tabLabel] = []; groupOrder.push(e.tabLabel); }
      groups[e.tabLabel].push(e);
    });

    var html = '';
    groupOrder.forEach(function (grp) {
      html += '<div class="sr-group-label">' + grp + '</div>';
      groups[grp].forEach(function (e) {
        re.lastIndex = 0;
        var snip = _snippet(e.body, new RegExp(_esc(q), 'gi'));
        if (!snip) {
          var mh = e.headings.find(function (h) { return h.toLowerCase().indexOf(lq) >= 0; });
          if (mh) { re.lastIndex = 0; snip = _hl(mh, new RegExp(_esc(q), 'gi')); }
        }
        var hrefAttr   = _resolveHref(e) ? ' data-href="' + _resolveHref(e) + '"' : '';
        var db2Attr    = e.db2page        ? ' data-db2page="' + e.db2page + '"'     : '';
        var tabAttr    = ' data-tab="' + e.tab + '"';
        re.lastIndex   = 0;
        html += '<div class="sr-item"' + tabAttr + db2Attr + hrefAttr + '>'
              + '<span class="sr-item-badge" style="color:' + e.badgeColor + ';background:' + e.badgeBg + ';">' + e.tabLabel + '</span>'
              + '<span class="sr-item-title">'
              +   '<span>' + _hl(e.label, new RegExp(_esc(q), 'gi')) + '</span>'
              +   (snip ? '<span class="sr-snippet">' + snip + '</span>' : '')
              + '</span>'
              + '</div>';
      });
    });
    _drop.innerHTML = html;
    _drop.classList.add('open');

    _drop.querySelectorAll('.sr-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var db2page = item.getAttribute('data-db2page');
        var href    = item.getAttribute('data-href');
        // Close search first
        if (_input) _input.value = '';
        if (_clear)  _clear.style.display = 'none';
        if (_drop)  { _drop.classList.remove('open'); _drop.innerHTML = ''; }

        if (db2page && typeof switchTab === 'function' && typeof db2LoadPage === 'function') {
          // We're on the SPA index page — use in-page navigation
          switchTab('tab-db2');
          var sideLink = document.querySelector('.db2-nav-link[data-db2page="' + db2page + '"]');
          db2LoadPage(db2page, sideLink);
        } else if (db2page) {
          // DB2 pages are standalone, so open the matched page directly.
          window.location.href = ROOT + db2page;
        } else if (href) {
          window.location.href = href;
        }
      });
    });
  }

  function _closeSearch() {
    if (_input) _input.value = '';
    if (_clear)  _clear.style.display = 'none';
    if (_drop)  { _drop.classList.remove('open'); _drop.innerHTML = ''; }
  }

  if (_input) {
    _input.addEventListener('focus', function () {
      _ensureIndex(function () { if (_input.value.trim()) _renderResults(_input.value.trim()); });
    });
    _input.addEventListener('input', function () {
      var q = _input.value.trim();
      if (_clear) _clear.style.display = q ? 'block' : 'none';
      if (!_idxLoaded) { _ensureIndex(function () { _renderResults(q); }); return; }
      _renderResults(q);
    });
  }
  if (_clear) { _clear.addEventListener('click', function () { _closeSearch(); if (_input) _input.focus(); }); }

  document.addEventListener('click', function (e) {
    var wrap = document.getElementById('global-search-wrap');
    if (wrap && !wrap.contains(e.target) && _drop) _drop.classList.remove('open');
  });

  // ── 3. Group DB2 sidebar links into categories ───────────────────────
  function _categorizeDb2Sidebar() {
    var section = document.getElementById('section-db2');
    if (!section || section.getAttribute('data-db2-categorized') === 'true') return;

    var directLinks = Array.from(section.children).filter(function (node) {
      return node.tagName === 'A' && node.classList.contains('list-group-item');
    });
    if (!directLinks.length) return;

    var byFile = {};
    directLinks.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var file = href.split('#')[0].split('?')[0].split('/').pop();
      if (file) byFile[file] = link;
    });

    var knownDb2Pages = {
      'db2MustGather.html': 'DB2 Must Gather Commands'
    };
    Object.keys(knownDb2Pages).forEach(function (file) {
      if (byFile[file]) return;
      var link = document.createElement('a');
      link.className = 'list-group-item list-group-item-action bg-light';
      link.href = ROOT + 'db2/' + file;
      link.textContent = knownDb2Pages[file];
      byFile[file] = link;
    });

    var categories = [
      {
        id: 'db2-start',
        label: 'Overview',
        files: ['index.html', 'sizing.html', 'hadrBenefits.html', 'featureHistory.html']
      },
      {
        id: 'db2-architecture',
        label: 'Architecture',
        files: ['hadrSyncMode.html', 'hadrLogShipping.html', 'clientReroute.html', 'clusterManagers.html', 'hadrPureScale.html', 'tcpTuning.html']
      },
      {
        id: 'db2-hadr',
        label: 'HADR',
        files: ['hadrPerf.html', 'hadrTakeover.html', 'hadrCommands.html', 'hadrMonitoring.html', 'hadrSimulator.html', 'simulatorOptions.html', 'simulatorOutput.html', 'simulatorParams.html']
      },
      {
        id: 'db2-diag',
        label: 'Operations',
        files: ['diagConnect.html', 'db2diag.html', 'db2MustGather.html', 'db2logscan.html', 'db2fmtlog.html', 'perfTuning.html']
      },
      {
        id: 'db2-installation',
        label: 'Installation',
        files: ['hadrTutorial.html', 'hadrConfig.html']
      },
      {
        id: 'db2-faq',
        label: 'FAQ',
        files: ['faq.html']
      }
    ];

    section.innerHTML = '';
    section.setAttribute('data-db2-categorized', 'true');

    categories.forEach(function (category) {
      var pages = document.createElement('div');
      pages.className = 'snav-product-pages collapsed';
      pages.id = 'snav-' + category.id;

      category.files.forEach(function (file) {
        if (byFile[file]) pages.appendChild(byFile[file]);
      });
      if (!pages.children.length) pages.appendChild(_createSidebarPlaceholder());

      var row = document.createElement('div');
      row.className = 'snav-product-row';
      row.setAttribute('data-snav', category.id);
      row.appendChild(document.createTextNode(category.label + ' '));

      var chevron = document.createElement('span');
      chevron.className = 'snav-chevron';
      chevron.innerHTML = '&#9656;';
      row.appendChild(chevron);

      section.appendChild(row);
      section.appendChild(pages);
    });
  }

  // ── 4. Group LEGACY product links into nested categories ─────────────
  function _createChevron() {
    var chevron = document.createElement('span');
    chevron.className = 'snav-chevron';
    chevron.innerHTML = '&#9656;';
    return chevron;
  }

  function _createSidebarLink(href, label) {
    var link = document.createElement('a');
    link.className = 'list-group-item list-group-item-action bg-light';
    link.href = href;
    link.textContent = label;
    return link;
  }

  function _createSidebarPlaceholder() {
    var placeholder = document.createElement('span');
    placeholder.className = 'list-group-item bg-light snav-wip';
    placeholder.textContent = 'Work in progress';
    return placeholder;
  }

  function _groupSidebarCategories(container, categories, nested) {
    if (!container) return;

    var byFile = {};
    Array.from(container.querySelectorAll('a.list-group-item')).forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var file = href.split('#')[0].split('?')[0].split('/').pop();
      if (file && !byFile[file]) byFile[file] = link;
    });

    container.innerHTML = '';
    categories.forEach(function (category) {
      var pages = document.createElement('div');
      pages.className = nested ? 'snav-category-pages collapsed' : 'snav-product-pages collapsed';
      pages.id = 'snav-' + category.id;

      category.files.forEach(function (file, index) {
        if (!byFile[file]) return;
        if (category.label === 'Overview' && index === 0) byFile[file].textContent = 'Overview';
        pages.appendChild(byFile[file]);
      });
      (category.links || []).forEach(function (link) {
        pages.appendChild(_createSidebarLink(link.href, link.label));
      });
      if (!pages.children.length) pages.appendChild(_createSidebarPlaceholder());

      var row = document.createElement('div');
      row.className = nested ? 'snav-category-row' : 'snav-product-row';
      row.setAttribute(nested ? 'data-snav-category' : 'data-snav', category.id);
      row.appendChild(document.createTextNode(category.label + ' '));
      row.appendChild(_createChevron());

      container.appendChild(row);
      container.appendChild(pages);
    });
  }

  function _categorizeGeneralSidebar() {
    var section = document.getElementById('section-general');
    if (!section || section.getAttribute('data-general-categorized') === 'true') return;

    // Directly set the three link labels without grouping into sub-categories
    var links = Array.from(section.querySelectorAll('a.list-group-item'));
    var labelMap = {
      'general-principles.html': 'Deployment Principles',
      'general-licensing.html':  'IBM Licensing Guide',
      'general-severity.html':   'IBM Severity Guide'
    };
    links.forEach(function (link) {
      var file = (link.getAttribute('href') || '').split('#')[0].split('?')[0].split('/').pop();
      if (labelMap[file]) link.textContent = labelMap[file];
    });
    section.setAttribute('data-general-categorized', 'true');
  }

  function _categorizeInfosphereSidebar() {
    var section = document.getElementById('section-ds');
    var sectionLabel = document.querySelector('.sidebar-section-label[data-section="ds"]');
    if (sectionLabel && sectionLabel.childNodes.length) sectionLabel.childNodes[0].nodeValue = 'LEGACY ';
    if (!section) return;

    var products = [
      {
        nav: 'ds-datastage',
        label: 'DataStage',
        categories: [
          { id: 'ds-overview', label: 'Overview', files: ['ds-overview.html'] },
          { id: 'ds-architecture', label: 'Architecture', files: ['ds-topology.html', 'ds-engine.html', 'ds-repo.html'] },
          { id: 'ds-deployment', label: 'Deployment', files: ['ds-checklist.html', 'ds-sizing.html'] },
          { id: 'ds-operations', label: 'Operations', files: ['ds-monitoring.html', 'ds-recovery.html'] },
          { id: 'ds-faq', label: 'FAQ', files: ['ds-faq.html'] }
        ]
      },
      {
        nav: 'ds-cdc',
        label: 'CDC',
        categories: [
          { id: 'cdc-overview', label: 'Overview', files: ['cdc-overview.html', 'cdc-sizing.html'] },
          { id: 'cdc-architecture', label: 'Architecture', files: [] },
          { id: 'cdc-hadr', label: 'HADR', files: [] },
          { id: 'cdc-diagnostics', label: 'Operations', files: [] },
          { id: 'cdc-installation', label: 'Installation', files: [] },
          { id: 'cdc-faq', label: 'FAQ', files: [] }
        ]
      },
      {
        nav: 'ds-dv',
        label: 'Data Virtualization',
        categories: [
          { id: 'dv-overview', label: 'Overview', files: ['dv-overview.html'] },
          { id: 'dv-architecture', label: 'Architecture', files: [] },
          { id: 'dv-hadr', label: 'HADR', files: [] },
          { id: 'dv-diagnostics', label: 'Operations', files: [] },
          { id: 'dv-installation', label: 'Installation', files: [] },
          { id: 'dv-faq', label: 'FAQ', files: [] }
        ]
      },
      {
        nav: 'ds-producthub',
        label: 'Product Hub',
        categories: [
          { id: 'ph-overview', label: 'Overview', files: ['ph-overview.html'] },
          { id: 'ph-architecture', label: 'Architecture', files: [] },
          { id: 'ph-hadr', label: 'HADR', files: [] },
          { id: 'ph-diagnostics', label: 'Operations', files: [] },
          { id: 'ph-installation', label: 'Installation', files: [] },
          { id: 'ph-faq', label: 'FAQ', files: [] }
        ]
      }
    ];

    var knownProductPages = {
      'ds-datastage': {
        'ds-overview.html': {
          label: 'Overview',
          href: ROOT + 'InfoSphere/DataStage/ds-overview.html'
        },
        'ds-topology.html': {
          label: 'Architecture',
          href: ROOT + 'InfoSphere/DataStage/ds-topology.html'
        },
        'ds-engine.html': {
          label: 'Topology and Engine Patterns',
          href: ROOT + 'InfoSphere/DataStage/ds-engine.html'
        },
        'ds-repo.html': {
          label: 'HA / DR Architecture',
          href: ROOT + 'InfoSphere/DataStage/ds-repo.html'
        },
        'ds-checklist.html': {
          label: 'Deployment and Lifecycle',
          href: ROOT + 'InfoSphere/DataStage/ds-checklist.html'
        },
        'ds-sizing.html': {
          label: 'Sizing',
          href: ROOT + 'InfoSphere/DataStage/ds-sizing.html'
        },
        'ds-monitoring.html': {
          label: 'Day-to-Day Operations',
          href: ROOT + 'InfoSphere/DataStage/ds-monitoring.html'
        },
        'ds-recovery.html': {
          label: 'Backup and HA / DR Operations',
          href: ROOT + 'InfoSphere/DataStage/ds-recovery.html'
        },
        'ds-faq.html': {
          label: 'FAQ and Quick Reference',
          href: ROOT + 'InfoSphere/DataStage/ds-faq.html'
        }
      },
      'ds-cdc': {
        'cdc-overview.html': {
          label: 'Overview',
          href: ROOT + 'InfoSphere/Change Data Capture/cdc-overview.html'
        },
        'cdc-sizing.html': {
          label: 'Sizing',
          href: ROOT + 'InfoSphere/Change Data Capture/cdc-sizing.html'
        },
        'cdc-faq.html': {
          label: 'FAQ',
          href: ROOT + 'InfoSphere/Change Data Capture/cdc-faq.html'
        }
      },
      'ds-dv': {
        'dv-overview.html': {
          label: 'Overview',
          href: ROOT + 'InfoSphere/Data Virtualization/dv-overview.html'
        }
      },
      'ds-producthub': {
        'ph-overview.html': {
          label: 'Overview',
          href: ROOT + 'InfoSphere/Product Hub/ph-overview.html'
        }
      }
    };

    products.forEach(function (product) {
      var row = section.querySelector('.snav-product-row[data-snav="' + product.nav + '"]');
      var productPages;

      if (!row) {
        row = document.createElement('div');
        row.className = 'snav-product-row';
        row.setAttribute('data-snav', product.nav);
        row.appendChild(document.createTextNode(product.label + ' '));
        row.appendChild(_createChevron());

        productPages = document.createElement('div');
        productPages.className = 'snav-product-pages collapsed';
        productPages.id = 'snav-' + product.nav;

        section.appendChild(row);
        section.appendChild(productPages);
      } else {
        productPages = row.nextElementSibling;
      }

      if (!productPages || !productPages.classList.contains('snav-product-pages')) return;
      var directLinks = Array.from(productPages.querySelectorAll('a.list-group-item'));

      var byFile = {};
      directLinks.forEach(function (link) {
        var href = link.getAttribute('href') || '';
        var file = href.split('#')[0].split('?')[0].split('/').pop();
        if (file) byFile[file] = link;
      });

      var knownPages = knownProductPages[product.nav] || {};
      Object.keys(knownPages).forEach(function (file) {
        if (byFile[file]) {
          byFile[file].textContent = knownPages[file].label;
          return;
        }
        byFile[file] = _createSidebarLink(knownPages[file].href, knownPages[file].label);
        productPages.appendChild(byFile[file]);
      });

      productPages.setAttribute('data-product-categorized', 'true');
      _groupSidebarCategories(productPages, product.categories, true);
    });

    section.setAttribute('data-infosphere-categorized', 'true');
  }

  function _appendLinkIfMissing(pages, file, href, label) {
    if (!pages) return;
    var existing = Array.from(pages.querySelectorAll('a.list-group-item')).find(function (link) {
      var current = (link.getAttribute('href') || '').split('#')[0].split('?')[0].split('/').pop();
      return current === file;
    });
    if (existing) {
      existing.textContent = label;
      return;
    }
    pages.appendChild(_createSidebarLink(href, label));
  }

  function _ensureProductPages(section, nav, label) {
    var row = section.querySelector('.snav-product-row[data-snav="' + nav + '"]');
    if (row && row.nextElementSibling && row.nextElementSibling.classList.contains('snav-product-pages')) return row.nextElementSibling;

    row = document.createElement('div');
    row.className = 'snav-product-row';
    row.setAttribute('data-snav', nav);
    row.appendChild(document.createTextNode(label + ' '));
    row.appendChild(_createChevron());

    var pages = document.createElement('div');
    pages.className = 'snav-product-pages collapsed';
    pages.id = 'snav-' + nav;

    section.appendChild(row);
    section.appendChild(pages);
    return pages;
  }

  function _augmentWatsonxSidebar() {
    var section = document.getElementById('section-wx');
    if (!section || section.getAttribute('data-watsonx-augmented') === 'true') return;

    var lakehousePages = _ensureProductPages(section, 'wx-lakehouse', 'Lakehouse');
    _appendLinkIfMissing(lakehousePages, 'wxdata-overview.html', ROOT + 'watsonx.data/wxdata-overview.html', 'Overview');
    _appendLinkIfMissing(lakehousePages, 'wxdata-sizing.html', ROOT + 'watsonx.data/wxdata-sizing.html', 'Sizing');
    _groupSidebarCategories(lakehousePages, [
      { id: 'wx-lakehouse-overview', label: 'Overview', files: ['wxdata-overview.html', 'wxdata-sizing.html'] },
      { id: 'wx-lakehouse-architecture', label: 'Architecture', files: [] },
      { id: 'wx-lakehouse-hadr', label: 'HADR', files: [] },
      { id: 'wx-lakehouse-diagnostics', label: 'Operations', files: [] },
      { id: 'wx-lakehouse-installation', label: 'Installation', files: [] },
      { id: 'wx-lakehouse-faq', label: 'FAQ', files: [] }
    ], true);

    var integrationPages = _ensureProductPages(section, 'wx-integration', 'Integration');
    _appendLinkIfMissing(integrationPages, 'wxi-overview.html', ROOT + 'watsonx.data Integration/wxi-overview.html', 'Overview');
    _appendLinkIfMissing(integrationPages, 'wxi-sizing.html', ROOT + 'watsonx.data Integration/wxi-sizing.html', 'Sizing');
    _appendLinkIfMissing(integrationPages, 'wxi-streamsets.html', ROOT + 'watsonx.data Integration/wxi-streamsets.html', 'StreamSets');
    _appendLinkIfMissing(integrationPages, 'wxi-manta.html', ROOT + 'watsonx.data Integration/wxi-manta.html', 'Manta');
    _appendLinkIfMissing(integrationPages, 'wxi-databand.html', ROOT + 'watsonx.data Integration/wxi-databand.html', 'DataBand');
    _groupSidebarCategories(integrationPages, [
      { id: 'wx-integration-overview', label: 'Overview', files: ['wxi-overview.html', 'wxi-sizing.html', 'wxi-streamsets.html', 'wxi-manta.html', 'wxi-databand.html'] },
      { id: 'wx-integration-architecture', label: 'Architecture', files: [] },
      { id: 'wx-integration-hadr', label: 'HADR', files: [] },
      { id: 'wx-integration-diagnostics', label: 'Operations', files: [] },
      { id: 'wx-integration-installation', label: 'Installation', files: [] },
      { id: 'wx-integration-faq', label: 'FAQ', files: [] }
    ], true);

    var intelligencePages = _ensureProductPages(section, 'wx-intelligence', 'Intelligence');
    _appendLinkIfMissing(intelligencePages, 'wxn-overview.html', ROOT + 'watsonx.data Intelligence/wxn-overview.html', 'Overview');
    _appendLinkIfMissing(intelligencePages, 'wxn-sizing.html', ROOT + 'watsonx.data Intelligence/wxn-sizing.html', 'Sizing');
    _appendLinkIfMissing(intelligencePages, 'wxn-catalog.html', ROOT + 'watsonx.data Intelligence/wxn-catalog.html', 'Knowledge Catalog');
    _appendLinkIfMissing(intelligencePages, 'wxn-lineage.html', ROOT + 'watsonx.data Intelligence/wxn-lineage.html', 'Lineage');
    _groupSidebarCategories(intelligencePages, [
      { id: 'wx-intelligence-overview', label: 'Overview', files: ['wxn-overview.html', 'wxn-sizing.html', 'wxn-catalog.html', 'wxn-lineage.html'] },
      { id: 'wx-intelligence-architecture', label: 'Architecture', files: [] },
      { id: 'wx-intelligence-hadr', label: 'HADR', files: [] },
      { id: 'wx-intelligence-diagnostics', label: 'Operations', files: [] },
      { id: 'wx-intelligence-installation', label: 'Installation', files: [] },
      { id: 'wx-intelligence-faq', label: 'FAQ', files: [] }
    ], true);

    section.setAttribute('data-watsonx-augmented', 'true');
  }

  function _augmentGuardiumSidebar() {
    var section = document.getElementById('section-gdp');
    if (!section || section.getAttribute('data-guardium-augmented') === 'true') return;

    var dataProtectionPages = _ensureProductPages(section, 'gdp-dp', 'Data Protection');
    _appendLinkIfMissing(dataProtectionPages, 'gdp-overview.html', ROOT + 'Guardium/Guardium Data Protection/gdp-overview.html', 'Overview');
    _appendLinkIfMissing(dataProtectionPages, 'gdp-sizing.html', ROOT + 'Guardium/Guardium Data Protection/gdp-sizing.html', 'Sizing');
    _groupSidebarCategories(dataProtectionPages, [
      { id: 'gdp-dp-overview', label: 'Overview', files: ['gdp-overview.html', 'gdp-sizing.html'] },
      { id: 'gdp-dp-architecture', label: 'Architecture', files: [] },
      { id: 'gdp-dp-hadr', label: 'HADR', files: [] },
      { id: 'gdp-dp-diagnostics', label: 'Operations', files: [] },
      { id: 'gdp-dp-installation', label: 'Installation', files: [] },
      { id: 'gdp-dp-faq', label: 'FAQ', files: [] }
    ], true);

    var discoverPages = _ensureProductPages(section, 'gdp-dc', 'Discover & Classify');
    _appendLinkIfMissing(discoverPages, 'gdc-overview.html', ROOT + 'Guardium/Guardium Discover and Classify/gdc-overview.html', 'Overview');
    _appendLinkIfMissing(discoverPages, 'gdc-sizing.html', ROOT + 'Guardium/Guardium Discover and Classify/gdc-sizing.html', 'Sizing');
    _groupSidebarCategories(discoverPages, [
      { id: 'gdp-dc-overview', label: 'Overview', files: ['gdc-overview.html', 'gdc-sizing.html'] },
      { id: 'gdp-dc-architecture', label: 'Architecture', files: [] },
      { id: 'gdp-dc-hadr', label: 'HADR', files: [] },
      { id: 'gdp-dc-diagnostics', label: 'Operations', files: [] },
      { id: 'gdp-dc-installation', label: 'Installation', files: [] },
      { id: 'gdp-dc-faq', label: 'FAQ', files: [] }
    ], true);

    var cryptoPages = _ensureProductPages(section, 'gdp-cm', 'Cryptography Manager');
    _appendLinkIfMissing(cryptoPages, 'gcm-overview.html', ROOT + 'Guardium/Guardium Crytography Manager/gcm-overview.html', 'Overview');
    _appendLinkIfMissing(cryptoPages, 'gcm-installation.html', ROOT + 'Guardium/Guardium Crytography Manager/gcm-installation.html', 'Installation Requirements');
    _appendLinkIfMissing(cryptoPages, 'gcm-sizing.html', ROOT + 'Guardium/Guardium Crytography Manager/gcm-sizing.html', 'Sizing');
    _groupSidebarCategories(cryptoPages, [
      { id: 'gdp-cm-overview', label: 'Overview', files: ['gcm-overview.html', 'gcm-sizing.html'] },
      { id: 'gdp-cm-architecture', label: 'Architecture', files: [] },
      { id: 'gdp-cm-hadr', label: 'HADR', files: [] },
      { id: 'gdp-cm-diagnostics', label: 'Operations', files: [] },
      { id: 'gdp-cm-installation', label: 'Installation', files: ['gcm-installation.html'] },
      { id: 'gdp-cm-faq', label: 'FAQ', files: [] }
    ], true);

    section.setAttribute('data-guardium-augmented', 'true');
  }

  function _ensureTopLevelSection(sectionId, dataSection, label, href, linkLabel) {
    var list = document.querySelector('#sidebar-wrapper .list-group');
    if (!list || document.getElementById(sectionId)) return;

    var labelNode = document.createElement('div');
    labelNode.className = 'sidebar-section-label collapsed';
    labelNode.setAttribute('data-section', dataSection);
    labelNode.appendChild(document.createTextNode(label + ' '));

    var chevron = document.createElement('span');
    chevron.className = 'chevron';
    chevron.innerHTML = '&#9660;';
    labelNode.appendChild(chevron);

    var items = document.createElement('div');
    items.className = 'sidebar-section-items collapsed';
    items.id = sectionId;
    items.appendChild(_createSidebarLink(href, linkLabel));

    list.appendChild(labelNode);
    list.appendChild(items);
  }

  function _ensureGlossarySidebarSection() {
    _ensureTopLevelSection(
      'section-glossary',
      'glossary',
      'Glossary',
      ROOT + 'index.html#glossary-abreviation',
      'Abreviation'
    );

    var section = document.getElementById('section-glossary');
    if (!section || section.getAttribute('data-glossary-built') === 'true') return;

    var glossaryItems = [
      { pane: 'glossary-abreviation', label: 'Abreviation' },
      { pane: 'glossary-data', label: 'Data' },
      { pane: 'glossary-ai', label: 'Artificial Intelligence' },
      { pane: 'glossary-governance', label: 'Governance' },
      { pane: 'glossary-infrastructure', label: 'Infrastructure' },
      { pane: 'glossary-others', label: 'Others' }
    ];

    section.innerHTML = '';
    glossaryItems.forEach(function (item) {
      var link = _createSidebarLink(ROOT + 'index.html#' + item.pane, item.label);
      link.setAttribute('data-glossary-pane', item.pane);
      link.addEventListener('click', function (event) {
        if (!document.getElementById('tab-glossary') ||
            typeof switchTab !== 'function' ||
            typeof switchGlossaryPane !== 'function') return;
        event.preventDefault();
        switchTab('tab-glossary');
        switchGlossaryPane(item.pane, true);
      });
      section.appendChild(link);
    });
    section.setAttribute('data-glossary-built', 'true');
  }

  function _augmentTopLevelSidebar() {
    _ensureTopLevelSection('section-optim', 'optim', 'Optim', ROOT + 'Optim/optim-overview.html', 'Overview');
    var optimPages = document.getElementById('section-optim');
    _appendLinkIfMissing(optimPages, 'optim-overview.html', ROOT + 'Optim/optim-overview.html', 'Overview');
    _appendLinkIfMissing(optimPages, 'optim-sizing.html', ROOT + 'Optim/optim-sizing.html', 'Sizing');
    _groupSidebarCategories(optimPages, [
      { id: 'optim-overview', label: 'Overview', files: ['optim-overview.html', 'optim-sizing.html'] },
      { id: 'optim-architecture', label: 'Architecture', files: [] },
      { id: 'optim-hadr', label: 'HADR', files: [] },
      { id: 'optim-diagnostics', label: 'Operations', files: [] },
      { id: 'optim-installation', label: 'Installation', files: [] },
      { id: 'optim-faq', label: 'FAQ', files: [] }
    ], false);

    _ensureTopLevelSection('section-mdm', 'mdm', 'MDM', ROOT + 'Master Data Management/mdm-overview.html', 'Overview');
    var mdmPages = document.getElementById('section-mdm');
    _appendLinkIfMissing(mdmPages, 'mdm-overview.html', ROOT + 'Master Data Management/mdm-overview.html', 'Overview');
    _appendLinkIfMissing(mdmPages, 'mdm-sizing.html', ROOT + 'Master Data Management/mdm-sizing.html', 'Sizing');
    _groupSidebarCategories(mdmPages, [
      { id: 'mdm-overview', label: 'Overview', files: ['mdm-overview.html', 'mdm-sizing.html'] },
      { id: 'mdm-architecture', label: 'Architecture', files: [] },
      { id: 'mdm-hadr', label: 'HADR', files: [] },
      { id: 'mdm-diagnostics', label: 'Operations', files: [] },
      { id: 'mdm-installation', label: 'Installation', files: [] },
      { id: 'mdm-faq', label: 'FAQ', files: [] }
    ], false);

    _ensureTopLevelSection('section-oem', 'oem', 'OEM', ROOT + 'Guardium/OEM/edb-postgresql.html', 'EDB PostgreSQL');
  }

  function _normalizeOemSidebar() {
    var section = document.getElementById('section-oem');
    if (!section) return;

    section.innerHTML = '';

    var edbPages = _ensureProductPages(section, 'oem-edb', 'EDB PostgreSQL');
    _appendLinkIfMissing(edbPages, 'edb-postgresql.html', ROOT + 'Guardium/OEM/edb-postgresql.html', 'Overview');
    _appendLinkIfMissing(edbPages, 'edb-postgresql-sizing.html', ROOT + 'Guardium/OEM/edb-postgresql-sizing.html', 'Sizing');
    _groupSidebarCategories(edbPages, [
      { id: 'oem-edb-overview', label: 'Overview', files: ['edb-postgresql.html', 'edb-postgresql-sizing.html'] },
      { id: 'oem-edb-architecture', label: 'Architecture', files: [] },
      { id: 'oem-edb-hadr', label: 'HADR', files: [] },
      { id: 'oem-edb-diagnostics', label: 'Operations', files: [] },
      { id: 'oem-edb-installation', label: 'Installation', files: [] },
      { id: 'oem-edb-faq', label: 'FAQ', files: [] }
    ], true);

    var mongoPages = _ensureProductPages(section, 'oem-mongodb', 'MongoDB');
    _appendLinkIfMissing(mongoPages, 'mongodb.html', ROOT + 'Guardium/OEM/mongodb.html', 'Overview');
    _appendLinkIfMissing(mongoPages, 'mongodb-sizing.html', ROOT + 'Guardium/OEM/mongodb-sizing.html', 'Sizing');
    _groupSidebarCategories(mongoPages, [
      { id: 'oem-mongodb-overview', label: 'Overview', files: ['mongodb.html', 'mongodb-sizing.html'] },
      { id: 'oem-mongodb-architecture', label: 'Architecture', files: [] },
      { id: 'oem-mongodb-hadr', label: 'HADR', files: [] },
      { id: 'oem-mongodb-diagnostics', label: 'Operations', files: [] },
      { id: 'oem-mongodb-installation', label: 'Installation', files: [] },
      { id: 'oem-mongodb-faq', label: 'FAQ', files: [] }
    ], true);

    section.setAttribute('data-oem-grouped', 'true');
  }

  // Keep every dashboard product aligned to the same category sequence.
  function _renderDashboardCategoryTabs(host, source, prefix, categoryFiles, categoryLinks) {
    if (!host || host.getAttribute('data-dashboard-categorized') === 'true') return;

    var byFile = {};
    Array.from((source || host).querySelectorAll('a[href]')).forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var file = href.split('#')[0].split('?')[0].split('/').pop();
      if (file && !byFile[file]) byFile[file] = {
        href: href,
        label: link.textContent.trim()
      };
    });

    var order = [
      { key: 'overview', label: 'Overview' },
      { key: 'architecture', label: 'Architecture' },
      { key: 'hadr', label: 'HADR' },
      { key: 'operations', label: 'Operations' },
      { key: 'installation', label: 'Installation' },
      { key: 'faq', label: 'FAQ' }
    ];

    host.innerHTML = '';
    host.setAttribute('data-dashboard-categorized', 'true');

    var tabs = document.createElement('ul');
    tabs.className = 'nav nav-tabs content-subcategory-tabs dashboard-category-tabs';
    tabs.setAttribute('role', 'tablist');

    var content = document.createElement('div');
    content.className = 'tab-content content-category-content dashboard-category-content';

    order.forEach(function (category, index) {
      var tabId = prefix + '-cat-' + category.key;
      var tabItem = document.createElement('li');
      tabItem.className = 'nav-item';

      var tab = document.createElement('a');
      tab.className = 'nav-link' + (index === 0 ? ' active' : '');
      tab.id = tabId + '-tab';
      tab.href = '#' + tabId;
      tab.textContent = category.label;
      tab.setAttribute('data-toggle', 'tab');
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', tabId);
      tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      tabItem.appendChild(tab);
      tabs.appendChild(tabItem);

      var pane = document.createElement('div');
      pane.className = 'tab-pane fade' + (index === 0 ? ' show active' : '');
      pane.id = tabId;
      pane.setAttribute('role', 'tabpanel');
      pane.setAttribute('aria-labelledby', tab.id);

      var links = [];
      (categoryFiles[category.key] || []).forEach(function (file) {
        if (byFile[file]) links.push(byFile[file]);
      });
      (categoryLinks[category.key] || []).forEach(function (link) {
        links.push(link);
      });

      if (links.length) {
        var list = document.createElement('ul');
        list.className = 'content-page-list dashboard-category-list';
        links.forEach(function (link) {
          var item = document.createElement('li');
          var anchor = document.createElement('a');
          anchor.href = link.href;
          anchor.textContent = link.label;
          item.appendChild(anchor);
          list.appendChild(item);
        });
        pane.appendChild(list);
      } else {
        var placeholder = document.createElement('p');
        placeholder.className = 'text-muted font-italic mb-0 dashboard-category-wip';
        placeholder.textContent = 'Work in progress';
        pane.appendChild(placeholder);
      }

      content.appendChild(pane);
    });

    host.appendChild(tabs);
    host.appendChild(content);
  }

  function _standardizeDashboardCategories() {
    var productConfigs = {
      'watsonx.data (Lakehouse)': { prefix: 'dashboard-wx-lakehouse', overview: ['wxdata-overview.html', 'wxdata-sizing.html'] },
      'watsonx.data Integration': { prefix: 'dashboard-wx-integration', overview: ['wxi-overview.html', 'wxi-sizing.html', 'wxi-streamsets.html', 'wxi-manta.html', 'wxi-databand.html'] },
      'watsonx.data Intelligence': { prefix: 'dashboard-wx-intelligence', overview: ['wxn-overview.html', 'wxn-sizing.html', 'wxn-catalog.html', 'wxn-lineage.html'] },
      'Guardium Data Protection': { prefix: 'dashboard-gdp', overview: ['gdp-overview.html', 'gdp-sizing.html'] },
      'Guardium Discover & Classify': { prefix: 'dashboard-gdc', overview: ['gdc-overview.html', 'gdc-sizing.html'] },
      'Guardium Cryptography Manager': { prefix: 'dashboard-gcm', overview: ['gcm-overview.html', 'gcm-sizing.html'], installation: ['gcm-installation.html'] },
      'EDB PostgreSQL': { prefix: 'dashboard-edb', overview: ['edb-postgresql.html', 'edb-postgresql-sizing.html'] },
      'MongoDB': { prefix: 'dashboard-mongodb', overview: ['mongodb.html', 'mongodb-sizing.html'] },
      'Optim': { prefix: 'dashboard-optim', overview: ['optim-overview.html', 'optim-sizing.html'] },
      'Master Data Management': { prefix: 'dashboard-mdm', overview: ['mdm-overview.html', 'mdm-sizing.html'] },
      'Deployment Principles': { prefix: 'dashboard-general-principles', overview: ['general-principles.html'] },
      'IBM Licensing Guide': { prefix: 'dashboard-general-licensing', overview: ['general-licensing.html'] },
      'IBM Severity Guide': { prefix: 'dashboard-general-severity', overview: ['general-severity.html'] }
    };

    document.querySelectorAll('.grp-product').forEach(function (product) {
      var heading = product.querySelector('.grp-product-label strong');
      var pages = product.querySelector('.grp-pages');
      var config = heading && productConfigs[heading.textContent.trim()];
      if (!pages || !config) return;

      _renderDashboardCategoryTabs(pages, pages, config.prefix, {
        overview: config.overview || [],
        architecture: config.architecture || [],
        hadr: config.hadr || [],
        operations: config.operations || [],
        installation: config.installation || [],
        faq: config.faq || []
      }, {});
    });

    [
      { selector: '#legacy-datavirtualization', prefix: 'dashboard-dv', overview: ['dv-overview.html'] },
      { selector: '#legacy-producthub', prefix: 'dashboard-ph', overview: ['ph-overview.html'] }
    ].forEach(function (config) {
      var pane = document.querySelector(config.selector);
      var oldList = pane && pane.querySelector('.content-page-list');
      if (!pane || !oldList) return;

      var host = document.createElement('div');
      pane.replaceChild(host, oldList);
      _renderDashboardCategoryTabs(host, oldList, config.prefix, {
        overview: config.overview,
        architecture: [],
        hadr: [],
        operations: [],
        installation: [],
        faq: []
      }, {});
    });
  }

  // ── 4. Unified product content taxonomy ────────────────────────────
  // One model drives both the dashboard and every sidebar. Missing topic
  // entries intentionally render as "Work in progress".
  var _CONTENT_SECTIONS = [
    {
      key: 'overview',
      label: 'Overview',
      topics: [
        { key: 'introduction', label: 'Introduction' },
        { key: 'key-capabilities', label: 'Key Capabilities' },
        { key: 'use-cases', label: 'Use Cases' },
        { key: 'terminology', label: 'Terminology' }
      ]
    },
    {
      key: 'architecture',
      label: 'Architecture',
      topics: [
        { key: 'architecture-diagram', label: 'Architecture Diagram' },
        { key: 'components', label: 'Components' },
        { key: 'data-flow', label: 'Data Flow' },
        { key: 'topologies', label: 'Topologies' },
        { key: 'ha-dr-architecture', label: 'HA / DR Architecture' }
      ]
    },
    {
      key: 'deployment',
      label: 'Deployment',
      topics: [
        { key: 'requirements', label: 'Requirements' },
        { key: 'specifications', label: 'Specifications' },
        { key: 'sizing', label: 'Sizing' },
        { key: 'installation', label: 'Installation' },
        { key: 'configuration', label: 'Configuration' },
        { key: 'upgrade-migration', label: 'Upgrade / Migration' }
      ]
    },
    {
      key: 'operations',
      label: 'Operations',
      topics: [
        { key: 'day-to-day', label: 'Day-to-Day Operations' },
        { key: 'monitoring', label: 'Monitoring' },
        { key: 'performance', label: 'Performance' },
        { key: 'maintenance', label: 'Maintenance' },
        { key: 'backup-recovery', label: 'Backup / Recovery' },
        { key: 'ha-dr-operations', label: 'HA / DR Operations' },
        { key: 'tools-commands', label: 'Tools / Commands' }
      ]
    },
    {
      key: 'faq',
      label: 'FAQ',
      topics: [
        { key: 'logs', label: 'Logs' },
        { key: 'diagnostics', label: 'Diagnostics' },
        { key: 'common-issues', label: 'Common Issues' },
        { key: 'rca', label: 'RCA' },
        { key: 'best-practices', label: 'Best Practices' },
        { key: 'quick-reference', label: 'Quick Reference' }
      ]
    }
  ];

  function _contentLink(href, label) {
    return { href: href, label: label };
  }

  var L = _contentLink;
  var _PRODUCT_CONTENT = {
    general: {
      overview: {
        'introduction': [L('general/general-principles.html', 'Deployment Principles')],
        'key-capabilities': [L('general/general-principles.html', 'Core Availability Principles')],
        'use-cases': [L('general/general-licensing.html', 'Standby System Use Cases')],
        'terminology': [L('general/general-severity.html', 'Severity Terminology'), L('general/general-licensing.html', 'Cold, Warm, and Hot Standby Definitions')]
      },
      architecture: {
        'architecture-diagram': [L('general/general-licensing.html', 'Standby Topology Diagrams')],
        'topologies': [L('general/general-licensing.html', 'Cold, Warm, and Hot Standby Topologies')],
        'ha-dr-architecture': [L('general/general-principles.html', 'RPO, RTO, and HA / DR Design'), L('general/general-licensing.html', 'Standby Architecture and Licensing')]
      },
      deployment: {
        'requirements': [L('general/general-principles.html', 'Availability and Recovery Requirements')]
      },
      operations: {
        'day-to-day': [L('general/general-severity.html', 'Support Severity and Response Workflow')],
        'monitoring': [L('general/general-severity.html', 'Incident Severity Monitoring')],
        'maintenance': [L('general/general-principles.html', 'Operational Readiness Principles')],
        'backup-recovery': [L('general/general-principles.html', 'RPO and RTO Framework')],
        'ha-dr-operations': [L('general/general-licensing.html', 'Standby Testing and Operational Allowances')]
      },
      faq: {
        'diagnostics': [L('general/general-severity.html', 'Severity Assessment')],
        'common-issues': [L('general/general-severity.html', 'Common Severity Downgrade Scenarios')],
        'rca': [L('general/general-severity.html', 'Incident Evidence and Support Response')],
        'best-practices': [L('general/general-principles.html', 'Core Principles')],
        'quick-reference': [L('general/general-severity.html', 'Severity and Response-Time Reference')]
      }
    },

    db2: {
      overview: {
        'introduction': [L('db2/index.html', 'Db2 HADR Overview'), L('db2/hadrTutorial.html', 'HADR Introduction and Tutorial')],
        'key-capabilities': [L('db2/hadrBenefits.html', 'HADR Benefits and Capabilities')],
        'use-cases': [L('db2/hadrBenefits.html', 'High Availability and Disaster Recovery Use Cases')],
        'terminology': [L('db2/hadrTutorial.html', 'HADR Roles, States, and Concepts'), L('db2/hadrSyncMode.html', 'Synchronization Modes')]
      },
      architecture: {
        'architecture-diagram': [L('db2/hadrTutorial.html', 'HADR Architecture and Data Path'), L('db2/hadrPureScale.html', 'Db2 pureScale HADR Architecture')],
        'components': [L('db2/hadrTutorial.html', 'Primary, Standby, and Log Components'), L('db2/clusterManagers.html', 'Cluster Managers')],
        'data-flow': [L('db2/hadrLogShipping.html', 'HADR Log Shipping and Replay')],
        'topologies': [L('db2/clusterManagers.html', 'Automated HADR Topologies'), L('db2/hadrPureScale.html', 'pureScale Topologies'), L('db2/clientReroute.html', 'Client Reroute Topology')],
        'ha-dr-architecture': [L('db2/hadrSyncMode.html', 'Synchronization and Data-Loss Design'), L('db2/clientReroute.html', 'Client Failover Architecture')]
      },
      deployment: {
        'requirements': [L('db2/hadrTutorial.html', 'HADR Requirements and Planning')],
        'specifications': [L('db2/hadrConfig.html', 'HADR Configuration Parameters')],
        'sizing': [L('db2/sizing.html', 'Db2 HADR Sizing')],
        'installation': [L('db2/hadrTutorial.html', 'Setup, Initialization, and Validation')],
        'configuration': [L('db2/hadrConfig.html', 'HADR Configuration'), L('db2/tcpTuning.html', 'TCP Configuration and Tuning')],
        'upgrade-migration': [L('db2/featureHistory.html', 'Feature History and Version Planning'), L('db2/hadrTutorial.html', 'Rolling Update Guidance')]
      },
      operations: {
        'day-to-day': [L('db2/hadrCommands.html', 'Routine HADR Commands'), L('db2/hadrTakeover.html', 'Takeover and Role Management')],
        'monitoring': [
          L('db2/db2CpuMonitoring.html', 'General'),
          L('db2/hadrMonitoring.html', 'HADR')
        ],
        'performance': [L('db2/hadrPerf.html', 'HADR Performance'), L('db2/perfTuning.html', 'Db2 Performance Tuning'), L('db2/tcpTuning.html', 'Network Tuning')],
        'maintenance': [L('db2/hadrCommands.html', 'Startup, Shutdown, and Role Operations')],
        'backup-recovery': [L('db2/hadrTakeover.html', 'Takeover and Recovery Procedures')],
        'ha-dr-operations': [L('db2/hadrTakeover.html', 'Planned and Forced Takeover'), L('db2/hadrCommands.html', 'HADR Operational Commands')],
        'tools-commands': [L('db2/hadrSimulator.html', 'HADR Simulator'), L('db2/db2logscan.html', 'db2logscan'), L('db2/hadrCommands.html', 'Command Reference')]
      },
      faq: {
        'logs': [L('db2/db2diag.html', 'db2diag.log'), L('db2/db2logscan.html', 'Transaction Log Scan'), L('db2/db2fmtlog.html', 'db2fmtlog Replay-Only Window')],
        'diagnostics': [L('db2/diagConnect.html', 'Connection Diagnostics'), L('db2/db2MustGather.html', 'Db2 Must Gather')],
        'common-issues': [L('db2/faq.html', 'Common HADR Questions and Issues')],
        'rca': [L('db2/db2diag.html', 'Diagnostic Log Analysis'), L('db2/db2MustGather.html', 'Evidence Collection for RCA')],
        'best-practices': [L('db2/hadrPerf.html', 'HADR Best Practices')],
        'quick-reference': [L('db2/hadrCommands.html', 'HADR Command Quick Reference'), L('db2/faq.html', 'HADR FAQ')]
      }
    },

    datastage: {
      overview: {
        'introduction':     [L('InfoSphere/DataStage/ds-introduction.html',    'Introduction')],
        'key-capabilities': [L('InfoSphere/DataStage/ds-key-capabilities.html','Key Capabilities')],
        'use-cases':        [L('InfoSphere/DataStage/ds-use-cases.html',       'Use Cases')],
        'terminology':      [L('InfoSphere/DataStage/ds-terminology.html',     'Terminology')]
      },
      architecture: {
        'architecture-diagram': [L('InfoSphere/DataStage/ds-architecture-diagram.html','Architecture Diagram')],
        'components':           [L('InfoSphere/DataStage/ds-components.html',          'Components')],
        'data-flow':            [L('InfoSphere/DataStage/ds-data-flow.html',           'Data Flow')],
        'topologies':           [L('InfoSphere/DataStage/ds-topologies.html',          'Topologies')],
        'ha-dr-architecture':   [L('InfoSphere/DataStage/ds-ha-dr-architecture.html',  'HA / DR Architecture')]
      },
      deployment: {
        'requirements':      [L('InfoSphere/DataStage/ds-requirements.html',     'Requirements')],
        'specifications':    [L('InfoSphere/DataStage/ds-specifications.html',   'Specifications')],
        'sizing':            [L('InfoSphere/DataStage/ds-sizing.html',           'Sizing')],
        'installation':      [L('InfoSphere/DataStage/ds-installation.html',     'Installation')],
        'configuration':     [L('InfoSphere/DataStage/ds-configuration.html',    'Configuration')],
        'upgrade-migration': [L('InfoSphere/DataStage/ds-upgrade-migration.html','Upgrade / Migration')]
      },
      operations: {
        'day-to-day':       [L('InfoSphere/DataStage/ds-day-to-day.html',      'Day-to-Day Operations')],
        'monitoring':       [L('InfoSphere/DataStage/ds-monitoring.html',       'Monitoring')],
        'performance':      [L('InfoSphere/DataStage/ds-performance.html',      'Performance')],
        'maintenance':      [L('InfoSphere/DataStage/ds-maintenance.html',      'Maintenance')],
        'backup-recovery':  [L('InfoSphere/DataStage/ds-backup-recovery.html',  'Backup / Recovery')],
        'ha-dr-operations': [L('InfoSphere/DataStage/ds-ha-dr-operations.html', 'HA / DR Operations')],
        'tools-commands':   [L('InfoSphere/DataStage/ds-tools-commands.html',   'Tools / Commands')]
      },
      faq: {
        'logs':            [L('InfoSphere/DataStage/ds-logs.html',           'Logs')],
        'diagnostics':     [L('InfoSphere/DataStage/ds-diagnostics.html',    'Diagnostics')],
        'common-issues':   [L('InfoSphere/DataStage/ds-common-issues.html',  'Common Issues')],
        'rca':             [L('InfoSphere/DataStage/ds-rca.html',            'RCA')],
        'best-practices':  [L('InfoSphere/DataStage/ds-best-practices.html', 'Best Practices')],
        'quick-reference': [L('InfoSphere/DataStage/ds-quick-reference.html','Quick Reference')]
      }
    },

    cdc: {
      overview: {
        'introduction':     [L('InfoSphere/Change Data Capture/cdc-introduction.html',    'Introduction')],
        'key-capabilities': [L('InfoSphere/Change Data Capture/cdc-key-capabilities.html','Key Capabilities')],
        'use-cases':        [L('InfoSphere/Change Data Capture/cdc-use-cases.html',       'Use Cases')],
        'terminology':      [L('InfoSphere/Change Data Capture/cdc-terminology.html',     'Terminology')]
      },
      architecture: {
        'architecture-diagram': [L('InfoSphere/Change Data Capture/cdc-architecture-diagram.html','Architecture Diagram')],
        'components':           [L('InfoSphere/Change Data Capture/cdc-components.html',          'Components')],
        'data-flow':            [L('InfoSphere/Change Data Capture/cdc-data-flow.html',           'Data Flow')],
        'topologies':           [L('InfoSphere/Change Data Capture/cdc-topologies.html',          'Topologies')],
        'ha-dr-architecture':   [L('InfoSphere/Change Data Capture/cdc-ha-dr-architecture.html',  'HA / DR Architecture')]
      },
      deployment: {
        'requirements':      [L('InfoSphere/Change Data Capture/cdc-requirements.html',     'Requirements')],
        'specifications':    [L('InfoSphere/Change Data Capture/cdc-specifications.html',   'Specifications')],
        'sizing':            [L('InfoSphere/Change Data Capture/cdc-sizing.html',           'Sizing')],
        'installation':      [L('InfoSphere/Change Data Capture/cdc-installation.html',     'Installation')],
        'configuration':     [L('InfoSphere/Change Data Capture/cdc-configuration.html',    'Configuration')],
        'upgrade-migration': [L('InfoSphere/Change Data Capture/cdc-upgrade-migration.html','Upgrade / Migration')]
      },
      operations: {
        'day-to-day':       [L('InfoSphere/Change Data Capture/cdc-day-to-day.html',      'Day-to-Day Operations')],
        'monitoring':       [L('InfoSphere/Change Data Capture/cdc-monitoring.html',       'Monitoring')],
        'performance':      [L('InfoSphere/Change Data Capture/cdc-performance.html',      'Performance')],
        'maintenance':      [L('InfoSphere/Change Data Capture/cdc-maintenance.html',      'Maintenance')],
        'backup-recovery':  [L('InfoSphere/Change Data Capture/cdc-backup-recovery.html',  'Backup / Recovery')],
        'ha-dr-operations': [L('InfoSphere/Change Data Capture/cdc-ha-dr-operations.html', 'HA / DR Operations')],
        'tools-commands':   [L('InfoSphere/Change Data Capture/cdc-tools-commands.html',   'Tools / Commands')]
      },
      faq: {
        'logs':            [L('InfoSphere/Change Data Capture/cdc-logs.html',           'Logs')],
        'diagnostics':     [L('InfoSphere/Change Data Capture/cdc-diagnostics.html',    'Diagnostics')],
        'common-issues':   [L('InfoSphere/Change Data Capture/cdc-common-issues.html',  'Common Issues')],
        'rca':             [L('InfoSphere/Change Data Capture/cdc-rca.html',            'RCA')],
        'best-practices':  [L('InfoSphere/Change Data Capture/cdc-best-practices.html', 'Best Practices')],
        'quick-reference': [L('InfoSphere/Change Data Capture/cdc-quick-reference.html','Quick Reference')]
      }
    },

    dataVirtualization: {
      overview: {
        'introduction':     [L('InfoSphere/Data Virtualization/dv-introduction.html',    'Introduction')],
        'key-capabilities': [L('InfoSphere/Data Virtualization/dv-key-capabilities.html','Key Capabilities')],
        'use-cases':        [L('InfoSphere/Data Virtualization/dv-use-cases.html',       'Use Cases')],
        'terminology':      [L('InfoSphere/Data Virtualization/dv-terminology.html',     'Terminology')]
      },
      architecture: {
        'architecture-diagram': [L('InfoSphere/Data Virtualization/dv-architecture-diagram.html','Architecture Diagram')],
        'components':           [L('InfoSphere/Data Virtualization/dv-components.html',          'Components')],
        'data-flow':            [L('InfoSphere/Data Virtualization/dv-data-flow.html',           'Data Flow')],
        'topologies':           [L('InfoSphere/Data Virtualization/dv-topologies.html',          'Topologies')],
        'ha-dr-architecture':   [L('InfoSphere/Data Virtualization/dv-ha-dr-architecture.html',  'HA / DR Architecture')]
      },
      deployment: {
        'requirements':      [L('InfoSphere/Data Virtualization/dv-requirements.html',     'Requirements')],
        'specifications':    [L('InfoSphere/Data Virtualization/dv-specifications.html',   'Specifications')],
        'sizing':            [L('InfoSphere/Data Virtualization/dv-sizing.html',           'Sizing')],
        'installation':      [L('InfoSphere/Data Virtualization/dv-installation.html',     'Installation')],
        'configuration':     [L('InfoSphere/Data Virtualization/dv-configuration.html',    'Configuration')],
        'upgrade-migration': [L('InfoSphere/Data Virtualization/dv-upgrade-migration.html','Upgrade / Migration')]
      },
      operations: {
        'day-to-day':       [L('InfoSphere/Data Virtualization/dv-day-to-day.html',      'Day-to-Day Operations')],
        'monitoring':       [L('InfoSphere/Data Virtualization/dv-monitoring.html',       'Monitoring')],
        'performance':      [L('InfoSphere/Data Virtualization/dv-performance.html',      'Performance')],
        'maintenance':      [L('InfoSphere/Data Virtualization/dv-maintenance.html',      'Maintenance')],
        'backup-recovery':  [L('InfoSphere/Data Virtualization/dv-backup-recovery.html',  'Backup / Recovery')],
        'ha-dr-operations': [L('InfoSphere/Data Virtualization/dv-ha-dr-operations.html', 'HA / DR Operations')],
        'tools-commands':   [L('InfoSphere/Data Virtualization/dv-tools-commands.html',   'Tools / Commands')]
      },
      faq: {
        'logs':            [L('InfoSphere/Data Virtualization/dv-logs.html',           'Logs')],
        'diagnostics':     [L('InfoSphere/Data Virtualization/dv-diagnostics.html',    'Diagnostics')],
        'common-issues':   [L('InfoSphere/Data Virtualization/dv-common-issues.html',  'Common Issues')],
        'rca':             [L('InfoSphere/Data Virtualization/dv-rca.html',            'RCA')],
        'best-practices':  [L('InfoSphere/Data Virtualization/dv-best-practices.html', 'Best Practices')],
        'quick-reference': [L('InfoSphere/Data Virtualization/dv-quick-reference.html','Quick Reference')]
      }
    },

    productHub: {
      overview: {
        'introduction':     [L('InfoSphere/Product Hub/ph-introduction.html',    'Introduction')],
        'key-capabilities': [L('InfoSphere/Product Hub/ph-key-capabilities.html','Key Capabilities')],
        'use-cases':        [L('InfoSphere/Product Hub/ph-use-cases.html',       'Use Cases')],
        'terminology':      [L('InfoSphere/Product Hub/ph-terminology.html',     'Terminology')]
      },
      architecture: {
        'architecture-diagram': [L('InfoSphere/Product Hub/ph-architecture-diagram.html','Architecture Diagram')],
        'components':           [L('InfoSphere/Product Hub/ph-components.html',          'Components')],
        'data-flow':            [L('InfoSphere/Product Hub/ph-data-flow.html',           'Data Flow')],
        'topologies':           [L('InfoSphere/Product Hub/ph-topologies.html',          'Topologies')],
        'ha-dr-architecture':   [L('InfoSphere/Product Hub/ph-ha-dr-architecture.html',  'HA / DR Architecture')]
      },
      deployment: {
        'requirements':      [L('InfoSphere/Product Hub/ph-requirements.html',     'Requirements')],
        'specifications':    [L('InfoSphere/Product Hub/ph-specifications.html',   'Specifications')],
        'sizing':            [L('InfoSphere/Product Hub/ph-sizing.html',           'Sizing')],
        'installation':      [L('InfoSphere/Product Hub/ph-installation.html',     'Installation')],
        'configuration':     [L('InfoSphere/Product Hub/ph-configuration.html',    'Configuration')],
        'upgrade-migration': [L('InfoSphere/Product Hub/ph-upgrade-migration.html','Upgrade / Migration')]
      },
      operations: {
        'day-to-day':       [L('InfoSphere/Product Hub/ph-day-to-day.html',      'Day-to-Day Operations')],
        'monitoring':       [L('InfoSphere/Product Hub/ph-monitoring.html',       'Monitoring')],
        'performance':      [L('InfoSphere/Product Hub/ph-performance.html',      'Performance')],
        'maintenance':      [L('InfoSphere/Product Hub/ph-maintenance.html',      'Maintenance')],
        'backup-recovery':  [L('InfoSphere/Product Hub/ph-backup-recovery.html',  'Backup / Recovery')],
        'ha-dr-operations': [L('InfoSphere/Product Hub/ph-ha-dr-operations.html', 'HA / DR Operations')],
        'tools-commands':   [L('InfoSphere/Product Hub/ph-tools-commands.html',   'Tools / Commands')]
      },
      faq: {
        'logs':            [L('InfoSphere/Product Hub/ph-logs.html',           'Logs')],
        'diagnostics':     [L('InfoSphere/Product Hub/ph-diagnostics.html',    'Diagnostics')],
        'common-issues':   [L('InfoSphere/Product Hub/ph-common-issues.html',  'Common Issues')],
        'rca':             [L('InfoSphere/Product Hub/ph-rca.html',            'RCA')],
        'best-practices':  [L('InfoSphere/Product Hub/ph-best-practices.html', 'Best Practices')],
        'quick-reference': [L('InfoSphere/Product Hub/ph-quick-reference.html','Quick Reference')]
      }
    },

    lakehouse: {
      overview: {
        'introduction':     [L('watsonx.data/wxl-introduction.html',    'Introduction')],
        'key-capabilities': [L('watsonx.data/wxl-key-capabilities.html','Key Capabilities')],
        'use-cases':        [L('watsonx.data/wxl-use-cases.html',       'Use Cases')],
        'terminology':      [L('watsonx.data/wxl-terminology.html',     'Terminology')]
      },
      architecture: {
        'architecture-diagram': [L('watsonx.data/wxl-architecture-diagram.html','Architecture Diagram')],
        'components':           [L('watsonx.data/wxl-components.html',          'Components')],
        'data-flow':            [L('watsonx.data/wxl-data-flow.html',           'Data Flow')],
        'topologies':           [L('watsonx.data/wxl-topologies.html',          'Topologies')],
        'ha-dr-architecture':   [L('watsonx.data/wxl-ha-dr-architecture.html',  'HA / DR Architecture')]
      },
      deployment: {
        'requirements':      [L('watsonx.data/wxl-requirements.html',     'Requirements')],
        'specifications':    [L('watsonx.data/wxl-specifications.html',   'Specifications')],
        'sizing':            [L('watsonx.data/wxdata-sizing.html',        'Sizing')],
        'installation':      [L('watsonx.data/wxl-installation.html',     'Installation')],
        'configuration':     [L('watsonx.data/wxl-configuration.html',    'Configuration')],
        'upgrade-migration': [L('watsonx.data/wxl-upgrade-migration.html','Upgrade / Migration')]
      },
      operations: {
        'day-to-day':       [L('watsonx.data/wxl-day-to-day.html',      'Day-to-Day Operations')],
        'monitoring':       [L('watsonx.data/wxl-monitoring.html',       'Monitoring')],
        'performance':      [L('watsonx.data/wxl-performance.html',      'Performance')],
        'maintenance':      [L('watsonx.data/wxl-maintenance.html',      'Maintenance')],
        'backup-recovery':  [L('watsonx.data/wxl-backup-recovery.html',  'Backup / Recovery')],
        'ha-dr-operations': [L('watsonx.data/wxl-ha-dr-operations.html', 'HA / DR Operations')],
        'tools-commands':   [L('watsonx.data/wxl-tools-commands.html',   'Tools / Commands')]
      },
      faq: {
        'logs':            [L('watsonx.data/wxl-logs.html',           'Logs')],
        'diagnostics':     [L('watsonx.data/wxl-diagnostics.html',    'Diagnostics')],
        'common-issues':   [L('watsonx.data/wxl-common-issues.html',  'Common Issues')],
        'rca':             [L('watsonx.data/wxl-rca.html',            'RCA')],
        'best-practices':  [L('watsonx.data/wxl-best-practices.html', 'Best Practices')],
        'quick-reference': [L('watsonx.data/wxl-quick-reference.html','Quick Reference')]
      }
    },

    integration: {
      overview: {
        'introduction':     [L('watsonx.data Integration/wxi-introduction.html',    'Introduction')],
        'key-capabilities': [L('watsonx.data Integration/wxi-key-capabilities.html','Key Capabilities')],
        'use-cases':        [L('watsonx.data Integration/wxi-use-cases.html',       'Use Cases')],
        'terminology':      [L('watsonx.data Integration/wxi-terminology.html',     'Terminology')]
      },
      architecture: {
        'architecture-diagram': [L('watsonx.data Integration/wxi-architecture-diagram.html','Architecture Diagram')],
        'components':           [L('watsonx.data Integration/wxi-components.html',          'Components')],
        'data-flow':            [L('watsonx.data Integration/wxi-data-flow.html',           'Data Flow')],
        'topologies':           [L('watsonx.data Integration/wxi-topology.html',            'Topologies')],
        'ha-dr-architecture':   [L('watsonx.data Integration/wxi-ha-dr-architecture.html',  'HA / DR Architecture')]
      },
      deployment: {
        'requirements':      [L('watsonx.data Integration/wxi-requirements.html',     'Requirements')],
        'specifications':    [L('watsonx.data Integration/wxi-specifications.html',   'Specifications')],
        'sizing':            [L('watsonx.data Integration/wxi-sizing.html',           'Sizing')],
        'installation':      [L('watsonx.data Integration/wxi-installation.html',     'Installation')],
        'configuration':     [L('watsonx.data Integration/wxi-configuration.html',    'Configuration')],
        'upgrade-migration': [L('watsonx.data Integration/wxi-upgrade-migration.html','Upgrade / Migration')]
      },
      operations: {
        'day-to-day':       [L('watsonx.data Integration/wxi-day-to-day.html',      'Day-to-Day Operations')],
        'monitoring':       [L('watsonx.data Integration/wxi-monitoring.html',       'Monitoring')],
        'performance':      [L('watsonx.data Integration/wxi-performance.html',      'Performance')],
        'maintenance':      [L('watsonx.data Integration/wxi-maintenance.html',      'Maintenance')],
        'backup-recovery':  [L('watsonx.data Integration/wxi-backup-recovery.html',  'Backup / Recovery')],
        'ha-dr-operations': [L('watsonx.data Integration/wxi-ha-dr-operations.html', 'HA / DR Operations')],
        'tools-commands':   [L('watsonx.data Integration/wxi-tools-commands.html',   'Tools / Commands')]
      },
      faq: {
        'logs':            [L('watsonx.data Integration/wxi-logs.html',           'Logs')],
        'diagnostics':     [L('watsonx.data Integration/wxi-diagnostics.html',    'Diagnostics')],
        'common-issues':   [L('watsonx.data Integration/wxi-common-issues.html',  'Common Issues')],
        'rca':             [L('watsonx.data Integration/wxi-rca.html',            'RCA')],
        'best-practices':  [L('watsonx.data Integration/wxi-best-practices.html', 'Best Practices')],
        'quick-reference': [L('watsonx.data Integration/wxi-quick-reference.html','Quick Reference')]
      }
    },

    intelligence: {
      overview: {
        'introduction':     [L('watsonx.data Intelligence/wxn-introduction.html',    'Introduction')],
        'key-capabilities': [L('watsonx.data Intelligence/wxn-key-capabilities.html','Key Capabilities')],
        'use-cases':        [L('watsonx.data Intelligence/wxn-use-cases.html',       'Use Cases')],
        'terminology':      [L('watsonx.data Intelligence/wxn-terminology.html',     'Terminology')]
      },
      architecture: {
        'architecture-diagram': [L('watsonx.data Intelligence/wxn-architecture-diagram.html','Architecture Diagram')],
        'components':           [L('watsonx.data Intelligence/wxn-components.html',          'Components')],
        'data-flow':            [L('watsonx.data Intelligence/wxn-data-flow.html',           'Data Flow')],
        'topologies':           [L('watsonx.data Intelligence/wxn-topologies.html',          'Topologies')],
        'ha-dr-architecture':   [L('watsonx.data Intelligence/wxn-ha-dr-architecture.html',  'HA / DR Architecture')]
      },
      deployment: {
        'requirements':      [L('watsonx.data Intelligence/wxn-requirements.html',     'Requirements')],
        'specifications':    [L('watsonx.data Intelligence/wxn-specifications.html',   'Specifications')],
        'sizing':            [L('watsonx.data Intelligence/wxn-sizing.html',           'Sizing')],
        'installation':      [L('watsonx.data Intelligence/wxn-installation.html',     'Installation')],
        'configuration':     [L('watsonx.data Intelligence/wxn-configuration.html',    'Configuration')],
        'upgrade-migration': [L('watsonx.data Intelligence/wxn-upgrade-migration.html','Upgrade / Migration')]
      },
      operations: {
        'day-to-day':       [L('watsonx.data Intelligence/wxn-day-to-day.html',      'Day-to-Day Operations')],
        'monitoring':       [L('watsonx.data Intelligence/wxn-monitoring.html',       'Monitoring')],
        'performance':      [L('watsonx.data Intelligence/wxn-performance.html',      'Performance')],
        'maintenance':      [L('watsonx.data Intelligence/wxn-maintenance.html',      'Maintenance')],
        'backup-recovery':  [L('watsonx.data Intelligence/wxn-backup-recovery.html',  'Backup / Recovery')],
        'ha-dr-operations': [L('watsonx.data Intelligence/wxn-ha-dr-operations.html', 'HA / DR Operations')],
        'tools-commands':   [L('watsonx.data Intelligence/wxn-tools-commands.html',   'Tools / Commands')]
      },
      faq: {
        'logs':            [L('watsonx.data Intelligence/wxn-logs.html',           'Logs')],
        'diagnostics':     [L('watsonx.data Intelligence/wxn-diagnostics.html',    'Diagnostics')],
        'common-issues':   [L('watsonx.data Intelligence/wxn-common-issues.html',  'Common Issues')],
        'rca':             [L('watsonx.data Intelligence/wxn-rca.html',            'RCA')],
        'best-practices':  [L('watsonx.data Intelligence/wxn-best-practices.html', 'Best Practices')],
        'quick-reference': [L('watsonx.data Intelligence/wxn-quick-reference.html','Quick Reference')]
      }
    },

    guardiumDataProtection: {
      overview: {
        'introduction':     [L('Guardium/Guardium Data Protection/gdp-introduction.html',    'Introduction')],
        'key-capabilities': [L('Guardium/Guardium Data Protection/gdp-key-capabilities.html','Key Capabilities')],
        'use-cases':        [L('Guardium/Guardium Data Protection/gdp-use-cases.html',       'Use Cases')],
        'terminology':      [L('Guardium/Guardium Data Protection/gdp-terminology.html',     'Terminology')]
      },
      architecture: {
        'architecture-diagram': [L('Guardium/Guardium Data Protection/gdp-architecture-diagram.html','Architecture Diagram')],
        'components':           [L('Guardium/Guardium Data Protection/gdp-components.html',          'Components')],
        'data-flow':            [L('Guardium/Guardium Data Protection/gdp-data-flow.html',           'Data Flow')],
        'topologies':           [L('Guardium/Guardium Data Protection/gdp-topologies.html',          'Topologies')],
        'ha-dr-architecture':   [L('Guardium/Guardium Data Protection/gdp-ha-dr-architecture.html',  'HA / DR Architecture')]
      },
      deployment: {
        'requirements':      [L('Guardium/Guardium Data Protection/gdp-requirements.html',     'Requirements')],
        'specifications':    [L('Guardium/Guardium Data Protection/gdp-specifications.html',   'Specifications')],
        'sizing':            [L('Guardium/Guardium Data Protection/gdp-sizing.html',            'Sizing')],
        'installation':      [L('Guardium/Guardium Data Protection/gdp-installation.html',     'Installation')],
        'configuration':     [L('Guardium/Guardium Data Protection/gdp-configuration.html',    'Configuration')],
        'upgrade-migration': [L('Guardium/Guardium Data Protection/gdp-upgrade-migration.html','Upgrade / Migration')]
      },
      operations: {
        'day-to-day':       [L('Guardium/Guardium Data Protection/gdp-day-to-day.html',      'Day-to-Day Operations')],
        'monitoring':       [L('Guardium/Guardium Data Protection/gdp-monitoring.html',       'Monitoring')],
        'performance':      [L('Guardium/Guardium Data Protection/gdp-performance.html',      'Performance')],
        'maintenance':      [L('Guardium/Guardium Data Protection/gdp-maintenance.html',      'Maintenance')],
        'backup-recovery':  [L('Guardium/Guardium Data Protection/gdp-backup-recovery.html',  'Backup / Recovery')],
        'ha-dr-operations': [L('Guardium/Guardium Data Protection/gdp-ha-dr-operations.html', 'HA / DR Operations')],
        'tools-commands':   [L('Guardium/Guardium Data Protection/gdp-tools-commands.html',   'Tools / Commands')]
      },
      faq: {
        'logs':            [L('Guardium/Guardium Data Protection/gdp-logs.html',           'Logs')],
        'diagnostics':     [L('Guardium/Guardium Data Protection/gdp-diagnostics.html',    'Diagnostics')],
        'common-issues':   [L('Guardium/Guardium Data Protection/gdp-common-issues.html',  'Common Issues')],
        'rca':             [L('Guardium/Guardium Data Protection/gdp-rca.html',            'RCA')],
        'best-practices':  [L('Guardium/Guardium Data Protection/gdp-best-practices.html', 'Best Practices')],
        'quick-reference': [L('Guardium/Guardium Data Protection/gdp-quick-reference.html','Quick Reference')]
      }
    },

    guardiumDiscover: {
      overview: {
        'introduction':     [L('Guardium/Guardium Discover and Classify/gdc-introduction.html',    'Introduction')],
        'key-capabilities': [L('Guardium/Guardium Discover and Classify/gdc-key-capabilities.html','Key Capabilities')],
        'use-cases':        [L('Guardium/Guardium Discover and Classify/gdc-use-cases.html',       'Use Cases')],
        'terminology':      [L('Guardium/Guardium Discover and Classify/gdc-terminology.html',     'Terminology')]
      },
      architecture: {
        'architecture-diagram': [L('Guardium/Guardium Discover and Classify/gdc-architecture-diagram.html','Architecture Diagram')],
        'components':           [L('Guardium/Guardium Discover and Classify/gdc-components.html',          'Components')],
        'data-flow':            [L('Guardium/Guardium Discover and Classify/gdc-data-flow.html',           'Data Flow')],
        'topologies':           [L('Guardium/Guardium Discover and Classify/gdc-topologies.html',          'Topologies')],
        'ha-dr-architecture':   [L('Guardium/Guardium Discover and Classify/gdc-ha-dr-architecture.html',  'HA / DR Architecture')]
      },
      deployment: {
        'requirements':      [L('Guardium/Guardium Discover and Classify/gdc-requirements.html',     'Requirements')],
        'specifications':    [L('Guardium/Guardium Discover and Classify/gdc-specifications.html',   'Specifications')],
        'sizing':            [L('Guardium/Guardium Discover and Classify/gdc-sizing.html',            'Sizing')],
        'installation':      [L('Guardium/Guardium Discover and Classify/gdc-installation.html',     'Installation')],
        'configuration':     [L('Guardium/Guardium Discover and Classify/gdc-configuration.html',    'Configuration')],
        'upgrade-migration': [L('Guardium/Guardium Discover and Classify/gdc-upgrade-migration.html','Upgrade / Migration')]
      },
      operations: {
        'day-to-day':       [L('Guardium/Guardium Discover and Classify/gdc-day-to-day.html',      'Day-to-Day Operations')],
        'monitoring':       [L('Guardium/Guardium Discover and Classify/gdc-monitoring.html',       'Monitoring')],
        'performance':      [L('Guardium/Guardium Discover and Classify/gdc-performance.html',      'Performance')],
        'maintenance':      [L('Guardium/Guardium Discover and Classify/gdc-maintenance.html',      'Maintenance')],
        'backup-recovery':  [L('Guardium/Guardium Discover and Classify/gdc-backup-recovery.html',  'Backup / Recovery')],
        'ha-dr-operations': [L('Guardium/Guardium Discover and Classify/gdc-ha-dr-operations.html', 'HA / DR Operations')],
        'tools-commands':   [L('Guardium/Guardium Discover and Classify/gdc-tools-commands.html',   'Tools / Commands')]
      },
      faq: {
        'logs':            [L('Guardium/Guardium Discover and Classify/gdc-logs.html',           'Logs')],
        'diagnostics':     [L('Guardium/Guardium Discover and Classify/gdc-diagnostics.html',    'Diagnostics')],
        'common-issues':   [L('Guardium/Guardium Discover and Classify/gdc-common-issues.html',  'Common Issues')],
        'rca':             [L('Guardium/Guardium Discover and Classify/gdc-rca.html',            'RCA')],
        'best-practices':  [L('Guardium/Guardium Discover and Classify/gdc-best-practices.html', 'Best Practices')],
        'quick-reference': [L('Guardium/Guardium Discover and Classify/gdc-quick-reference.html','Quick Reference')]
      }
    },

    guardiumCrypto: {
      overview: {
        'introduction':     [L('Guardium/Guardium Crytography Manager/gcm-introduction.html',    'Introduction')],
        'key-capabilities': [L('Guardium/Guardium Crytography Manager/gcm-key-capabilities.html','Key Capabilities')],
        'use-cases':        [L('Guardium/Guardium Crytography Manager/gcm-use-cases.html',       'Use Cases')],
        'terminology':      [L('Guardium/Guardium Crytography Manager/gcm-terminology.html',     'Terminology')]
      },
      architecture: {
        'architecture-diagram': [L('Guardium/Guardium Crytography Manager/gcm-architecture-diagram.html','Architecture Diagram')],
        'components':           [L('Guardium/Guardium Crytography Manager/gcm-components.html',          'Components')],
        'data-flow':            [L('Guardium/Guardium Crytography Manager/gcm-data-flow.html',           'Data Flow')],
        'topologies':           [L('Guardium/Guardium Crytography Manager/gcm-topologies.html',          'Topologies')],
        'ha-dr-architecture':   [L('Guardium/Guardium Crytography Manager/gcm-ha-dr-architecture.html',  'HA / DR Architecture')]
      },
      deployment: {
        'requirements':      [L('Guardium/Guardium Crytography Manager/gcm-requirements.html',     'Requirements')],
        'specifications':    [L('Guardium/Guardium Crytography Manager/gcm-specifications.html',   'Specifications')],
        'sizing':            [L('Guardium/Guardium Crytography Manager/gcm-sizing.html',            'Sizing')],
        'installation':      [L('Guardium/Guardium Crytography Manager/gcm-installation.html',     'Installation')],
        'configuration':     [L('Guardium/Guardium Crytography Manager/gcm-configuration.html',    'Configuration')],
        'upgrade-migration': [L('Guardium/Guardium Crytography Manager/gcm-upgrade-migration.html','Upgrade / Migration')]
      },
      operations: {
        'day-to-day':       [L('Guardium/Guardium Crytography Manager/gcm-day-to-day.html',      'Day-to-Day Operations')],
        'monitoring':       [L('Guardium/Guardium Crytography Manager/gcm-monitoring.html',       'Monitoring')],
        'performance':      [L('Guardium/Guardium Crytography Manager/gcm-performance.html',      'Performance')],
        'maintenance':      [L('Guardium/Guardium Crytography Manager/gcm-maintenance.html',      'Maintenance')],
        'backup-recovery':  [L('Guardium/Guardium Crytography Manager/gcm-backup-recovery.html',  'Backup / Recovery')],
        'ha-dr-operations': [L('Guardium/Guardium Crytography Manager/gcm-ha-dr-operations.html', 'HA / DR Operations')],
        'tools-commands':   [L('Guardium/Guardium Crytography Manager/gcm-tools-commands.html',   'Tools / Commands')]
      },
      faq: {
        'logs':            [L('Guardium/Guardium Crytography Manager/gcm-logs.html',           'Logs')],
        'diagnostics':     [L('Guardium/Guardium Crytography Manager/gcm-diagnostics.html',    'Diagnostics')],
        'common-issues':   [L('Guardium/Guardium Crytography Manager/gcm-common-issues.html',  'Common Issues')],
        'rca':             [L('Guardium/Guardium Crytography Manager/gcm-rca.html',            'RCA')],
        'best-practices':  [L('Guardium/Guardium Crytography Manager/gcm-best-practices.html', 'Best Practices')],
        'quick-reference': [L('Guardium/Guardium Crytography Manager/gcm-quick-reference.html','Quick Reference')]
      }
    },

    edb: {
      overview: {
        'introduction':     [L('Guardium/OEM/edb-postgresql-introduction.html',    'Introduction')],
        'key-capabilities': [L('Guardium/OEM/edb-postgresql-key-capabilities.html','Key Capabilities')],
        'use-cases':        [L('Guardium/OEM/edb-postgresql-use-cases.html',       'Use Cases')],
        'terminology':      [L('Guardium/OEM/edb-postgresql-terminology.html',     'Terminology')]
      },
      architecture: {
        'architecture-diagram': [L('Guardium/OEM/edb-postgresql-architecture-diagram.html','Architecture Diagram')],
        'components':           [L('Guardium/OEM/edb-postgresql-components.html',          'Components')],
        'data-flow':            [L('Guardium/OEM/edb-postgresql-data-flow.html',           'Data Flow')],
        'topologies':           [L('Guardium/OEM/edb-postgresql-topologies.html',          'Topologies')],
        'ha-dr-architecture':   [L('Guardium/OEM/edb-postgresql-ha-dr-architecture.html',  'HA / DR Architecture')]
      },
      deployment: {
        'requirements':      [L('Guardium/OEM/edb-postgresql-requirements.html',     'Requirements')],
        'specifications':    [L('Guardium/OEM/edb-postgresql-specifications.html',   'Specifications')],
        'sizing':            [L('Guardium/OEM/edb-postgresql-sizing.html',           'Sizing')],
        'installation':      [L('Guardium/OEM/edb-postgresql-installation.html',     'Installation')],
        'configuration':     [L('Guardium/OEM/edb-postgresql-configuration.html',    'Configuration')],
        'upgrade-migration': [L('Guardium/OEM/edb-postgresql-upgrade-migration.html','Upgrade / Migration')]
      },
      operations: {
        'day-to-day':       [L('Guardium/OEM/edb-postgresql-day-to-day.html',      'Day-to-Day Operations')],
        'monitoring':       [L('Guardium/OEM/edb-postgresql-monitoring.html',       'Monitoring')],
        'performance':      [L('Guardium/OEM/edb-postgresql-performance.html',      'Performance')],
        'maintenance':      [L('Guardium/OEM/edb-postgresql-maintenance.html',      'Maintenance')],
        'backup-recovery':  [L('Guardium/OEM/edb-postgresql-backup-recovery.html',  'Backup / Recovery')],
        'ha-dr-operations': [L('Guardium/OEM/edb-postgresql-ha-dr-operations.html', 'HA / DR Operations')],
        'tools-commands':   [L('Guardium/OEM/edb-postgresql-tools-commands.html',   'Tools / Commands')]
      },
      faq: {
        'logs':            [L('Guardium/OEM/edb-postgresql-logs.html',           'Logs')],
        'diagnostics':     [L('Guardium/OEM/edb-postgresql-diagnostics.html',    'Diagnostics')],
        'common-issues':   [L('Guardium/OEM/edb-postgresql-common-issues.html',  'Common Issues')],
        'rca':             [L('Guardium/OEM/edb-postgresql-rca.html',            'RCA')],
        'best-practices':  [L('Guardium/OEM/edb-postgresql-best-practices.html', 'Best Practices')],
        'quick-reference': [L('Guardium/OEM/edb-postgresql-quick-reference.html','Quick Reference')]
      }
    },

    mongodb: {
      overview: {
        'introduction':     [L('Guardium/OEM/mongodb-introduction.html',    'Introduction')],
        'key-capabilities': [L('Guardium/OEM/mongodb-key-capabilities.html','Key Capabilities')],
        'use-cases':        [L('Guardium/OEM/mongodb-use-cases.html',       'Use Cases')],
        'terminology':      [L('Guardium/OEM/mongodb-terminology.html',     'Terminology')]
      },
      architecture: {
        'architecture-diagram': [L('Guardium/OEM/mongodb-architecture-diagram.html', 'Architecture Diagram')],
        'components':           [L('Guardium/OEM/mongodb-components.html',            'Components')],
        'data-flow':            [L('Guardium/OEM/mongodb-data-flow.html',             'Data Flow')],
        'topologies':           [L('Guardium/OEM/mongodb-topologies.html',            'Topologies')],
        'ha-dr-architecture':   [L('Guardium/OEM/mongodb-ha-dr-architecture.html',   'HA / DR Architecture')]
      },
      deployment: {
        'requirements':      [L('Guardium/OEM/mongodb-requirements.html',      'Requirements')],
        'specifications':    [L('Guardium/OEM/mongodb-specifications.html',     'Specifications')],
        'sizing':            [L('Guardium/OEM/mongodb-sizing.html',             'Sizing')],
        'installation':      [L('Guardium/OEM/mongodb-installation.html',       'Installation')],
        'configuration':     [L('Guardium/OEM/mongodb-configuration.html',      'Configuration')],
        'upgrade-migration': [L('Guardium/OEM/mongodb-upgrade-migration.html',  'Upgrade / Migration')]
      },
      operations: {
        'day-to-day':       [L('Guardium/OEM/mongodb-day-to-day.html',       'Day-to-Day Operations')],
        'monitoring':       [L('Guardium/OEM/mongodb-monitoring.html',        'Monitoring')],
        'performance':      [L('Guardium/OEM/mongodb-performance.html',       'Performance')],
        'maintenance':      [L('Guardium/OEM/mongodb-maintenance.html',       'Maintenance')],
        'backup-recovery':  [L('Guardium/OEM/mongodb-backup-recovery.html',   'Backup / Recovery')],
        'ha-dr-operations': [L('Guardium/OEM/mongodb-ha-dr-operations.html',  'HA / DR Operations')],
        'tools-commands':   [L('Guardium/OEM/mongodb-tools-commands.html',    'Tools / Commands')]
      },
      faq: {
        'logs':            [L('Guardium/OEM/mongodb-logs.html',            'Logs')],
        'diagnostics':     [L('Guardium/OEM/mongodb-diagnostics.html',     'Diagnostics')],
        'common-issues':   [L('Guardium/OEM/mongodb-common-issues.html',   'Common Issues')],
        'rca':             [L('Guardium/OEM/mongodb-rca.html',             'RCA')],
        'best-practices':  [L('Guardium/OEM/mongodb-best-practices.html',  'Best Practices')],
        'quick-reference': [L('Guardium/OEM/mongodb-quick-reference.html', 'Quick Reference')]
      }
    },

    optim: {
      overview: {
        'introduction':     [L('Optim/optim-introduction.html',    'Introduction')],
        'key-capabilities': [L('Optim/optim-key-capabilities.html','Key Capabilities')],
        'use-cases':        [L('Optim/optim-use-cases.html',       'Use Cases')],
        'terminology':      [L('Optim/optim-terminology.html',     'Terminology')]
      },
      architecture: {
        'architecture-diagram': [L('Optim/optim-architecture-diagram.html','Architecture Diagram')],
        'components':           [L('Optim/optim-components.html',          'Components')],
        'data-flow':            [L('Optim/optim-data-flow.html',           'Data Flow')],
        'topologies':           [L('Optim/optim-topologies.html',          'Topologies')],
        'ha-dr-architecture':   [L('Optim/optim-ha-dr-architecture.html',  'HA / DR Architecture')]
      },
      deployment: {
        'requirements':      [L('Optim/optim-requirements.html',     'Requirements')],
        'specifications':    [L('Optim/optim-specifications.html',   'Specifications')],
        'sizing':            [L('Optim/optim-sizing.html',           'Sizing')],
        'installation':      [L('Optim/optim-installation.html',     'Installation')],
        'configuration':     [L('Optim/optim-configuration.html',    'Configuration')],
        'upgrade-migration': [L('Optim/optim-upgrade-migration.html','Upgrade / Migration')]
      },
      operations: {
        'day-to-day':       [L('Optim/optim-day-to-day.html',      'Day-to-Day Operations')],
        'monitoring':       [L('Optim/optim-monitoring.html',       'Monitoring')],
        'performance':      [L('Optim/optim-performance.html',      'Performance')],
        'maintenance':      [L('Optim/optim-maintenance.html',      'Maintenance')],
        'backup-recovery':  [L('Optim/optim-backup-recovery.html',  'Backup / Recovery')],
        'ha-dr-operations': [L('Optim/optim-ha-dr-operations.html', 'HA / DR Operations')],
        'tools-commands':   [L('Optim/optim-tools-commands.html',   'Tools / Commands')]
      },
      faq: {
        'logs':            [L('Optim/optim-logs.html',           'Logs')],
        'diagnostics':     [L('Optim/optim-diagnostics.html',    'Diagnostics')],
        'common-issues':   [L('Optim/optim-common-issues.html',  'Common Issues')],
        'rca':             [L('Optim/optim-rca.html',            'RCA')],
        'best-practices':  [L('Optim/optim-best-practices.html', 'Best Practices')],
        'quick-reference': [L('Optim/optim-quick-reference.html','Quick Reference')]
      }
    },

    mdm: {
      overview: {
        'introduction':     [L('Master Data Management/mdm-introduction.html',    'Introduction')],
        'key-capabilities': [L('Master Data Management/mdm-key-capabilities.html','Key Capabilities')],
        'use-cases':        [L('Master Data Management/mdm-use-cases.html',       'Use Cases')],
        'terminology':      [L('Master Data Management/mdm-terminology.html',     'Terminology')]
      },
      architecture: {
        'architecture-diagram': [L('Master Data Management/mdm-architecture-diagram.html','Architecture Diagram')],
        'components':           [L('Master Data Management/mdm-components.html',          'Components')],
        'data-flow':            [L('Master Data Management/mdm-data-flow.html',           'Data Flow')],
        'topologies':           [L('Master Data Management/mdm-topologies.html',          'Topologies')],
        'ha-dr-architecture':   [L('Master Data Management/mdm-ha-dr-architecture.html',  'HA / DR Architecture')]
      },
      deployment: {
        'requirements':      [L('Master Data Management/mdm-requirements.html',     'Requirements')],
        'specifications':    [L('Master Data Management/mdm-specifications.html',   'Specifications')],
        'sizing':            [L('Master Data Management/mdm-sizing.html',           'Sizing')],
        'installation':      [L('Master Data Management/mdm-installation.html',     'Installation')],
        'configuration':     [L('Master Data Management/mdm-configuration.html',    'Configuration')],
        'upgrade-migration': [L('Master Data Management/mdm-upgrade-migration.html','Upgrade / Migration')]
      },
      operations: {
        'day-to-day':       [L('Master Data Management/mdm-day-to-day.html',      'Day-to-Day Operations')],
        'monitoring':       [L('Master Data Management/mdm-monitoring.html',       'Monitoring')],
        'performance':      [L('Master Data Management/mdm-performance.html',      'Performance')],
        'maintenance':      [L('Master Data Management/mdm-maintenance.html',      'Maintenance')],
        'backup-recovery':  [L('Master Data Management/mdm-backup-recovery.html',  'Backup / Recovery')],
        'ha-dr-operations': [L('Master Data Management/mdm-ha-dr-operations.html', 'HA / DR Operations')],
        'tools-commands':   [L('Master Data Management/mdm-tools-commands.html',   'Tools / Commands')]
      },
      faq: {
        'logs':            [L('Master Data Management/mdm-logs.html',           'Logs')],
        'diagnostics':     [L('Master Data Management/mdm-diagnostics.html',    'Diagnostics')],
        'common-issues':   [L('Master Data Management/mdm-common-issues.html',  'Common Issues')],
        'rca':             [L('Master Data Management/mdm-rca.html',            'RCA')],
        'best-practices':  [L('Master Data Management/mdm-best-practices.html', 'Best Practices')],
        'quick-reference': [L('Master Data Management/mdm-quick-reference.html','Quick Reference')]
      }
    }
  };

  function _topicLinks(productKey, sectionKey, topicKey) {
    var product = _PRODUCT_CONTENT[productKey] || {};
    var section = product[sectionKey] || {};
    return section[topicKey] || [];
  }

  function _sidebarLevel(level) {
    if (level === 0) return { row: 'snav-product-row', pages: 'snav-product-pages', data: 'data-snav' };
    if (level === 1) return { row: 'snav-category-row', pages: 'snav-category-pages', data: 'data-snav-category' };
    return { row: 'snav-subcategory-row', pages: 'snav-subcategory-pages', data: 'data-snav-subcategory' };
  }

  function _appendSidebarBranch(container, level, id, label, buildChildren) {
    var classes = _sidebarLevel(level);
    var row = document.createElement('div');
    row.className = classes.row;
    row.setAttribute(classes.data, id);
    row.appendChild(document.createTextNode(label + ' '));
    row.appendChild(_createChevron());

    var pages = document.createElement('div');
    pages.className = classes.pages + ' collapsed';
    pages.id = 'snav-' + id;
    buildChildren(pages);

    container.appendChild(row);
    container.appendChild(pages);
  }

  function _renderSidebarTaxonomy(container, productKey, prefix, startLevel) {
    _CONTENT_SECTIONS.forEach(function (section) {
      _appendSidebarBranch(container, startLevel, prefix + '-' + section.key, section.label, function (sectionPages) {
        section.topics.forEach(function (topic) {
          _appendSidebarBranch(sectionPages, startLevel + 1, prefix + '-' + section.key + '-' + topic.key, topic.label, function (topicPages) {
            var links = _topicLinks(productKey, section.key, topic.key);
            links.forEach(function (link) {
              topicPages.appendChild(_createSidebarLink(ROOT + link.href, link.label));
            });
            if (!links.length) topicPages.appendChild(_createSidebarPlaceholder());
          });
        });
      });
    });
  }

  // Flat variant: section rows have a chevron, topics are direct links (no sub-chevron)
  function _renderSidebarTaxonomyFlat(container, productKey, prefix, startLevel) {
    _CONTENT_SECTIONS.forEach(function (section) {
      _appendSidebarBranch(container, startLevel, prefix + '-' + section.key, section.label, function (sectionPages) {
        section.topics.forEach(function (topic) {
          var links = _topicLinks(productKey, section.key, topic.key);
          if (links.length) {
            sectionPages.appendChild(_createSidebarLink(ROOT + links[0].href, links[0].label));
          } else {
            sectionPages.appendChild(_createSidebarPlaceholder());
          }
        });
      });
    });
  }

  function _rebuildDirectSidebar(sectionId, productKey, prefix) {
    var section = document.getElementById(sectionId);
    if (!section) return;
    section.innerHTML = '';
    _renderSidebarTaxonomy(section, productKey, prefix, 0);
  }

  // OEM sidebar: Product branch → Section direct link (no topic sub-level)
  function _rebuildOEMSidebar(sectionId, products) {
    var section = document.getElementById(sectionId);
    if (!section) return;
    section.innerHTML = '';
    products.forEach(function (product) {
      _appendSidebarBranch(section, 0, product.prefix, product.label, function (productPages) {
        var productData = _PRODUCT_CONTENT[product.key] || {};
        _CONTENT_SECTIONS.forEach(function (sec) {
          // Find first available link for this section across all its topics
          var href = null;
          var sectionData = productData[sec.key] || {};
          sec.topics.some(function (topic) {
            var links = sectionData[topic.key] || [];
            if (links.length) { href = links[0].href; return true; }
          });
          if (href) {
            productPages.appendChild(_createSidebarLink(ROOT + href, sec.label));
          }
        });
      });
    });
  }

  function _rebuildGroupedSidebar(sectionId, products) {
    var section = document.getElementById(sectionId);
    if (!section) return;
    section.innerHTML = '';
    products.forEach(function (product) {
      _appendSidebarBranch(section, 0, product.prefix, product.label, function (productPages) {
        _renderSidebarTaxonomy(productPages, product.key, product.prefix, 1);
      });
    });
  }

  function _applyUnifiedSidebarTaxonomy() {
    // General sidebar: flat three links only
    (function () {
      var section = document.getElementById('section-general');
      if (!section) return;
      section.innerHTML = '';
      // ROOT is the module-level variable computed from wiki.js script src
      [
        { href: ROOT + 'general/general-principles.html', label: 'Deployment Principles' },
        { href: ROOT + 'general/general-licensing.html',  label: 'IBM Licensing Guide' },
        { href: ROOT + 'general/general-severity.html',   label: 'IBM Severity Guide' }
      ].forEach(function (item) {
        var a = document.createElement('a');
        a.className = 'list-group-item list-group-item-action bg-light';
        a.href = item.href;
        a.textContent = item.label;
        section.appendChild(a);
      });
    })();
    _rebuildDirectSidebar('section-db2', 'db2', 'db2');
    // Legacy: section rows with chevron, topics as direct links (flat taxonomy)
    (function () {
      var dsSection = document.getElementById('section-ds');
      if (!dsSection) return;
      dsSection.innerHTML = '';
      [
        { key: 'datastage',        prefix: 'legacy-datastage',    label: 'DataStage' },
        { key: 'cdc',              prefix: 'legacy-cdc',          label: 'CDC' },
        { key: 'dataVirtualization', prefix: 'legacy-dv',         label: 'Data Virtualization' },
        { key: 'productHub',       prefix: 'legacy-producthub',   label: 'Product Hub' }
      ].forEach(function (prod) {
        _appendSidebarBranch(dsSection, 0, prod.prefix, prod.label, function (productPages) {
          _renderSidebarTaxonomyFlat(productPages, prod.key, prod.prefix, 1);
        });
      });
    })();
    // watsonx.data: section rows with chevron, topics as direct links (flat taxonomy)
    (function () {
      var wxSection = document.getElementById('section-wx');
      if (!wxSection) return;
      wxSection.innerHTML = '';
      [
        { key: 'lakehouse',    prefix: 'wx-lakehouse',    label: 'Lakehouse' },
        { key: 'integration',  prefix: 'wx-integration',  label: 'Integration' },
        { key: 'intelligence', prefix: 'wx-intelligence', label: 'Intelligence' }
      ].forEach(function (prod) {
        _appendSidebarBranch(wxSection, 0, prod.prefix, prod.label, function (productPages) {
          _renderSidebarTaxonomyFlat(productPages, prod.key, prod.prefix, 1);
        });
      });
    })();
    // Guardium: section rows with chevron, topics as direct links
    (function () {
      var gdpSection = document.getElementById('section-gdp');
      if (!gdpSection) return;
      gdpSection.innerHTML = '';
      [
        { key: 'guardiumDataProtection', prefix: 'guardium-dp', label: 'Data Protection' },
        { key: 'guardiumDiscover',        prefix: 'guardium-dc', label: 'Discover \u0026 Classify' },
        { key: 'guardiumCrypto',          prefix: 'guardium-gcm', label: 'Cryptography Manager' }
      ].forEach(function (prod) {
        _appendSidebarBranch(gdpSection, 0, prod.prefix, prod.label, function (productPages) {
          _renderSidebarTaxonomyFlat(productPages, prod.key, prod.prefix, 1);
        });
      });
    })();
    // Optim: flat taxonomy (same structure as OEM products)
    (function () {
      var optimSection = document.getElementById('section-optim');
      if (!optimSection) return;
      optimSection.innerHTML = '';
      _renderSidebarTaxonomyFlat(optimSection, 'optim', 'optim', 0);
    })();
    // MDM: flat taxonomy (same structure as OEM products)
    (function () {
      var mdmSection = document.getElementById('section-mdm');
      if (!mdmSection) return;
      mdmSection.innerHTML = '';
      _renderSidebarTaxonomyFlat(mdmSection, 'mdm', 'mdm', 0);
    })();
    // OEM: section rows with chevron, topics as direct links
    (function () {
      var oemSection = document.getElementById('section-oem');
      if (!oemSection) return;
      oemSection.innerHTML = '';
      [
        { key: 'edb',     prefix: 'oem-edb',     label: 'EDB PostgreSQL' },
        { key: 'mongodb', prefix: 'oem-mongodb',  label: 'MongoDB' }
      ].forEach(function (prod) {
        _appendSidebarBranch(oemSection, 0, prod.prefix, prod.label, function (productPages) {
          _renderSidebarTaxonomyFlat(productPages, prod.key, prod.prefix, 1);
        });
      });
    })();
    _ensureGlossarySidebarSection();
  }

  function _renderDashboardTaxonomy(host, productKey, prefix) {
    if (!host) return;
    host.innerHTML = '';
    host.classList.add('dashboard-taxonomy');
    host.setAttribute('data-dashboard-taxonomy', productKey);

    var tabs = document.createElement('ul');
    tabs.className = 'nav nav-tabs content-subcategory-tabs dashboard-category-tabs';
    tabs.setAttribute('role', 'tablist');

    var content = document.createElement('div');
    content.className = 'tab-content content-category-content dashboard-category-content';

    _CONTENT_SECTIONS.forEach(function (section, sectionIndex) {
      var tabId = prefix + '-taxonomy-' + section.key;
      var item = document.createElement('li');
      item.className = 'nav-item';

      var tab = document.createElement('a');
      tab.className = 'nav-link' + (sectionIndex === 0 ? ' active' : '');
      tab.id = tabId + '-tab';
      tab.href = '#' + tabId;
      tab.textContent = section.label;
      tab.setAttribute('data-toggle', 'tab');
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', tabId);
      tab.setAttribute('aria-selected', sectionIndex === 0 ? 'true' : 'false');
      item.appendChild(tab);
      tabs.appendChild(item);

      var pane = document.createElement('div');
      pane.className = 'tab-pane fade' + (sectionIndex === 0 ? ' show active' : '');
      pane.id = tabId;
      pane.setAttribute('role', 'tabpanel');
      pane.setAttribute('aria-labelledby', tab.id);

      var topicList = document.createElement('div');
      topicList.className = 'dashboard-topic-list';
      section.topics.forEach(function (topic) {
        var row = document.createElement('section');
        row.className = 'dashboard-topic-row';

        var heading = document.createElement('h3');
        heading.textContent = topic.label;
        row.appendChild(heading);

        var links = _topicLinks(productKey, section.key, topic.key);
        if (links.length) {
          var list = document.createElement('ul');
          list.className = 'dashboard-topic-links';
          links.forEach(function (link) {
            var li = document.createElement('li');
            var anchor = document.createElement('a');
            anchor.href = link.href;
            anchor.textContent = link.label;
            li.appendChild(anchor);
            list.appendChild(li);
          });
          row.appendChild(list);
        } else {
          var wip = document.createElement('p');
          wip.className = 'dashboard-topic-wip';
          wip.textContent = 'Work in progress';
          row.appendChild(wip);
        }

        topicList.appendChild(row);
      });
      pane.appendChild(topicList);
      content.appendChild(pane);
    });

    host.appendChild(tabs);
    host.appendChild(content);
  }

  function _replaceDashboardPane(selector, productKey, prefix) {
    var pane = document.querySelector(selector);
    if (!pane) return;
    // Skip panes that already use the page-nav-tabs design (real page links)
    if (pane.getAttribute('data-page-nav') === 'true') return;
    var intro = pane.querySelector(':scope > .content-product-intro');
    Array.from(pane.children).forEach(function (child) {
      if (child !== intro) pane.removeChild(child);
    });
    var host = document.createElement('div');
    pane.appendChild(host);
    _renderDashboardTaxonomy(host, productKey, prefix);
  }

  function _applyUnifiedDashboardTaxonomy() {
    var db2Tabs = document.getElementById('db2-category-tabs');
    var db2Content = document.getElementById('db2-category-content');
    if (db2Tabs && db2Content && db2Tabs.parentNode) {
      var db2Host = document.createElement('div');
      db2Tabs.parentNode.insertBefore(db2Host, db2Tabs);
      db2Tabs.parentNode.removeChild(db2Tabs);
      db2Content.parentNode.removeChild(db2Content);
      _renderDashboardTaxonomy(db2Host, 'db2', 'dashboard-db2');
    }

    _replaceDashboardPane('#infosphere-datastage', 'datastage', 'dashboard-datastage');
    _replaceDashboardPane('#infosphere-cdc', 'cdc', 'dashboard-cdc');
    _replaceDashboardPane('#legacy-datavirtualization', 'dataVirtualization', 'dashboard-dv');
    _replaceDashboardPane('#legacy-producthub', 'productHub', 'dashboard-producthub');

    var groupConfigs = {
      'watsonx.data (Lakehouse)': ['lakehouse', 'dashboard-lakehouse'],
      'watsonx.data Integration': ['integration', 'dashboard-integration'],
      'watsonx.data Intelligence': ['intelligence', 'dashboard-intelligence'],
      'Guardium Data Protection': ['guardiumDataProtection', 'dashboard-guardium-dp'],
      'Guardium Discover & Classify': ['guardiumDiscover', 'dashboard-guardium-dc'],
      'Guardium Cryptography Manager': ['guardiumCrypto', 'dashboard-guardium-gcm'],
      'EDB PostgreSQL': ['edb', 'dashboard-edb'],
      'MongoDB': ['mongodb', 'dashboard-mongodb'],
      'Optim': ['optim', 'dashboard-optim'],
      'Master Data Management': ['mdm', 'dashboard-mdm']
    };

    document.querySelectorAll('.grp-product').forEach(function (product) {
      var heading = product.querySelector('.grp-product-label strong');
      var pages = product.querySelector('.grp-pages');
      var config = heading && groupConfigs[heading.textContent.trim()];
      if (pages && config) _renderDashboardTaxonomy(pages, config[0], config[1]);
    });

    var generalPanel = document.getElementById('tab-general');
    var generalContainer = generalPanel && generalPanel.querySelector('.container-fluid');
    if (generalContainer && generalPanel.getAttribute('data-page-nav') !== 'true') {
      generalContainer.querySelectorAll('.grp-product').forEach(function (product) {
        product.parentNode.removeChild(product);
      });
      var generalHost = document.createElement('div');
      generalHost.className = 'general-dashboard-taxonomy';
      generalContainer.appendChild(generalHost);
      _renderDashboardTaxonomy(generalHost, 'general', 'dashboard-general');
    }
  }

  _applyUnifiedSidebarTaxonomy();
  _applyUnifiedDashboardTaxonomy();

  function _setupSidebarExpandAll() {
    var sidebar = document.getElementById('sidebar-wrapper');
    var heading = sidebar && sidebar.querySelector(':scope > .sidebar-heading');
    if (!sidebar || !heading || document.getElementById('sidebar-expand-toggle')) return;

    var headerRow = document.createElement('div');
    headerRow.className = 'sidebar-header-row';
    sidebar.insertBefore(headerRow, heading);
    headerRow.appendChild(heading);

    var button = document.createElement('button');
    button.type = 'button';
    button.id = 'sidebar-expand-toggle';
    button.className = 'sidebar-expand-toggle';
    button.textContent = '\u229E';
    headerRow.appendChild(button);

    function isAllExpanded() {
      var topLevel = Array.from(sidebar.querySelectorAll('.sidebar-section-label'));
      var products = Array.from(sidebar.querySelectorAll('.snav-product-row'));
      var categories = Array.from(sidebar.querySelectorAll('.snav-category-row'));
      var subcategories = Array.from(sidebar.querySelectorAll('.snav-subcategory-row'));
      return topLevel.length > 0
        && topLevel.every(function (row) { return !row.classList.contains('collapsed'); })
        && products.every(function (row) { return row.classList.contains('open'); })
        && categories.every(function (row) { return row.classList.contains('open'); })
        && subcategories.every(function (row) { return row.classList.contains('open'); });
    }

    function updateButton() {
      var expanded = isAllExpanded();
      var label = expanded ? 'Collapse all sidebar sections' : 'Expand all sidebar sections';
      button.textContent = expanded ? '\u229F' : '\u229E';
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      button.setAttribute('aria-pressed', expanded ? 'true' : 'false');
    }

    function setAllExpanded(expand) {
      sidebar.querySelectorAll('.sidebar-section-label').forEach(function (label) {
        var items = label.nextElementSibling;
        label.classList.toggle('collapsed', !expand);
        if (!items || !items.classList.contains('sidebar-section-items')) return;
        items.classList.toggle('collapsed', !expand);
        items.style.height = expand ? 'auto' : '0';
      });

      sidebar.querySelectorAll('.snav-product-row, .snav-category-row, .snav-subcategory-row').forEach(function (row) {
        var pages = row.nextElementSibling;
        row.classList.toggle('open', expand);
        if (pages) pages.style.height = expand ? 'auto' : '0';
      });

      updateButton();
    }

    button.addEventListener('click', function () {
      setAllExpanded(!isAllExpanded());
    });

    sidebar.addEventListener('click', function (event) {
      if (!event.target.closest('.sidebar-section-label, .snav-product-row, .snav-category-row, .snav-subcategory-row')) return;
      requestAnimationFrame(updateButton);
    });

    updateButton();
  }

  _setupSidebarExpandAll();

  // ── Per-page update footnote ───────────────────────────────────────
  function _appendLastUpdatedFooter() {
    var page = document.getElementById('page-content-wrapper');
    var meta = document.querySelector('meta[name="last-updated"]');
    if (!page || !meta || page.querySelector('.wiki-page-footer')) return;

    var date = (meta.getAttribute('content') || '').trim();
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return;

    var footer = document.createElement('footer');
    footer.className = 'wiki-page-footer';
    footer.setAttribute('aria-label', 'Page update information');
    footer.textContent = 'Last updated: ' + date;
    page.appendChild(footer);
  }

  _appendLastUpdatedFooter();

  // ── 5. Toggle sidebar ─────────────────────────────────────────────────
  if (!window.__menuToggleRegistered) {
    var _mt = document.getElementById('menu-toggle');
    if (_mt) _mt.addEventListener('click', function () {
      document.getElementById('wrapper').classList.toggle('toggled');
    });
  }

  // ── 6. Highlight current page & auto-expand its section ──────────────
  (function () {
    var fullPath = window.location.pathname;
    var page = fullPath.split('/').pop() || 'index.html';
    var matchFound = false;

    document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(function (a) {
      if (matchFound) return;
      var href      = a.getAttribute('href') || '';
      if (href.indexOf('#glossary-') !== -1 && window.location.hash !== '#' + href.split('#')[1]) return;
      var hrefClean = href.split('?')[0].split('#')[0];
      var hrefFile  = hrefClean.split('/').pop();
      var isIndex   = (hrefFile === 'index.html');
      var isMatch   = isIndex
        ? fullPath.endsWith('/' + hrefClean.replace(/^(\.\.\/)+/, ''))
        : (hrefFile === page);
      if (!isMatch) return;
      matchFound = true;

      a.classList.add('sidebar-active');
      var items = a.closest('.sidebar-section-items');
      if (!items) return;

      items.classList.remove('collapsed');
      items.style.height = 'auto';
      var label = items.previousElementSibling;
      if (label) label.classList.remove('collapsed');

      var snavPages = a.closest('.snav-product-pages');
      var snavCategoryPages = a.closest('.snav-category-pages');
      var snavSubcategoryPages = a.closest('.snav-subcategory-pages');
      if (snavSubcategoryPages) {
        snavSubcategoryPages.style.height = 'auto';
        var snavSubcategoryRow = snavSubcategoryPages.previousElementSibling;
        if (snavSubcategoryRow && snavSubcategoryRow.classList.contains('snav-subcategory-row')) snavSubcategoryRow.classList.add('open');
      }
      if (snavCategoryPages) {
        snavCategoryPages.style.height = 'auto';
        var snavCategoryRow = snavCategoryPages.previousElementSibling;
        if (snavCategoryRow && snavCategoryRow.classList.contains('snav-category-row')) snavCategoryRow.classList.add('open');
      }
      if (snavPages) {
        snavPages.style.height = 'auto';
        var snavRow = snavPages.previousElementSibling;
        if (snavRow && snavRow.classList.contains('snav-product-row')) snavRow.classList.add('open');
      }
    });
  })();

  // ── 7–9. Snav accordion — single delegated listener on the sidebar ───
  // Using event delegation so dynamically-created rows (built by
  // _applyUnifiedSidebarTaxonomy) are always handled without needing a
  // second querySelectorAll pass or registration guards.
  (function () {
    var sidebar = document.getElementById('sidebar-wrapper');
    if (!sidebar || sidebar.getAttribute('data-snav-delegated')) return;
    sidebar.setAttribute('data-snav-delegated', 'true');

    sidebar.addEventListener('click', function (e) {
      var row = e.target.closest('.snav-product-row, .snav-category-row, .snav-subcategory-row');
      if (!row) return;
      e.stopPropagation();

      var isOpen   = row.classList.contains('open');
      var pages    = row.nextElementSibling;
      if (!pages) return;

      // ── product-row (level 0: e.g. "Integration", "DataStage") ──────
      if (row.classList.contains('snav-product-row')) {
        // Close other open product-rows in the same section
        var section = row.closest('.sidebar-section-items');
        if (section) {
          section.querySelectorAll('.snav-product-row.open').forEach(function (other) {
            if (other === row) return;
            other.classList.remove('open');
            var op = other.nextElementSibling;
            if (op) op.style.height = '0';
          });
        }
        if (isOpen) {
          row.classList.remove('open');
          pages.style.height = '0';
        } else {
          row.classList.add('open');
          pages.style.height = 'auto';
        }
        return;
      }

      // ── category-row (level 1: e.g. "Overview", "Operations") ───────
      if (row.classList.contains('snav-category-row')) {
        var productPages = row.closest('.snav-product-pages');
        // Close other open category-rows in the same product panel
        if (productPages) {
          Array.from(productPages.children).forEach(function (other) {
            if (other === row || !other.classList.contains('snav-category-row') || !other.classList.contains('open')) return;
            other.classList.remove('open');
            var op = other.nextElementSibling;
            if (op) op.style.height = '0';
          });
          productPages.style.height = 'auto';
        }
        if (isOpen) {
          row.classList.remove('open');
          pages.style.height = '0';
        } else {
          row.classList.add('open');
          pages.style.height = 'auto';
        }
        return;
      }

      // ── subcategory-row (level 2) ────────────────────────────────────
      if (row.classList.contains('snav-subcategory-row')) {
        var catPages = row.closest('.snav-category-pages');
        if (catPages) {
          Array.from(catPages.children).forEach(function (other) {
            if (other === row || !other.classList.contains('snav-subcategory-row') || !other.classList.contains('open')) return;
            other.classList.remove('open');
            var op = other.nextElementSibling;
            if (op) op.style.height = '0';
          });
          catPages.style.height = 'auto';
        }
        var prodPages = row.closest('.snav-product-pages');
        if (prodPages) prodPages.style.height = 'auto';
        if (isOpen) {
          row.classList.remove('open');
          pages.style.height = '0';
        } else {
          row.classList.add('open');
          pages.style.height = 'auto';
        }
      }
    });
  })();

  // ── 10. Smooth accordion sidebar sections ────────────────────────────
  (function () {
    var labels = Array.from(document.querySelectorAll('.sidebar-section-label'));

    function collapse(label, items) {
      items.style.height = items.getBoundingClientRect().height + 'px';
      requestAnimationFrame(function () { requestAnimationFrame(function () { items.style.height = '0'; }); });
      label.classList.add('collapsed');
      items.classList.add('collapsed');
    }

    function expand(label, items) {
      items.classList.remove('collapsed');
      label.classList.remove('collapsed');
      // Measure full height before collapsing so display:none ancestors don't return 0
      items.style.transition = 'none';
      items.style.height = 'auto';
      var target = items.getBoundingClientRect().height + 'px';
      items.style.height = '0';
      items.getBoundingClientRect(); // force reflow
      items.style.transition = '';
      requestAnimationFrame(function () { requestAnimationFrame(function () { items.style.height = target; }); });
      items.addEventListener('transitionend', function onEnd() {
        items.removeEventListener('transitionend', onEnd);
        items.style.height = 'auto';
      });
    }

    labels.forEach(function (label) {
      label.addEventListener('click', function () {
        var items = label.nextElementSibling;
        if (!items || !items.classList.contains('sidebar-section-items')) return;
        var isCollapsed = label.classList.contains('collapsed');
        labels.forEach(function (other) {
          if (other === label) return;
          var otherItems = other.nextElementSibling;
          if (!otherItems || !otherItems.classList.contains('sidebar-section-items')) return;
          if (!other.classList.contains('collapsed')) collapse(other, otherItems);
        });
        if (isCollapsed) expand(label, items); else collapse(label, items);
      });
    });
  })();

})();
