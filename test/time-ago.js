suite('time-ago', function() {
  test('always uses relative dates', function() {
    const now = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, '10 years ago')
  })

  test('rewrites from now past datetime to minutes ago', function() {
    const now = new Date(Date.now() - 3 * 60 * 1000).toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, '3 minutes ago')
  })

  test('rewrites a few seconds ago to now', function() {
    const now = new Date().toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, 'now')
  })

  test('displays future times as now', function() {
    const now = new Date(Date.now() + 3 * 1000).toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, 'now')
  })

  test('sets relative contents when parsed element is upgraded', function() {
    const now = new Date().toISOString()
    const root = document.createElement('div')
    root.innerHTML = `<time-ago datetime="${now}"></time-ago>`
    if ('CustomElements' in window) {
      window.CustomElements.upgradeSubtree(root)
    }
    assert.equal(root.children[0].textContent, 'now')
  })

  test('rewrites from now past datetime to months ago', function() {
    const now = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, '3 months ago')
  })

  test('rewrites from now past datetime to years ago', function() {
    const now = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, 'last year')
  })

  test('micro formats years', function() {
    const now = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    time.setAttribute('format', 'micro')
    assert.equal(time.textContent, '10y')
  })

  test('micro formats future times', function() {
    const now = new Date(Date.now() + 3 * 1000).toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    time.setAttribute('format', 'micro')
    assert.equal(time.textContent, '1m')
  })

  test('micro formats hours', function() {
    const now = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    time.setAttribute('format', 'micro')
    assert.equal(time.textContent, '1h')
  })

  test('micro formats days', function() {
    const now = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    time.setAttribute('format', 'micro')
    assert.equal(time.textContent, '1d')
  })
})
