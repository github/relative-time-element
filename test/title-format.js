module('title-format');

test('null getFormattedTitle if datetime is missing', function() {
  var time = document.createElement('time', 'local-time');
  equal(time.getFormattedTitle(), null);
});

test('locale-aware getFormattedTitle for datetime value', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  ok(time.getFormattedTitle().match(/\d\d\d\d/)[0]);
});

test('skips setting a title attribute if already provided', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('title', 'does not change');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  equal(time.getAttribute('title'), 'does not change');
});

test('skips setting a title attribute if datetime is missing', function() {
  var time = document.createElement('time', 'local-time');
  equal(time.getAttribute('title'), null);
});

test('sets the title attribute for datetime value', function() {
  var time = document.createElement('time', 'local-time');
  time.setAttribute('datetime', '1970-01-01T00:00:00.000Z');
  ok(time.getAttribute('title').match(/\d\d\d\d/)[0]);
});

test('set the title attribute when parsed element is upgraded', function() {
  var root = document.createElement('div');
  root.innerHTML = '<time is="local-time" datetime="1970-01-01T00:00:00.000Z"></time>';
  if ('CustomElements' in window) {
    window.CustomElements.upgradeSubtree(root);
  }
  ok(root.children[0].getAttribute('title').match(/\d\d\d\d/)[0]);
});
