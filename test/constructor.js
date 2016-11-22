suite('constructor', function() {
  test('create local-time from document.createElement', function() {
    var time = document.createElement('local-time')
    assert.equal('LOCAL-TIME', time.nodeName)
  })

  test('create local-time from constructor', function() {
    var time = new window.LocalTimeElement()
    assert.equal('LOCAL-TIME', time.nodeName)
  })

  test('create relative-time from document.createElement', function() {
    var time = document.createElement('relative-time')
    assert.equal('RELATIVE-TIME', time.nodeName)
  })

  test('create relative-time from constructor', function() {
    var time = new window.RelativeTimeElement()
    assert.equal('RELATIVE-TIME', time.nodeName)
  })

  test('ignores elements without a datetime attr', function() {
    var time = document.createElement('local-time')
    assert.equal(time.textContent, '')
  })

  test('leaves contents alone if only datetime is set', function() {
    var time = document.createElement('local-time')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    assert.equal(time.textContent, '')
  })
})
