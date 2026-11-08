import {assert} from '@open-wc/testing'
import {
  dateTimeFormat,
  relativeTimeFormat,
  numberFormat,
  getLocale,
  clearIntlCache,
  startLookups,
  stopLookups,
  repeatLookups,
} from '../src/intl-cache.ts'

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

  test('repeating recorded lookups restores the least-recently-used order', () => {
    clearIntlCache()
    const recorded = dateTimeFormat('en', {year: 'numeric'})
    startLookups()
    dateTimeFormat('en', {year: 'numeric'})
    const lookups = stopLookups()
    for (let i = 0; i < 99; i++) dateTimeFormat(`en-x-b${i}`, {year: 'numeric'})
    assert.isTrue(repeatLookups(lookups))
    // One more entry evicts the least recently used, which is no longer the recorded one
    dateTimeFormat('en-x-c', {year: 'numeric'})
    assert.strictEqual(dateTimeFormat('en', {year: 'numeric'}), recorded)
  })

  test('repeating lookups reports an entry that is no longer cached', () => {
    clearIntlCache()
    dateTimeFormat('en', {year: 'numeric'})
    startLookups()
    dateTimeFormat('en', {year: 'numeric'})
    relativeTimeFormat('en', {numeric: 'auto'})
    const lookups = stopLookups()
    clearIntlCache()
    assert.isFalse(repeatLookups(lookups))
  })

  test('only records lookups between startLookups and stopLookups', () => {
    dateTimeFormat('en', {year: 'numeric'})
    startLookups()
    relativeTimeFormat('en', {numeric: 'auto'})
    const lookups = stopLookups()
    dateTimeFormat('en', {month: 'short'})
    assert.equal(lookups.length, 1)
    assert.isNull(stopLookups())
  })

  test('a lookup the render left missing repeats as missing until the entry appears', () => {
    clearIntlCache()
    startLookups()
    assert.throws(() => getLocale('en_US'))
    const lookups = stopLookups()
    assert.isTrue(repeatLookups(lookups))
    // An entry that now exists would be found by a full render, so repeating it must fail
    dateTimeFormat('en', {year: 'numeric'})
    startLookups()
    dateTimeFormat('en', {month: 'short'})
    const present = stopLookups()
    clearIntlCache()
    assert.isFalse(repeatLookups(present))
  })
})
