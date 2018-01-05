suite('local-time', function() {
  test('null getFormattedDate when datetime missing', function() {
    var time = document.createElement('local-time')
    time.setAttribute('format', '%Y-%m-%dT%H:%M:%SZ')
    assert.isUndefined(time.getFormattedDate())
  })

  test('getFormattedDate returns empty string when format missing', function() {
    var time = document.createElement('local-time')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    assert.equal(time.getFormattedDate(), '')
  })

  test('getFormattedDate with only date attributes', function() {
    var time = document.createElement('local-time')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    time.setAttribute('day', 'numeric')
    time.setAttribute('month', 'short')
    time.setAttribute('year', 'numeric')

    var value = time.getFormattedDate()
    assert.include(['Dec 31, 1969', '31 Dec 1969', 'Jan 1, 1970', '1 Jan 1970'], value)
  })

  test('getFormattedDate without year attribute', function() {
    var time = document.createElement('local-time')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    time.setAttribute('day', 'numeric')
    time.setAttribute('month', 'short')

    var value = time.getFormattedDate()
    assert.include(['Dec 31', '31 Dec', 'Jan 1', '1 Jan'], value)
  })

  test('getFormattedDate with only time attributes', function() {
    var time = document.createElement('local-time')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    time.setAttribute('hour', 'numeric')
    time.setAttribute('minute', '2-digit')

    if ('Intl' in window) {
      assert.match(time.getFormattedDate(), /^\d{1,2}:\d\d (AM|PM)$/)
    } else {
      assert.match(time.getFormattedDate(), /^\d{2}:\d{2}$/)
    }
  })

  test('ignores contents if datetime attribute is missing', function() {
    var time = document.createElement('local-time')
    time.setAttribute('year', 'numeric')
    assert.equal(time.textContent, '')
  })

  test('sets formatted contents to format attribute', function() {
    var time = document.createElement('local-time')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    time.setAttribute('year', 'numeric')
    assert.include(['1969', '1970'], time.textContent)
  })

  test('sets formatted contents when parsed element is upgraded', function() {
    var root = document.createElement('div')
    root.innerHTML = '<local-time datetime="1970-01-01T00:00:00.000Z" year="numeric"></local-time>'
    if ('CustomElements' in window) {
      window.CustomElements.upgradeSubtree(root)
    }
    assert.include(['1969', '1970'], root.children[0].textContent)
  })
  ;('Intl' in window ? test : test.skip)('displays time zone name', function() {
    var root = document.createElement('div')
    root.innerHTML =
      '<local-time datetime="1970-01-01T00:00:00.000Z" minute="2-digit" time-zone-name="short"></local-time>'
    if ('CustomElements' in window) {
      window.CustomElements.upgradeSubtree(root)
    }
    assert.match(root.children[0].textContent, /^\d{1,2} (UTC|GMT([+-]\d+)?)$/)
  })
})
