module('local-time');

test('null getFormattedDate when datetime missing', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('format', '%Y-%m-%dT%H:%M:%SZ');
  equal(time.getFormattedDate(), null);
});

test('getFormattedDate returns empty string when format missing', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  equal(time.getFormattedDate(), '');
});

test('getFormattedDate with only date attributes', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  time.setAttribute('day', 'numeric');
  time.setAttribute('month', 'short');
  time.setAttribute('year', 'numeric');

  var value = time.getFormattedDate();
  var acceptable = ['Dec 31, 1969', '31 Dec 1969', 'Jan 1, 1970', '1 Jan 1970'];
  ok(acceptable.indexOf(value) !== -1);
});

test('getFormattedDate without year attribute', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  time.setAttribute('day', 'numeric');
  time.setAttribute('month', 'short');

  var value = time.getFormattedDate();
  var acceptable = ['Dec 31', '31 Dec', 'Jan 1', '1 Jan'];
  ok(acceptable.indexOf(value !== -1));
});

test('getFormattedDate with only time attributes', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  time.setAttribute('hour', 'numeric');
  time.setAttribute('minute', '2-digit');

  var browser = time.getFormattedDate().match(/^\d{1,2}:\d\d [AP]M$/);
  var phantom = time.getFormattedDate().match(/^\d\d:\d\d$/);
  ok(browser || phantom);
});

test('ignores contents if datetime attribute is missing', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('year', 'numeric');
  equal(time.textContent, '');
});

test('sets formatted contents to format attribute', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  time.setAttribute('year', 'numeric');
  ok(time.textContent === '1969' || time.textContent === '1970');
});

test('sets formatted contents when parsed element is upgraded', function() {
  var root = document.createElement('div');
  root.innerHTML = '<time is="local-time" datetime="1970-01-01T00:00:00.000Z" year="numeric"></time>';
  if ('CustomElements' in window) {
    window.CustomElements.upgradeSubtree(root);
  }
  var text = root.children[0].textContent;
  ok(text === '1969' || text === '1970');
});
