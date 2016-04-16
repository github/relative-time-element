module('relative-time-to-go');

test('rewrites from now future datetime to in minutes', function() {
  var now = new Date(Date.now() + 3 * 60 * 1000).toISOString();
  var time = document.createElement('time', 'relative-time-to-go');
  time.setAttribute('datetime', now);
  equal(time.textContent, 'in 3 minutes');
});

test('rewrites a few seconds to before now', function() {
  var now = new Date().toISOString();
  var time = document.createElement('time', 'relative-time-to-go');
  time.setAttribute('datetime', now);
  equal(time.textContent, 'before now');
});

test('displays past times as before now', function() {
  var now = new Date(Date.now() - 3 * 1000).toISOString();
  var time = document.createElement('time', 'relative-time-to-go');
  time.setAttribute('datetime', now);
  equal(time.textContent, 'before now');
});

test('displays in a day', function() {
  var now = new Date(Date.now() + 60 * 60 * 24 * 1000).toISOString();
  var time = document.createElement('time', 'relative-time-to-go');
  time.setAttribute('datetime', now);
  equal(time.textContent, 'in a day');
});

test('displays in 2 days', function() {
  var now = new Date(Date.now() + 2 * 60 * 60 * 24 * 1000).toISOString();
  var time = document.createElement('time', 'relative-time-to-go');
  time.setAttribute('datetime', now);
  equal(time.textContent, 'in 2 days');
});

test('switches to dates after 30 days', function() {
  var now = new Date(Date.now() + 30 * 60 * 60 * 24 * 1000).toISOString();
  var time = document.createElement('time', 'relative-time-to-go');
  time.setAttribute('datetime', now);
  ok(time.textContent.match(/on \w\w\w \d{1,2}/));
});

test('ignores malformed dates', function() {
  var time = document.createElement('time', 'relative-time-to-go');
  time.textContent = 'Jun 30';
  time.setAttribute('datetime', 'bogus');
  equal(time.textContent, 'Jun 30');
});

test('ignores blank dates', function() {
  var time = document.createElement('time', 'relative-time-to-go');
  time.textContent = 'Jun 30';
  time.setAttribute('datetime', '');
  equal(time.textContent, 'Jun 30');
});

test('ignores removed dates', function() {
  var time = document.createElement('time', 'relative-time-to-go');
  var now = new Date().toISOString();

  time.setAttribute('datetime', now);
  equal(time.textContent, 'before now');

  time.removeAttribute('datetime');
  equal(time.textContent, 'before now');
});

test('sets relative contents when parsed element is upgraded', function() {
  var now = new Date().toISOString();
  var root = document.createElement('div');
  root.innerHTML = '<time is="relative-time-to-go" datetime="'+now+'"></time>';
  if ('CustomElements' in window) {
    window.CustomElements.upgradeSubtree(root);
  }
  equal(root.children[0].textContent, 'before now');
});

test('sets custom relative contents when parsed element is upgraded', function() {
  var now = new Date().toISOString();
  var root = document.createElement('div');
  root.innerHTML = '<time is="relative-time-to-go" just-now="expired" datetime="'+now+'"></time>';
  if ('CustomElements' in window) {
    window.CustomElements.upgradeSubtree(root);
  }
  equal(root.children[0].textContent, 'expired');
});
