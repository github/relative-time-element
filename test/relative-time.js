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
    document.body.removeAttribute('data-prefers-absolute-time')
    fixture.innerHTML = ''
    if (dateNow) {
      // eslint-disable-next-line no-global-assign
      Date = dateNow
      dateNow = null
    }
  })

  test('keeps duration updates scheduled for the Unix epoch', async () => {
    freezeTime(new Date(5000))
    const originalSetTimeout = window.setTimeout
    const time = document.createElement('relative-time')
    let tick
    globalThis.setTimeout = window.setTimeout = function (callback) {
      tick = callback
      return 0
    }
    try {
      fixture.append(time)
      time.setAttribute('format', 'duration')
      time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '5 seconds')
      assert.isFunction(tick)
      Date.now = () => 6000
      tick()
      assert.equal(time.shadowRoot.textContent, '6 seconds')
    } finally {
      globalThis.setTimeout = window.setTimeout = originalSetTimeout
      time.disconnectedCallback()
    }
  })

  test('renders duration and elapsed formats with tabular numerals', async () => {
    freezeTime(new Date(5000))
    for (const format of ['duration', 'elapsed']) {
      const time = document.createElement('relative-time')
      time.setAttribute('format', format)
      time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
      await Promise.resolve()
      assert.equal(
        time.shadowRoot.firstElementChild.style.fontVariantNumeric,
        'tabular-nums',
        `${format} keeps each tick's digits the same width`,
      )
      time.disconnectedCallback()
    }
  })

  test('renders other formats without inline numeric styling', async () => {
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', '2026-10-30T00:00:00.000Z')
    await Promise.resolve()
    assert.equal(time.shadowRoot.firstElementChild.style.fontVariantNumeric, '')
    time.disconnectedCallback()
  })

  test('clears tabular numerals when the format changes away from duration', async () => {
    freezeTime(new Date(5000))
    const time = document.createElement('relative-time')
    time.setAttribute('format', 'duration')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    await Promise.resolve()
    assert.equal(time.shadowRoot.firstElementChild.style.fontVariantNumeric, 'tabular-nums')
    time.setAttribute('format', 'auto')
    await Promise.resolve()
    assert.equal(
      time.shadowRoot.firstElementChild.style.fontVariantNumeric,
      '',
      'the reused span does not keep tabular-nums after the format change',
    )
    time.disconnectedCallback()
  })

  test('reschedules future micro datetime updates at the explicit threshold boundary', async () => {
    const originalSetTimeout = window.setTimeout
    const delays = []
    const time = document.createElement('relative-time')
    globalThis.setTimeout = window.setTimeout = function (_, ms) {
      delays.push(ms)
      return 1
    }
    try {
      fixture.append(time)
      time.setAttribute('format', 'micro')
      time.setAttribute('datetime', new Date(Date.now() + 65 * 1000).toISOString())
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '1m')
      assert.isAtLeast(delays[0], 59000)

      delays.length = 0
      time.setAttribute('threshold', 'PT1M')
      await Promise.resolve()
      assert.match(time.shadowRoot.textContent, /on [A-Z][a-z]{2} \d{1,2}/)
      assert.isAbove(delays[0], 0)
      assert.isBelow(delays[0], 6000)

      delays.length = 0
      const pastTime = document.createElement('relative-time')
      fixture.append(pastTime)
      pastTime.setAttribute('format', 'micro')
      pastTime.setAttribute('threshold', 'PT1H')
      pastTime.setAttribute('datetime', new Date(Date.now() - 59 * 60 * 1000 - 58 * 1000).toISOString())
      await Promise.resolve()
      assert.equal(pastTime.shadowRoot.textContent, '1h')
      assert.isAbove(delays[0], 0)
      assert.isBelow(delays[0], 6000)
      pastTime.disconnectedCallback()
    } finally {
      globalThis.setTimeout = window.setTimeout = originalSetTimeout
      time.disconnectedCallback()
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

  test('does not rebuild the render root when the displayed text is unchanged', async () => {
    const el = document.createElement('relative-time')
    el.setAttribute('datetime', new Date(Date.now() - 3 * 60 * 1000).toISOString())
    fixture.append(el)
    await Promise.resolve()
    const root = el.shadowRoot.querySelector('[part="root"]')
    assert.ok(root, 'expected a rendered [part="root"] element')
    const text = root.textContent

    // A subsequent update that produces the same text must not replace the node.
    el.update()
    await Promise.resolve()
    const rootAfter = el.shadowRoot.querySelector('[part="root"]')
    assert.equal(rootAfter, root, 'render root node should be reused when text is unchanged')
    assert.equal(rootAfter.textContent, text)
  })

  test('reuses the render root node and updates text in place when the display changes', async () => {
    const el = document.createElement('relative-time')
    el.setAttribute('datetime', new Date(Date.now() - 3 * 60 * 1000).toISOString())
    fixture.append(el)
    await Promise.resolve()
    const root = el.shadowRoot.querySelector('[part="root"]')
    const text = root.textContent

    el.setAttribute('datetime', new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString())
    await Promise.resolve()
    const rootAfter = el.shadowRoot.querySelector('[part="root"]')
    assert.equal(rootAfter, root, 'render root node should be reused across a text change')
    assert.notEqual(rootAfter.textContent, text, 'text should have changed')
  })

  test('emits no shadow-root mutations on a no-op update', async () => {
    const el = document.createElement('relative-time')
    el.setAttribute('datetime', new Date(Date.now() - 3 * 60 * 1000).toISOString())
    fixture.append(el)
    await Promise.resolve()

    const records = []
    const observer = new MutationObserver(mutations => records.push(...mutations))
    observer.observe(el.shadowRoot, {subtree: true, childList: true, characterData: true, attributes: true})
    try {
      el.update()
      await Promise.resolve()
    } finally {
      observer.disconnect()
    }
    assert.deepEqual(records, [], 'a no-op update must not mutate the shadow root')
  })

  test('emits no shadow-root mutations on a no-op update when aria-hidden', async () => {
    const el = document.createElement('relative-time')
    el.setAttribute('aria-hidden', 'true')
    el.setAttribute('datetime', new Date(Date.now() - 3 * 60 * 1000).toISOString())
    fixture.append(el)
    await Promise.resolve()
    const span = el.shadowRoot.querySelector('[part="root"]')
    assert.equal(span.getAttribute('aria-hidden'), 'true', 'aria-hidden should be mirrored onto the span')

    const records = []
    const observer = new MutationObserver(mutations => records.push(...mutations))
    observer.observe(el.shadowRoot, {subtree: true, childList: true, characterData: true, attributes: true})
    try {
      el.update()
      await Promise.resolve()
    } finally {
      observer.disconnect()
    }
    assert.deepEqual(records, [], 'a no-op update must not rewrite aria-hidden or text')
  })

  test('does not rewrite the title attribute on a no-op update', async () => {
    const el = document.createElement('relative-time')
    el.setAttribute('datetime', new Date(Date.now() - 3 * 60 * 1000).toISOString())
    fixture.append(el)
    await Promise.resolve()
    const title = el.getAttribute('title')
    assert.ok(title, 'expected a formatted title to be set')

    const records = []
    const observer = new MutationObserver(mutations => records.push(...mutations))
    observer.observe(el, {attributes: true, attributeFilter: ['title']})
    try {
      el.update()
      await Promise.resolve()
    } finally {
      observer.disconnect()
    }
    assert.deepEqual(records, [], 'an unchanged formatted title must not be written again')
    assert.equal(el.getAttribute('title'), title)
  })

  test('calls update even after nullish datetime', async () => {
    const el = document.createElement('relative-time')
    el.setAttribute('datetime', '')
    await new Promise(resolve => setTimeout(resolve, 10))
    el.setAttribute('datetime', new Date().toISOString())
    await Promise.resolve()
    assert(el.shadowRoot.textContent.length > 0, 'should have set time, but textContent is empty')
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
    fixture.append(el)
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
    observedAttributes.delete('aria-hidden') // Standard HTML attribute, no need for custom getter
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

    test('micro switches to dates after explicit P30D threshold', async () => {
      freezeTime(new Date('2023-01-01T00:00:00Z'))
      const time = document.createElement('relative-time')
      time.setAttribute('format', 'micro')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('threshold', 'P30D')
      time.setAttribute('datetime', '2022-11-15T00:00:00Z')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'on Nov 15, 2022')
    })

    test('micro threshold datetime output does not include tense phrasing', async () => {
      freezeTime(new Date('2023-01-01T00:00:00Z'))
      const time = document.createElement('relative-time')
      time.setAttribute('format', 'micro')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('tense', 'past')
      time.setAttribute('threshold', 'P30D')
      time.setAttribute('datetime', '2022-11-15T00:00:00Z')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'on Nov 15, 2022')
    })

    test('micro uses duration within explicit P30D threshold', async () => {
      freezeTime(new Date('2023-01-15T00:00:00Z'))
      const time = document.createElement('relative-time')
      time.setAttribute('format', 'micro')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('threshold', 'P30D')
      time.setAttribute('datetime', '2023-01-01T00:00:00Z')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '2w')
    })

    test('micro ignores default P30D threshold unless threshold attribute is set', async () => {
      freezeTime(new Date('2023-01-01T00:00:00Z'))
      const time = document.createElement('relative-time')
      time.setAttribute('format', 'micro')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('datetime', '2022-11-15T00:00:00Z')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '2mo')
    })

    test('micro with auto tense remains compact', async () => {
      freezeTime(new Date('2023-01-15T00:00:00Z'))
      const time = document.createElement('relative-time')
      time.setAttribute('format', 'micro')
      time.setAttribute('lang', 'en-US')
      time.setAttribute('tense', 'auto')
      time.setAttribute('datetime', '2023-01-01T00:00:00Z')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '2w')
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

  test('warns for and ignores malformed dates', async () => {
    const originalWarn = globalThis.console.warn
    let warning
    globalThis.console.warn = message => {
      warning = message
    }
    const time = document.createElement('relative-time')
    try {
      time.shadowRoot.textContent = 'Jun 30'
      time.setAttribute('datetime', 'bogus')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'Jun 30')
      assert.equal(warning, 'The datetime attribute must use the ECMAScript date-time string format: bogus')

      for (const datetime of ['2024T03:04', '2024-01T03:04']) {
        time.setAttribute('datetime', datetime)
        assert.equal(warning, `The datetime attribute must use the ECMAScript date-time string format: ${datetime}`)
      }
    } finally {
      globalThis.console.warn = originalWarn
    }
  })

  test('warns for implementation-dependent date strings without changing parsing', () => {
    const originalWarn = globalThis.console.warn
    let warning
    globalThis.console.warn = message => {
      warning = message
    }
    const time = document.createElement('relative-time')
    const datetime = '2009-11-10 23:00:00+00:00 UTC'
    try {
      time.setAttribute('datetime', datetime)
      const parsed = Date.parse(datetime)
      assert.equal(time.date?.getTime() ?? null, Number.isNaN(parsed) ? null : parsed)
      assert.equal(warning, `The datetime attribute must use the ECMAScript date-time string format: ${datetime}`)
    } finally {
      globalThis.console.warn = originalWarn
    }
  })

  test('does not warn for ECMAScript date-time strings', () => {
    const originalWarn = globalThis.console.warn
    let warned = false
    globalThis.console.warn = () => {
      warned = true
    }
    const time = document.createElement('relative-time')
    try {
      for (const datetime of [
        '2024',
        '2024-01',
        '2024-01-02',
        '2024-01-02T03:04',
        '2024-01-02T03:04:05.006Z',
        '2024-01-02T03:04:05+02:30',
        '+001970-01-01T00:00:00Z',
        '1995-02-04T24:00',
      ]) {
        time.setAttribute('datetime', datetime)
      }
      assert.isFalse(warned)
    } finally {
      globalThis.console.warn = originalWarn
    }
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

    test('micro tense phrasing respects lang attribute', async () => {
      const now = new Date(Date.now() + 3 * 60 * 60 * 24 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      time.setAttribute('lang', 'es')
      time.setAttribute('tense', 'future')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'dentro de 3 d')
    })
  }

  test('renders correctly when given an invalid lang', async () => {
    const now = new Date().toISOString()

    const element = document.createElement('relative-time')
    element.setAttribute('datetime', now)
    element.setAttribute('lang', 'does-not-exist')

    await Promise.resolve()
    assert.equal(element.shadowRoot.textContent, 'now')
  })

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
      // FIXME: there is still a bug, if the duration is long enough (say, 10 or 100 years)
      // then the `month = Math.floor(day / 30)` in elapsedTime causes errors, then "10 years" would output "11y"
      const now = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '2y ago')
    })

    test('micro formats future times', async () => {
      const now = new Date(Date.now() + 3 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '1m ago')
    })

    test('micro formats hours', async () => {
      const now = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '1h ago')
    })

    test('micro formats days', async () => {
      freezeTime(new Date(2024, 0, 15, 12))
      const now = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '1d ago')
    })

    test('micro formats months', async () => {
      freezeTime(new Date(2024, 0, 15))
      const datetime = new Date()
      datetime.setMonth(datetime.getMonth() - 2)
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'past')
      time.setAttribute('datetime', datetime)
      time.setAttribute('format', 'micro')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, '2mo ago')
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
      // FIXME: there is still a bug, if the duration is long enough (say, 10 or 100 years)
      // then the `month = Math.floor(day / 30)` in elapsedTime causes errors, then "10 years" would output "11y"
      const now = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'in 2y')
    })

    test('micro formats near-future times', async () => {
      const now = new Date(Date.now() + 3 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'in 1m')
    })

    test('micro formats hours', async () => {
      const now = new Date(Date.now() + 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'in 1h')
    })

    test('micro formats same-day hours rounded to a day', async () => {
      freezeTime(new Date(2024, 0, 15, 0, 30))
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', new Date(2024, 0, 15, 22, 30).toISOString())
      time.setAttribute('format', 'micro')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'in 1d')
    })

    test('micro formats days', async () => {
      freezeTime(new Date(2024, 0, 15, 12))
      const now = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('tense', 'future')
      time.setAttribute('datetime', now)
      time.setAttribute('format', 'micro')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'in 1d')
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
        expected: 'in 50s',
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
        expected: 'in 1m',
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
        expected: 'in 3w',
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
        precision: 'year',
        expected: '2 years',
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
        expected: '50 seconds ago',
      },
      {
        datetime: '2022-10-24T14:45:10.000Z',
        format: 'relative',
        formatStyle: 'narrow',
        expected: '50s ago',
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
        expected: '1m ago',
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
        expected: '3w ago',
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

  suite('experimental: [data-prefers-absolute-time]', async () => {
    teardown(() => {
      document.documentElement.removeAttribute('data-prefers-absolute-time')
      document.body.removeAttribute('data-prefers-absolute-time')
    })
    test('formats with absolute time when data-prefers-absolute-time="true"', async () => {
      document.documentElement.setAttribute('data-prefers-absolute-time', 'true')
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '2022-01-01T12:00:00.000Z')
      await Promise.resolve()

      assert.match(el.shadowRoot.textContent, /[A-Z][a-z]{2} \d{1,2}, \d{4}, \d{1,2}:\d{2} (AM|PM)/)
    })

    test('does not format with absolute time when format is elapsed or duration', async () => {
      document.documentElement.setAttribute('data-prefers-absolute-time', 'true')
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '2022-01-01T12:00:00.000Z')
      el.setAttribute('format', 'elapsed')
      await Promise.resolve()

      assert.notMatch(el.shadowRoot.textContent, /[A-Z][a-z]{2} \d{1,2}, \d{4}, \d{1,2}:\d{2} (AM|PM)/)
    })

    test('does not format with absolute time when data-prefers-absolute-time="false"', async () => {
      document.documentElement.setAttribute('data-prefers-absolute-time', 'false')
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', new Date(Date.now() - 3 * 60 * 60 * 24 * 1000).toISOString())
      await Promise.resolve()

      assert.equal(el.shadowRoot.textContent, '3 days ago')
    })

    test('does not format with absolute time when data-prefers-absolute-time attribute is not set', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', new Date(Date.now() - 3 * 60 * 60 * 24 * 1000).toISOString())
      await Promise.resolve()

      assert.equal(el.shadowRoot.textContent, '3 days ago')
    })

    test('supports data-prefers-absolute-time="true" on body element too', async () => {
      document.body.setAttribute('data-prefers-absolute-time', 'true')
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '2022-01-01T12:00:00.000Z')
      await Promise.resolve()

      assert.match(el.shadowRoot.textContent, /[A-Z][a-z]{2} \d{1,2}, \d{4}, \d{1,2}:\d{2} (AM|PM)/)
    })

    test('formats today dates with "Today" text', async () => {
      freezeTime(new Date('2023-01-15T17:00:00.000Z'))

      document.documentElement.setAttribute('data-prefers-absolute-time', 'true')
      const el = document.createElement('relative-time')
      el.setAttribute('lang', 'en-US')
      el.setAttribute('time-zone', 'America/New_York')

      el.setAttribute('datetime', '2023-01-15T17:00:00.000Z')
      await Promise.resolve()

      assert.equal(el.shadowRoot.textContent, 'Today 12:00 PM EST')
    })

    test('formats current year dates without year', async () => {
      freezeTime(new Date('2023-06-15T12:00:00.000Z'))

      document.documentElement.setAttribute('data-prefers-absolute-time', 'true')
      const el = document.createElement('relative-time')
      el.setAttribute('lang', 'en-US')
      el.setAttribute('time-zone', 'America/New_York')
      el.setAttribute('datetime', '2023-03-10T18:00:00.000Z')
      await Promise.resolve()

      assert.equal(el.shadowRoot.textContent, 'Mar 10, 1:00 PM EST')
    })

    test('formats different year dates as full date', async () => {
      freezeTime(new Date('2023-06-15T12:00:00.000Z'))

      document.documentElement.setAttribute('data-prefers-absolute-time', 'true')
      const el = document.createElement('relative-time')
      el.setAttribute('lang', 'en-US')
      el.setAttribute('time-zone', 'America/New_York')
      el.setAttribute('datetime', '2022-03-10T18:00:00.000Z')
      await Promise.resolve()

      assert.equal(el.shadowRoot.textContent, 'Mar 10, 2022, 1:00 PM EST')
    })

    test('respects locale formatting', async () => {
      freezeTime(new Date('2023-01-15T17:00:00.000Z'))

      document.documentElement.setAttribute('data-prefers-absolute-time', 'true')
      const el = document.createElement('relative-time')
      el.setAttribute('lang', 'es-ES')
      el.setAttribute('time-zone', 'Europe/Madrid')
      el.setAttribute('hour-cycle', 'h23')

      el.setAttribute('datetime', '2023-01-15T17:00:00.000Z')
      await Promise.resolve()

      // Spanish formatting - "hoy" = "today", 24-hour format
      assert.equal(el.shadowRoot.textContent, 'Hoy 18:00 CET')
    })

    test('uses element time-zone attribute', async () => {
      freezeTime(new Date('2023-01-15T17:00:00.000Z'))

      document.documentElement.setAttribute('data-prefers-absolute-time', 'true')
      const el = document.createElement('relative-time')
      el.setAttribute('lang', 'en-US')
      el.setAttribute('time-zone', 'Europe/Paris')
      el.setAttribute('datetime', '2023-01-15T17:00:00.000Z')
      await Promise.resolve()

      assert.equal(el.shadowRoot.textContent, 'Today 6:00 PM GMT+1')
    })

    suite('format exclusions', function () {
      test('does not activate for format="duration"', async () => {
        freezeTime(new Date('2023-01-15T17:00:00.000Z'))
        document.documentElement.setAttribute('data-prefers-absolute-time', 'true')

        const el = document.createElement('relative-time')
        el.setAttribute('lang', 'en-US')
        el.setAttribute('datetime', '2023-01-15T16:00:00.000Z')
        el.setAttribute('format', 'duration')
        await Promise.resolve()

        assert.equal(el.shadowRoot.textContent, '1 hour')
      })

      test('does not activate for format="elapsed"', async () => {
        freezeTime(new Date('2023-01-15T17:00:00.000Z'))
        document.documentElement.setAttribute('data-prefers-absolute-time', 'true')

        const el = document.createElement('relative-time')
        el.setAttribute('lang', 'en-US')
        el.setAttribute('datetime', '2023-01-15T16:00:00.000Z')
        el.setAttribute('format', 'elapsed')
        await Promise.resolve()

        assert.equal(el.shadowRoot.textContent, '1h')
      })

      test('activates for format="micro"', async () => {
        freezeTime(new Date('2023-01-15T17:00:00.000Z'))
        document.documentElement.setAttribute('data-prefers-absolute-time', 'true')

        const el = document.createElement('relative-time')
        el.setAttribute('lang', 'en-US')
        el.setAttribute('time-zone', 'GMT')
        el.setAttribute('datetime', '2023-01-15T16:00:00.000Z')
        el.setAttribute('format', 'micro')
        await Promise.resolve()

        assert.equal(el.shadowRoot.textContent, 'Today 4:00 PM UTC')
      })

      test('does not observe old format="micro" absolute-time preference output', async () => {
        freezeTime(new Date('2023-01-15T17:00:00.000Z'))
        document.documentElement.setAttribute('data-prefers-absolute-time', 'true')
        const originalSetTimeout = window.setTimeout
        const delays = []
        globalThis.setTimeout = window.setTimeout = function (_, ms) {
          delays.push(ms)
          return 1
        }
        try {
          const el = document.createElement('relative-time')
          el.setAttribute('lang', 'en-US')
          el.setAttribute('time-zone', 'GMT')
          el.setAttribute('datetime', '2022-01-15T17:00:00.000Z')
          el.setAttribute('format', 'micro')
          await Promise.resolve()

          assert.equal(el.shadowRoot.textContent, 'Jan 15, 2022, 5:00 PM UTC')
          assert.empty(delays)
          el.disconnectedCallback()
        } finally {
          globalThis.setTimeout = window.setTimeout = originalSetTimeout
        }
      })

      test('format="micro" absolute-time preference output does not include tense phrasing', async () => {
        freezeTime(new Date('2023-01-15T17:00:00.000Z'))
        document.documentElement.setAttribute('data-prefers-absolute-time', 'true')

        const el = document.createElement('relative-time')
        el.setAttribute('lang', 'en-US')
        el.setAttribute('time-zone', 'GMT')
        el.setAttribute('datetime', '2023-01-15T16:00:00.000Z')
        el.setAttribute('format', 'micro')
        el.setAttribute('tense', 'past')
        await Promise.resolve()

        assert.equal(el.shadowRoot.textContent, 'Today 4:00 PM UTC')
      })

      test('activates for format="relative" (default)', async () => {
        freezeTime(new Date('2023-01-15T17:00:00.000Z'))
        document.documentElement.setAttribute('data-prefers-absolute-time', 'true')

        const el = document.createElement('relative-time')
        el.setAttribute('lang', 'en-US')
        el.setAttribute('time-zone', 'GMT')
        el.setAttribute('datetime', '2023-01-15T17:00:00.000Z')
        el.setAttribute('format', 'relative')
        await Promise.resolve()

        assert.equal(el.shadowRoot.textContent, 'Today 5:00 PM UTC')
      })

      test('activates for format="auto"', async () => {
        freezeTime(new Date('2023-01-15T17:00:00.000Z'))
        document.documentElement.setAttribute('data-prefers-absolute-time', 'true')

        const el = document.createElement('relative-time')
        el.setAttribute('lang', 'en-US')
        el.setAttribute('time-zone', 'UTC')
        el.setAttribute('datetime', '2023-01-15T17:00:00.000Z')
        el.setAttribute('format', 'auto')
        await Promise.resolve()

        assert.equal(el.shadowRoot.textContent, 'Today 5:00 PM UTC')
      })

      test('activates for format="datetime" if current day', async () => {
        freezeTime(new Date('2023-01-15T17:00:00.000Z'))
        document.documentElement.setAttribute('data-prefers-absolute-time', 'true')

        const el = document.createElement('relative-time')
        el.setAttribute('lang', 'en-US')
        el.setAttribute('time-zone', 'America/New_York')
        el.setAttribute('datetime', '2023-01-15T17:00:00.000Z')
        el.setAttribute('format', 'datetime')
        await Promise.resolve()

        assert.equal(el.shadowRoot.textContent, 'Today 12:00 PM EST')
      })

      test('activates for format="datetime" if current year but not today', async () => {
        freezeTime(new Date('2023-06-15T17:00:00.000Z'))
        document.documentElement.setAttribute('data-prefers-absolute-time', 'true')

        const el = document.createElement('relative-time')
        el.setAttribute('lang', 'en-US')
        el.setAttribute('time-zone', 'America/New_York')
        el.setAttribute('datetime', '2023-03-10T18:00:00.000Z') // 18:00 UTC = 1:00 PM EST
        el.setAttribute('format', 'datetime')
        await Promise.resolve()

        assert.equal(el.shadowRoot.textContent, 'Mar 10, 1:00 PM EST')
      })
    })
  })

  suite('[aria-hidden]', async () => {
    test('[aria-hidden="true"] applies to shadow root', async () => {
      const now = new Date().toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('datetime', now)
      time.setAttribute('aria-hidden', 'true')
      await Promise.resolve()

      const span = time.shadowRoot.querySelector('span')
      assert.equal(span.getAttribute('aria-hidden'), 'true')
    })

    test('[aria-hidden="false"] applies to shadow root', async () => {
      const now = new Date().toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('datetime', now)
      time.setAttribute('aria-hidden', 'false')
      await Promise.resolve()

      assert.isNull(time.shadowRoot.querySelector('[aria-hidden]'), 'Expected no aria-hidden to be present')
    })

    test('no aria-hidden applies to shadow root', async () => {
      const now = new Date().toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('datetime', now)
      await Promise.resolve()

      assert.isNull(time.shadowRoot.querySelector('[aria-hidden]'), 'Expected no aria-hidden to be present')
    })
  })

  suite('[part]', () => {
    test('shadow root span has part="root"', async () => {
      const now = new Date().toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('datetime', now)
      await Promise.resolve()

      const span = time.shadowRoot.querySelector('span')
      assert.equal(span.getAttribute('part'), 'root')
    })

    test('shadow root span has part="root" alongside aria-hidden="true"', async () => {
      const now = new Date().toISOString()
      const time = document.createElement('relative-time')
      time.setAttribute('datetime', now)
      time.setAttribute('aria-hidden', 'true')
      await Promise.resolve()

      const span = time.shadowRoot.querySelector('span')
      assert.equal(span.getAttribute('part'), 'root')
      assert.equal(span.getAttribute('aria-hidden'), 'true')
    })
  })

  suite('legacy formats', function () {
    const referenceDate = '2022-10-24T14:46:00.000Z'
    const tests = new Set([
      // Same as the current time
      {
        datetime: '2022-10-24T14:46:00.000z',
        tense: 'future',
        format: 'micro',
        expected: 'in 1m',
      },
      {
        datetime: '2022-10-24T14:46:00.000z',
        tense: 'past',
        format: 'micro',
        expected: '1m ago',
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
        expected: 'in 1mo',
      },
      {
        datetime: '2022-10-23T14:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: 'in 1m',
      },
      {
        datetime: '2022-10-24T13:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: 'in 1m',
      },

      // Dates in the future
      {
        datetime: '2022-10-24T15:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: 'in 1h',
      },
      {
        datetime: '2022-10-24T16:00:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: 'in 1h',
      },
      {
        datetime: '2022-10-24T16:15:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: 'in 1h',
      },
      {
        datetime: '2022-10-24T16:31:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: 'in 1h',
      },
      {
        datetime: '2022-10-30T14:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: 'in 1w',
      },
      {
        datetime: '2022-11-24T14:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: 'in 1mo',
      },
      {
        datetime: '2023-10-23T14:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: 'in 1y',
      },
      {
        datetime: '2023-10-24T14:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: 'in 1y',
      },
      {
        datetime: '2024-03-31T14:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: 'in 2y',
      },
      {
        datetime: '2024-04-01T14:46:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: 'in 2y',
      },

      // Dates in the future
      {
        datetime: '2022-11-24T14:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1mo ago',
      },
      {
        datetime: '2022-10-25T14:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1m ago',
      },
      {
        datetime: '2022-10-24T15:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1m ago',
      },

      // Dates in the past
      {
        datetime: '2022-10-24T13:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1h ago',
      },
      {
        datetime: '2022-10-24T13:30:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1h ago',
      },
      {
        datetime: '2022-10-24T13:17:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1h ago',
      },
      {
        datetime: '2022-10-24T13:01:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1h ago',
      },
      {
        datetime: '2022-10-18T14:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1w ago',
      },
      {
        datetime: '2022-09-23T14:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1mo ago',
      },
      {
        datetime: '2021-10-25T14:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1y ago',
      },
      {
        datetime: '2021-10-24T14:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1y ago',
      },
      {
        datetime: '2021-05-18T14:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1y ago',
      },
      {
        datetime: '2021-05-17T14:46:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1y ago',
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
        expected: '11mo 29d',
      },
      {
        datetime: '2021-10-30T14:46:00.000Z',
        format: 'elapsed',
        precision: 'month',
        expected: '11mo',
      },
      {
        datetime: '2021-10-29T14:46:00.000Z',
        format: 'elapsed',
        expected: '1y',
      },
      {
        datetime: '2020-10-24T14:46:00.000Z',
        format: 'elapsed',
        precision: 'year',
        expected: '2y',
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
        expected: 'in 1h',
      },
      {
        datetime: '2022-10-24T16:00:00.000Z',
        lang: 'en',
        tense: 'future',
        formatStyle: 'narrow',
        expected: 'in 1h',
      },
      {
        datetime: '2022-10-24T16:15:00.000Z',
        lang: 'en',
        tense: 'future',
        formatStyle: 'narrow',
        expected: 'in 1h',
      },
      {
        datetime: '2022-10-24T16:31:00.000Z',
        lang: 'en',
        tense: 'future',
        formatStyle: 'narrow',
        expected: 'in 1h',
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
        expected: 'in 2y',
      },
      {
        datetime: '2024-04-01T14:46:00.000Z',
        lang: 'en',
        tense: 'future',
        formatStyle: 'narrow',
        expected: 'in 2y',
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
        expected: '1h ago',
      },
      {
        datetime: '2022-10-24T13:30:00.000Z',
        lang: 'en',
        tense: 'past',
        formatStyle: 'narrow',
        expected: '1h ago',
      },
      {
        datetime: '2022-10-24T13:17:00.000Z',
        lang: 'en',
        tense: 'past',
        formatStyle: 'narrow',
        expected: '1h ago',
      },
      {
        datetime: '2022-10-24T13:01:00.000Z',
        lang: 'en',
        tense: 'past',
        formatStyle: 'narrow',
        expected: '1h ago',
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
        expected: '1d ago',
      },
      {
        reference: '2022-12-31T12:00:00.000Z',
        datetime: '2022-01-01T12:00:00.000Z',
        tense: 'past',
        format: 'micro',
        expected: '1y ago',
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
        expected: 'in 2y',
      },
      {
        reference: '2021-04-24T12:00:00.000Z',
        datetime: '2023-02-01T12:00:00.000Z',
        tense: 'future',
        format: 'micro',
        expected: 'in 2y',
      },
      {
        reference: '2024-01-04T12:00:00.000Z',
        datetime: '2020-02-16T16:16:41.000Z',
        tense: 'past',
        format: 'auto',
        expected: '4 years ago',
      },
      {
        reference: '2024-12-04T00:00:00.000Z',
        datetime: '2024-01-16T00:00:00.000Z',
        tense: 'past',
        format: 'auto',
        expected: '11 months ago',
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

  suite('[hourCycle]', function () {
    test('formats with 24-hour cycle when hour-cycle is h23', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '2020-01-01T15:00:00.000Z')
      el.setAttribute('time-zone', 'UTC')
      el.setAttribute('format', 'datetime')
      el.setAttribute('hour', 'numeric')
      el.setAttribute('minute', '2-digit')
      el.setAttribute('hour-cycle', 'h23')
      await Promise.resolve()
      assert.notMatch(el.shadowRoot.textContent, /AM|PM/i)
      assert.match(el.shadowRoot.textContent, /15:00/)
    })

    test('formats with 12-hour cycle when hour-cycle is h12', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '2020-01-01T15:00:00.000Z')
      el.setAttribute('time-zone', 'UTC')
      el.setAttribute('format', 'datetime')
      el.setAttribute('hour', 'numeric')
      el.setAttribute('minute', '2-digit')
      el.setAttribute('hour-cycle', 'h12')
      await Promise.resolve()
      assert.match(el.shadowRoot.textContent, /3:00/)
      assert.match(el.shadowRoot.textContent, /PM/i)
    })

    test('formats with 12-hour cycle when hour-cycle is h11', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '2020-01-01T15:00:00.000Z')
      el.setAttribute('time-zone', 'UTC')
      el.setAttribute('format', 'datetime')
      el.setAttribute('hour', 'numeric')
      el.setAttribute('minute', '2-digit')
      el.setAttribute('hour-cycle', 'h11')
      await Promise.resolve()
      assert.match(el.shadowRoot.textContent, /3:00/)
      assert.match(el.shadowRoot.textContent, /PM/i)
    })

    test('formats with 24-hour cycle when hour-cycle is h24', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '2020-01-01T15:00:00.000Z')
      el.setAttribute('time-zone', 'UTC')
      el.setAttribute('format', 'datetime')
      el.setAttribute('hour', 'numeric')
      el.setAttribute('minute', '2-digit')
      el.setAttribute('hour-cycle', 'h24')
      await Promise.resolve()
      assert.notMatch(el.shadowRoot.textContent, /AM|PM/i)
      assert.match(el.shadowRoot.textContent, /15:00/)
    })

    test('title uses hour-cycle setting', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '2020-01-01T15:00:00.000Z')
      el.setAttribute('time-zone', 'UTC')
      el.setAttribute('hour-cycle', 'h23')
      await Promise.resolve()
      assert.notMatch(el.getAttribute('title'), /AM|PM/i)
      assert.match(el.getAttribute('title'), /15/)
    })

    test('inherits hour-cycle from ancestor', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '2020-01-01T15:00:00.000Z')
      el.setAttribute('time-zone', 'UTC')
      el.setAttribute('format', 'datetime')
      el.setAttribute('hour', 'numeric')
      el.setAttribute('minute', '2-digit')
      const div = document.createElement('div')
      div.setAttribute('hour-cycle', 'h23')
      div.appendChild(el)
      document.body.appendChild(div)
      await Promise.resolve()
      assert.notMatch(el.shadowRoot.textContent, /AM|PM/i)
      assert.match(el.shadowRoot.textContent, /15:00/)
      div.remove()
    })

    test('inherits hour-cycle from documentElement', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '2020-01-01T15:00:00.000Z')
      el.setAttribute('time-zone', 'UTC')
      el.setAttribute('format', 'datetime')
      el.setAttribute('hour', 'numeric')
      el.setAttribute('minute', '2-digit')
      document.documentElement.setAttribute('hour-cycle', 'h23')
      await Promise.resolve()
      assert.notMatch(el.shadowRoot.textContent, /AM|PM/i)
      assert.match(el.shadowRoot.textContent, /15:00/)
      document.documentElement.removeAttribute('hour-cycle')
    })

    test('element attribute overrides ancestor', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '2020-01-01T15:00:00.000Z')
      el.setAttribute('time-zone', 'UTC')
      el.setAttribute('format', 'datetime')
      el.setAttribute('hour', 'numeric')
      el.setAttribute('minute', '2-digit')
      el.setAttribute('hour-cycle', 'h12')
      const div = document.createElement('div')
      div.setAttribute('hour-cycle', 'h23')
      div.appendChild(el)
      document.body.appendChild(div)
      await Promise.resolve()
      assert.match(el.shadowRoot.textContent, /3:00/)
      assert.match(el.shadowRoot.textContent, /PM/i)
      div.remove()
    })

    test('re-renders when hour-cycle attribute changes', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '2020-01-01T15:00:00.000Z')
      el.setAttribute('time-zone', 'UTC')
      el.setAttribute('format', 'datetime')
      el.setAttribute('hour', 'numeric')
      el.setAttribute('minute', '2-digit')
      el.setAttribute('hour-cycle', 'h12')
      await Promise.resolve()
      assert.match(el.shadowRoot.textContent, /PM/i)
      el.setAttribute('hour-cycle', 'h23')
      await Promise.resolve()
      assert.notMatch(el.shadowRoot.textContent, /AM|PM/i)
      assert.match(el.shadowRoot.textContent, /15:00/)
    })
  })

  suite('[timeZone]', function () {
    test('updates when the time-zone attribute is set', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '2020-01-01T12:00:00.000Z')
      el.setAttribute('time-zone', 'America/New_York')
      el.setAttribute('format', 'datetime')
      el.setAttribute('hour', 'numeric')
      el.setAttribute('minute', '2-digit')
      el.setAttribute('second', '2-digit')
      el.setAttribute('time-zone-name', 'longGeneric')
      await Promise.resolve()
      assert.equal(el.shadowRoot.textContent, 'Wed, Jan 1, 2020, 7:00:00 AM Eastern Time')
    })

    test('updates when the time-zone attribute changes', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '2020-01-01T12:00:00.000Z')
      el.setAttribute('time-zone', 'America/New_York')
      el.setAttribute('format', 'datetime')
      el.setAttribute('hour', 'numeric')
      el.setAttribute('minute', '2-digit')
      el.setAttribute('second', '2-digit')
      await Promise.resolve()
      const initial = el.shadowRoot.textContent
      el.setAttribute('time-zone', 'Asia/Tokyo')
      await Promise.resolve()
      assert.notEqual(el.shadowRoot.textContent, initial)
      assert.equal(el.shadowRoot.textContent, 'Wed, Jan 1, 2020, 9:00:00 PM')
    })

    test('ignores empty time-zone attributes', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '2020-01-01T12:00:00.000Z')
      el.setAttribute('time-zone', '')
      el.setAttribute('format', 'datetime')
      el.setAttribute('hour', 'numeric')
      el.setAttribute('minute', '2-digit')
      el.setAttribute('second', '2-digit')
      await Promise.resolve()
      // Should fallback to default or system time zone
      assert.equal(el.shadowRoot.textContent, 'Wed, Jan 1, 2020, 4:00:00 PM')
    })

    test('uses html time-zone if element time-zone is empty', async () => {
      const time = document.createElement('relative-time')
      time.setAttribute('datetime', '2020-01-01T12:00:00.000Z')
      time.setAttribute('time-zone', '')
      document.documentElement.setAttribute('time-zone', 'Asia/Tokyo')
      time.setAttribute('format', 'datetime')
      time.setAttribute('hour', 'numeric')
      time.setAttribute('minute', '2-digit')
      time.setAttribute('second', '2-digit')
      await Promise.resolve()
      assert.equal(time.shadowRoot.textContent, 'Wed, Jan 1, 2020, 9:00:00 PM')
      document.documentElement.removeAttribute('time-zone')
    })

    test('shows the year when the date is in a past year in the time-zone', async () => {
      freezeTime(new Date('2023-06-15T12:00:00.000Z'))
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', '2023-01-01T02:00:00.000Z')
      el.setAttribute('time-zone', 'America/New_York')
      el.setAttribute('format', 'datetime')
      await Promise.resolve()
      assert.equal(el.shadowRoot.textContent, 'Sat, Dec 31, 2022')
    })
  })

  suite('shared update timer', () => {
    const originalSetAdd = Set.prototype.add
    let observedSets

    setup(() => {
      observedSets = new Set()
      Set.prototype.add = function (value) {
        if (value instanceof RelativeTimeElement) observedSets.add(this)
        return originalSetAdd.call(this, value)
      }
    })

    teardown(() => {
      Set.prototype.add = originalSetAdd
    })

    // The observer's Set is module-private, so detect membership by recording every Set that a
    // RelativeTimeElement is added to and checking it afterwards.
    function isObserved(el) {
      return [...observedSets].some(set => set.has(el))
    }

    const recent = () => new Date(Date.now() - 3 * 60 * 1000).toISOString()

    test('observes connected elements', async () => {
      const el = document.createElement('relative-time')
      fixture.append(el)
      el.setAttribute('datetime', recent())
      await Promise.resolve()
      assert.isTrue(isObserved(el))
    })

    test('stops observing elements when they are disconnected', async () => {
      const el = document.createElement('relative-time')
      fixture.append(el)
      el.setAttribute('datetime', recent())
      await Promise.resolve()
      el.remove()
      assert.isFalse(isObserved(el))
    })

    test('does not observe elements that were never connected', async () => {
      const el = document.createElement('relative-time')
      el.setAttribute('datetime', recent())
      await Promise.resolve()
      assert.equal(el.shadowRoot.textContent, '3 minutes ago')
      assert.isFalse(isObserved(el))
    })

    test('does not observe clones of connected elements', async () => {
      const el = document.createElement('relative-time')
      fixture.append(el)
      el.setAttribute('datetime', recent())
      await Promise.resolve()
      const clone = el.cloneNode(true)
      await Promise.resolve()
      assert.equal(clone.shadowRoot.textContent, '3 minutes ago')
      assert.isFalse(isObserved(clone))
    })

    test('does not observe elements removed in the same task as an attribute change', async () => {
      const el = document.createElement('relative-time')
      fixture.append(el)
      el.setAttribute('datetime', recent())
      await Promise.resolve()
      el.setAttribute('datetime', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      el.remove()
      await Promise.resolve()
      assert.equal(el.shadowRoot.textContent, '5 minutes ago')
      assert.isFalse(isObserved(el))
    })

    test('timer ticks update connected elements and drop disconnected ones', async () => {
      const originalSetTimeout = window.setTimeout
      const connected = document.createElement('relative-time')
      const detached = document.createElement('relative-time')
      let tick
      // Far-future "now" so the observer always schedules a fresh timer instead of reusing a pending one.
      freezeTime(new Date('2100-01-01T00:00:00.000Z'))
      globalThis.setTimeout = window.setTimeout = function (callback) {
        tick = callback
        return 0
      }
      try {
        fixture.append(connected)
        connected.setAttribute('datetime', '2099-12-31T23:57:00.000Z')
        await Promise.resolve()
        assert.isFunction(tick)

        // Force a detached element into the Set as if it had been retained before removal.
        const set = [...observedSets].find(candidate => candidate.has(connected))
        originalSetAdd.call(set, detached)
        detached.setAttribute('datetime', '2099-12-31T23:57:00.000Z')
        let detachedUpdates = 0
        const update = detached.update
        detached.update = function () {
          detachedUpdates += 1
          return update.call(this)
        }

        Date.now = () => new dateNow('2100-01-01T00:01:00.000Z').getTime()
        tick()
        assert.equal(connected.shadowRoot.textContent, '4 minutes ago')
        assert.equal(detachedUpdates, 0)
        assert.isFalse(set.has(detached))
      } finally {
        globalThis.setTimeout = window.setTimeout = originalSetTimeout
      }
    })
  })

  suite('errors thrown during a tick', () => {
    const originalSetTimeout = window.setTimeout
    const originalOnError = window.onerror
    const minute = 60 * 1000
    // Later tests start a day after the last one so that each schedules a timer of its own
    let clockStart = Date.parse('2100-06-01T00:00:00.000Z')
    let clock
    let timers
    let rethrows
    let reportRethrowsToWindow

    function relativeTime(attributes, parent = fixture) {
      const el = document.createElement('relative-time')
      for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value)
      parent.append(el)
      return el
    }

    function ago(ms) {
      return new dateNow(clock - ms).toISOString()
    }

    function tick() {
      timers.at(-1).callback()
    }

    function thrown(callback) {
      try {
        callback()
      } catch (error) {
        return error
      }
      return null
    }

    setup(() => {
      clockStart += 24 * 60 * minute
      clock = clockStart
      freezeTime(new Date(clock))
      timers = []
      rethrows = []
      reportRethrowsToWindow = false
      // The observer's timer has a delay; a rethrown error has none
      globalThis.setTimeout = window.setTimeout = function (callback, delay) {
        if (delay !== undefined) {
          timers.push({callback, delay})
        } else if (reportRethrowsToWindow) {
          return originalSetTimeout(callback)
        } else {
          rethrows.push(callback)
        }
        return 0
      }
    })

    teardown(() => {
      globalThis.setTimeout = window.setTimeout = originalSetTimeout
      window.onerror = originalOnError
    })

    async function settled() {
      await Promise.resolve()
      assert.isAbove(timers.length, 0)
    }

    function advance(ms) {
      clock += ms
      Date.now = () => clock
    }

    test('an element whose update throws does not stop the others or the timer', async () => {
      const failure = new Error('update failed')
      const bad = relativeTime({datetime: ago(3 * minute)})
      const good = relativeTime({datetime: ago(3 * minute)})
      await settled()
      bad.update = () => {
        throw failure
      }
      const scheduled = timers.length

      advance(minute)
      tick()

      assert.equal(good.shadowRoot.textContent, '4 minutes ago')
      assert.isAbove(timers.length, scheduled)
      assert.equal(timers.at(-1).delay, minute)
      assert.equal(rethrows.length, 1)
      assert.strictEqual(thrown(rethrows[0]), failure)
    })

    test('an element whose isConnected getter throws does not stop the others or the timer', async () => {
      const failure = new Error('isConnected failed')
      const bad = relativeTime({datetime: ago(3 * minute)})
      const good = relativeTime({datetime: ago(3 * minute)})
      await settled()
      Object.defineProperty(bad, 'isConnected', {
        get() {
          throw failure
        },
      })
      const scheduled = timers.length

      advance(minute)
      assert.isNull(thrown(tick))

      assert.equal(good.shadowRoot.textContent, '4 minutes ago')
      assert.isAbove(timers.length, scheduled)
      assert.equal(timers.at(-1).delay, minute)
      assert.equal(rethrows.length, 1)
      assert.strictEqual(thrown(rethrows[0]), failure)
    })

    test('a render that fails part way leaves later elements skipping and rendering as before', async () => {
      const zone = document.createElement('div')
      fixture.append(zone)
      const bad = relativeTime({datetime: ago(3 * minute)}, zone)
      const old = relativeTime({datetime: ago(3 * 60 * minute)})
      const fresh = relativeTime({datetime: ago(2000)})
      await settled()
      // An invalid zone on an ancestor makes the next render throw after it has started
      zone.setAttribute('time-zone', 'Not/AZone')
      // Count renders without changing the element's class, which would turn skipping off: a render
      // without a custom title reads `no-title` exactly once
      const hasAttribute = Element.prototype.hasAttribute
      const updates = new Map()
      Element.prototype.hasAttribute = function (name) {
        if (name === 'no-title' && this instanceof RelativeTimeElement) updates.set(this, (updates.get(this) || 0) + 1)
        return hasAttribute.call(this, name)
      }
      try {
        advance(1000)
        assert.isNull(thrown(tick))
      } finally {
        Element.prototype.hasAttribute = hasAttribute
      }

      // The failing render throws while formatting its title, before it reads `no-title`
      assert.equal(rethrows.length, 1)
      assert.instanceOf(thrown(rethrows[0]), RangeError)
      assert.equal(bad.shadowRoot.textContent, '3 minutes ago')
      assert.isUndefined(updates.get(old))
      assert.equal(old.shadowRoot.textContent, '3 hours ago')
      assert.equal(updates.get(fresh), 1)
      assert.equal(fresh.shadowRoot.textContent, 'now')
    })

    test('an element whose date getter throws does not stop the others or the timer', async () => {
      const failure = new Error('date failed')
      const bad = relativeTime({datetime: ago(3 * minute)})
      const good = relativeTime({datetime: ago(3 * minute)})
      await settled()
      Object.defineProperty(bad, 'date', {
        get() {
          throw failure
        },
      })
      const scheduled = timers.length

      advance(minute)
      tick()

      assert.equal(good.shadowRoot.textContent, '4 minutes ago')
      assert.isAbove(timers.length, scheduled)
      assert.equal(timers.at(-1).delay, minute)
      assert.equal(rethrows.length, 1)
      assert.strictEqual(thrown(rethrows[0]), failure)
    })

    test('an old element with an invalid time zone does not stop the others or the timer', async () => {
      const zoned = document.createElement('div')
      zoned.setAttribute('time-zone', 'UTC')
      fixture.append(zoned)
      relativeTime({datetime: ago(3 * 60 * minute)}, zoned)
      const good = relativeTime({datetime: ago(3 * minute)})
      await settled()
      zoned.setAttribute('time-zone', 'Not/AZone')
      const scheduled = timers.length

      advance(minute)
      tick()

      assert.equal(good.shadowRoot.textContent, '4 minutes ago')
      assert.isAbove(timers.length, scheduled)
      assert.equal(timers.at(-1).delay, minute)
      assert.equal(rethrows.length, 1)
      assert.instanceOf(thrown(rethrows[0]), RangeError)
    })

    test('a failing element is reported once per tick and retried on the next', async () => {
      const failures = []
      const bad = relativeTime({datetime: ago(3 * minute)})
      const good = relativeTime({datetime: ago(3 * minute)})
      await settled()
      bad.update = () => {
        const failure = new Error(`failure ${failures.length}`)
        failures.push(failure)
        throw failure
      }

      advance(minute)
      tick()
      assert.equal(rethrows.length, 1)
      advance(minute)
      tick()

      assert.equal(failures.length, 2)
      assert.equal(rethrows.length, 2)
      assert.deepEqual(rethrows.map(thrown), failures)
      assert.equal(good.shadowRoot.textContent, '5 minutes ago')
    })

    test('every failing element is reported', async () => {
      const first = new Error('first')
      const second = new Error('second')
      const a = relativeTime({datetime: ago(3 * minute)})
      const b = relativeTime({datetime: ago(3 * minute)})
      const good = relativeTime({datetime: ago(3 * minute)})
      await settled()
      a.update = () => {
        throw first
      }
      Object.defineProperty(b, 'date', {
        get() {
          throw second
        },
      })

      advance(minute)
      tick()

      assert.deepEqual(rethrows.map(thrown), [first, second])
      assert.equal(good.shadowRoot.textContent, '4 minutes ago')
    })

    test('the error reaches the page as an uncaught error', async () => {
      const failure = new Error('uncaught')
      const bad = relativeTime({datetime: ago(3 * minute)})
      await settled()
      bad.update = () => {
        throw failure
      }
      const reported = []
      const listener = event => {
        event.preventDefault()
        reported.push(event.error)
      }
      window.onerror = null
      window.addEventListener('error', listener)
      reportRethrowsToWindow = true
      try {
        advance(minute)
        tick()
        await new Promise(resolve => originalSetTimeout(resolve, 10))
      } finally {
        window.removeEventListener('error', listener)
      }
      assert.deepEqual(reported, [failure])
    })

    test('elements that do not throw are not reported', async () => {
      const good = relativeTime({datetime: ago(3 * minute)})
      await settled()
      advance(minute)
      tick()
      assert.equal(good.shadowRoot.textContent, '4 minutes ago')
      assert.equal(rethrows.length, 0)
    })
  })

  suite('skipping re-renders that cannot change output', () => {
    const originalSetTimeout = window.setTimeout
    const hasAttribute = Element.prototype.hasAttribute
    let realDate
    let tick
    // Renders per element, counted without changing the element's class, which would turn skipping
    // off. A render without a custom title reads `no-title` exactly once.
    let updates

    // A clock that `Date.now()` and `new Date()` both follow, unlike `freezeTime`.
    function useClock(start) {
      realDate = Date
      let current = start
      function ClockDate(...args) {
        return args.length ? new realDate(...args) : new realDate(current)
      }
      ClockDate.UTC = realDate.UTC
      ClockDate.parse = realDate.parse
      ClockDate.now = () => current
      ClockDate.prototype = realDate.prototype
      // eslint-disable-next-line no-global-assign
      Date = ClockDate
      return ms => {
        current = ms
      }
    }

    setup(() => {
      tick = null
      updates = new Map()
      globalThis.setTimeout = window.setTimeout = function (callback) {
        tick = callback
        return 0
      }
      Element.prototype.hasAttribute = function (name) {
        if (name === 'no-title' && this instanceof RelativeTimeElement) updates.set(this, (updates.get(this) || 0) + 1)
        return hasAttribute.call(this, name)
      }
    })

    teardown(() => {
      globalThis.setTimeout = window.setTimeout = originalSetTimeout
      Element.prototype.hasAttribute = hasAttribute
      if (realDate) {
        // eslint-disable-next-line no-global-assign
        Date = realDate
        realDate = null
      }
    })

    function relativeTime(attributes, parent = fixture) {
      const el = document.createElement('relative-time')
      for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value)
      parent.append(el)
      return el
    }

    // What a full render produces right now for an element with the same attributes and ancestors.
    function freshRender(el) {
      const copy = document.createElement('relative-time')
      for (const {name, value} of el.attributes) {
        // A rendered title is recomputed; only a title set by the page is kept
        if (name !== 'title' || el.hasAttribute('data-custom-title')) copy.setAttribute(name, value)
      }
      el.after(copy)
      const result = `${copy.shadowRoot.textContent} | ${copy.getAttribute('title')}`
      copy.remove()
      return result
    }

    function rendered(el) {
      return `${el.shadowRoot.textContent} | ${el.getAttribute('title')}`
    }

    // Ticks the shared timer at every step and checks each element against a fresh render.
    function assertMatchesFreshRenders(elements, setClock, from, to, step, onTick) {
      const mismatches = []
      for (let now = from; now <= to; now += step) {
        setClock(now)
        if (onTick) onTick(now)
        tick()
        for (const el of elements) {
          const expected = freshRender(el)
          if (rendered(el) !== expected) {
            mismatches.push(`${new realDate(now).toISOString()} ${el.outerHTML}: "${rendered(el)}" != "${expected}"`)
          }
        }
      }
      assert.deepEqual(mismatches.slice(0, 5), [])
    }

    function seededRandom(seed) {
      return () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296
        return seed / 4294967296
      }
    }

    const second = 1000
    const minute = 60 * second
    const hour = 60 * minute
    const day = 24 * hour

    // Ages chosen to cross every point where the text can change: :55 and :00 seconds,
    // 54:55 and 00:00 within the hour, 21 hours, whole days, 28 days, and thresholds.
    const ages = [
      50 * second,
      3 * minute + 50 * second,
      54 * minute + 30 * second,
      59 * minute + 50 * second,
      2 * hour + 54 * minute + 30 * second,
      20 * hour + 54 * minute + 30 * second,
      23 * hour + 54 * minute + 30 * second,
      day + 23 * hour + 55 * minute,
      6 * day + 23 * hour + 55 * minute,
      27 * day + 23 * hour + 55 * minute,
      29 * day + 23 * hour + 55 * minute,
    ]

    function elementsAround(start, extraAttributes = {}) {
      const elements = []
      for (const age of ages) {
        for (const [direction, tense] of [
          [-1, 'auto'],
          [1, 'auto'],
          [-1, 'past'],
          [1, 'future'],
        ]) {
          const datetime = new realDate(start + direction * age + 123).toISOString()
          elements.push(relativeTime({datetime, tense, ...extraAttributes}))
        }
      }
      return elements
    }

    for (const timeZone of [null, 'UTC', 'America/New_York', 'Australia/Lord_Howe', 'Pacific/Chatham']) {
      test(`matches full renders across minutes, hours and midnights (time-zone: ${timeZone})`, async function () {
        // eslint-disable-next-line @typescript-eslint/no-invalid-this
        this.timeout(60000)
        // 23:55 in the test runner's Asia/Dubai time zone, so the window crosses local midnight
        const start = Date.parse('2026-03-07T19:55:00.000Z')
        const setClock = useClock(start)
        const elements = elementsAround(start, timeZone ? {'time-zone': timeZone} : {})
        await Promise.resolve()
        assertMatchesFreshRenders(elements, setClock, start, start + 6 * minute, second)
      })
    }

    test('matches full renders across daylight saving and zone midnights', async function () {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.timeout(60000)
      const windows = [
        ['America/New_York', '2026-03-08T04:55:00.000Z'], // midnight
        ['America/New_York', '2026-03-08T06:55:00.000Z'], // clocks go forward
        ['Australia/Lord_Howe', '2026-04-04T14:55:00.000Z'], // clocks go back 30 minutes
        ['Pacific/Chatham', '2026-04-04T13:40:00.000Z'], // midnight at +13:45
        ['UTC', '2026-03-07T23:55:00.000Z'], // UTC midnight, used by thresholds
      ]
      for (const [timeZone, iso] of windows) {
        fixture.innerHTML = ''
        const start = Date.parse(iso)
        if (realDate) {
          // eslint-disable-next-line no-global-assign
          Date = realDate
        }
        const setClock = useClock(start)
        const elements = elementsAround(start, {'time-zone': timeZone})
        await Promise.resolve()
        assertMatchesFreshRenders(elements, setClock, start, start + 6 * minute, second)
      }
    })

    test('matches full renders across thresholds and local month ends', async function () {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.timeout(60000)
      const windows = [
        // 23:55 on the last day of February in the test runner's Asia/Dubai time zone
        ['2026-02-28T19:55:00.000Z', null],
        ['2026-02-28T19:55:00.000Z', 'America/New_York'],
        ['2026-02-28T19:55:00.000Z', 'Pacific/Chatham'],
      ]
      const thresholds = [
        ['PT45M', 44 * minute],
        ['PT45M30S', 45 * minute],
        ['PT1H30M', hour + 27 * minute],
        ['PT2H', hour + 57 * minute],
        ['P1D', 23 * hour + 57 * minute],
        ['P7D', 6 * day + 23 * hour + 57 * minute],
        ['P1M', 27 * day + 23 * hour + 57 * minute],
      ]
      for (const [iso, timeZone] of windows) {
        fixture.innerHTML = ''
        if (realDate) {
          // eslint-disable-next-line no-global-assign
          Date = realDate
        }
        const start = Date.parse(iso)
        const setClock = useClock(start)
        const elements = []
        for (const [threshold, age] of thresholds) {
          const attributes = {threshold, datetime: new realDate(start - age).toISOString()}
          if (timeZone) attributes['time-zone'] = timeZone
          elements.push(relativeTime(attributes))
        }
        // Around four weeks, rounding to weeks or months depends on the local calendar month
        const monthEndAges = [27 * day, 27 * day + 6 * hour, 27 * day + 12 * hour, 27 * day + 18 * hour]
        for (const age of [...ages, ...monthEndAges]) {
          const attributes = {datetime: new realDate(start - age).toISOString()}
          if (timeZone) attributes['time-zone'] = timeZone
          elements.push(relativeTime(attributes))
        }
        await Promise.resolve()
        assertMatchesFreshRenders(elements, setClock, start, start + 6 * minute, second)
      }
    })

    test('matches full renders for random dates at sub-second steps', async function () {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.timeout(60000)
      const random = seededRandom(42)
      const start = Date.parse('2026-06-01T11:58:00.000Z')
      const setClock = useClock(start)
      const thresholds = [null, 'PT2H', 'P1D', 'PT45M']
      const elements = []
      for (let i = 0; i < 40; i++) {
        const age = Math.floor(random() * 30 * day)
        const direction = random() < 0.7 ? -1 : 1
        const attributes = {datetime: new realDate(start + direction * age).toISOString()}
        const threshold = thresholds[i % thresholds.length]
        if (threshold) attributes.threshold = threshold
        if (i % 5 === 0) attributes.format = 'relative'
        elements.push(relativeTime(attributes))
      }
      // Ages that sit just before change points, with a random millisecond offset
      for (const age of ages) {
        const datetime = new realDate(start - age - Math.floor(random() * second)).toISOString()
        elements.push(relativeTime({datetime}))
      }
      await Promise.resolve()
      assertMatchesFreshRenders(elements, setClock, start, start + 3 * minute, 250)
    })

    test('matches full renders when ancestors, preferences or the clock change', async function () {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.timeout(60000)
      const start = Date.parse('2026-03-07T12:00:00.000Z')
      const setClock = useClock(start)
      const parent = document.createElement('div')
      fixture.append(parent)
      const elements = ages.map(age => relativeTime({datetime: new realDate(start - age).toISOString()}, parent))
      await Promise.resolve()
      const changes = [
        () => parent.setAttribute('lang', 'de'),
        () => parent.setAttribute('time-zone', 'America/New_York'),
        () => parent.setAttribute('hour-cycle', 'h12'),
        () => document.body.setAttribute('data-prefers-absolute-time', 'true'),
        () => document.body.removeAttribute('data-prefers-absolute-time'),
        () => parent.removeAttribute('lang'),
        () => window.dispatchEvent(new Event('languagechange')),
        () => {
          elements[4].shadowRoot.firstElementChild.textContent = 'tampered'
        },
        () => {
          elements[5].setAttribute('data-custom-title', '')
          elements[5].setAttribute('title', 'custom title')
        },
        () => setClock(Date.now() - 3 * hour),
      ]
      let step = 0
      assertMatchesFreshRenders(elements, setClock, start, start + 2 * minute, second, now => {
        if (now % (10 * second) === 0 && step < changes.length) changes[step++]()
      })
      assert.equal(step, changes.length)
    })

    test('ticks do not re-render elements whose text cannot change', async () => {
      const start = Date.parse('2026-03-07T12:00:00.000Z')
      const setClock = useClock(start)
      const old = []
      for (let i = 0; i < 100; i++) {
        old.push(relativeTime({datetime: new realDate(start - 3 * hour - 10 * minute - i * second).toISOString()}))
      }
      const fresh = relativeTime({datetime: new realDate(start - 2 * second).toISOString()})
      await Promise.resolve()
      updates.clear()

      // The fresh element stays under a minute old, so its text changes every second
      for (let i = 1; i <= 50; i++) {
        setClock(start + i * second)
        tick()
      }

      assert.equal(updates.get(fresh), 50)
      assert.equal(
        old.reduce((sum, el) => sum + (updates.get(el) || 0), 0),
        0,
      )
      assert.equal(old[0].shadowRoot.textContent, '3 hours ago')
    })

    test('an inserted element renders once', async () => {
      useClock(Date.parse('2026-03-07T12:00:00.000Z'))
      const el = relativeTime({datetime: '2026-03-07T09:00:00.000Z'})
      await Promise.resolve()
      await Promise.resolve()
      assert.equal(updates.get(el), 1)
      assert.equal(el.shadowRoot.textContent, '3 hours ago')
    })

    test('update() always re-renders', async () => {
      useClock(Date.parse('2026-03-07T12:00:00.000Z'))
      const el = relativeTime({datetime: '2026-03-07T09:00:00.000Z'})
      await Promise.resolve()
      const before = updates.get(el)
      el.update()
      el.update()
      assert.equal(updates.get(el), before + 2)
    })

    test('an attribute changed by an update listener re-renders', async () => {
      useClock(Date.parse('2026-03-07T12:00:00.000Z'))
      const el = document.createElement('relative-time')
      el.addEventListener('relative-time-updated', () => el.setAttribute('format', 'datetime'), {once: true})
      el.setAttribute('datetime', '2026-03-07T09:00:00.000Z')
      fixture.append(el)
      await Promise.resolve()
      await Promise.resolve()
      assert.equal(rendered(el), freshRender(el))
      assert.notEqual(el.shadowRoot.textContent, '3 hours ago')
    })

    test('no-title elements keep firing an event on every tick', async () => {
      const start = Date.parse('2026-03-07T12:00:00.000Z')
      const setClock = useClock(start)
      const el = relativeTime({'no-title': '', datetime: '2026-03-07T09:00:00.000Z'})
      relativeTime({datetime: new realDate(start - 2 * second).toISOString()})
      await Promise.resolve()
      let events = 0
      el.addEventListener('relative-time-updated', () => events++)
      for (let i = 1; i <= 3; i++) {
        setClock(start + i * second)
        tick()
      }
      assert.equal(events, 3)
    })

    test('a changed render root is repaired on the next tick', async () => {
      const start = Date.parse('2026-03-07T12:00:00.000Z')
      const setClock = useClock(start)
      const elements = [0, 1, 2, 3].map(() => relativeTime({datetime: '2026-03-07T09:00:00.000Z'}))
      relativeTime({datetime: new realDate(start - 2 * second).toISOString()})
      await Promise.resolve()
      const hidden = document.createElement('div')
      hidden.hidden = true
      hidden.textContent = '3 hours ago'
      elements[0].shadowRoot.replaceChildren(hidden)
      elements[1].shadowRoot.firstElementChild.setAttribute('aria-hidden', 'true')
      elements[2].shadowRoot.firstElementChild.style.fontVariantNumeric = 'tabular-nums'
      elements[3].shadowRoot.append(document.createTextNode(''))
      setClock(start + second)
      tick()
      for (const el of elements) {
        const [span, ...rest] = el.shadowRoot.childNodes
        assert.equal(rest.length, 0)
        assert.equal(span.getAttribute('part'), 'root')
        assert.equal(span.textContent, '3 hours ago')
        assert.isFalse(span.hasAttribute('aria-hidden'))
        assert.equal(span.style.fontVariantNumeric, '')
      }
    })

    test('a host time zone change re-renders', async () => {
      const start = Date.parse('2026-03-07T12:00:00.000Z')
      const setClock = useClock(start)
      const el = relativeTime({datetime: '2026-03-07T09:00:00.000Z'})
      relativeTime({datetime: new realDate(start - 2 * second).toISOString()})
      await Promise.resolve()
      setClock(start + second)
      tick()
      const before = updates.get(el)
      const resolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions
      Intl.DateTimeFormat.prototype.resolvedOptions = function () {
        return {...resolvedOptions.call(this), timeZone: 'America/Puerto_Rico'}
      }
      try {
        setClock(start + 2 * second)
        tick()
      } finally {
        Intl.DateTimeFormat.prototype.resolvedOptions = resolvedOptions
      }
      assert.equal(updates.get(el), before + 1)
    })

    test('subclass instances always re-render', async () => {
      const start = Date.parse('2026-03-07T12:00:00.000Z')
      const setClock = useClock(start)
      let date = new realDate('2026-03-07T09:00:00.000Z')
      class DynamicTime extends RelativeTimeElement {
        get date() {
          return new realDate(date)
        }
      }
      // eslint-disable-next-line custom-elements/extends-correct-class
      if (!customElements.get('dynamic-time')) customElements.define('dynamic-time', DynamicTime)
      const el = document.createElement('dynamic-time')
      el.setAttribute('datetime', '2026-03-07T09:00:00.000Z')
      fixture.append(el)
      relativeTime({datetime: new realDate(start - 2 * second).toISOString()})
      await Promise.resolve()
      assert.equal(el.shadowRoot.textContent, '3 hours ago')
      date = new realDate('2026-01-01T09:00:00.000Z')
      setClock(start + second)
      tick()
      assert.equal(el.shadowRoot.textContent, 'on Jan 1')
    })

    test('removing Intl.RelativeTimeFormat re-renders', async () => {
      const start = Date.parse('2026-03-07T12:00:00.000Z')
      const setClock = useClock(start)
      const el = relativeTime({datetime: '2026-03-07T09:00:00.000Z'})
      relativeTime({datetime: new realDate(start - 2 * second).toISOString()})
      await Promise.resolve()
      const RelativeTimeFormat = Intl.RelativeTimeFormat
      Intl.RelativeTimeFormat = undefined
      try {
        setClock(start + second)
        tick()
      } finally {
        Intl.RelativeTimeFormat = RelativeTimeFormat
      }
      assert.equal(el.shadowRoot.textContent, 'on Mar 7')
    })

    test('a skipped tick keeps formatter caches in the same order as a render', async () => {
      const start = Date.parse('2026-03-07T12:00:00.000Z')
      const setClock = useClock(start)
      // Empties the formatter caches
      window.dispatchEvent(new Event('languagechange'))
      const el = relativeTime({lang: 'en-x-lru', datetime: '2026-03-07T09:00:00.000Z'})
      relativeTime({datetime: new realDate(start - 2 * second).toISOString()})
      // Fill the 100-entry locale cache, leaving the element's locale least recently used
      const datetime = '2026-03-07T09:00:00.000Z'
      for (let i = 0; i < 99; i++) relativeTime({lang: `en-x-fill${i}`, format: 'datetime', datetime})
      await Promise.resolve()

      // Rendering on this tick looks the element's locale up again, so must skipping it
      setClock(start + second)
      tick()
      relativeTime({lang: 'en-x-fill-last', format: 'datetime', datetime})
      await Promise.resolve()

      const Locale = Intl.Locale
      let constructed = 0
      Intl.Locale = new Proxy(Locale, {
        construct(target, args) {
          constructed++
          return Reflect.construct(target, args)
        },
      })
      try {
        el.update()
      } finally {
        Intl.Locale = Locale
      }
      assert.equal(constructed, 0)
    })

    test('instances that override an inherited member always re-render', async () => {
      const start = Date.parse('2026-03-07T12:00:00.000Z')
      const setClock = useClock(start)
      const el = relativeTime({datetime: '2026-03-07T09:00:00.000Z'})
      relativeTime({datetime: new realDate(start - 2 * second).toISOString()})
      await Promise.resolve()
      Object.defineProperty(el, 'date', {get: () => new realDate('2026-01-01T09:00:00.000Z')})
      setClock(start + second)
      tick()
      assert.equal(el.shadowRoot.textContent, 'on Jan 1')
    })

    test('a host time zone change re-renders even if the clock has not moved', async () => {
      const start = Date.parse('2026-03-07T12:00:00.000Z')
      useClock(start)
      const el = relativeTime({datetime: '2026-03-07T09:00:00.000Z'})
      relativeTime({datetime: new realDate(start - 2 * second).toISOString()})
      await Promise.resolve()
      tick()
      const before = updates.get(el)
      const resolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions
      Intl.DateTimeFormat.prototype.resolvedOptions = function () {
        return {...resolvedOptions.call(this), timeZone: 'America/Puerto_Rico'}
      }
      try {
        tick()
      } finally {
        Intl.DateTimeFormat.prototype.resolvedOptions = resolvedOptions
      }
      assert.equal(updates.get(el), before + 1)
    })

    test('working out when text can change does not add formatters to the caches', async () => {
      const start = Date.parse('2026-03-07T12:00:00.000Z')
      useClock(start)
      // Empties the formatter caches
      window.dispatchEvent(new Event('languagechange'))
      relativeTime({'time-zone': 'UTC', datetime: new realDate(start - 3 * minute).toISOString()})
      await Promise.resolve()

      // A render two days back reads the wall clock in UTC, which nothing has needed yet
      const DateTimeFormat = Intl.DateTimeFormat
      let wallClockFormatters = 0
      Intl.DateTimeFormat = new Proxy(DateTimeFormat, {
        construct(target, args) {
          if (args[1]?.era === 'short') wallClockFormatters++
          return Reflect.construct(target, args)
        },
      })
      try {
        relativeTime({'time-zone': 'UTC', datetime: new realDate(start - 2 * day).toISOString()})
      } finally {
        Intl.DateTimeFormat = DateTimeFormat
      }
      assert.equal(wallClockFormatters, 1)
    })

    test('overriding instances have their inputs read as often as a render reads them', async () => {
      useClock(Date.parse('2026-03-07T12:00:00.000Z'))
      const el = relativeTime({datetime: '2026-03-07T09:00:00.000Z'})
      await Promise.resolve()
      let reads = 0
      Object.defineProperty(el, 'precision', {
        get() {
          reads++
          return 'second'
        },
      })
      el.update()
      assert.equal(reads, 1)
    })

    test('renders without queueMicrotask', async () => {
      useClock(Date.parse('2026-03-07T12:00:00.000Z'))
      const original = globalThis.queueMicrotask
      globalThis.queueMicrotask = undefined
      let el
      try {
        el = relativeTime({datetime: '2026-03-07T09:00:00.000Z'})
      } finally {
        globalThis.queueMicrotask = original
      }
      assert.equal(el.shadowRoot.textContent, '3 hours ago')
    })

    test('a prototype member replaced before the first render always re-renders', async () => {
      const start = Date.parse('2026-03-09T12:00:00.000Z')
      const setClock = useClock(start)
      const original = Object.getOwnPropertyDescriptor(RelativeTimeElement.prototype, 'date')
      let date = new realDate('2026-03-09T09:00:00.000Z')
      Object.defineProperty(RelativeTimeElement.prototype, 'date', {
        configurable: true,
        get() {
          return new realDate(date)
        },
      })
      try {
        const el = relativeTime({datetime: '2026-03-09T09:00:00.000Z'})
        relativeTime({datetime: new realDate(start - 2 * second).toISOString()})
        await Promise.resolve()
        assert.equal(el.shadowRoot.textContent, '3 hours ago')
        date = new realDate('2026-01-01T09:00:00.000Z')
        setClock(start + second)
        tick()
        assert.equal(el.shadowRoot.textContent, 'on Jan 1')
      } finally {
        Object.defineProperty(RelativeTimeElement.prototype, 'date', original)
      }
    })

    test('an invalid lang still renders once and skips unchanged ticks', async () => {
      const start = Date.parse('2026-03-10T12:00:00.000Z')
      const setClock = useClock(start)
      const el = relativeTime({lang: 'en_US', datetime: '2026-03-10T09:00:00.000Z'})
      relativeTime({datetime: new realDate(start - 2 * second).toISOString()})
      await Promise.resolve()
      assert.equal(updates.get(el), 1)
      for (let i = 1; i <= 5; i++) {
        setClock(start + i * second)
        tick()
      }
      assert.equal(updates.get(el), 1)
      assert.equal(rendered(el), freshRender(el))
    })

    test('an attribute change re-renders', async () => {
      useClock(Date.parse('2026-03-07T12:00:00.000Z'))
      const el = relativeTime({datetime: '2026-03-07T09:00:00.000Z'})
      await Promise.resolve()
      const before = updates.get(el)
      el.setAttribute('format-style', 'narrow')
      await Promise.resolve()
      assert.equal(updates.get(el), before + 1)
      assert.equal(el.shadowRoot.textContent, '3h ago')
    })

    // Zone offsets are not always whole quarter hours: fixed offsets accept any minute, and
    // historical offsets have odd minutes and seconds.
    for (const [timeZone, datetime, before, after] of [
      ['+00:01', '2026-03-06T00:29:00.000Z', '2026-03-07T23:58:00.000Z', '2026-03-07T23:59:30.000Z'],
      ['Africa/Monrovia', '1971-06-13T01:14:00.000Z', '1971-06-15T00:44:00.000Z', '1971-06-15T00:44:40.000Z'],
    ]) {
      test(`renders when a tick crosses midnight in ${timeZone}`, async () => {
        const setClock = useClock(Date.parse(before))
        const el = relativeTime({datetime, 'time-zone': timeZone})
        await Promise.resolve()
        const initial = rendered(el)
        let events = 0
        el.addEventListener('relative-time-updated', () => events++)

        setClock(Date.parse(after))
        tick()

        assert.notEqual(rendered(el), initial)
        assert.equal(rendered(el), freshRender(el))
        assert.equal(events, 1)
      })
    }

    test('renders when a tick crosses UTC midnight before 1970', async () => {
      const setClock = useClock(Date.parse('1969-06-10T23:58:00.000Z'))
      const el = relativeTime({datetime: '1969-06-10T20:48:00.000Z'})
      await Promise.resolve()
      updates.clear()

      setClock(Date.parse('1969-06-11T00:00:30.000Z'))
      tick()

      assert.equal(updates.get(el), 1)
      assert.equal(rendered(el), freshRender(el))
    })
  })
})
