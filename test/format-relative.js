module('format=relative');

test('getFormattedFromDate for datetime and from=now attributes', function() {
  var minsAgo = new Date(Date.now() - 180000).toISOString();
  var time = document.createElement('local-time');
  time.setAttribute('datetime', minsAgo);
  time.setAttribute('format', 'relative');
  equal(time.getFormattedDate(), '3 minutes ago');
});

test('rewrites from now past datetime to minutes ago', function() {
  var now = new Date(Date.now() - 180000).toISOString();
  var time = document.createElement('local-time');
  time.setAttribute('datetime', now);
  time.setAttribute('format', 'relative');
  equal(time.textContent, '3 minutes ago');
});

test('rewrites a few seconds ago to just now', function() {
  var now = new Date().toISOString();
  var time = document.createElement('local-time');
  time.setAttribute('datetime', now);
  time.setAttribute('format', 'relative');
  equal(time.textContent, 'just now');
});

test('displays future times as just now', function() {
  var now = new Date(Date.now() + 3000).toISOString();
  var time = document.createElement('local-time');
  time.setAttribute('datetime', now);
  time.setAttribute('format', 'relative');
  equal(time.textContent, 'just now');
});

test('sets relative contents when parsed element is upgraded', function() {
  var now = new Date().toISOString();
  var root = document.createElement('div');
  root.innerHTML = '<local-time datetime="'+now+'" format=relative></local-time>';
  if ('CustomElements' in window) {
    window.CustomElements.upgradeSubtree(root);
  }
  equal(root.children[0].textContent, 'just now');
});
