import {assert} from '@open-wc/testing'
import '../src/index.ts'

suite('local-time', function () {
  let fixture
  suiteSetup(() => {
    fixture = document.createElement('div')
    document.body.appendChild(fixture)
  })

  teardown(() => {
    fixture.innerHTML = ''
  })

  test('null getFormattedDate when datetime missing', async () => {
    const time = document.createElement('local-time')
    time.setAttribute('format', '%Y-%m-%dT%H:%M:%SZ')
    await Promise.resolve()
    assert.isUndefined(time.getFormattedDate())
  })

  test('getFormattedDate returns empty string when format missing', async () => {
    const time = document.createElement('local-time')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    await Promise.resolve()
    assert.equal(time.getFormattedDate(), '')
  })

  test('getFormattedDate with only date attributes', async () => {
    const time = document.createElement('local-time')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    time.setAttribute('day', 'numeric')
    time.setAttribute('month', 'short')
    time.setAttribute('year', 'numeric')

    const value = time.getFormattedDate()
    await Promise.resolve()
    assert.include(['Dec 31, 1969', '31 Dec 1969', 'Jan 1, 1970', '1 Jan 1970'], value)
  })

  test('getFormattedDate without year attribute', async () => {
    const time = document.createElement('local-time')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    time.setAttribute('day', 'numeric')
    time.setAttribute('month', 'short')

    const value = time.getFormattedDate()
    await Promise.resolve()
    assert.include(['Dec 31', '31 Dec', 'Jan 1', '1 Jan'], value)
  })

  test('getFormattedDate with only time attributes', async () => {
    const time = document.createElement('local-time')
    time.setAttribute('lang', 'en-US')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    time.setAttribute('hour', 'numeric')
    time.setAttribute('minute', '2-digit')

    await Promise.resolve()
    if ('Intl' in window) {
      assert.match(time.getFormattedDate(), /^\d{1,2}:\d\d (AM|PM)$/)
    } else {
      assert.match(time.getFormattedDate(), /^\d{2}:\d{2}$/)
    }
  })

  test('ignores contents if datetime attribute is missing', async () => {
    const time = document.createElement('local-time')
    time.setAttribute('year', 'numeric')
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, '')
  })

  test('sets formatted contents to format attribute', async () => {
    const time = document.createElement('local-time')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    time.setAttribute('year', 'numeric')
    await Promise.resolve()
    assert.include(['1969', '1970'], time.shadowRoot.textContent)
  })

  test('updates format when attributes change', async () => {
    const time = document.createElement('local-time')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')

    time.setAttribute('year', 'numeric')
    await Promise.resolve()
    assert.include(['1969', '1970'], time.shadowRoot.textContent)

    time.setAttribute('year', '2-digit')
    await Promise.resolve()
    assert.include(['69', '70'], time.shadowRoot.textContent)
  })

  test('sets formatted contents when parsed element is upgraded', async () => {
    const root = document.createElement('div')
    root.innerHTML = '<local-time datetime="1970-01-01T00:00:00.000Z" year="numeric"></local-time>'
    if ('CustomElements' in window) {
      window.CustomElements.upgradeSubtree(root)
    }
    await Promise.resolve()
    assert.include(['1969', '1970'], root.children[0].shadowRoot.textContent)
  })
  ;('Intl' in window ? test : test.skip)('displays time zone name', async () => {
    const root = document.createElement('div')
    root.innerHTML =
      '<local-time datetime="1970-01-01T00:00:00.000Z" minute="2-digit" time-zone-name="short"></local-time>'
    if ('CustomElements' in window) {
      window.CustomElements.upgradeSubtree(root)
    }
    await Promise.resolve()
    assert.match(root.children[0].shadowRoot.textContent, /^\d{1,2} (\w+([+-]\d+)?)$/)
    assert.equal(root.children[0].shadowRoot.textContent, '0 GMT+4')
  })

  test('updates time zone when the `time-zone-name` attribute changes', async () => {
    const el = document.createElement('local-time')
    el.setAttribute('lang', 'en-US')
    el.setAttribute('datetime', '1970-01-01T00:00:00.000-08:00')
    el.setAttribute('time-zone-name', 'short')

    fixture.appendChild(el)
    await Promise.resolve()
    assert.equal(el.shadowRoot.textContent, '1/1/1970, GMT+4')

    el.setAttribute('time-zone-name', 'long')

    await Promise.resolve()
    assert.equal(el.shadowRoot.textContent, '1/1/1970, Gulf Standard Time')
  })
})
