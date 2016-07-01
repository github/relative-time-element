module('time-until');

test('always uses relative dates', function() {
  var now = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
  var time = document.createElement('time', 'time-until');
  time.setAttribute('datetime', now);
  equal(time.textContent, '10 years from now');
});

test('rewrites from now future datetime to minutes ago', function() {
  var now = new Date(Date.now() + 3 * 60 * 1000).toISOString();
  var time = document.createElement('time', 'time-until');
  time.setAttribute('datetime', now);
  equal(time.textContent, '3 minutes from now');
});

test('rewrites a few seconds from now to just now', function() {
  var now = new Date().toISOString();
  var time = document.createElement('time', 'time-until');
  time.setAttribute('datetime', now);
  equal(time.textContent, 'just now');
});

test('displays past times as just now', function() {
  var now = new Date(Date.now() + 3 * 1000).toISOString();
  var time = document.createElement('time', 'time-until');
  time.setAttribute('datetime', now);
  equal(time.textContent, 'just now');
});

test('sets relative contents when parsed element is upgraded', function() {
  var now = new Date().toISOString();
  var root = document.createElement('div');
  root.innerHTML = '<time is="time-until" datetime="'+now+'"></time>';
  if ('CustomElements' in window) {
    window.CustomElements.upgradeSubtree(root);
  }
  equal(root.children[0].textContent, 'just now');
});

test('micro formats years', function() {
  var now = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
  var time = document.createElement('time', 'time-until');
  time.setAttribute('datetime', now);
  time.setAttribute('format', 'micro');
  equal(time.textContent, '10y');
});

test('micro formats past times', function() {
  var now = new Date(Date.now() + 3 * 1000).toISOString();
  var time = document.createElement('time', 'time-until');
  time.setAttribute('datetime', now);
  time.setAttribute('format', 'micro');
  equal(time.textContent, '1m');
});

test('micro formats hours', function() {
  var now = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  var time = document.createElement('time', 'time-until');
  time.setAttribute('datetime', now);
  time.setAttribute('format', 'micro');
  equal(time.textContent, '1h');
});

test('micro formats days', function() {
  var now = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();
  var time = document.createElement('time', 'time-until');
  time.setAttribute('datetime', now);
  time.setAttribute('format', 'micro');
  equal(time.textContent, '1d');
});
