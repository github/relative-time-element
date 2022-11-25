import {assert} from '@open-wc/testing'
import '../src/index.ts'

suite('time-until', function () {
  test('always uses relative dates', async () => {
    const now = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-until')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'in 10 years')
  })

  test('rewrites from now future datetime to minutes ago', async () => {
    const now = new Date(Date.now() + 3 * 60 * 1000).toISOString()
    const time = document.createElement('time-until')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'in 3 minutes')
  })

  test('rewrites a few seconds from now to now', async () => {
    const now = new Date().toISOString()
    const time = document.createElement('time-until')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'now')
  })

  test('displays past times as now', async () => {
    const now = new Date(Date.now() + 3 * 1000).toISOString()
    const time = document.createElement('time-until')
    time.setAttribute('datetime', now)
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, 'now')
  })

  test('sets relative contents when parsed element is upgraded', async () => {
    const now = new Date().toISOString()
    const root = document.createElement('div')
    root.innerHTML = `<time-until datetime="${now}"></time-until>`
    if ('CustomElements' in window) {
      window.CustomElements.upgradeSubtree(root)
    }
    await Promise.resolve()
    assert.equal(root.children[0].shadowRoot.textContent, 'now')
  })

  test('micro formats years', async () => {
    const now = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-until')
    time.setAttribute('datetime', now)
    time.setAttribute('format', 'micro')
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, '10y')
  })

  test('micro formats past times', async () => {
    const now = new Date(Date.now() + 3 * 1000).toISOString()
    const time = document.createElement('time-until')
    time.setAttribute('datetime', now)
    time.setAttribute('format', 'micro')
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, '1m')
  })

  test('micro formats hours', async () => {
    const now = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-until')
    time.setAttribute('datetime', now)
    time.setAttribute('format', 'micro')
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, '1h')
  })

  test('micro formats days', async () => {
    const now = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()
    const time = document.createElement('time-until')
    time.setAttribute('datetime', now)
    time.setAttribute('format', 'micro')
    await Promise.resolve()
    assert.equal(time.shadowRoot.textContent, '1d')
  })
})
