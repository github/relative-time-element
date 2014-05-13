module('local-time');

test('null getFormattedDate when datetime missing', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('format', '%Y-%m-%dT%H:%M:%SZ');
  equal(time.getFormattedDate(), null);
});

test('null getFormattedDate when format missing', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  equal(time.getFormattedDate(), null);
});

test('getFormattedDate for datetime and format attributes', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  time.setAttribute('format', '%Y-%m-%d');
  equal(time.getFormattedDate(), window.epochLocalDate);
});

test('ignores contents if datetime attribute is missing', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('format', '%Y-%m-%dT%H:%M:%SZ');
  equal(time.textContent, '');
});

test('sets formatted contents to format attribute', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  time.setAttribute('format', '%Y-%m-%d');
  equal(time.textContent, window.epochLocalDate);
});

test('sets formatted contents when parsed element is upgraded', function() {
  var root = document.createElement('div');
  root.innerHTML = '<time is="local-time" datetime="1970-01-01T00:00:00.000Z" ' +
    'format="%Y-%m-%d"></time>';
  if ('CustomElements' in window) {
    window.CustomElements.upgradeSubtree(root);
  }
  equal(root.children[0].textContent, window.epochLocalDate);
});
