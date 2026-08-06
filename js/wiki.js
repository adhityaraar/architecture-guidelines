// Toggle sidebar
document.getElementById('menu-toggle').addEventListener('click', function() {
  document.getElementById('wrapper').classList.toggle('toggled');
});

// Highlight current page in sidebar
(function() {
  var page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#sidebar-wrapper .list-group-item').forEach(function(a) {
    if (a.getAttribute('href') === page) {
      a.classList.add('sidebar-active');
    }
  });
})();
