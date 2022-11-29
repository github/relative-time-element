import {assert} from '@open-wc/testing'
import '../src/index.ts'

suite('title-format', function () {
  test('null title if datetime is missing', async () => {
    const time = document.createElement('relative-time')
    assert.equal(time.getAttribute('title'), null)
  })

  test('locale-aware title for datetime value', async () => {
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    await Promise.resolve()
    assert.match(time.getAttribute('title'), /\d{4}/)
  })

  test('skips setting a title attribute if already provided', async () => {
    const time = document.createElement('relative-time')
    time.setAttribute('title', 'does not change')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    await Promise.resolve()
    assert.equal(time.getAttribute('title'), 'does not change')
  })

  test('skips setting a title attribute if datetime is missing', async () => {
    const time = document.createElement('relative-time')
    await Promise.resolve()
    assert.isNull(time.getAttribute('title'))
  })

  test('sets the title attribute for datetime value', async () => {
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    await Promise.resolve()
    assert.match(time.getAttribute('title'), /\d{4}/)
  })

  test('update the title attribute after a datetime value change', async () => {
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', '1970-05-01T00:00:00.000Z')
    await Promise.resolve()
    assert.match(time.getAttribute('title'), /1970/)
    time.setAttribute('datetime', '1979-05-01T00:00:00.000Z')
    await Promise.resolve()
    assert.match(time.getAttribute('title'), /1979/)
    time.setAttribute('title', 'custom title')
    time.setAttribute('datetime', '1989-05-01T00:00:00.000Z')
    await Promise.resolve()
    assert.match(time.getAttribute('title'), /custom title/)
  })

  test('set the title attribute when parsed element is upgraded', async () => {
    const root = document.createElement('div')
    root.innerHTML = '<relative-time datetime="1970-01-01T00:00:00.000Z"></relative-time>'
    if ('CustomElements' in window) {
      window.CustomElements.upgradeSubtree(root)
    }
    await Promise.resolve()
    assert.match(root.children[0].getAttribute('title'), /\d{4}/)
  })
})
