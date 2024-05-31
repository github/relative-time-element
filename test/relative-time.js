import {assert} from '@open-wc/testing'
import {RelativeTimeElement, RelativeTimeUpdatedEvent} from '../src/index.ts'

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
    document.documentElement.lang = 'en'
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

  test('does not set title if no-title attribute is present', async () => {
    const el = document.createElement('relative-time')
    el.setAttribute('datetime', new Date().toISOString())
    el.setAttribute('no-title', '')
    await Promise.resolve()
    assert.equal(el.getAttribute('title'), null)
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
    const members = [
      ...Object.getOwnPropertyNames(RelativeTimeElement.prototype).map(n =>
        n.replace(/([A-Z])/g, c => `-${c.toLowerCase()}`),
      ),
      ...Object.getOwnPropertyNames(HTMLElement.prototype),
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

  test('uses html lang if given lang is invalid', async () => {
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', new Date())
    time.setAttribute('lang', '')
    document.documentElement.lang = 'es'
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'ahora')
  })

  test('ignores empty lang attributes', async () => {
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', new Date())
    time.setAttribute('lang', '')
    document.documentElement.lang = ''
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'now')
  })

  suite('[threshold]', function () {
    test('switches to dates after 30 past days with default threshold', async () => {
      const now = new Date(Date.now() - 32 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('datetime', now)
      await Promise.resolve()
      assert.match(time.shadowRoot.textContent, /on [A-Z][a-z]{2} \d{1,2}/)
    })

    test('switches to dates after 30 future days with default threshold', async () => {
      freezeTime(new Date('2023-01-01T00:00:00Z'))
      const time = document.createElement('relative-time')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('datetime', '2023-02-10T00:00:00Z')
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
      freezeTime(new Date('2023-01-01T00:00:00Z'))
      const time = document.createElement('relative-time')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('datetime', '2023-02-10T00:00:00Z')
      await Promise.resolve()
      assert.match(time.shadowRoot.textContent, /on [A-Z][a-z]{2} \d{1,2}/)
    })

    test('switches to dates after 30 future days with P1D threshold', async () => {
      freezeTime(new Date('2023-01-01T00:00:00Z'))
      const time = document.createElement('relative-time')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('threshold', 'P1D')
      time.setAttribute('datetime', '2023-01-03T00:00:00Z')
      await Promise.resolve()
      assert.match(time.shadowRoot.textContent, /on [A-Z][a-z]{2} \d{1,2}/)
    })

    test('uses `prefix` attribute to customise prefix', async () => {
      freezeTime(new Date('2023-01-01T00:00:00Z'))
      const time = document.createElement('relative-time')
      time.setAttribute('prefix', 'will happen by')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('datetime', '2023-02-01T00:00:00.000Z')
      await Promise.resolve()
      assert.match(time.shadowRoot.textContent, /will happen by [A-Z][a-z]{2} \d{1,2}/)
    })

    test('uses `prefix` attribute to customise prefix as empty string', async () => {
      freezeTime(new Date('2023-01-01T00:00:00Z'))
      const time = document.createElement('relative-time')
      time.setAttribute('prefix', '')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('datetime', '2023-02-01T00:00:00.000Z')
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
    assert.equal(time.shadowRoot.textContent, 'on Jan 10, 2022')
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
      freezeTime(new Date(2033, 1, 1))
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', '2023-01-01T00:00:00Z')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '11 years ago')
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
      freezeTime(new Date(2023, 8, 1))
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', '2023-06-01T00:00:00Z')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '4 months ago')
    })

    test('rewrites from last few days of month to smaller last month', async () => {
      freezeTime(new Date(2024, 4, 31))
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', '2024-04-30T00:00:00Z')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'last month')
    })

    test('rewrites from last few days of month to smaller previous month', async () => {
      freezeTime(new Date(2024, 4, 31))
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', '2024-02-29T00:00:00Z')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '3 months ago')
    })

    test('micro formats years', async () => {
      const datetime = new Date()
      datetime.setFullYear(datetime.getFullYear() - 10)
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', datetime)
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
      freezeTime(new Date(2023, 1, 1))
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', '2033-01-01T00:00:00Z')
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

  suite('relative-time-updated event', () => {
    test('dispatches a bubbling+composed relative-time-updated event on each update', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '1970-01-01T00:00:00.000-08:00')
      let event
      el.addEventListener('relative-time-updated', e => (event = e))
      await Promise.resolve()
      assert.instanceOf(event, RelativeTimeUpdatedEvent)
      assert.propertyVal(event, 'composed', true)
      assert.propertyVal(event, 'bubbles', true)
    })

    test('event contains oldText, newText, oldTitle, newTitle properties', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '1970-01-01T00:00:00.000-08:00')
      let event
      el.addEventListener('relative-time-updated', e => (event = e))
      await Promise.resolve()
      assert.propertyVal(event, 'oldText', '')
      assert.propertyVal(event, 'newText', 'on Jan 1, 1970')
      assert.propertyVal(event, 'oldTitle', '')
      assert.propertyVal(event, 'newTitle', 'Jan 1, 1970, 12:00 PM GMT+4')
      el.setAttribute('datetime', '1970-01-01T01:00:00.000-08:00')
      await Promise.resolve()
      assert.propertyVal(event, 'oldText', 'on Jan 1, 1970')
      assert.propertyVal(event, 'newText', 'on Jan 1, 1970')
      assert.propertyVal(event, 'oldTitle', 'Jan 1, 1970, 12:00 PM GMT+4')
      assert.propertyVal(event, 'newTitle', 'Jan 1, 1970, 1:00 PM GMT+4')
    })

    test('allows binding of `onrelativetimeupdated` property', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '1970-01-01T00:00:00.000-08:00')
      let event
      el.onRelativeTimeUpdated = e => (event = e)
      await Promise.resolve()
      assert.instanceOf(event, RelativeTimeUpdatedEvent)
    })

    test('unbinds old `onRelativeTimeUpdated` property values', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '1970-01-01T00:00:00.000-08:00')
      let called = false
      const fn = () => (called = true)
      el.onRelativeTimeUpdated = fn
      assert.equal(el.onRelativeTimeUpdated, fn)
      el.onRelativeTimeUpdated = null
      assert.equal(el.onRelativeTimeUpdated, null)
      await Promise.resolve()
      assert.equal(called, false, 'onRelativeTimeUpdated was called but should not have been')
    })

    test('only binds function event listeners on `onRelativeTimeUpdated`', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '1970-01-01T00:00:00.000-08:00')
      let called = false
      const listenerObject = {
        handleEvent() {
          called = true
        },
      }
      el.onRelativeTimeUpdated = listenerObject
      assert.equal(el.onRelativeTimeUpdated, listenerObject)
      await Promise.resolve()
      assert.equal(called, false, 'onRelativeTimeUpdated was called but should not have been')
    })

    test('calling stopImmediatePropagation() effects onRelativeTimeUpdated property', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '1970-01-01T00:00:00.000-08:00')
      let called = false
      el.addEventListener('relative-time-updated', e => {
        e.stopImmediatePropagation()
      })
      el.onRelativeTimeUpdated = () => (called = true)
      await Promise.resolve()
      assert.equal(called, false, 'onRelativeTimeUpdated was called but should not have been')
    })
  })

  suite('table tests', function () {
    const referenceDate = '2022-10-24T14:46:00.000Z'
    const tests = new Set([
      // Same as the current time
      {
        datetime: '2022-10-24T14:46:00.000Z',
        tense: 'future',
        format: 'relative',
        expected: 'now',
      },
      {
        datetime: '2022-10-24T14:46:00.000Z',
        tense: 'past',
        format: 'relative',
        expected: 'now',
      },
      {
        datetime: '2022-10-24T14:46:00.000Z',
        format: 'relative',
        formatStyle: 'narrow',
        expected: 'now',
      },
      {
        datetime: '2022-10-24T14:46:00.000Z',
        format: 'relative',
        precision: 'hour',
        expected: 'this hour',
      },
      {
        datetime: '2022-10-24T14:46:00.000Z',
        format: 'relative',
        threshold: 'PT0S',
        expected: 'on Oct 24',
      },
      {
        datetime: '2022-10-24T14:46:00.000Z',
        format: 'datetime',
        expected: 'Mon, Oct 24',
      },
      {
        datetime: '2022-10-24T14:46:00.000Z',
        format: 'datetime',
        weekday: '',
        month: '',
        expected: '24',
      },
      {
        datetime: '2022-10-24T14:46:00.000Z',
        format: 'duration',
        expected: '0 seconds',
      },
      {
        datetime: '2022-10-24T14:46:00.000Z',
        format: 'duration',
        precision: 'minute',
        expected: '0 minutes',
      },
      {
        datetime: '2022-10-24T14:46:00.000Z',
        format: 'duration',
        precision: 'day',
        expected: '0 days',
      },

      // A few seconds in the future
      {
        datetime: '2022-10-24T14:46:08.000Z',
        tense: 'future',
        format: 'relative',
        expected: 'now',
      },
      {
        datetime: '2022-10-24T14:46:08.000Z',
        tense: 'past',
        format: 'relative',
        expected: 'now',
      },
      {
        datetime: '2022-10-24T14:46:08.000Z',
        format: 'relative',
        formatStyle: 'narrow',
        expected: 'now',
      },
      {
        datetime: '2022-10-24T14:46:08.000Z',
        format: 'relative',
        precision: 'hour',
        expected: 'this hour',
      },
      {
        datetime: '2022-10-24T14:46:08.000Z',
        format: 'relative',
        threshold: 'PT0S',
        expected: 'on Oct 24',
      },
      {
        datetime: '2022-10-24T14:46:08.000Z',
        format: 'datetime',
        expected: 'Mon, Oct 24',
      },
      {
        datetime: '2022-10-24T14:46:00.000Z',
        format: 'datetime',
        weekday: '',
        month: '',
        expected: '24',
      },
      {
        datetime: '2022-10-24T14:46:08.000Z',
        format: 'duration',
        expected: '8 seconds',
      },
      {
        datetime: '2022-10-24T14:46:08.000Z',
        format: 'duration',
        precision: 'minute',
        expected: '0 minutes',
      },
      {
        datetime: '2022-10-24T14:46:08.000Z',
        format: 'duration',
        precision: 'day',
        expected: '0 days',
      },
      {
        datetime: '2022-10-24T14:46:08.000Z',
        format: 'duration',
        tense: 'future',
        expected: '8 seconds',
      },
      {
        datetime: '2022-10-24T14:46:08.000Z',
        format: 'duration',
        tense: 'past',
        expected: '0 seconds',
      },

      // 50 seconds in the future
      {
        datetime: '2022-10-24T14:46:50.000Z',
        tense: 'future',
        format: 'relative',
        expected: 'in 50 seconds',
      },
      {
        datetime: '2022-10-24T14:46:50.000Z',
        tense: 'past',
        format: 'relative',
        expected: 'now',
      },
      {
        datetime: '2022-10-24T14:46:50.000Z',
        format: 'relative',
        formatStyle: 'narrow',
        expected: 'in 50 sec.',
      },
      {
        datetime: '2022-10-24T14:46:50.000Z',
        format: 'relative',
        precision: 'minute',
        expected: 'this minute',
      },
      {
        datetime: '2022-10-24T14:46:50.000Z',
        format: 'relative',
        precision: 'day',
        expected: 'today',
      },
      {
        datetime: '2022-10-24T14:46:50.000Z',
        format: 'relative',
        threshold: 'PT0S',
        expected: 'on Oct 24',
      },
      {
        datetime: '2022-10-24T14:46:50.000Z',
        format: 'datetime',
        expected: 'Mon, Oct 24',
      },
      {
        datetime: '2022-10-24T14:46:50.000Z',
        format: 'datetime',
        weekday: '',
        month: '',
        expected: '24',
      },
      {
        datetime: '2022-10-24T14:46:50.000Z',
        format: 'duration',
        expected: '50 seconds',
      },
      {
        datetime: '2022-10-24T14:46:50.000Z',
        format: 'duration',
        precision: 'minute',
        expected: '0 minutes',
      },
      {
        datetime: '2022-10-24T14:46:50.000Z',
        format: 'duration',
        precision: 'day',
        expected: '0 days',
      },
      {
        datetime: '2022-10-24T14:46:50.000Z',
        format: 'duration',
        tense: 'future',
        expected: '50 seconds',
      },
      {
        datetime: '2022-10-24T14:46:50.000Z',
        format: 'duration',
        tense: 'past',
        expected: '0 seconds',
      },

      // 90 seconds in the future
      {
        datetime: '2022-10-24T14:47:30.000Z',
        tense: 'future',
        format: 'relative',
        expected: 'in 1 minute',
      },
      {
        datetime: '2022-10-24T14:47:30.000Z',
        tense: 'past',
        format: 'relative',
        expected: 'now',
      },
      {
        datetime: '2022-10-24T14:47:30.000Z',
        format: 'relative',
        formatStyle: 'narrow',
        expected: 'in 1 min.',
      },
      {
        datetime: '2022-10-24T14:47:30.000Z',
        format: 'relative',
        precision: 'hour',
        expected: 'this hour',
      },
      {
        datetime: '2022-10-24T14:47:30.000Z',
        format: 'relative',
        threshold: 'PT0S',
        expected: 'on Oct 24',
      },
      {
        datetime: '2022-10-24T14:47:30.000Z',
        format: 'datetime',
        expected: 'Mon, Oct 24',
      },
      {
        datetime: '2022-10-24T14:47:30.000Z',
        format: 'datetime',
        weekday: '',
        month: '',
        expected: '24',
      },
      {
        datetime: '2022-10-24T14:47:30.000Z',
        format: 'duration',
        expected: '1 minute, 30 seconds',
      },
      {
        datetime: '2022-10-24T14:47:30.000Z',
        format: 'duration',
        precision: 'minute',
        expected: '1 minute',
      },
      {
        datetime: '2022-10-24T14:47:30.000Z',
        format: 'duration',
        precision: 'day',
        expected: '0 days',
      },
      {
        datetime: '2022-10-24T14:47:30.000Z',
        format: 'duration',
        tense: 'future',
        expected: '1 minute, 30 seconds',
      },
      {
        datetime: '2022-10-24T14:47:30.000Z',
        format: 'duration',
        tense: 'past',
        expected: '0 seconds',
      },

      // 20 days in the future
      {
        datetime: '2022-11-13T15:46:00.000Z',
        tense: 'future',
        format: 'relative',
        expected: 'in 3 weeks',
      },
      {
        datetime: '2022-11-13T15:46:00.000Z',
        tense: 'past',
        format: 'relative',
        expected: 'now',
      },
      {
        datetime: '2022-11-13T15:46:00.000Z',
        format: 'relative',
        formatStyle: 'narrow',
        expected: 'in 3 wk.',
      },
      {
        datetime: '2022-11-13T15:46:00.000Z',
        format: 'relative',
        precision: 'hour',
        expected: 'in 3 weeks',
      },
      {
        datetime: '2022-11-13T15:46:00.000Z',
        format: 'relative',
        precision: 'month',
        expected: 'this month',
      },
      {
        datetime: '2022-11-13T15:46:00.000Z',
        format: 'relative',
        threshold: 'PT0S',
        expected: 'on Nov 13',
      },
      {
        datetime: '2022-11-13T15:46:00.000Z',
        format: 'datetime',
        expected: 'Sun, Nov 13',
      },
      {
        datetime: '2022-11-13T15:46:00.000Z',
        format: 'datetime',
        weekday: '',
        month: '',
        expected: '13',
      },
      {
        datetime: '2022-11-13T15:46:00.000Z',
        format: 'duration',
        expected: '20 days, 1 hour',
      },
      {
        datetime: '2022-11-13T15:46:00.000Z',
        format: 'duration',
        precision: 'minute',
        expected: '20 days, 1 hour',
      },
      {
        datetime: '2022-11-13T15:46:00.000Z',
        format: 'duration',
        precision: 'day',
        expected: '20 days',
      },
      {
        datetime: '2022-11-13T15:46:00.000Z',
        format: 'duration',
        tense: 'future',
        expected: '20 days, 1 hour',
      },
      {
        datetime: '2022-11-13T15:46:00.000Z',
        format: 'duration',
        tense: 'past',
        expected: '0 seconds',
      },

      // 40 days in the future
      {
        datetime: '2022-12-03T15:46:00.000Z',
        tense: 'future',
        format: 'relative',
        expected: 'in 2 months',
      },
      {
        datetime: '2022-12-03T15:46:00.000Z',
        tense: 'past',
        format: 'relative',
        expected: 'now',
      },
      {
        datetime: '2022-12-03T15:46:00.000Z',
        format: 'relative',
        formatStyle: 'narrow',
        expected: 'on Dec 3',
      },
      {
        datetime: '2022-12-03T15:46:00.000Z',
        format: 'relative',
        precision: 'hour',
        expected: 'on Dec 3',
      },
      {
        datetime: '2022-12-03T15:46:00.000Z',
        format: 'relative',
        threshold: 'PT0S',
        expected: 'on Dec 3',
      },
      {
        datetime: '2022-12-03T15:46:00.000Z',
        format: 'datetime',
        expected: 'Sat, Dec 3',
      },
      {
        datetime: '2022-12-03T15:46:00.000Z',
        format: 'datetime',
        weekday: '',
        month: '',
        expected: '3',
      },
      {
        datetime: '2022-12-03T15:46:00.000Z',
        format: 'duration',
        expected: '1 month, 10 days, 1 hour',
      },
      {
        datetime: '2022-12-03T15:46:00.000Z',
        format: 'duration',
        precision: 'minute',
        expected: '1 month, 10 days, 1 hour',
      },
      {
        datetime: '2022-12-03T15:46:00.000Z',
        format: 'duration',
        precision: 'day',
        expected: '1 month, 10 days',
      },
      {
        datetime: '2022-12-03T15:46:00.000Z',
        format: 'duration',
        tense: 'future',
        expected: '1 month, 10 days, 1 hour',
      },
      {
        datetime: '2022-12-03T15:46:00.000Z',
        format: 'duration',
        tense: 'past',
        expected: '0 seconds',
      },

      // 2 years in the future
      {
        datetime: '2024-10-24T14:46:00.000Z',
        tense: 'future',
        format: 'relative',
        expected: 'in 2 years',
      },
      {
        datetime: '2024-10-24T14:46:00.000Z',
        tense: 'past',
        format: 'relative',
        expected: 'now',
      },
      {
        datetime: '2024-10-24T14:46:00.000Z',
        format: 'relative',
        formatStyle: 'narrow',
        expected: 'on Oct 24, 2024',
      },
      {
        datetime: '2024-10-24T14:46:00.000Z',
        format: 'relative',
        precision: 'hour',
        expected: 'on Oct 24, 2024',
      },
      {
        datetime: '2024-10-24T14:46:00.000Z',
        format: 'relative',
        threshold: 'PT0S',
        expected: 'on Oct 24, 2024',
      },
      {
        datetime: '2024-10-24T14:46:00.000Z',
        format: 'datetime',
        expected: 'Thu, Oct 24, 2024',
      },
      {
        datetime: '2024-10-24T14:46:00.000Z',
        format: 'datetime',
        weekday: '',
        month: '',
        expected: '2024 (day: 24)',
      },
      {
        datetime: '2024-10-24T14:46:00.000Z',
        format: 'duration',
        expected: '2 years, 11 days',
      },
      {
        datetime: '2024-10-24T14:46:00.000Z',
        format: 'duration',
        precision: 'minute',
        expected: '2 years, 11 days',
      },
      {
        datetime: '2024-10-24T14:46:00.000Z',
        format: 'duration',
        precision: 'day',
        expected: '2 years, 11 days',
      },
      {
        datetime: '2024-10-24T14:46:00.000Z',
        format: 'duration',
        tense: 'future',
        expected: '2 years, 11 days',
      },
      {
        datetime: '2024-10-24T14:46:00.000Z',
        format: 'duration',
        tense: 'past',
        expected: '0 seconds',
      },

      // A few seconds in the past
      {
        datetime: '2022-10-24T14:45:52.000Z',
        tense: 'future',
        format: 'relative',
        expected: 'now',
      },
      {
        datetime: '2022-10-24T14:45:52.000Z',
        tense: 'past',
        format: 'relative',
        expected: 'now',
      },
      {
        datetime: '2022-10-24T14:45:52.000Z',
        format: 'relative',
        formatStyle: 'narrow',
        expected: 'now',
      },
      {
        datetime: '2022-10-24T14:45:52.000Z',
        format: 'relative',
        precision: 'hour',
        expected: 'this hour',
      },
      {
        datetime: '2022-10-24T14:45:52.000Z',
        format: 'relative',
        threshold: 'PT0S',
        expected: 'on Oct 24',
      },
      {
        datetime: '2022-10-24T14:45:52.000Z',
        format: 'datetime',
        expected: 'Mon, Oct 24',
      },
      {
        datetime: '2022-10-24T14:45:52.000Z',
        format: 'datetime',
        weekday: '',
        month: '',
        expected: '24',
      },
      {
        datetime: '2022-10-24T14:45:52.000Z',
        format: 'duration',
        expected: '8 seconds',
      },
      {
        datetime: '2022-10-24T14:45:52.000Z',
        format: 'duration',
        precision: 'minute',
        expected: '0 minutes',
      },
      {
        datetime: '2022-10-24T14:45:52.000Z',
        format: 'duration',
        precision: 'day',
        expected: '0 days',
      },
      {
        datetime: '2022-10-24T14:45:52.000Z',
        format: 'duration',
        tense: 'future',
        expected: '0 seconds',
      },
      {
        datetime: '2022-10-24T14:45:52.000Z',
        format: 'duration',
        tense: 'past',
        expected: '8 seconds',
      },

      // 50 seconds in the past
      {
        datetime: '2022-10-24T14:45:10.000Z',
        tense: 'future',
        format: 'relative',
        expected: 'now',
      },
      {
        datetime: '2022-10-24T14:45:10.000Z',
        tense: 'past',
        format: 'relative',
        expected: 'now',
      },
      {
        datetime: '2022-10-24T14:45:10.000Z',
        format: 'relative',
        formatStyle: 'narrow',
        expected: 'now',
      },
      {
        datetime: '2022-10-24T14:45:10.000Z',
        format: 'relative',
        precision: 'hour',
        expected: 'this hour',
      },
      {
        datetime: '2022-10-24T14:45:10.000Z',
        format: 'relative',
        precision: 'day',
        expected: 'today',
      },
      {
        datetime: '2022-10-24T14:45:10.000Z',
        format: 'relative',
        threshold: 'PT0S',
        expected: 'on Oct 24',
      },
      {
        datetime: '2022-10-24T14:45:10.000Z',
        format: 'datetime',
        expected: 'Mon, Oct 24',
      },
      {
        datetime: '2022-10-24T14:45:10.000Z',
        format: 'datetime',
        weekday: '',
        month: '',
        expected: '24',
      },
      {
        datetime: '2022-10-24T14:45:10.000Z',
        format: 'duration',
        expected: '50 seconds',
      },
      {
        datetime: '2022-10-24T14:45:10.000Z',
        format: 'duration',
        precision: 'minute',
        expected: '0 minutes',
      },
      {
        datetime: '2022-10-24T14:45:10.000Z',
        format: 'duration',
        precision: 'day',
        expected: '0 days',
      },
      {
        datetime: '2022-10-24T14:45:10.000Z',
        format: 'duration',
        tense: 'future',
        expected: '0 seconds',
      },
      {
        datetime: '2022-10-24T14:45:10.000Z',
        format: 'duration',
        tense: 'past',
        expected: '50 seconds',
      },

      // 90 seconds in the past
      {
        datetime: '2022-10-24T14:44:30.000Z',
        tense: 'future',
        format: 'relative',
        expected: 'now',
      },
      {
        datetime: '2022-10-24T14:44:30.000Z',
        tense: 'past',
        format: 'relative',
        expected: '1 minute ago',
      },
      {
        datetime: '2022-10-24T14:44:30.000Z',
        format: 'relative',
        formatStyle: 'narrow',
        expected: '1 min. ago',
      },
      {
        datetime: '2022-10-24T14:44:30.000Z',
        format: 'relative',
        precision: 'hour',
        expected: 'this hour',
      },
      {
        datetime: '2022-10-24T14:44:30.000Z',
        format: 'relative',
        threshold: 'PT0S',
        expected: 'on Oct 24',
      },
      {
        datetime: '2022-10-24T14:44:30.000Z',
        format: 'datetime',
        expected: 'Mon, Oct 24',
      },
      {
        datetime: '2022-10-24T14:44:30.000Z',
        format: 'datetime',
        weekday: '',
        month: '',
        expected: '24',
      },
      {
        datetime: '2022-10-24T14:44:30.000Z',
        format: 'duration',
        expected: '1 minute, 30 seconds',
      },
      {
        datetime: '2022-10-24T14:44:30.000Z',
        format: 'duration',
        precision: 'minute',
        expected: '1 minute',
      },
      {
        datetime: '2022-10-24T14:44:30.000Z',
        format: 'duration',
        precision: 'day',
        expected: '0 days',
      },
      {
        datetime: '2022-10-24T14:44:30.000Z',
        format: 'duration',
        tense: 'future',
        expected: '0 seconds',
      },
      {
        datetime: '2022-10-24T14:44:30.000Z',
        format: 'duration',
        tense: 'past',
        expected: '1 minute, 30 seconds',
      },

      // 20 days in the past
      {
        datetime: '2022-10-04T14:46:00.000Z',
        tense: 'future',
        format: 'relative',
        expected: 'now',
      },
      {
        datetime: '2022-10-04T14:46:00.000Z',
        tense: 'past',
        format: 'relative',
        expected: '3 weeks ago',
      },
      {
        datetime: '2022-10-04T14:46:00.000Z',
        format: 'relative',
        formatStyle: 'narrow',
        expected: '3 wk. ago',
      },
      {
        datetime: '2022-10-04T14:46:00.000Z',
        format: 'relative',
        precision: 'hour',
        expected: '3 weeks ago',
      },
      {
        datetime: '2022-10-04T14:46:00.000Z',
        format: 'relative',
        precision: 'month',
        expected: 'this month',
      },
      {
        datetime: '2022-10-04T14:46:00.000Z',
        format: 'relative',
        threshold: 'PT0S',
        expected: 'on Oct 4',
      },
      {
        datetime: '2022-10-04T14:46:00.000Z',
        format: 'datetime',
        expected: 'Tue, Oct 4',
      },
      {
        datetime: '2022-10-04T14:46:00.000Z',
        format: 'datetime',
        weekday: '',
        month: '',
        expected: '4',
      },
      {
        datetime: '2022-10-04T14:46:00.000Z',
        format: 'duration',
        expected: '20 days',
      },
      {
        datetime: '2022-10-04T14:46:00.000Z',
        format: 'duration',
        precision: 'minute',
        expected: '20 days',
      },
      {
        datetime: '2022-10-04T14:46:00.000Z',
        format: 'duration',
        precision: 'day',
        expected: '20 days',
      },
      {
        datetime: '2022-10-04T14:46:00.000Z',
        format: 'duration',
        tense: 'future',
        expected: '0 seconds',
      },
      {
        datetime: '2022-10-04T14:46:00.000Z',
        format: 'duration',
        tense: 'past',
        expected: '20 days',
      },

      // 40 days in the past
      {
        datetime: '2022-09-14T14:46:00.000Z',
        tense: 'future',
        format: 'relative',
        expected: 'now',
      },
      {
        datetime: '2022-09-14T14:46:00.000Z',
        tense: 'past',
        format: 'relative',
        expected: 'last month',
      },
      {
        datetime: '2022-09-14T14:46:00.000Z',
        format: 'relative',
        formatStyle: 'narrow',
        expected: 'on Sep 14',
      },
      {
        datetime: '2022-09-14T14:46:00.000Z',
        format: 'relative',
        precision: 'hour',
        expected: 'on Sep 14',
      },
      {
        datetime: '2022-09-14T14:46:00.000Z',
        format: 'relative',
        threshold: 'PT0S',
        expected: 'on Sep 14',
      },
      {
        datetime: '2022-09-14T14:46:00.000Z',
        format: 'datetime',
        expected: 'Wed, Sep 14',
      },
      {
        datetime: '2022-09-14T14:46:00.000Z',
        format: 'datetime',
        weekday: '',
        month: '',
        expected: '14',
      },
      {
        datetime: '2022-09-14T14:46:00.000Z',
        format: 'duration',
        expected: '1 month, 10 days',
      },
      {
        datetime: '2022-09-14T14:46:00.000Z',
        format: 'duration',
        precision: 'minute',
        expected: '1 month, 10 days',
      },
      {
        datetime: '2022-09-14T14:46:00.000Z',
        format: 'duration',
        precision: 'day',
        expected: '1 month, 10 days',
      },
      {
        datetime: '2022-09-14T14:46:00.000Z',
        format: 'duration',
        tense: 'future',
        expected: '0 seconds',
      },
      {
        datetime: '2022-09-14T14:46:00.000Z',
        format: 'duration',
        tense: 'past',
        expected: '1 month, 10 days',
      },

      // 2 years in the past
      {
        datetime: '2020-10-24T14:46:00.000Z',
        tense: 'future',
        format: 'relative',
        expected: 'now',
      },
      {
        datetime: '2020-10-24T14:46:00.000Z',
        tense: 'past',
        format: 'relative',
        expected: '2 years ago',
      },
      {
        datetime: '2020-10-24T14:46:00.000Z',
        format: 'relative',
        formatStyle: 'narrow',
        expected: 'on Oct 24, 2020',
      },
      {
        datetime: '2020-10-24T14:46:00.000Z',
        format: 'relative',
        precision: 'hour',
        expected: 'on Oct 24, 2020',
      },
      {
        datetime: '2020-10-24T14:46:00.000Z',
        format: 'relative',
        threshold: 'PT0S',
        expected: 'on Oct 24, 2020',
      },
      {
        datetime: '2020-10-24T14:46:00.000Z',
        format: 'datetime',
        expected: 'Sat, Oct 24, 2020',
      },
      {
        datetime: '2020-10-24T14:46:00.000Z',
        format: 'datetime',
        weekday: '',
        month: '',
        expected: '2020 (day: 24)',
      },
      {
        datetime: '2020-10-24T14:46:00.000Z',
        format: 'duration',
        expected: '2 years, 10 days',
      },
      {
        datetime: '2020-10-24T14:46:00.000Z',
        format: 'duration',
        precision: 'minute',
        expected: '2 years, 10 days',
      },
      {
        datetime: '2020-10-24T14:46:00.000Z',
        format: 'duration',
        precision: 'day',
        expected: '2 years, 10 days',
      },
      {
        datetime: '2020-10-24T14:46:00.000Z',
        format: 'duration',
        tense: 'future',
        expected: '0 seconds',
      },
      {
        datetime: '2020-10-24T14:46:00.000Z',
        format: 'duration',
        tense: 'past',
        expected: '2 years, 10 days',
      },
      {
        reference: '2023-03-23T12:03:00.000Z',
        datetime: '2023-03-21T16:03:00.000Z',
        format: 'relative',
        tense: 'past',
        expected: '2 days ago',
      },
    ])

    for (const {
      datetime,
      expected,
      tense,
      format,
      formatStyle,
      threshold,
      precision = '',
      weekday,
      month,
      lang = 'en',
      reference = referenceDate,
    } of tests) {
      const attrs = Object.entries({
        datetime,
        tense,
        format,
        formatStyle,
        precision,
      }).map(([k, v]) => (v ? `${k}="${v}"` : ''))
      test(`<relative-time ${attrs.join(' ')}> => ${expected}`, async () => {
        freezeTime(new Date(reference))
        const time = document.createElement('relative-time')
        time.setAttribute('datetime', datetime)
        if (tense) time.setAttribute('tense', tense)
        if (format) time.setAttribute('format', format)
        if (threshold) time.setAttribute('threshold', threshold)
        if (precision) time.setAttribute('precision', precision)
        if (weekday != null) time.setAttribute('weekday', weekday)
        if (month != null) time.setAttribute('month', month)
        if (lang) time.setAttribute('lang', lang)
        if (formatStyle) time.formatStyle = formatStyle
        await Promise.resolve()
        assert.equal(time.shadowRoot.textContent, expected)
      })
    }
  })

  suite('legacy formats', function () {
    const referenceDate = '2022-10-24T14:46:00.000Z'
    const tests = new Set([
      // Same as the current time
      {
        datetime: '2022-10-24T14:46:00.000z',
        tense: 'future',
        format: 'micro',
        expected: '1m',
      },
      {
        datetime: '2022-10-24T14:46:00.000z',
        tense: 'past',
        format: 'micro',
        expected: '1m',
      },
      {
        datetime: '2022-10-24T14:46:00.000z',
        tense: 'auto',
        format: 'micro',
        expected: '1m',
      },
      {
        datetime: '2022-10-24T14:46:00.000z',
        tense: 'auto',
        format: 'auto',
        expected: 'now',
      },

      // Dates in the past
      {
        datetime: '2022-09-24T14:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: '1m',
      },
      {
        datetime: '2022-10-23T14:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: '1m',
      },
      {
        datetime: '2022-10-24T13:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: '1m',
      },

      // Dates in the future
      {
        datetime: '2022-10-24T15:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: '1h',
      },
      {
        datetime: '2022-10-24T16:00:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: '1h',
      },
      {
        datetime: '2022-10-24T16:15:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: '1h',
      },
      {
        datetime: '2022-10-24T16:31:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: '1h',
      },
      {
        datetime: '2022-10-30T14:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: '1w',
      },
      {
        datetime: '2022-11-24T14:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: '1m',
      },
      {
        datetime: '2023-10-23T14:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: '1y',
      },
      {
        datetime: '2023-10-24T14:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: '1y',
      },
      {
        datetime: '2024-03-31T14:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: '2y',
      },
      {
        datetime: '2024-04-01T14:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: '2y',
      },

      // Dates in the future
      {
        datetime: '2022-11-24T14:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1m',
      },
      {
        datetime: '2022-10-25T14:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1m',
      },
      {
        datetime: '2022-10-24T15:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1m',
      },

      // Dates in the past
      {
        datetime: '2022-10-24T13:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1h',
      },
      {
        datetime: '2022-10-24T13:30:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1h',
      },
      {
        datetime: '2022-10-24T13:17:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1h',
      },
      {
        datetime: '2022-10-24T13:01:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1h',
      },
      {
        datetime: '2022-10-18T14:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1w',
      },
      {
        datetime: '2022-09-23T14:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1m',
      },
      {
        datetime: '2021-10-25T14:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1y',
      },
      {
        datetime: '2021-10-24T14:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1y',
      },
      {
        datetime: '2021-05-18T14:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1y',
      },
      {
        datetime: '2021-05-17T14:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1y',
      },

      // Elapsed Times
      {
        datetime: '2022-10-24T14:46:10.000Z',
        format: 'elapsed',
        expected: '10s',
      },
      {
        datetime: '2022-10-24T14:45:50.000Z',
        format: 'elapsed',
        expected: '10s',
      },
      {
        datetime: '2022-10-24T14:45:50.000Z',
        format: 'elapsed',
        precision: 'minute',
        expected: '0m',
      },
      {
        datetime: '2022-10-24T14:47:40.000Z',
        format: 'elapsed',
        expected: '1m 40s',
      },
      {
        datetime: '2022-10-24T14:44:20.000Z',
        format: 'elapsed',
        expected: '1m 40s',
      },
      {
        datetime: '2022-10-24T14:44:20.000Z',
        format: 'elapsed',
        precision: 'minute',
        expected: '1m',
      },
      {
        datetime: '2022-10-24T15:51:40.000Z',
        format: 'elapsed',
        expected: '1h 5m 40s',
      },
      {
        datetime: '2022-10-24T15:51:40.000Z',
        format: 'elapsed',
        precision: 'minute',
        expected: '1h 5m',
      },
      {
        datetime: '2022-10-24T15:52:00.000Z',
        format: 'elapsed',
        expected: '1h 6m',
      },
      {
        datetime: '2022-10-24T17:46:00.000Z',
        format: 'elapsed',
        expected: '3h',
      },
      {
        datetime: '2022-10-24T10:46:00.000Z',
        format: 'elapsed',
        expected: '4h',
      },
      {
        datetime: '2022-10-25T18:46:00.000Z',
        format: 'elapsed',
        expected: '1d 4h',
      },
      {
        datetime: '2022-10-23T10:46:00.000Z',
        format: 'elapsed',
        expected: '1d 4h',
      },
      {
        datetime: '2022-10-23T10:46:00.000Z',
        format: 'elapsed',
        precision: 'day',
        expected: '1d',
      },
      {
        datetime: '2021-10-30T14:46:00.000Z',
        format: 'elapsed',
        expected: '11m 29d',
      },
      {
        datetime: '2021-10-30T14:46:00.000Z',
        format: 'elapsed',
        precision: 'month',
        expected: '11m',
      },
      {
        datetime: '2021-10-29T14:46:00.000Z',
        format: 'elapsed',
        expected: '1y',
      },

      // Dates in the past
      {
        datetime: '2022-09-24T14:46:00.000Z',
        tense: 'future',
        format: 'auto',
        expected: 'now',
      },
      {
        datetime: '2022-10-23T14:46:00.000Z',
        tense: 'future',
        format: 'auto',
        expected: 'now',
      },
      {
        datetime: '2022-10-24T13:46:00.000Z',
        tense: 'future',
        format: 'auto',
        expected: 'now',
      },

      // Dates in the future
      {
        datetime: '2022-10-24T15:46:00.000Z',
        tense: 'future',
        format: 'auto',
        expected: 'in 1 hour',
      },
      {
        datetime: '2022-10-24T16:00:00.000Z',
        tense: 'future',
        format: 'auto',
        expected: 'in 1 hour',
      },
      {
        datetime: '2022-10-24T16:15:00.000Z',
        tense: 'future',
        format: 'auto',
        expected: 'in 1 hour',
      },
      {
        datetime: '2022-10-24T16:31:00.000Z',
        tense: 'future',
        format: 'auto',
        expected: 'in 1 hour',
      },
      {
        datetime: '2022-10-30T14:46:00.000Z',
        tense: 'future',
        format: 'auto',
        expected: 'next week',
      },
      {
        datetime: '2022-11-24T14:46:00.000Z',
        tense: 'future',
        format: 'auto',
        expected: 'next month',
      },
      {
        datetime: '2023-10-23T14:46:00.000Z',
        tense: 'future',
        format: 'auto',
        expected: 'next year',
      },
      {
        datetime: '2023-10-24T14:46:00.000Z',
        tense: 'future',
        format: 'auto',
        expected: 'next year',
      },
      {
        datetime: '2024-03-31T14:46:00.000Z',
        tense: 'future',
        format: 'auto',
        expected: 'in 2 years',
      },
      {
        datetime: '2024-04-01T14:46:00.000Z',
        tense: 'future',
        format: 'auto',
        expected: 'in 2 years',
      },
      {
        datetime: '2022-10-24T15:46:00.000Z',
        lang: 'en',
        tense: 'future',
        formatStyle: 'narrow',
        expected: 'in 1 hr.',
      },
      {
        datetime: '2022-10-24T16:00:00.000Z',
        lang: 'en',
        tense: 'future',
        formatStyle: 'narrow',
        expected: 'in 1 hr.',
      },
      {
        datetime: '2022-10-24T16:15:00.000Z',
        lang: 'en',
        tense: 'future',
        formatStyle: 'narrow',
        expected: 'in 1 hr.',
      },
      {
        datetime: '2022-10-24T16:31:00.000Z',
        lang: 'en',
        tense: 'future',
        formatStyle: 'narrow',
        expected: 'in 1 hr.',
      },
      {
        datetime: '2022-10-30T14:46:00.000Z',
        lang: 'en',
        tense: 'future',
        formatStyle: 'narrow',
        expected: 'next wk.',
      },
      {
        datetime: '2022-11-24T14:46:00.000Z',
        lang: 'en',
        tense: 'future',
        formatStyle: 'narrow',
        expected: 'next mo.',
      },
      {
        datetime: '2023-10-23T14:46:00.000Z',
        lang: 'en',
        tense: 'future',
        formatStyle: 'narrow',
        expected: 'next yr.',
      },
      {
        datetime: '2023-10-24T14:46:00.000Z',
        lang: 'en',
        tense: 'future',
        formatStyle: 'narrow',
        expected: 'next yr.',
      },
      {
        datetime: '2024-03-31T14:46:00.000Z',
        lang: 'en',
        tense: 'future',
        formatStyle: 'narrow',
        expected: 'in 2 yr.',
      },
      {
        datetime: '2024-04-01T14:46:00.000Z',
        lang: 'en',
        tense: 'future',
        formatStyle: 'narrow',
        expected: 'in 2 yr.',
      },

      // Dates in the future
      {
        datetime: '2022-11-24T14:46:00.000Z',
        tense: 'past',
        format: 'auto',
        expected: 'now',
      },
      {
        datetime: '2022-10-25T14:46:00.000Z',
        tense: 'past',
        format: 'auto',
        expected: 'now',
      },
      {
        datetime: '2022-10-24T15:46:00.000Z',
        tense: 'past',
        format: 'auto',
        expected: 'now',
      },

      // Dates in the past
      {
        datetime: '2022-10-24T13:46:00.000Z',
        tense: 'past',
        format: 'auto',
        expected: '1 hour ago',
      },
      {
        datetime: '2022-10-24T13:30:00.000Z',
        tense: 'past',
        format: 'auto',
        expected: '1 hour ago',
      },
      {
        datetime: '2022-10-24T13:17:00.000Z',
        tense: 'past',
        format: 'auto',
        expected: '1 hour ago',
      },
      {
        datetime: '2022-10-24T13:01:00.000Z',
        tense: 'past',
        format: 'auto',
        expected: '1 hour ago',
      },
      {
        datetime: '2022-10-18T14:46:00.000Z',
        tense: 'past',
        format: 'auto',
        expected: 'last week',
      },
      {
        datetime: '2022-09-23T14:46:00.000Z',
        tense: 'past',
        format: 'auto',
        expected: 'last month',
      },
      {
        datetime: '2021-10-25T14:46:00.000Z',
        tense: 'past',
        format: 'auto',
        expected: 'last year',
      },
      {
        datetime: '2021-10-24T14:46:00.000Z',
        tense: 'past',
        format: 'auto',
        expected: 'last year',
      },
      {
        datetime: '2021-05-18T14:46:00.000Z',
        tense: 'past',
        format: 'auto',
        expected: 'last year',
      },
      {
        datetime: '2021-05-17T14:46:00.000Z',
        tense: 'past',
        format: 'auto',
        expected: 'last year',
      },
      {
        datetime: '2022-10-24T13:46:00.000Z',
        lang: 'en',
        tense: 'past',
        formatStyle: 'narrow',
        expected: '1 hr. ago',
      },
      {
        datetime: '2022-10-24T13:30:00.000Z',
        lang: 'en',
        tense: 'past',
        formatStyle: 'narrow',
        expected: '1 hr. ago',
      },
      {
        datetime: '2022-10-24T13:17:00.000Z',
        lang: 'en',
        tense: 'past',
        formatStyle: 'narrow',
        expected: '1 hr. ago',
      },
      {
        datetime: '2022-10-24T13:01:00.000Z',
        lang: 'en',
        tense: 'past',
        formatStyle: 'narrow',
        expected: '1 hr. ago',
      },
      {
        datetime: '2022-10-18T14:46:00.000Z',
        lang: 'en',
        tense: 'past',
        formatStyle: 'narrow',
        expected: 'last wk.',
      },
      {
        datetime: '2022-09-23T14:46:00.000Z',
        lang: 'en',
        tense: 'past',
        formatStyle: 'narrow',
        expected: 'last mo.',
      },
      {
        datetime: '2021-10-25T14:46:00.000Z',
        lang: 'en',
        tense: 'past',
        formatStyle: 'narrow',
        expected: 'last yr.',
      },
      {
        datetime: '2021-10-24T14:46:00.000Z',
        lang: 'en',
        tense: 'past',
        formatStyle: 'narrow',
        expected: 'last yr.',
      },
      {
        datetime: '2021-05-18T14:46:00.000Z',
        lang: 'en',
        tense: 'past',
        formatStyle: 'narrow',
        expected: 'last yr.',
      },
      {
        datetime: '2021-05-17T14:46:00.000Z',
        lang: 'en',
        tense: 'past',
        formatStyle: 'narrow',
        expected: 'last yr.',
      },

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
        expected: '1y',
      },
      {
        reference: '2022-12-31T12:00:00.000Z',
        datetime: '2024-03-01T12:00:00.000Z',
        tense: 'future',
        format: 'auto',
        expected: 'in 2 years',
      },
      {
        reference: '2022-12-31T12:00:00.000Z',
        datetime: '2024-03-01T12:00:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: '2y',
      },
      {
        reference: '2021-04-24T12:00:00.000Z',
        datetime: '2023-02-01T12:00:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: '2y',
      },
      {
        reference: '2024-01-04T12:00:00.000Z',
        datetime: '2020-02-16T16:16:41.000Z',
        tense: 'past',
        format: 'auto',
        expected: '4 years ago',
      },
    ])

    for (const {
      datetime,
      expected,
      tense,
      format,
      formatStyle,
      precision = '',
      lang,
      reference = referenceDate,
    } of tests) {
      const attrs = Object.entries({
        datetime,
        tense,
        format,
        formatStyle,
        precision,
      }).map(([k, v]) => (v ? `${k}="${v}"` : ''))
      test(`<relative-time ${attrs.join(' ')}> => ${expected}`, async () => {
        freezeTime(new Date(reference))
        const time = document.createElement('relative-time')
        time.setAttribute('datetime', datetime)
        if (tense) time.setAttribute('tense', tense)
        if (format) time.setAttribute('format', format)
        if (precision) time.setAttribute('precision', precision)
        if (lang) time.setAttribute('lang', lang)
        if (formatStyle) time.formatStyle = formatStyle
        await Promise.resolve()
        assert.equal(time.shadowRoot.textContent, expected)
      })
    }
  })
})
