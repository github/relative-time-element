module('constructor');

test('create local-time from document.createElement', function() {
  var time = document.createElement('local-time');
  equal('LOCAL-TIME', time.nodeName);
});

test('create local-time from constructor', function() {
  var time = new window.LocalTimeElement();
  equal('LOCAL-TIME', time.nodeName);
});

test('create relative-time from document.createElement', function() {
  var time = document.createElement('relative-time');
  equal('RELATIVE-TIME', time.nodeName);
});

test('create relative-time from constructor', function() {
  var time = new window.RelativeTimeElement();
  equal('RELATIVE-TIME', time.nodeName);
});

test('create relative-time-to-go from document.createElement', function() {
  var time = document.createElement('time', 'relative-time-to-go');
  equal('TIME', time.nodeName);
  equal('relative-time-to-go', time.getAttribute('is'));
});

test('create relative-time-to-go from constructor', function() {
  var time = new window.RelativeTimeToGoElement();
  equal('TIME', time.nodeName);
  equal('relative-time-to-go', time.getAttribute('is'));
});

test('create time-ago from document.createElement', function() {
  var time = document.createElement('time', 'time-ago');
  equal('TIME', time.nodeName);
  equal('time-ago', time.getAttribute('is'));
});

test('create time-ago from constructor', function() {
  var time = new window.TimeAgoElement();
  equal('TIME', time.nodeName);
  equal('time-ago', time.getAttribute('is'));
});

test('create time-to-go from document.createElement', function() {
  var time = document.createElement('time', 'time-to-go');
  equal('TIME', time.nodeName);
  equal('time-to-go', time.getAttribute('is'));
});

test('create time-to-go from constructor', function() {
  var time = new window.TimeToGoElement();
  equal('TIME', time.nodeName);
  equal('time-to-go', time.getAttribute('is'));
});
test('ignores elements without a datetime attr', function() {
  var time = document.createElement('local-time');
  equal(time.textContent, '');
});

test('leaves contents alone if only datetime is set', function() {
  var time = document.createElement('local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  equal(time.textContent, '');
});
