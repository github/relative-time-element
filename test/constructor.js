module('constructor');

test('create local-time from document.createElement', function() {
  var time = document.createElement('time', 'local-time');
  equal('TIME', time.nodeName);
  equal('local-time', time.getAttribute('is'));
});

test('create local-time from constructor', function() {
  var time = new window.LocalTimeElement();
  equal('TIME', time.nodeName);
  equal('local-time', time.getAttribute('is'));
});

test('create relative-time from document.createElement', function() {
  var time = document.createElement('time', 'relative-time');
  equal('TIME', time.nodeName);
  equal('relative-time', time.getAttribute('is'));
});

test('create relative-time from constructor', function() {
  var time = new window.RelativeTimeElement();
  equal('TIME', time.nodeName);
  equal('relative-time', time.getAttribute('is'));
});

test('ignores elements without a datetime attr', function() {
  var time = document.createElement('time', 'local-time');
  equal(time.textContent, '');
});

test('leaves contents alone if only datetime is set', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  equal(time.textContent, '');
});
