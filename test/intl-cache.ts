import {assert} from '@open-wc/testing'
import {dateTimeFormat, relativeTimeFormat, numberFormat, getLocale, clearIntlCache} from '../src/intl-cache.ts'

suite('intl-cache', function () {
  test('returns the same DateTimeFormat instance for identical locale + options', () => {
    const a = dateTimeFormat('en', {year: 'numeric', month: 'short'})
    const b = dateTimeFormat('en', {year: 'numeric', month: 'short'})
    assert.strictEqual(a, b)
  })

  test('returns different DateTimeFormat instances for different options', () => {
    const a = dateTimeFormat('en', {year: 'numeric'})
    const b = dateTimeFormat('en', {year: '2-digit'})
    assert.notStrictEqual(a, b)
  })

  test('returns different DateTimeFormat instances for different locales', () => {
    const a = dateTimeFormat('en', {year: 'numeric'})
    const b = dateTimeFormat('fr', {year: 'numeric'})
    assert.notStrictEqual(a, b)
  })

  test('treats undefined option values the same as absent ones', () => {
    const a = dateTimeFormat('en', {year: 'numeric', timeZone: undefined})
    const b = dateTimeFormat('en', {year: 'numeric'})
    assert.strictEqual(a, b)
  })

  test('caches RelativeTimeFormat, NumberFormat, and Locale instances', () => {
    assert.strictEqual(relativeTimeFormat('en', {numeric: 'auto'}), relativeTimeFormat('en', {numeric: 'auto'}))
    assert.strictEqual(numberFormat('en', {minimumIntegerDigits: 2}), numberFormat('en', {minimumIntegerDigits: 2}))
    assert.strictEqual(getLocale('en'), getLocale('en'))
    assert.notStrictEqual(getLocale('en'), getLocale('fr'))
  })

  test('evicts the least-recently-used entry once capacity is exceeded', () => {
    clearIntlCache()
    const first = getLocale('en-x-a0')
    // The default capacity is 100; adding 100 further distinct entries pushes
    // the cache past capacity and evicts the least-recently-used entry (the first).
    for (let i = 1; i <= 100; i++) getLocale(`en-x-a${i}`)
    assert.notStrictEqual(getLocale('en-x-a0'), first)
  })

  test('clearIntlCache drops cached instances so fresh ones are constructed', () => {
    const before = dateTimeFormat('en', {year: 'numeric', month: 'short'})
    clearIntlCache()
    const after = dateTimeFormat('en', {year: 'numeric', month: 'short'})
    assert.notStrictEqual(before, after)
  })
})
