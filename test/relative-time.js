module('relative-time');

test('rewrites from now past datetime to minutes ago', function() {
  var now = new Date(Date.now() - 3 * 60 * 1000).toISOString();
  var time = document.createElement('time', 'relative-time');
  time.setAttribute('datetime', now);
  equal(time.textContent, '3 minutes ago');
});

test('rewrites from now future datetime to minutes from now', function() {
  var now = new Date(Date.now() + 3 * 60 * 1000).toISOString();
  var time = document.createElement('time', 'relative-time');
  time.setAttribute('datetime', now);
  equal(time.textContent, '3 minutes from now');
});

test('rewrites a few seconds ago to just now', function() {
  var now = new Date().toISOString();
  var time = document.createElement('time', 'relative-time');
  time.setAttribute('datetime', now);
  equal(time.textContent, 'just now');
});

test('rewrites a few seconds from now to just now', function() {
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

test('displays a day ago', function() {
  var now = new Date(Date.now() - 60 * 60 * 24 * 1000).toISOString();
  var time = document.createElement('time', 'relative-time');
  time.setAttribute('datetime', now);
  equal(time.textContent, 'a day ago');
});

test('displays a day from now', function() {
  var now = new Date(Date.now() + 60 * 60 * 24 * 1000).toISOString();
  var time = document.createElement('time', 'relative-time');
  time.setAttribute('datetime', now);
  equal(time.textContent, 'a day from now');
});

test('displays 2 days ago', function() {
  var now = new Date(Date.now() - 2 * 60 * 60 * 24 * 1000).toISOString();
  var time = document.createElement('time', 'relative-time');
  time.setAttribute('datetime', now);
  equal(time.textContent, '2 days ago');
});

test('displays 2 days from now', function() {
  var now = new Date(Date.now() + 2 * 60 * 60 * 24 * 1000).toISOString();
  var time = document.createElement('time', 'relative-time');
  time.setAttribute('datetime', now);
  equal(time.textContent, '2 days from now');
});

test('switches to dates after 30 past days', function() {
  var now = new Date(Date.now() - 30 * 60 * 60 * 24 * 1000).toISOString();
  var time = document.createElement('time', 'relative-time');
  time.setAttribute('datetime', now);
  ok(time.textContent.match(/on \w\w\w \d{1,2}/));
});

test('switches to dates after 30 future days', function() {
  var now = new Date(Date.now() + 30 * 60 * 60 * 24 * 1000).toISOString();
  var time = document.createElement('time', 'relative-time');
  time.setAttribute('datetime', now);
  ok(time.textContent.match(/on \w\w\w \d{1,2}/));
});

test('ignores malformed dates', function() {
  var time = document.createElement('time', 'relative-time');
  time.textContent = 'Jun 30';
  time.setAttribute('datetime', 'bogus');
  equal(time.textContent, 'Jun 30');
});

test('ignores blank dates', function() {
  var time = document.createElement('time', 'relative-time');
  time.textContent = 'Jun 30';
  time.setAttribute('datetime', '');
  equal(time.textContent, 'Jun 30');
});

test('ignores removed dates', function() {
  var time = document.createElement('time', 'relative-time');
  var now = new Date().toISOString();

  time.setAttribute('datetime', now);
  equal(time.textContent, 'just now');

  time.removeAttribute('datetime');
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
