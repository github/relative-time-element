module('from=date');

test('null getFormattedFromDate when datetime missing', function() {
  var time = document.createElement('local-time');
  time.setAttribute('from', '1971-01-01T00:00:00.000Z');
  equal(time.getFormattedFromDate(), null);
});

test('null getFormattedFromDate when from missing', function() {
  var time = document.createElement('local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  equal(time.getFormattedFromDate(), null);
});

test('getFormattedFromDate for datetime and from attributes', function() {
  var time = document.createElement('local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  time.setAttribute('from', '1971-01-01T00:00:00.000Z');
  equal(time.getFormattedFromDate(), 'a year ago');
});

test('sets contents to duration between from', function() {
  var time = document.createElement('local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  time.setAttribute('from', '1971-01-01T00:00:00.000Z');
  equal(time.textContent, 'a year ago');
});

test('sets duration contents when parsed element is upgraded', function() {
  var root = document.createElement('div');
  root.innerHTML = '<local-time datetime="1970-01-01T00:00:00.000Z"' +
    ' from="1971-01-01T00:00:00.000Z"></local-time>';
  if ('CustomElements' in window) {
    window.CustomElements.upgradeSubtree(root);
  }
  equal(root.children[0].textContent, 'a year ago');
});
