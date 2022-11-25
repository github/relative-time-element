import {assert} from '@open-wc/testing'
import '../src/index.ts'

suite('time-ago', function () {
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

  test('always uses relative dates', async () => {
    const now = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, '10 years ago')
  })

  test('rewrites from now past datetime to minutes ago', async () => {
    const now = new Date(Date.now() - 3 * 60 * 1000).toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, '3 minutes ago')
  })

  test('rewrites a few seconds ago to now', async () => {
    const now = new Date().toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'now')
  })

  test('displays future times as now', async () => {
    const now = new Date(Date.now() + 3 * 1000).toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'now')
  })

  test('sets relative contents when parsed element is upgraded', async () => {
    const now = new Date().toISOString()
    const root = document.createElement('div')
    root.innerHTML = `<time-ago datetime="${now}"></time-ago>`
    if ('CustomElements' in window) {
      window.CustomElements.upgradeSubtree(root)
    }
    await Promise.resolve()
    assert.equal(root.children[0].shadowRoot.textContent, 'now')
  })

  test('rewrites from now past datetime to months ago', async () => {
    const now = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, '3 months ago')
  })

  test('rewrites time-ago datetimes < 18months as "months ago"', async () => {
    freezeTime(new Date(2020, 0, 1))
    const then = new Date(2018, 9, 1).toISOString()
    const timeElement = document.createElement('time-ago')
    timeElement.setAttribute('datetime', then)
    await Promise.resolve()
    assert.equal(timeElement.shadowRoot.textContent, '15 months ago')
  })

  test('rewrites time-ago datetimes >= 18 months as "years ago"', async () => {
    freezeTime(new Date(2020, 0, 1))
    const then = new Date(2018, 6, 1).toISOString()
    const timeElement = document.createElement('time-ago')
    timeElement.setAttribute('datetime', then)
    await Promise.resolve()
    assert.equal(timeElement.shadowRoot.textContent, '2 years ago')
  })

  test('micro formats years', async () => {
    const now = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    time.setAttribute('format', 'micro')
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, '10y')
  })

  test('micro formats future times', async () => {
    const now = new Date(Date.now() + 3 * 1000).toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    time.setAttribute('format', 'micro')
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, '1m')
  })

  test('micro formats hours', async () => {
    const now = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    time.setAttribute('format', 'micro')
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, '1h')
  })

  test('micro formats days', async () => {
    const now = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-ago')
    time.setAttribute('datetime', now)
    time.setAttribute('format', 'micro')
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, '1d')
  })
})
