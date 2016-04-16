module('time-ago');

test('always uses relative dates', function() {
  var now = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
  var time = document.createElement('time-ago');
  time.setAttribute('datetime', now);
  equal(time.textContent, '10 years ago');
});

test('rewrites from now past datetime to minutes ago', function() {
  var now = new Date(Date.now() - 3 * 60 * 1000).toISOString();
  var time = document.createElement('time-ago');
  time.setAttribute('datetime', now);
  equal(time.textContent, '3 minutes ago');
});

test('rewrites a few seconds ago to just now', function() {
  var now = new Date().toISOString();
  var time = document.createElement('time-ago');
  time.setAttribute('datetime', now);
  equal(time.textContent, 'just now');
});

test('displays future times as just now', function() {
  var now = new Date(Date.now() + 3 * 1000).toISOString();
  var time = document.createElement('time-ago');
  time.setAttribute('datetime', now);
  equal(time.textContent, 'just now');
});

test('sets relative contents when parsed element is upgraded', function() {
  var now = new Date().toISOString();
  var root = document.createElement('div');
  root.innerHTML = '<time-ago datetime="'+now+'"></time-ago>';
  if ('CustomElements' in window) {
    window.CustomElements.upgradeSubtree(root);
  }
  equal(root.children[0].textContent, 'just now');
});

test('sets custom relative contents when parsed element is upgraded', function() {
  var now = new Date().toISOString();
  var root = document.createElement('div');
  root.innerHTML = '<time is="time-ago" just-now="expired" datetime="'+now+'"></time>';
  if ('CustomElements' in window) {
    window.CustomElements.upgradeSubtree(root);
  }
  equal(root.children[0].textContent, 'expired');
});

test('micro formats years', function() {
  var now = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
  var time = document.createElement('time-ago');
  time.setAttribute('datetime', now);
  time.setAttribute('format', 'micro');
  equal(time.textContent, '10y');
});

test('micro formats future times', function() {
  var now = new Date(Date.now() + 3 * 1000).toISOString();
  var time = document.createElement('time-ago');
  time.setAttribute('datetime', now);
  time.setAttribute('format', 'micro');
  equal(time.textContent, '1m');
});

test('micro formats hours', function() {
  var now = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  var time = document.createElement('time-ago');
  time.setAttribute('datetime', now);
  time.setAttribute('format', 'micro');
  equal(time.textContent, '1h');
});

test('micro formats days', function() {
  var now = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  var time = document.createElement('time-ago');
  time.setAttribute('datetime', now);
  time.setAttribute('format', 'micro');
  equal(time.textContent, '1d');
});
