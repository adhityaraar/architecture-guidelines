// ── Toggle sidebar (hamburger button)
document.getElementById('menu-toggle').addEventListener('click', function() {
  document.getElementById('wrapper').classList.toggle('toggled');
});

// ── Collapsible sidebar sections
// Each .sidebar-section-label toggles its sibling .sidebar-section-items
document.querySelectorAll('.sidebar-section-label').forEach(function(label) {
  label.addEventListener('click', function() {
    var items = label.nextElementSibling;
    if (!items || !items.classList.contains('sidebar-section-items')) return;
    label.classList.toggle('collapsed');
    items.classList.toggle('collapsed');
  });
});

// ── Highlight current page & auto-expand its section
(function() {
  var page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(function(a) {
    if (a.getAttribute('href') === page) {
      a.classList.add('sidebar-active');
      // Ensure the parent section is expanded
      var items = a.closest('.sidebar-section-items');
      if (items) {
        items.classList.remove('collapsed');
        var label = items.previousElementSibling;
        if (label) label.classList.remove('collapsed');
      }
    }
  });
})();
