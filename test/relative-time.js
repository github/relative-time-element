import {assert} from '@open-wc/testing'
import '../src/relative-time-element.ts'

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

  suite('[threshold]', function () {

    test('switches to dates after 30 past days with default threshold', function () {
      const now = new Date(Date.now() - 31 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('datetime', now)
      assert.match(time.textContent, /on [A-Z][a-z]{2} \d{1,2}/)
    })

    test('switches to dates after 30 future days with default threshold', function () {
      const now = new Date(Date.now() + 31 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('datetime', now)
      assert.match(time.textContent, /on [A-Z][a-z]{2} \d{1,2}/)
    })

    test('switches to dates after 1 day with P1D threshold', function () {
      const now = new Date(Date.now() - 2 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('threshold', 'P1D')
      time.setAttribute('datetime', now)
      assert.match(time.textContent, /on [A-Z][a-z]{2} \d{1,2}/)
    })

    test('switches to dates after 30 future days with default threshold', function () {
      const now = new Date(Date.now() + 31 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('datetime', now)
      assert.match(time.textContent, /on [A-Z][a-z]{2} \d{1,2}/)
    })

    test('switches to dates after 30 future days with P1D threshold', function () {
      const now = new Date(Date.now() + 2 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('threshold', 'P1D')
      time.setAttribute('datetime', now)
      assert.match(time.textContent, /on [A-Z][a-z]{2} \d{1,2}/)
    })

    test('uses `prefix` attribute to customise prefix', function () {
      const now = new Date(Date.now() + 31 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('prefix', 'will happen by')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('datetime', now)
      assert.match(time.textContent, /will happen by [A-Z][a-z]{2} \d{1,2}/)
    })

    test('uses `prefix` attribute to customise prefix as empty string', function () {
      const now = new Date(Date.now() + 31 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('prefix', '')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('datetime', now)
      assert.match(time.textContent, /[A-Z][a-z]{2} \d{1,2}/)
    })

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

  test('allows for use of custom formats', function () {
    const time = document.createElement('relative-time')
    time.textContent = 'Jun 30'
    time.setAttribute('datetime', '2022-01-10T12:00:00')
    time.setAttribute('format', '%Y')
    assert.equal(time.textContent, '2022')
  })

  test('ignores blank formats', function () {
    const time = document.createElement('relative-time')
    time.textContent = 'Jun 30'
    time.setAttribute('datetime', '2022-01-10T12:00:00')
    time.setAttribute('lang', 'en-US')
    time.setAttribute('format', '')
    assert.equal(time.textContent, 'on Jan 10')
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

  suite('[tense=past]', function () {
    let dateNow

    function freezeTime(expected) {
      dateNow = Date

      function MockDate(...args) {
        if (args.length) {
          return new dateNow(...args)
        }
        return new dateNow(expected)
      }

      MockDate.UTC = dateNow.UTC
      MockDate.parse = dateNow.parse
      MockDate.now = () => expected.getTime()
      MockDate.prototype = dateNow.prototype

      // eslint-disable-next-line no-global-assign
      Date = MockDate
    }

    teardown(function () {
      if (dateNow) {
        // eslint-disable-next-line no-global-assign
        Date = dateNow
        dateNow = null
      }
    })

    test('always uses relative dates', function () {
      const now = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      assert.equal(time.textContent, '10 years ago')
    })

    test('rewrites from now past datetime to minutes ago', function () {
      const now = new Date(Date.now() - 3 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      assert.equal(time.textContent, '3 minutes ago')
    })

    test('rewrites a few seconds ago to now', function () {
      const now = new Date().toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      assert.equal(time.textContent, 'now')
    })

    test('displays future times as now', function () {
      const now = new Date(Date.now() + 3 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      assert.equal(time.textContent, 'now')
    })

    test('sets relative contents when parsed element is upgraded', function () {
      const now = new Date().toISOString()
      const root = document.createElement('div')
      root.innerHTML = `<relative-time tense="past" datetime="${now}"></relative-time>`
      if ('CustomElements' in window) {
        window.CustomElements.upgradeSubtree(root)
      }
      assert.equal(root.children[0].textContent, 'now')
    })

    test('rewrites from now past datetime to months ago', function () {
      const now = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      assert.equal(time.textContent, '3 months ago')
    })

    test('rewrites relative-time datetimes < 18 months as "months ago"', function () {
      freezeTime(new Date(2020, 0, 1))
      const then = new Date(2018, 9, 1).toISOString()
      const timeElement = document.createElement('relative-time')
      timeElement.setAttribute('tense', 'past')
      timeElement.setAttribute('datetime', then)
      assert.equal(timeElement.textContent, '15 months ago')
    })

    test('rewrites relative-time datetimes >= 18 months as "years ago"', function () {
      freezeTime(new Date(2020, 0, 1))
      const then = new Date(2018, 6, 1).toISOString()
      const timeElement = document.createElement('relative-time')
      timeElement.setAttribute('tense', 'past')
      timeElement.setAttribute('datetime', then)
      assert.equal(timeElement.textContent, '2 years ago')
    })

    test('micro formats years', function () {
      const now = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      assert.equal(time.textContent, '10y')
    })

    test('micro formats future times', function () {
      const now = new Date(Date.now() + 3 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      assert.equal(time.textContent, '1m')
    })

    test('micro formats hours', function () {
      const now = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      assert.equal(time.textContent, '1h')
    })

    test('micro formats days', function () {
      const now = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      assert.equal(time.textContent, '1d')
    })
  })

  suite('[tense=future]', function () {
    test('always uses relative dates', function () {
      const now = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      assert.equal(time.textContent, 'in 10 years')
    })

    test('rewrites from now future datetime to minutes ago', function () {
      const now = new Date(Date.now() + 3 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      assert.equal(time.textContent, 'in 3 minutes')
    })

    test('rewrites a few seconds from now to now', function () {
      const now = new Date().toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      assert.equal(time.textContent, 'now')
    })

    test('displays past times as now', function () {
      const now = new Date(Date.now() + 3 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      assert.equal(time.textContent, 'now')
    })

    test('sets relative contents when parsed element is upgraded', function () {
      const now = new Date().toISOString()
      const root = document.createElement('div')
      root.innerHTML = `<relative-time tense="future" datetime="${now}"></relative-time>`
      if ('CustomElements' in window) {
        window.CustomElements.upgradeSubtree(root)
      }
      assert.equal(root.children[0].textContent, 'now')
    })

    test('micro formats years', function () {
      const now = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      assert.equal(time.textContent, '10y')
    })

    test('micro formats past times', function () {
      const now = new Date(Date.now() + 3 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      assert.equal(time.textContent, '1m')
    })

    test('micro formats hours', function () {
      const now = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      assert.equal(time.textContent, '1h')
    })

    test('micro formats days', function () {
      const now = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      assert.equal(time.textContent, '1d')
    })
  })
})
