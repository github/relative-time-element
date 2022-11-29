import {assert} from '@open-wc/testing'
import '../src/index.ts'

suite('constructor', function () {
  test('create relative-time from document.createElement', function () {
    const time = document.createElement('relative-time')
    assert.equal('RELATIVE-TIME', time.nodeName)
  })

  test('create relative-time from constructor', function () {
    const time = new window.RelativeTimeElement()
    assert.equal('RELATIVE-TIME', time.nodeName)
  })

  test('ignores elements without a datetime attr', function () {
    const time = document.createElement('relative-time')
    assert.equal(time.textContent, '')
  })

  test('leaves contents alone if only datetime is set', function () {
    const time = document.createElement('relative-time')
    time.setAttribute('datetime', '1970-01-01T00:00:00.000Z')
    assert.equal(time.textContent, '')
  })
})
