import {assert} from '@open-wc/testing'
import '../src/time-until-element.ts'

suite('time-until', function () {
  test('always uses relative dates', function () {
    const now = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-until')
    time.setAttribute('datetime', now)
    assert.equal(time.shadowRoot.textContent, 'in 10 years')
  })

  test('rewrites from now future datetime to minutes ago', function () {
    const now = new Date(Date.now() + 3 * 60 * 1000).toISOString()
    const time = document.createElement('time-until')
    time.setAttribute('datetime', now)
    assert.equal(time.shadowRoot.textContent, 'in 3 minutes')
  })

  test('rewrites a few seconds from now to now', function () {
    const now = new Date().toISOString()
    const time = document.createElement('time-until')
    time.setAttribute('datetime', now)
    assert.equal(time.shadowRoot.textContent, 'now')
  })

  test('displays past times as now', function () {
    const now = new Date(Date.now() + 3 * 1000).toISOString()
    const time = document.createElement('time-until')
    time.setAttribute('datetime', now)
    assert.equal(time.shadowRoot.textContent, 'now')
  })

  test('sets relative contents when parsed element is upgraded', function () {
    const now = new Date().toISOString()
    const root = document.createElement('div')
    root.innerHTML = `<time-until datetime="${now}"></time-until>`
    if ('CustomElements' in window) {
      window.CustomElements.upgradeSubtree(root)
    }
    assert.equal(root.children[0].shadowRoot.textContent, 'now')
  })

  test('micro formats years', function () {
    const now = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-until')
    time.setAttribute('datetime', now)
    time.setAttribute('format', 'micro')
    assert.equal(time.shadowRoot.textContent, '10y')
  })

  test('micro formats past times', function () {
    const now = new Date(Date.now() + 3 * 1000).toISOString()
    const time = document.createElement('time-until')
    time.setAttribute('datetime', now)
    time.setAttribute('format', 'micro')
    assert.equal(time.shadowRoot.textContent, '1m')
  })

  test('micro formats hours', function () {
    const now = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-until')
    time.setAttribute('datetime', now)
    time.setAttribute('format', 'micro')
    assert.equal(time.shadowRoot.textContent, '1h')
  })

  test('micro formats days', function () {
    const now = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-until')
    time.setAttribute('datetime', now)
    time.setAttribute('format', 'micro')
    assert.equal(time.shadowRoot.textContent, '1d')
  })
})
