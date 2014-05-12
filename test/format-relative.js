module('relative-time');

test('rewrites from now past datetime to minutes ago', function() {
  var now = new Date(Date.now() - 3 * 60 * 1000).toISOString();
  var time = document.createElement('time', 'relative-time');
  time.setAttribute('datetime', now);
  equal(time.textContent, '3 minutes ago');
});

test('rewrites a few seconds ago to just now', function() {
  var now = new Date().toISOString();
  var time = document.createElement('time', 'relative-time');
  time.setAttribute('datetime', now);
  equal(time.textContent, 'just now');
});

test('displays future times as just now', function() {
  var now = new Date(Date.now() + 3 * 1000).toISOString();
  var time = document.createElement('time', 'relative-time');
  time.setAttribute('datetime', now);
  equal(time.textContent, 'just now');
});

test('sets relative contents when parsed element is upgraded', function() {
  var now = new Date().toISOString();
  var root = document.createElement('div');
  root.innerHTML = '<time is="relative-time" datetime="'+now+'"></time>';
  if ('CustomElements' in window) {
    window.CustomElements.upgradeSubtree(root);
  }
  equal(root.children[0].textContent, 'just now');
});
