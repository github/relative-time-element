module('time-to-go');

test('always uses relative dates', function() {
  var now = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
  var time = document.createElement('time', 'time-to-go');
  time.setAttribute('datetime', now);
  equal(time.textContent, 'in 10 years');
});

test('rewrites from now future datetime to in minutes', function() {
  var now = new Date(Date.now() + 3 * 60 * 1000).toISOString();
  var time = document.createElement('time', 'time-to-go');
  time.setAttribute('datetime', now);
  equal(time.textContent, 'in 3 minutes');
});

test('rewrites in a few seconds to before now', function() {
  var now = new Date().toISOString();
  var time = document.createElement('time', 'time-to-go');
  time.setAttribute('datetime', now);
  equal(time.textContent, 'before now');
});

test('displays past times as before now', function() {
  var now = new Date(Date.now() - 3 * 1000).toISOString();
  var time = document.createElement('time', 'time-to-go');
  time.setAttribute('datetime', now);
  equal(time.textContent, 'before now');
});

test('sets relative contents when parsed element is upgraded', function() {
  var now = new Date().toISOString();
  var root = document.createElement('div');
  root.innerHTML = '<time is="time-to-go" datetime="'+now+'"></time>';
  if ('CustomElements' in window) {
    window.CustomElements.upgradeSubtree(root);
  }
  equal(root.children[0].textContent, 'before now');
});

test('sets custom relative contents when parsed element is upgraded', function() {
  var now = new Date().toISOString();
  var root = document.createElement('div');
  root.innerHTML = '<time is="time-to-go" just-now="expired" datetime="'+now+'"></time>';
  if ('CustomElements' in window) {
    window.CustomElements.upgradeSubtree(root);
  }
  equal(root.children[0].textContent, 'expired');
});

test('micro formats years', function() {
  var now = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
  var time = document.createElement('time', 'time-to-go');
  time.setAttribute('datetime', now);
  time.setAttribute('format', 'micro');
  equal(time.textContent, '10y');
});

test('micro formats past times', function() {
  var now = new Date(Date.now() - 3 * 1000).toISOString();
  var time = document.createElement('time', 'time-to-go');
  time.setAttribute('datetime', now);
  time.setAttribute('format', 'micro');
  equal(time.textContent, '1m');
});

test('micro formats hours', function() {
  var now = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  var time = document.createElement('time', 'time-to-go');
  time.setAttribute('datetime', now);
  time.setAttribute('format', 'micro');
  equal(time.textContent, '1h');
});

test('micro formats days', function() {
  var now = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();
  var time = document.createElement('time', 'time-to-go');
  time.setAttribute('datetime', now);
  time.setAttribute('format', 'micro');
  equal(time.textContent, '1d');
});
