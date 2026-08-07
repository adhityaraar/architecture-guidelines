// ── Toggle sidebar (hamburger button)
document.getElementById('menu-toggle').addEventListener('click', function() {
  document.getElementById('wrapper').classList.toggle('toggled');
});

// ── Highlight current page & auto-expand its section ──
// Runs FIRST so the open section has correct height before accordion attaches.
(function() {
  var fullPath = window.location.pathname;
  var page = fullPath.split('/').pop() || 'index.html';

  document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(function(a) {
    var href = a.getAttribute('href') || '';
    var hrefClean = href.split('?')[0];
    var hrefFile  = hrefClean.split('/').pop();
    // For index.html use full path suffix to avoid db2/index.html matching root index.html.
    // For all other pages a simple filename match is sufficient.
    var isIndex = (hrefFile === 'index.html');
    var isMatch = isIndex
      ? fullPath.endsWith('/' + hrefClean.replace(/^(\.\.\/)+/, ''))
      : (hrefFile === page);
    if (!isMatch) return;

    a.classList.add('sidebar-active');
    var items = a.closest('.sidebar-section-items');
    if (!items) return;

    // Open this section immediately (no animation on load)
    items.classList.remove('collapsed');
    items.style.height = 'auto';                  // let it size naturally
    var label = items.previousElementSibling;
    if (label) label.classList.remove('collapsed');

    // Also open any parent .snav-product-pages the active link lives inside
    var snavPages = a.closest('.snav-product-pages');
    if (snavPages) {
      snavPages.style.height = 'auto';
      var snavRow = snavPages.previousElementSibling;
      if (snavRow && snavRow.classList.contains('snav-product-row')) {
        snavRow.classList.add('open');
      }
    }
  });
})();

// ── Smooth accordion sidebar sections ──
// Opens the clicked section; closes all others.
(function() {
  var labels = Array.from(document.querySelectorAll('.sidebar-section-label'));

  // Collapse one panel smoothly
  function collapse(label, items) {
    // Pin to current rendered height before animating to 0
    items.style.height = items.getBoundingClientRect().height + 'px';
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        items.style.height = '0';
      });
    });
    label.classList.add('collapsed');
    items.classList.add('collapsed');
  }

  // Expand one panel smoothly
  function expand(label, items) {
    // Make visible but measure its natural height
    items.classList.remove('collapsed');
    label.classList.remove('collapsed');
    items.style.height = '0';
    var target = items.scrollHeight + 'px';
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        items.style.height = target;
      });
    });
    items.addEventListener('transitionend', function onEnd() {
      items.removeEventListener('transitionend', onEnd);
      items.style.height = 'auto';               // free after animation
    });
  }

  labels.forEach(function(label) {
    label.addEventListener('click', function() {
      var items = label.nextElementSibling;
      if (!items || !items.classList.contains('sidebar-section-items')) return;

      var isCollapsed = label.classList.contains('collapsed');

      // Close every OTHER open section
      labels.forEach(function(otherLabel) {
        if (otherLabel === label) return;
        var otherItems = otherLabel.nextElementSibling;
        if (!otherItems || !otherItems.classList.contains('sidebar-section-items')) return;
        if (!otherLabel.classList.contains('collapsed')) {
          collapse(otherLabel, otherItems);
        }
      });

      // Toggle clicked section
      if (isCollapsed) {
        expand(label, items);
      } else {
        collapse(label, items);
      }
    });
  });
})();
