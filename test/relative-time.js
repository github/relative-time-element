suite('relative-time', function () {
  test('rewrites from now past datetime to days ago', function () {
    const now = new Date(Date.now() - 3 * 60 * 60 * 24 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, '3 days ago')
  })

  test('rewrites from now future datetime to days from now', function () {
    const now = new Date(Date.now() + 3 * 60 * 60 * 24 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, 'in 3 days')
  })

  test('rewrites from now past datetime to yesterday', function () {
    const now = new Date(Date.now() - 1 * 60 * 60 * 24 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, 'yesterday')
  })

  test('rewrites from now past datetime to hours ago', function () {
    const now = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, '3 hours ago')
  })

  test('rewrites from now future datetime to minutes from now', function () {
    const now = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, 'in 3 hours')
  })

  test('rewrites from now past datetime to an hour ago', function () {
    const now = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, '1 hour ago')
  })

  test('rewrites from now past datetime to minutes ago', function () {
    const now = new Date(Date.now() - 3 * 60 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, '3 minutes ago')
  })

  test('rewrites from now future datetime to minutes from now', function () {
    const now = new Date(Date.now() + 3 * 60 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, 'in 3 minutes')
  })

  test('rewrites from now past datetime to a minute ago', function () {
    const now = new Date(Date.now() - 1 * 60 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, '1 minute ago')
  })

  test('rewrites a few seconds ago to now', function () {
    const now = new Date().toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, 'now')
  })

  test('rewrites a few seconds from now to now', function () {
    const now = new Date().toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, 'now')
  })

  test('displays future times as now', function () {
    const now = new Date(Date.now() + 3 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, 'now')
  })

  test('displays yesterday', function () {
    const now = new Date(Date.now() - 60 * 60 * 24 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, 'yesterday')
  })

  test('displays a day from now', function () {
    const now = new Date(Date.now() + 60 * 60 * 24 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, 'tomorrow')
  })

  test('displays 2 days ago', function () {
    const now = new Date(Date.now() - 2 * 60 * 60 * 24 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, '2 days ago')
  })

  test('displays 2 days from now', function () {
    const now = new Date(Date.now() + 2 * 60 * 60 * 24 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    assert.equal(time.textContent, 'in 2 days')
  })

  test('switches to dates after 30 past days', function () {
    const now = new Date(Date.now() - 30 * 60 * 60 * 24 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('lang', 'en-US')
    time.setAttribute('datetime', now)
    assert.match(time.textContent, /on [A-Z][a-z]{2} \d{1,2}/)
  })

  test('switches to dates after 30 future days', function () {
    const now = new Date(Date.now() + 30 * 60 * 60 * 24 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('lang', 'en-US')
    time.setAttribute('datetime', now)
    assert.match(time.textContent, /on [A-Z][a-z]{2} \d{1,2}/)
  })

  test('ignores malformed dates', function () {
    const time = document.createElement('relative-time')
    time.textContent = 'Jun 30'
    time.setAttribute('datetime', 'bogus')
    assert.equal(time.textContent, 'Jun 30')
  })

  test('ignores blank dates', function () {
    const time = document.createElement('relative-time')
    time.textContent = 'Jun 30'
    time.setAttribute('datetime', '')
    assert.equal(time.textContent, 'Jun 30')
  })

  test('ignores removed dates', function () {
    const time = document.createElement('relative-time')
    const now = new Date().toISOString()

    time.setAttribute('datetime', now)
    assert.equal(time.textContent, 'now')

    time.removeAttribute('datetime')
    assert.equal(time.textContent, 'now')
  })

  test('sets relative contents when parsed element is upgraded', function () {
    const now = new Date().toISOString()
    const root = document.createElement('div')
    root.innerHTML = `<relative-time datetime="${now}"></relative-time>`
    if ('CustomElements' in window) {
      window.CustomElements.upgradeSubtree(root)
    }
    assert.equal(root.children[0].textContent, 'now')
  })

  const esLangSupport = (function () {
    try {
      return new Intl.RelativeTimeFormat('es').format(1, 'minute') === 'dentro de 1 minuto'
    } catch (e) {
      return false
    }
  })()

  if (esLangSupport) {
    test('rewrites given lang attribute', function () {
      const now = new Date(Date.now() - 3 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('datetime', now)
      time.setAttribute('lang', 'es')
      assert.equal(time.getFormattedDate(), 'hace 3 días')
    })

    test('rewrites given parent lang attribute', function () {
      const container = document.createElement('span')
      container.setAttribute('lang', 'es')
      const now = new Date(Date.now() - 3 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      container.appendChild(time)
      time.setAttribute('datetime', now)
      assert.equal(time.getFormattedDate(), 'hace 3 días')
    })
  }
})
