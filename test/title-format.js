suite('title-format', function() {
  test('null getFormattedTitle if datetime is missing', function() {
    var time = document.createElement('local-time')
    assert.isUndefined(time.getFormattedTitle())
  })

  test('locale-aware getFormattedTitle for datetime value', function() {
    var time = document.createElement('local-time')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    assert.match(time.getFormattedTitle(), /\d{4}/)
  })

  test('skips setting a title attribute if already provided', function() {
    var time = document.createElement('local-time')
    time.setAttribute('title', 'does not change')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    assert.equal(time.getAttribute('title'), 'does not change')
  })

  test('skips setting a title attribute if datetime is missing', function() {
    var time = document.createElement('local-time')
    assert.isNull(time.getAttribute('title'))
  })

  test('sets the title attribute for datetime value', function() {
    var time = document.createElement('local-time')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    assert.match(time.getAttribute('title'), /\d{4}/)
  })

  test('set the title attribute when parsed element is upgraded', function() {
    var root = document.createElement('div')
    root.innerHTML = '<local-time datetime="1970-01-01T00:00:00.000Z"></local-time>'
    if ('CustomElements' in window) {
      window.CustomElements.upgradeSubtree(root)
    }
    assert.match(root.children[0].getAttribute('title'), /\d{4}/)
  })
})
