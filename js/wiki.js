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
  // Number of '/' segments below the architecture/ root
  var _depth  = (_path.match(/\//g) || []).length - 1;
  // Find the architecture root by walking up
  var _parts  = _path.split('/').filter(Boolean);
  var _rootIdx = -1;
  for (var _i = _parts.length - 1; _i >= 0; _i--) {
    if (_parts[_i] === 'architecture') { _rootIdx = _i; break; }
  }
  // prefix = number of '../' needed to reach architecture/
  var _levelsBelow = _rootIdx >= 0 ? (_parts.length - 1 - _rootIdx) : 0;
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
      if (sectionId.indexOf('db2') >= 0)     { tabLabel = 'DB2';          badgeColor = '#6d28d9'; badgeBg = '#ede9fb'; }
      else if (sectionId.indexOf('ds') >= 0) { tabLabel = 'InfoSphere';   badgeColor = '#0f7b5e'; badgeBg = '#e6f4ee'; }
      else if (sectionId.indexOf('wx') >= 0) { tabLabel = 'watsonx.data'; badgeColor = '#0550ae'; badgeBg = '#e6f0fb'; }
      else if (sectionId.indexOf('gdp') >= 0){ tabLabel = 'Guardium';     badgeColor = '#b91c1c'; badgeBg = '#fde8e8'; }
      entries.push({ label: label, headings: [], body: label, tabLabel: tabLabel,
                     badgeColor: badgeColor, badgeBg: badgeBg, href: href, tab: sectionId });
    });
    return entries;
  }

  function _ensureIndex(cb) {
    if (_idxLoaded) { cb(); return; }
    // Use inline index if available (injected by build script, works on file://)
    if (window.__SEARCH_INDEX) {
      _INDEX = window.__SEARCH_INDEX; _idxLoaded = true; cb(); return;
    }
    if (_drop) { _drop.innerHTML = '<div class="sr-empty">Loading\u2026</div>'; _drop.classList.add('open'); }
    fetch(ROOT + 'search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { _INDEX = data; _idxLoaded = true; cb(); })
      .catch(function () {
        // fetch failed (e.g. file:// protocol) — fall back to sidebar links
        _INDEX = _buildSidebarIndex();
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
          // We're on a sub-page — navigate to index with hash
          window.location.href = ROOT + 'index.html#tab-db2';
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

  // ── 3. Toggle sidebar ─────────────────────────────────────────────────
  if (!window.__menuToggleRegistered) {
    var _mt = document.getElementById('menu-toggle');
    if (_mt) _mt.addEventListener('click', function () {
      document.getElementById('wrapper').classList.toggle('toggled');
    });
  }

  // ── 4. Highlight current page & auto-expand its section ──────────────
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
      if (snavPages) {
        snavPages.style.height = 'auto';
        var snavRow = snavPages.previousElementSibling;
        if (snavRow && snavRow.classList.contains('snav-product-row')) snavRow.classList.add('open');
      }
    });
  })();

  // ── 5. Snav sub-product accordion (InfoSphere, watsonx.data, Guardium) ──
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

  // ── 6. Smooth accordion sidebar sections ─────────────────────────────
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
