module('title-format');

test('null getFormattedTitle if title-format is missing', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  equal(time.getFormattedTitle(), null);
});

test('null getFormattedTitle if datetime is missing', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('title-format', '%Y-%m-%d %H:%M');
  equal(time.getFormattedTitle(), null);
});

test('getFormattedTitle with title-formatted datetime', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  time.setAttribute('title-format', '%Y-%m-%d');
  equal(time.getFormattedTitle(), window.epochLocalDate);
});

test('getFormattedTitle with %z timezone offset', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  time.setAttribute('title-format', '%z');
  ok(time.getFormattedTitle().match(/\-\d\d\d\d/)[0]);
});

test('skips setting a title if title-format is missing', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  equal(time.getAttribute('title'), null);
});

test('skips setting a title if datetime is missing', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('title-format', '%Y-%m-%d %H:%M');
  equal(time.getAttribute('title'), null);
});

test('sets the title title-formatted datetime', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  time.setAttribute('title-format', '%Y-%m-%d');
  equal(time.getAttribute('title'), window.epochLocalDate);
});

test('set the title when parsed element is upgraded', function() {
  var root = document.createElement('div');
  root.innerHTML = '<time is="local-time" datetime="1970-01-01T00:00:00.000Z"' +
    ' title-format="%Y-%m-%d"></time>';
  if ('CustomElements' in window) {
    window.CustomElements.upgradeSubtree(root);
  }
  equal(root.children[0].getAttribute('title'), window.epochLocalDate);
});

test('updates title if title-formatted changes', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  time.setAttribute('title-format', '%Y-%m-%d');
  equal(time.getAttribute('title'), window.epochLocalDate);
  time.setAttribute('title-format', '%Y');
  equal(time.getAttribute('title'), window.epochLocalYear);
});

test('updates title if datetime changes', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  time.setAttribute('title-format', '%Y-%m-%d');
  equal(time.getAttribute('title'), window.epochLocalDate);
  time.setAttribute('datetime', '1971-01-01T00:00:00.000Z');
  equal(time.getAttribute('title'), window.yearAfterEpochLocalDate);
});
