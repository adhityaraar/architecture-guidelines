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
  // ROOT is now '' for index.html, '../' for depth-1, '../../' for depth-2 etc.

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
      label: 'IIS DataStage',
      tab: 'tab-infosphere',
      tabLabel: 'LEGACY',
      badgeColor: '#0f7b5e',
      badgeBg: '#e6f4ee',
      headings: ['IIS DataStage', 'DataStage HA Overview', 'Architecture Components'],
      body: 'IBM InfoSphere Information Server IIS DataStage architecture client tools services tier repository tier engine tier ETL design scheduling metadata parallel execution',
      href: 'InfoSphere/DataStage/ds-overview.html#iis-datastage'
    },
    {
      label: 'DataStage Sizing',
      tab: 'tab-infosphere',
      tabLabel: 'LEGACY',
      badgeColor: '#0f7b5e',
      badgeBg: '#e6f4ee',
      headings: ['DataStage Sizing', 'Sizing Questions', 'Planning Notes', 'Job Complexity Glossary'],
      body: 'InfoSphere DataStage sizing questionnaire throughput execution window processing overlap job complexity operations console engine tier clustering active passive high availability services repository topology data growth simple medium complex very complex',
      href: 'InfoSphere/DataStage/ds-sizing.html'
    },
    {
      label: 'DataStage FAQ',
      tab: 'tab-infosphere',
      tabLabel: 'LEGACY',
      badgeColor: '#0f7b5e',
      badgeBg: '#e6f4ee',
      headings: ['DataStage FAQ', 'Frequently Asked Questions'],
      body: 'InfoSphere DataStage FAQ sizing architecture HADR diagnostics day to day operations engine repository services monitoring job restart failover scratch disk dataset',
      href: 'InfoSphere/DataStage/ds-faq.html'
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
        files: ['index.html', 'sizing.html', 'hadrBenefits.html', 'featureHistory.html', 'hadrTutorial.html']
      },
      {
        id: 'db2-architecture',
        label: 'Architecture',
        files: ['hadrConfig.html', 'hadrSyncMode.html', 'hadrLogShipping.html', 'clientReroute.html', 'clusterManagers.html', 'hadrPureScale.html', 'tcpTuning.html']
      },
      {
        id: 'db2-hadr',
        label: 'HADR',
        files: ['hadrPerf.html', 'hadrTakeover.html', 'hadrCommands.html', 'hadrMonitoring.html', 'hadrSimulator.html', 'simulatorOptions.html', 'simulatorOutput.html', 'simulatorParams.html']
      },
      {
        id: 'db2-diag',
        label: 'Diagnostics',
        files: ['diagConnect.html', 'db2diag.html', 'db2MustGather.html', 'db2logscan.html', 'db2fmtlog.html', 'perfTuning.html']
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
      if (!pages.children.length) return;

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

  _categorizeDb2Sidebar();

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
          { id: 'ds-overview', label: 'Overview', files: ['ds-overview.html', 'ds-sizing.html'] },
          { id: 'ds-architecture', label: 'Architecture', files: ['ds-topology.html'] },
          { id: 'ds-hadr', label: 'HADR', files: ['ds-engine.html', 'ds-repo.html', 'ds-recovery.html', 'ds-checklist.html'] },
          { id: 'ds-diagnostics', label: 'Diagnostics', files: ['ds-monitoring.html'] },
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
          { id: 'cdc-diagnostics', label: 'Diagnostics', files: [] },
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
          { id: 'dv-diagnostics', label: 'Diagnostics', files: [] },
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
          { id: 'ph-diagnostics', label: 'Diagnostics', files: [] },
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
        'ds-sizing.html': {
          label: 'Sizing',
          href: ROOT + 'InfoSphere/DataStage/ds-sizing.html'
        },
        'ds-faq.html': {
          label: 'FAQ',
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
        if (byFile[file]) return;
        byFile[file] = _createSidebarLink(knownPages[file].href, knownPages[file].label);
        productPages.appendChild(byFile[file]);
      });

      productPages.setAttribute('data-product-categorized', 'true');
      _groupSidebarCategories(productPages, product.categories, true);
    });

    section.setAttribute('data-infosphere-categorized', 'true');
  }

  _categorizeInfosphereSidebar();

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
      { id: 'wx-lakehouse-diagnostics', label: 'Diagnostics', files: [] },
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
      { id: 'wx-integration-diagnostics', label: 'Diagnostics', files: [] },
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
      { id: 'wx-intelligence-diagnostics', label: 'Diagnostics', files: [] },
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
      { id: 'gdp-dp-diagnostics', label: 'Diagnostics', files: [] },
      { id: 'gdp-dp-faq', label: 'FAQ', files: [] }
    ], true);

    var discoverPages = _ensureProductPages(section, 'gdp-dc', 'Discover & Classify');
    _appendLinkIfMissing(discoverPages, 'gdc-overview.html', ROOT + 'Guardium/Guardium Discover and Classify/gdc-overview.html', 'Overview');
    _appendLinkIfMissing(discoverPages, 'gdc-sizing.html', ROOT + 'Guardium/Guardium Discover and Classify/gdc-sizing.html', 'Sizing');
    _groupSidebarCategories(discoverPages, [
      { id: 'gdp-dc-overview', label: 'Overview', files: ['gdc-overview.html', 'gdc-sizing.html'] },
      { id: 'gdp-dc-architecture', label: 'Architecture', files: [] },
      { id: 'gdp-dc-hadr', label: 'HADR', files: [] },
      { id: 'gdp-dc-diagnostics', label: 'Diagnostics', files: [] },
      { id: 'gdp-dc-faq', label: 'FAQ', files: [] }
    ], true);

    var cryptoPages = _ensureProductPages(section, 'gdp-cm', 'Cryptography Manager');
    _appendLinkIfMissing(cryptoPages, 'gcm-overview.html', ROOT + 'Guardium/Guardium Crytography Manager/gcm-overview.html', 'Overview');
    _appendLinkIfMissing(cryptoPages, 'gcm-installation.html', ROOT + 'Guardium/Guardium Crytography Manager/gcm-installation.html', 'Installation Requirements');
    _appendLinkIfMissing(cryptoPages, 'gcm-sizing.html', ROOT + 'Guardium/Guardium Crytography Manager/gcm-sizing.html', 'Sizing');
    _groupSidebarCategories(cryptoPages, [
      { id: 'gdp-cm-overview', label: 'Overview', files: ['gcm-overview.html', 'gcm-installation.html', 'gcm-sizing.html'] },
      { id: 'gdp-cm-architecture', label: 'Architecture', files: [] },
      { id: 'gdp-cm-hadr', label: 'HADR', files: [] },
      { id: 'gdp-cm-diagnostics', label: 'Diagnostics', files: [] },
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

  function _augmentTopLevelSidebar() {
    _ensureTopLevelSection('section-optim', 'optim', 'Optim', ROOT + 'Optim/optim-overview.html', 'Overview');
    var optimPages = document.getElementById('section-optim');
    _appendLinkIfMissing(optimPages, 'optim-overview.html', ROOT + 'Optim/optim-overview.html', 'Overview');
    _appendLinkIfMissing(optimPages, 'optim-sizing.html', ROOT + 'Optim/optim-sizing.html', 'Sizing');
    _groupSidebarCategories(optimPages, [
      { id: 'optim-overview', label: 'Overview', files: ['optim-overview.html', 'optim-sizing.html'] },
      { id: 'optim-architecture', label: 'Architecture', files: [] },
      { id: 'optim-hadr', label: 'HADR', files: [] },
      { id: 'optim-diagnostics', label: 'Diagnostics', files: [] },
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
      { id: 'mdm-diagnostics', label: 'Diagnostics', files: [] },
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
      { id: 'oem-edb-diagnostics', label: 'Diagnostics', files: [] },
      { id: 'oem-edb-faq', label: 'FAQ', files: [] }
    ], true);

    var mongoPages = _ensureProductPages(section, 'oem-mongodb', 'MongoDB');
    _appendLinkIfMissing(mongoPages, 'mongodb.html', ROOT + 'Guardium/OEM/mongodb.html', 'Overview');
    _appendLinkIfMissing(mongoPages, 'mongodb-sizing.html', ROOT + 'Guardium/OEM/mongodb-sizing.html', 'Sizing');
    _groupSidebarCategories(mongoPages, [
      { id: 'oem-mongodb-overview', label: 'Overview', files: ['mongodb.html', 'mongodb-sizing.html'] },
      { id: 'oem-mongodb-architecture', label: 'Architecture', files: [] },
      { id: 'oem-mongodb-hadr', label: 'HADR', files: [] },
      { id: 'oem-mongodb-diagnostics', label: 'Diagnostics', files: [] },
      { id: 'oem-mongodb-faq', label: 'FAQ', files: [] }
    ], true);

    section.setAttribute('data-oem-grouped', 'true');
  }

  _augmentWatsonxSidebar();
  _augmentGuardiumSidebar();
  _augmentTopLevelSidebar();
  _normalizeOemSidebar();

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
      return topLevel.length > 0
        && topLevel.every(function (row) { return !row.classList.contains('collapsed'); })
        && products.every(function (row) { return row.classList.contains('open'); })
        && categories.every(function (row) { return row.classList.contains('open'); });
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

      sidebar.querySelectorAll('.snav-product-row, .snav-category-row').forEach(function (row) {
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
      if (!event.target.closest('.sidebar-section-label, .snav-product-row, .snav-category-row')) return;
      requestAnimationFrame(updateButton);
    });

    updateButton();
  }

  _setupSidebarExpandAll();

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

    document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(function (a) {
      var href      = a.getAttribute('href') || '';
      var hrefClean = href.split('?')[0];
      var hrefFile  = hrefClean.split('/').pop();
      var isIndex   = (hrefFile === 'index.html');
      var isMatch   = isIndex
        ? fullPath.endsWith('/' + hrefClean.replace(/^(\.\.\/)+/, ''))
        : (hrefFile === page);
      if (!isMatch) return;

      a.classList.add('sidebar-active');
      var items = a.closest('.sidebar-section-items');
      if (!items) return;

      items.classList.remove('collapsed');
      items.style.height = 'auto';
      var label = items.previousElementSibling;
      if (label) label.classList.remove('collapsed');

      var snavPages = a.closest('.snav-product-pages');
      var snavCategoryPages = a.closest('.snav-category-pages');
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

  // ── 7. Snav sub-product accordion ────────────────────────────────────
  if (!window.__snavAccordionRegistered) {
    window.__snavAccordionRegistered = true;
    document.querySelectorAll('.snav-product-row').forEach(function (row) {
      row.addEventListener('click', function () {
        var pages   = row.nextElementSibling; // .snav-product-pages
        var isOpen  = row.classList.contains('open');
        var section = row.closest('.sidebar-section-items');

        // Collapse any other open sibling in the same section
        section.querySelectorAll('.snav-product-row.open').forEach(function (other) {
          if (other === row) return;
          other.classList.remove('open');
          var op = other.nextElementSibling;
          op.style.height = op.getBoundingClientRect().height + 'px';
          requestAnimationFrame(function () { requestAnimationFrame(function () { op.style.height = '0'; }); });
        });

        if (isOpen) {
          row.classList.remove('open');
          pages.style.height = pages.getBoundingClientRect().height + 'px';
          requestAnimationFrame(function () { requestAnimationFrame(function () { pages.style.height = '0'; }); });
        } else {
          row.classList.add('open');
          pages.style.height = '0';
          var target = pages.scrollHeight + 'px';
          requestAnimationFrame(function () { requestAnimationFrame(function () { pages.style.height = target; }); });
          pages.addEventListener('transitionend', function once() {
            pages.removeEventListener('transitionend', once);
            if (row.classList.contains('open')) pages.style.height = 'auto';
          });
        }
      });
    });
  }

  // ── 8. Snav nested category accordion ────────────────────────────────
  if (!window.__snavCategoryAccordionRegistered) {
    window.__snavCategoryAccordionRegistered = true;
    document.querySelectorAll('.snav-category-row').forEach(function (row) {
      row.addEventListener('click', function () {
        var pages = row.nextElementSibling; // .snav-category-pages
        var isOpen = row.classList.contains('open');
        var productPages = row.closest('.snav-product-pages');

        Array.from(productPages.children).forEach(function (other) {
          if (other === row || !other.classList || !other.classList.contains('snav-category-row') || !other.classList.contains('open')) return;
          other.classList.remove('open');
          var otherPages = other.nextElementSibling;
          otherPages.style.height = otherPages.getBoundingClientRect().height + 'px';
          requestAnimationFrame(function () { requestAnimationFrame(function () { otherPages.style.height = '0'; }); });
        });

        if (isOpen) {
          row.classList.remove('open');
          pages.style.height = pages.getBoundingClientRect().height + 'px';
          requestAnimationFrame(function () { requestAnimationFrame(function () { pages.style.height = '0'; }); });
        } else {
          row.classList.add('open');
          pages.style.height = '0';
          var target = pages.scrollHeight + 'px';
          requestAnimationFrame(function () { requestAnimationFrame(function () { pages.style.height = target; }); });
          pages.addEventListener('transitionend', function once() {
            pages.removeEventListener('transitionend', once);
            if (row.classList.contains('open')) pages.style.height = 'auto';
          });
        }

        if (productPages && productPages.style.height !== 'auto') {
          productPages.style.height = 'auto';
        }
      });
    });
  }

  // ── 9. Smooth accordion sidebar sections ─────────────────────────────
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
