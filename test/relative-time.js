import {assert} from '@open-wc/testing'
import {RelativeTimeElement} from '../src/index.ts'

suite('relative-time', function () {
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

  let fixture
  suiteSetup(() => {
    fixture = document.createElement('div')
    document.body.appendChild(fixture)
  })

  teardown(() => {
    fixture.innerHTML = ''
    if (dateNow) {
      // eslint-disable-next-line no-global-assign
      Date = dateNow
      dateNow = null
    }
  })

  test('does not call update() frequently with attributeChangedCallback', async () => {
    let counter = 0
    const el = document.createElement('relative-time')
    el.update = function () {
      counter += 1
      return RelativeTimeElement.prototype.update.call(this)
    }
    assert.equal(counter, 0)
    el.setAttribute('datetime', new Date().toISOString())
    await Promise.resolve()
    assert.equal(counter, 1)
    el.setAttribute('datetime', el.getAttribute('datetime'))
    assert.equal(counter, 1)
    el.disconnectedCallback()
    assert.equal(counter, 1)
    el.setAttribute('title', 'custom')
    assert.equal(counter, 1)
    el.setAttribute('title', 'another custom')
    assert.equal(counter, 1)
    el.removeAttribute('title')
    await Promise.resolve()
    assert.equal(counter, 2)

    counter = 0
    el.setAttribute('second', '2-digit')
    el.setAttribute('hour', '2-digit')
    el.setAttribute('minute', '2-digit')
    await Promise.resolve()
    assert.equal(counter, 1)
  })

  test('sets title back to default if removed', async () => {
    const el = document.createElement('relative-time')
    el.setAttribute('datetime', new Date().toISOString())
    await Promise.resolve()
    assert.ok(el.getAttribute('title'))
    const text = el.getAttribute('title')
    el.setAttribute('title', 'custom')
    assert.equal(el.getAttribute('title'), 'custom')
    el.removeAttribute('title')
    await Promise.resolve()
    assert.equal(el.getAttribute('title'), text)
  })

  test('shadowDOM reflects textContent with invalid date', async () => {
    const el = document.createElement('relative-time')
    el.textContent = 'A date string'
    el.setAttribute('datetime', 'Invalid')
    await Promise.resolve()
    if (el.shadowRoot) assert.equal(el.shadowRoot.textContent, el.textContent)
  })

  test('updates the time automatically when it is a few seconds ago', async function () {
    // eslint-disable-next-line @typescript-eslint/no-invalid-this
    this.timeout(3000)
    const el = document.createElement('relative-time')
    el.setAttribute('datetime', new Date(Date.now() + 25000).toISOString())
    await Promise.resolve()
    const display = el.shadowRoot?.textContent || el.textContent
    assert.match(display, /in \d+ seconds/)
    await new Promise(resolve => setTimeout(resolve, 2000))
    const nextDisplay = el.shadowRoot.textContent || el.textContent
    assert.match(nextDisplay, /in \d+ seconds/)
    assert.notEqual(nextDisplay, display)
  })

  test('all observedAttributes have getters', async () => {
    const ALLOWED_PROPERTIES = ['time-zone-name']

    const members = [
      ...Object.getOwnPropertyNames(RelativeTimeElement.prototype),
      ...Object.getOwnPropertyNames(HTMLElement.prototype),
      ...ALLOWED_PROPERTIES,
    ]
    const observedAttributes = new Set(RelativeTimeElement.observedAttributes)
    for (const member of members) observedAttributes.delete(member)
    assert.empty([...observedAttributes], 'observedAttributes that arent class members')
  })

  test("doesn't error when no date is provided", async () => {
    const element = document.createElement('relative-time')
    assert.doesNotThrow(() => element.attributeChangedCallback('datetime', null, null))
  })

  test('rewrites from now past datetime to days ago', async () => {
    const now = new Date(Date.now() - 3 * 60 * 60 * 24 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, '3 days ago')
  })

  test('rewrites from now future datetime to days from now', async () => {
    const now = new Date(Date.now() + 3 * 60 * 60 * 24 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'in 3 days')
  })

  test('rewrites from now past datetime to yesterday', async () => {
    const now = new Date(Date.now() - 1 * 60 * 60 * 24 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'yesterday')
  })

  test('rewrites from now past datetime to hours ago', async () => {
    const now = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, '3 hours ago')
  })

  test('rewrites from now future datetime to minutes from now', async () => {
    const now = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'in 3 hours')
  })

  test('rewrites from now past datetime to an hour ago', async () => {
    const now = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, '1 hour ago')
  })

  test('rewrites from now past datetime to minutes ago', async () => {
    const now = new Date(Date.now() - 3 * 60 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, '3 minutes ago')
  })

  test('rewrites from now future datetime to minutes from now', async () => {
    const now = new Date(Date.now() + 3 * 60 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'in 3 minutes')
  })

  test('rewrites from now past datetime to a minute ago', async () => {
    const now = new Date(Date.now() - 1 * 60 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, '1 minute ago')
  })

  test('rewrites a few seconds ago to now', async () => {
    const now = new Date().toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'now')
  })

  test('rewrites a few seconds from now to now', async () => {
    const now = new Date().toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'now')
  })

  test('displays future times as now', async () => {
    const now = new Date(Date.now() + 3 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'now')
  })

  test('displays yesterday', async () => {
    const now = new Date(Date.now() - 60 * 60 * 24 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'yesterday')
  })

  test('displays a day from now', async () => {
    const now = new Date(Date.now() + 60 * 60 * 24 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'tomorrow')
  })

  test('displays 2 days ago', async () => {
    const now = new Date(Date.now() - 2 * 60 * 60 * 24 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, '2 days ago')
  })

  test('displays 2 days from now', async () => {
    const now = new Date(Date.now() + 2 * 60 * 60 * 24 * 1000).toISOString()
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'in 2 days')
  })

  suite('[threshold]', function () {
    test('switches to dates after 30 past days with default threshold', async () => {
      const now = new Date(Date.now() - 31 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('datetime', now)
      await Promise.resolve()
      assert.match(time.shadowRoot.textContent, /on [A-Z][a-z]{2} \d{1,2}/)
    })

    test('switches to dates after 30 future days with default threshold', async () => {
      const now = new Date(Date.now() + 31 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('datetime', now)
      await Promise.resolve()
      assert.match(time.shadowRoot.textContent, /on [A-Z][a-z]{2} \d{1,2}/)
    })

    test('switches to dates after 1 day with P1D threshold', async () => {
      const now = new Date(Date.now() - 2 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('threshold', 'P1D')
      time.setAttribute('datetime', now)
      await Promise.resolve()
      assert.match(time.shadowRoot.textContent, /on [A-Z][a-z]{2} \d{1,2}/)
    })

    test('switches to dates after 30 future days with default threshold', async () => {
      const now = new Date(Date.now() + 31 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('datetime', now)
      await Promise.resolve()
      assert.match(time.shadowRoot.textContent, /on [A-Z][a-z]{2} \d{1,2}/)
    })

    test('switches to dates after 30 future days with P1D threshold', async () => {
      const now = new Date(Date.now() + 2 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('threshold', 'P1D')
      time.setAttribute('datetime', now)
      await Promise.resolve()
      assert.match(time.shadowRoot.textContent, /on [A-Z][a-z]{2} \d{1,2}/)
    })

    test('uses `prefix` attribute to customise prefix', async () => {
      const now = new Date(Date.now() + 31 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('prefix', 'will happen by')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('datetime', now)
      await Promise.resolve()
      assert.match(time.shadowRoot.textContent, /will happen by [A-Z][a-z]{2} \d{1,2}/)
    })

    test('uses `prefix` attribute to customise prefix as empty string', async () => {
      const now = new Date(Date.now() + 31 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('prefix', '')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('datetime', now)
      await Promise.resolve()
      assert.match(time.shadowRoot.textContent, /[A-Z][a-z]{2} \d{1,2}/)
    })
  })

  test('ignores malformed dates', async () => {
    const time = document.createElement('relative-time')
    time.shadowRoot.textContent = 'Jun 30'
    time.setAttribute('datetime', 'bogus')
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'Jun 30')
  })

  test('ignores blank dates', async () => {
    const time = document.createElement('relative-time')
    time.shadowRoot.textContent = 'Jun 30'
    time.setAttribute('datetime', '')
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'Jun 30')
  })

  test('ignores removed dates', async () => {
    const time = document.createElement('relative-time')
    const now = new Date().toISOString()

    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'now')

    time.removeAttribute('datetime')
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'now')
  })

  test('sets relative contents when parsed element is upgraded', async () => {
    const now = new Date().toISOString()
    const root = document.createElement('div')
    root.innerHTML = `<relative-time datetime="${now}"></relative-time>`
    if ('CustomElements' in window) {
      window.CustomElements.upgradeSubtree(root)
    }
    await Promise.resolve()
    assert.equal(root.children[0].shadowRoot.textContent, 'now')
  })

  test('ignores blank formats', async () => {
    const time = document.createElement('relative-time')
    time.shadowRoot.textContent = 'Jun 30'
    time.setAttribute('datetime', '2022-01-10T12:00:00')
    time.setAttribute('lang', 'en-US')
    time.setAttribute('format', '')
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'on Jan 10')
  })

  const esLangSupport = (function () {
    try {
      return new Intl.RelativeTimeFormat('es').format(1, 'minute') === 'dentro de 1 minuto'
    } catch (e) {
      return false
    }
  })()

  if (esLangSupport) {
    test('rewrites given lang attribute', async () => {
      const now = new Date(Date.now() - 3 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('datetime', now)
      time.setAttribute('lang', 'es')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'hace 3 días')
    })

    test('rewrites given parent lang attribute', async () => {
      const container = document.createElement('span')
      container.setAttribute('lang', 'es')
      const now = new Date(Date.now() - 3 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      container.appendChild(time)
      time.setAttribute('datetime', now)
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'hace 3 días')
    })
  }

  suite('[tense=past]', function () {
    test('always uses relative dates', async () => {
      const now = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '10 years ago')
    })

    test('rewrites from now past datetime to minutes ago', async () => {
      const now = new Date(Date.now() - 3 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '3 minutes ago')
    })

    test('rewrites a few seconds ago to now', async () => {
      const now = new Date().toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'now')
    })

    test('displays future times as now', async () => {
      const now = new Date(Date.now() + 3 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'now')
    })

    test('sets relative contents when parsed element is upgraded', async () => {
      const now = new Date().toISOString()
      const root = document.createElement('div')
      root.innerHTML = `<relative-time tense="past" datetime="${now}"></relative-time>`
      if ('CustomElements' in window) {
        window.CustomElements.upgradeSubtree(root)
      }
      await Promise.resolve()
      assert.equal(root.children[0].shadowRoot.textContent, 'now')
    })

    test('rewrites from now past datetime to months ago', async () => {
      const now = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '3 months ago')
    })

    test('rewrites relative-time datetimes < 18 months as "months ago"', async () => {
      freezeTime(new Date(2020, 0, 1))
      const then = new Date(2018, 9, 1).toISOString()
      const timeElement = document.createElement('relative-time')
      timeElement.setAttribute('tense', 'past')
      timeElement.setAttribute('datetime', then)
      await Promise.resolve()
      assert.equal(timeElement.shadowRoot.textContent, '15 months ago')
    })

    test('rewrites relative-time datetimes >= 18 months as "years ago"', async () => {
      freezeTime(new Date(2020, 0, 1))
      const then = new Date(2018, 6, 1).toISOString()
      const timeElement = document.createElement('relative-time')
      timeElement.setAttribute('tense', 'past')
      timeElement.setAttribute('datetime', then)
      await Promise.resolve()
      assert.equal(timeElement.shadowRoot.textContent, '2 years ago')
    })

    test('micro formats years', async () => {
      const now = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '10y')
    })

    test('micro formats future times', async () => {
      const now = new Date(Date.now() + 3 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '1m')
    })

    test('micro formats hours', async () => {
      const now = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '1h')
    })

    test('micro formats days', async () => {
      const now = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '1d')
    })
  })

  suite('[tense=future]', function () {
    test('always uses relative dates', async () => {
      const now = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'in 10 years')
    })

    test('rewrites from now future datetime to minutes ago', async () => {
      const now = new Date(Date.now() + 3 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'in 3 minutes')
    })

    test('rewrites a few seconds from now to now', async () => {
      const now = new Date().toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'now')
    })

    test('displays past times as now', async () => {
      const now = new Date(Date.now() + 3 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'now')
    })

    test('sets relative contents when parsed element is upgraded', async () => {
      const now = new Date().toISOString()
      const root = document.createElement('div')
      root.innerHTML = `<relative-time tense="future" datetime="${now}"></relative-time>`
      if ('CustomElements' in window) {
        window.CustomElements.upgradeSubtree(root)
      }
      await Promise.resolve()
      assert.equal(root.children[0].shadowRoot.textContent, 'now')
    })

    test('micro formats years', async () => {
      const now = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '10y')
    })

    test('micro formats past times', async () => {
      const now = new Date(Date.now() + 3 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '1m')
    })

    test('micro formats hours', async () => {
      const now = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '1h')
    })

    test('micro formats days', async () => {
      const now = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '1d')
    })
  })

  suite('[threshold=0][prefix=""]', () => {
    test('with only date attributes', async () => {
      const time = document.createElement('relative-time')
      time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
      time.setAttribute('threshold', '0')
      time.setAttribute('prefix', '')
      time.setAttribute('day', 'numeric')
      time.setAttribute('month', 'short')
      time.setAttribute('year', 'numeric')

      await Promise.resolve()
      assert.include(['Dec 31, 1969', '31 Dec 1969', 'Jan 1, 1970', '1 Jan 1970'], time.shadowRoot.textContent)
    })

    test('with empty year attribute', async () => {
      const time = document.createElement('relative-time')
      time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
      time.setAttribute('threshold', '0')
      time.setAttribute('prefix', '')
      time.setAttribute('year', '')
      time.setAttribute('day', 'numeric')
      time.setAttribute('month', 'short')

      await Promise.resolve()
      assert.include(['Dec 31', '31 Dec', 'Jan 1', '1 Jan'], time.shadowRoot.textContent)
    })

    test('with only time attributes', async () => {
      const time = document.createElement('relative-time')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
      time.setAttribute('threshold', '0')
      time.setAttribute('prefix', '')
      time.setAttribute('year', '')
      time.setAttribute('month', '')
      time.setAttribute('day', '')
      time.setAttribute('hour', 'numeric')
      time.setAttribute('minute', '2-digit')
      await Promise.resolve()

      if ('Intl' in window) {
        assert.match(time.shadowRoot.textContent, /^\d{1,2}:\d\d (AM|PM)$/)
      } else {
        assert.match(time.shadowRoot.textContent, /^\d{2}:\d{2}$/)
      }
    })

    test('ignores contents if datetime attribute is missing', async () => {
      const time = document.createElement('relative-time')
      time.setAttribute('year', 'numeric')
      time.setAttribute('threshold', '0')
      time.setAttribute('prefix', '')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '')
    })

    test('can provide just year', async () => {
      const time = document.createElement('relative-time')
      time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
      time.setAttribute('day', '')
      time.setAttribute('month', '')
      time.setAttribute('year', 'numeric')
      time.setAttribute('threshold', '0')
      time.setAttribute('prefix', '')
      await Promise.resolve()
      assert.include(['1969', '1970'], time.shadowRoot.textContent)
    })

    test('updates format when attributes change', async () => {
      const time = document.createElement('relative-time')
      time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
      time.setAttribute('threshold', '0')
      time.setAttribute('prefix', '')
      time.setAttribute('day', '')
      time.setAttribute('month', '')

      time.setAttribute('year', 'numeric')
      await Promise.resolve()
      assert.include(['1969', '1970'], time.shadowRoot.textContent)

      time.setAttribute('year', '2-digit')
      await Promise.resolve()
      assert.include(['69', '70'], time.shadowRoot.textContent)
    })

    test('sets formatted contents when parsed element is upgraded', async () => {
      const root = document.createElement('div')
      root.innerHTML =
        '<relative-time datetime="1970-01-01T00:00:00.000Z" day="" month="" year="numeric" prefix="" threshold="0"></relative-time>'
      if ('CustomElements' in window) {
        window.CustomElements.upgradeSubtree(root)
      }
      await Promise.resolve()
      assert.include(['1969', '1970'], root.children[0].shadowRoot.textContent)
    })
    ;('Intl' in window ? test : test.skip)('displays time zone name', async () => {
      const root = document.createElement('div')
      root.innerHTML =
        '<relative-time datetime="1970-01-01T00:00:00.000Z" day="" month="" year="" minute="2-digit" time-zone-name="short" prefix="" threshold="0"></relative-time>'
      if ('CustomElements' in window) {
        window.CustomElements.upgradeSubtree(root)
      }

      await Promise.resolve()
      assert.match(root.children[0].shadowRoot.textContent, /^\d{1,2} (\w+([+-]\d+)?)$/)
      assert.equal(root.children[0].shadowRoot.textContent, '0 GMT+4')
    })

    test('updates time zone when the `time-zone-name` attribute changes', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('lang', 'en-US')
      el.setAttribute('datetime', '1970-01-01T00:00:00.000-08:00')
      el.setAttribute('day', 'numeric')
      el.setAttribute('month', 'numeric')
      el.setAttribute('time-zone-name', 'short')
      el.setAttribute('threshold', '0')
      el.setAttribute('prefix', '')

      fixture.appendChild(el)
      await Promise.resolve()
      assert.equal(el.shadowRoot.textContent, '1/1/1970, GMT+4')

      el.setAttribute('time-zone-name', 'long')

      await Promise.resolve()
      assert.equal(el.shadowRoot.textContent, '1/1/1970, Gulf Standard Time')
    })
  })

  suite('table tests', function () {
    const referenceDate = '2022-10-24T14:46:00.000Z'
    const tests = new Set([
      // Same as the current time
      {datetime: '2022-10-24t14:46:00.000z', tense: 'future', format: 'micro', expected: '1m'},
      {datetime: '2022-10-24t14:46:00.000z', tense: 'past', format: 'micro', expected: '1m'},
      {datetime: '2022-10-24t14:46:00.000z', tense: 'auto', format: 'micro', expected: '1m'},
      {datetime: '2022-10-24t14:46:00.000z', tense: 'auto', format: 'auto', expected: 'now'},

      // Dates in the past
      {datetime: '2022-09-24T14:46:00.000Z', tense: 'future', format: 'micro', expected: '1m'},
      {datetime: '2022-10-23T14:46:00.000Z', tense: 'future', format: 'micro', expected: '1m'},
      {datetime: '2022-10-24T13:46:00.000Z', tense: 'future', format: 'micro', expected: '1m'},

      // Dates in the future
      {datetime: '2022-10-24T15:46:00.000Z', tense: 'future', format: 'micro', expected: '1h'},
      {datetime: '2022-10-24T16:00:00.000Z', tense: 'future', format: 'micro', expected: '1h'},
      {datetime: '2022-10-24T16:15:00.000Z', tense: 'future', format: 'micro', expected: '1h'},
      {datetime: '2022-10-24T16:31:00.000Z', tense: 'future', format: 'micro', expected: '2h'},
      {datetime: '2022-10-30T14:46:00.000Z', tense: 'future', format: 'micro', expected: '6d'},
      {datetime: '2022-11-24T14:46:00.000Z', tense: 'future', format: 'micro', expected: '31d'},
      {datetime: '2023-10-23T14:46:00.000Z', tense: 'future', format: 'micro', expected: '364d'},
      {datetime: '2023-10-24T14:46:00.000Z', tense: 'future', format: 'micro', expected: '1y'},
      {datetime: '2024-03-31T14:46:00.000Z', tense: 'future', format: 'micro', expected: '1y'},
      {datetime: '2024-04-01T14:46:00.000Z', tense: 'future', format: 'micro', expected: '2y'},

      // Dates in the future
      {datetime: '2022-11-24T14:46:00.000Z', tense: 'past', format: 'micro', expected: '1m'},
      {datetime: '2022-10-25T14:46:00.000Z', tense: 'past', format: 'micro', expected: '1m'},
      {datetime: '2022-10-24T15:46:00.000Z', tense: 'past', format: 'micro', expected: '1m'},

      // Dates in the past
      {datetime: '2022-10-24T13:46:00.000Z', tense: 'past', format: 'micro', expected: '1h'},
      {datetime: '2022-10-24T13:30:00.000Z', tense: 'past', format: 'micro', expected: '1h'},
      {datetime: '2022-10-24T13:17:00.000Z', tense: 'past', format: 'micro', expected: '1h'},
      {datetime: '2022-10-24T13:01:00.000Z', tense: 'past', format: 'micro', expected: '2h'},
      {datetime: '2022-10-18T14:46:00.000Z', tense: 'past', format: 'micro', expected: '6d'},
      {datetime: '2022-09-23T14:46:00.000Z', tense: 'past', format: 'micro', expected: '31d'},
      {datetime: '2021-10-25T14:46:00.000Z', tense: 'past', format: 'micro', expected: '364d'},
      {datetime: '2021-10-24T14:46:00.000Z', tense: 'past', format: 'micro', expected: '1y'},
      {datetime: '2021-05-18T14:46:00.000Z', tense: 'past', format: 'micro', expected: '1y'},
      {datetime: '2021-05-17T14:46:00.000Z', tense: 'past', format: 'micro', expected: '2y'},

      // Elapsed Times
      {datetime: '2022-10-24T14:46:10.000Z', format: 'elapsed', expected: '10s'},
      {datetime: '2022-10-24T14:45:50.000Z', format: 'elapsed', expected: '10s'},
      {datetime: '2022-10-24T14:45:50.000Z', format: 'elapsed', precision: 'minute', expected: '0m'},
      {datetime: '2022-10-24T14:47:40.000Z', format: 'elapsed', expected: '1m 40s'},
      {datetime: '2022-10-24T14:44:20.000Z', format: 'elapsed', expected: '1m 40s'},
      {datetime: '2022-10-24T14:44:20.000Z', format: 'elapsed', precision: 'minute', expected: '1m'},
      {datetime: '2022-10-24T15:51:40.000Z', format: 'elapsed', expected: '1h 5m 40s'},
      {datetime: '2022-10-24T15:51:40.000Z', format: 'elapsed', precision: 'minute', expected: '1h 5m'},
      {datetime: '2022-10-24T15:52:00.000Z', format: 'elapsed', expected: '1h 6m'},
      {datetime: '2022-10-24T17:46:00.000Z', format: 'elapsed', expected: '3h'},
      {datetime: '2022-10-24T10:46:00.000Z', format: 'elapsed', expected: '4h'},
      {datetime: '2022-10-25T18:46:00.000Z', format: 'elapsed', expected: '1d 4h'},
      {datetime: '2022-10-23T10:46:00.000Z', format: 'elapsed', expected: '1d 4h'},
      {datetime: '2022-10-23T10:46:00.000Z', format: 'elapsed', precision: 'day', expected: '1d'},
      {datetime: '2021-10-30T14:46:00.000Z', format: 'elapsed', expected: '11m 29d'},
      {datetime: '2021-10-30T14:46:00.000Z', format: 'elapsed', precision: 'month', expected: '11m'},
      {datetime: '2021-10-29T14:46:00.000Z', format: 'elapsed', expected: '1y'},

      // Dates in the past
      {datetime: '2022-09-24T14:46:00.000Z', tense: 'future', format: 'auto', expected: 'now'},
      {datetime: '2022-10-23T14:46:00.000Z', tense: 'future', format: 'auto', expected: 'now'},
      {datetime: '2022-10-24T13:46:00.000Z', tense: 'future', format: 'auto', expected: 'now'},

      // Dates in the future
      {datetime: '2022-10-24T15:46:00.000Z', tense: 'future', format: 'auto', expected: 'in 1 hour'},
      {datetime: '2022-10-24T16:00:00.000Z', tense: 'future', format: 'auto', expected: 'in 1 hour'},
      {datetime: '2022-10-24T16:15:00.000Z', tense: 'future', format: 'auto', expected: 'in 1 hour'},
      {datetime: '2022-10-24T16:31:00.000Z', tense: 'future', format: 'auto', expected: 'in 2 hours'},
      {datetime: '2022-10-30T14:46:00.000Z', tense: 'future', format: 'auto', expected: 'in 6 days'},
      {datetime: '2022-11-24T14:46:00.000Z', tense: 'future', format: 'auto', expected: 'next month'},
      {datetime: '2023-10-23T14:46:00.000Z', tense: 'future', format: 'auto', expected: 'next year'},
      {datetime: '2023-10-24T14:46:00.000Z', tense: 'future', format: 'auto', expected: 'next year'},
      {datetime: '2024-03-31T14:46:00.000Z', tense: 'future', format: 'auto', expected: 'next year'},
      {datetime: '2024-04-01T14:46:00.000Z', tense: 'future', format: 'auto', expected: 'in 2 years'},

      // Dates in the future
      {datetime: '2022-11-24T14:46:00.000Z', tense: 'past', format: 'auto', expected: 'now'},
      {datetime: '2022-10-25T14:46:00.000Z', tense: 'past', format: 'auto', expected: 'now'},
      {datetime: '2022-10-24T15:46:00.000Z', tense: 'past', format: 'auto', expected: 'now'},

      // Dates in the past
      {datetime: '2022-10-24T13:46:00.000Z', tense: 'past', format: 'auto', expected: '1 hour ago'},
      {datetime: '2022-10-24T13:30:00.000Z', tense: 'past', format: 'auto', expected: '1 hour ago'},
      {datetime: '2022-10-24T13:17:00.000Z', tense: 'past', format: 'auto', expected: '1 hour ago'},
      {datetime: '2022-10-24T13:01:00.000Z', tense: 'past', format: 'auto', expected: '2 hours ago'},
      {datetime: '2022-10-18T14:46:00.000Z', tense: 'past', format: 'auto', expected: '6 days ago'},
      {datetime: '2022-09-23T14:46:00.000Z', tense: 'past', format: 'auto', expected: 'last month'},
      {datetime: '2021-10-25T14:46:00.000Z', tense: 'past', format: 'auto', expected: '12 months ago'},
      {datetime: '2021-10-24T14:46:00.000Z', tense: 'past', format: 'auto', expected: '12 months ago'},
      {datetime: '2021-05-18T14:46:00.000Z', tense: 'past', format: 'auto', expected: '17 months ago'},
      {datetime: '2021-05-17T14:46:00.000Z', tense: 'past', format: 'auto', expected: '2 years ago'},

      // Edge case dates
      {
        reference: '2022-01-01T12:00:00.000Z',
        datetime: '2021-12-31T12:00:00.000Z',
        tense: 'past',
        format: 'auto',
        expected: 'yesterday',
      },
      {
        reference: '2022-01-01T12:00:00.000Z',
        datetime: '2021-12-31T12:00:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1d',
      },
      {
        reference: '2022-12-31T12:00:00.000Z',
        datetime: '2022-01-01T12:00:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '364d',
      },
      {
        reference: '2022-12-31T12:00:00.000Z',
        datetime: '2024-03-01T12:00:00.000Z',
        tense: 'future',
        format: 'auto',
        expected: 'next year',
      },
      {
        reference: '2022-12-31T12:00:00.000Z',
        datetime: '2024-03-01T12:00:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: '1y',
      },
    ])

    for (const {datetime, expected, tense, format, precision = '', lang = null, reference = referenceDate} of tests) {
      test(`<relative-time datetime="${datetime}" tense="${tense}" format="${format}"> => ${expected}`, async () => {
        freezeTime(new Date(reference))
        const time = document.createElement('relative-time')
        time.setAttribute('tense', tense)
        time.setAttribute('datetime', datetime)
        time.setAttribute('format', format)
        time.setAttribute('precision', precision)
        if (lang) time.setAttribute('lang', lang)
        await Promise.resolve()
        assert.equal(time.shadowRoot.textContent, expected)
      })
    }
  })
})
