import {assert} from '@open-wc/testing'
// The published `main`. It is a lowered esbuild bundle, so it can fail where `dist/index.js` and
// `src` do not. Run after `npm run build`, and keep this file free of `src` imports so that only
// the bundle defines `relative-time`.
import '../dist/bundle.js'

suite('dist/bundle.js', () => {
  const originalSetTimeout = window.setTimeout
  let fixture

  suiteSetup(() => {
    fixture = document.createElement('div')
    document.body.appendChild(fixture)
    document.documentElement.lang = 'en'
  })

  teardown(() => {
    globalThis.setTimeout = window.setTimeout = originalSetTimeout
    fixture.innerHTML = ''
  })

  test('defines and renders relative-time', async () => {
    const el = document.createElement('relative-time')
    el.setAttribute('datetime', new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString())
    fixture.append(el)
    await Promise.resolve()
    assert.equal(el.shadowRoot.textContent, '3 hours ago')
  })

  test('re-renders on the shared timer', async () => {
    let tick
    globalThis.setTimeout = window.setTimeout = function (callback) {
      tick = callback
      return 0
    }
    const el = document.createElement('relative-time')
    el.setAttribute('datetime', new Date(Date.now() - 3 * 60 * 1000).toISOString())
    fixture.append(el)
    await Promise.resolve()
    assert.equal(el.shadowRoot.textContent, '3 minutes ago')
    tick()
    tick()
    assert.equal(el.shadowRoot.textContent, '3 minutes ago')
    el.update()
    assert.equal(el.shadowRoot.textContent, '3 minutes ago')
  })
})
