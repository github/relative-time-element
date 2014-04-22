test('create from document.createElement', function() {
  var time;
  time = document.createElement('local-time');
  return equal('LOCAL-TIME', time.nodeName);
});

test('create from constructor', function() {
  var time;
  time = new window.LocalTimeElement();
  return equal('LOCAL-TIME', time.nodeName);
});

test('null getFormattedDate when datetime missing', function() {
  var time;
  time = document.createElement('local-time');
  time.setAttribute('format', '%Y-%m-%dT%H:%M:%SZ');
  return equal(time.getFormattedDate(), null);
});

test('null getFormattedDate when format missing', function() {
  var time;
  time = document.createElement('local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  return equal(time.getFormattedDate(), null);
});

test('getFormattedDate for datetime and format attributes', function() {
  var time;
  time = document.createElement('local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  time.setAttribute('format', '%Y-%m-%d');
  return equal(time.getFormattedDate(), window.epochLocalDate);
});

test('ignores elements without a datetime attr', function() {
  var time;
  time = document.createElement('local-time');
  return equal(time.textContent, '');
});

test('leaves contents alone if only datetime is set', function() {
  var time;
  time = document.createElement('local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  return equal(time.textContent, '');
});

test('ignores contents if datetime attribute is missing', function() {
  var time;
  time = document.createElement('local-time');
  time.setAttribute('format', '%Y-%m-%dT%H:%M:%SZ');
  return equal(time.textContent, '');
});

test('sets formatted contents to format attribute', function() {
  var time;
  time = document.createElement('local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  time.setAttribute('format', '%Y-%m-%d');
  return equal(time.textContent, window.epochLocalDate);
});

test('sets formatted contents when parsed element is upgraded', function() {
  var root;
  root = document.createElement('div');
  root.innerHTML = '<local-time datetime="1970-01-01T00:00:00.000Z" ' +
    'format="%Y-%m-%d"></local-time>';
  if ('CustomElements' in window) {
    window.CustomElements.upgradeSubtree(root);
  }
  return equal(root.children[0].textContent, window.epochLocalDate);
});
