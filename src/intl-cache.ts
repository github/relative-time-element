// Shared, memoized `Intl` factories.
//
// Constructing an `Intl.*Format` instance is expensive — frequently more costly
// than the subsequent `.format()` call. `<relative-time>` re-formats on every
// tick, and a page can render hundreds of elements, so building fresh
// formatters per render is a meaningful, avoidable cost.
//
// These helpers reuse a single instance per (locale, options) combination
// across every element on the page. Formatters are immutable and stateless, so
// sharing is safe.
//
// Locale and time-zone values ultimately come from mutable DOM attributes and
// valid locale tags can carry arbitrarily many private-use subtags, so the set
// of keys is not truly bounded. To keep memory in check on long-lived pages the
// caches are bounded LRU maps that evict their least-recently-used entries.

// Least-recently-used cache with a fixed capacity. Reads and writes move the
// entry to the most-recently-used position; once the capacity is exceeded the
// least-recently-used entry is evicted.
class LRUCache<V> {
  #map = new Map<string, V>()

  constructor(private readonly max = 100) {}

  get(key: string): V | undefined {
    if (lookups) {
      if (lookups.length < maxLookups) lookups.push([this as LRUCache<unknown>, key, false])
      else lookupsOverflowed = true
    }
    const value = this.#map.get(key)
    if (value !== undefined) {
      this.#map.delete(key)
      this.#map.set(key, value)
    }
    return value
  }

  has(key: string): boolean {
    return this.#map.has(key)
  }

  set(key: string, value: V): void {
    this.#map.delete(key)
    this.#map.set(key, value)
    if (this.#map.size > this.max) {
      this.#map.delete(this.#map.keys().next().value)
    }
  }

  clear(): void {
    this.#map.clear()
  }
}

const registeredCaches: Array<LRUCache<unknown>> = []

// Each lookup records whether the render left its entry missing, as when constructing a formatter
// for an invalid locale throws. Looking up a missing entry changes nothing.
export type Lookups = Array<[LRUCache<unknown>, string, boolean]>

// Lookups made while rendering an element. Repeating them when the element skips a render
// leaves every cache in the same least-recently-used order as a full render would.
let lookups: Lookups | null = null
let lookupsOverflowed = false
// A render makes a handful of lookups. The cap bounds a recording left running by a render that
// threw; an overflowing recording is discarded.
const maxLookups = 64

export function startLookups(): void {
  lookups = []
  lookupsOverflowed = false
}

export function stopLookups(): Lookups | null {
  const result = lookupsOverflowed ? null : lookups
  lookups = null
  if (result) {
    for (const lookup of result) lookup[2] = !lookup[0].has(lookup[1])
  }
  return result
}

// Repeats recorded lookups in order. Returns false at the first entry a full render would find
// differently: no longer cached, or cached now when the render left it missing.
export function repeatLookups(recorded: Lookups): boolean {
  for (const [cache, key, missing] of recorded) {
    if (missing) {
      if (cache.has(key)) return false
    } else if (cache.get(key) === undefined) {
      return false
    }
  }
  return true
}

// Create a bounded cache that participates in `clearIntlCache` invalidation.
export function createCache<V>(max?: number): LRUCache<V> {
  const cache = new LRUCache<V>(max)
  registeredCaches.push(cache as LRUCache<unknown>)
  return cache
}

// Drop every cached formatter. Cached instances freeze the host's resolved
// locale/time-zone/hour-cycle defaults, so they must be discarded when those
// runtime preferences change (see the `languagechange` listener below).
export function clearIntlCache(): void {
  for (const cache of registeredCaches) cache.clear()
}

// Host locale preferences can change at runtime (e.g. the user switches their
// browser language). Cached formatters created under the previous defaults
// would otherwise keep returning stale output, so invalidate on `languagechange`.
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('languagechange', clearIntlCache)
}

function cacheKey(locale: string, options?: object): string {
  // Options in this codebase are built as object literals with a stable key
  // order, so `JSON.stringify` produces a stable key. `undefined` values (e.g.
  // an absent `timeZone`) are dropped by `JSON.stringify`, which matches the
  // behaviour of passing them explicitly.
  return `${locale}\u0000${options ? JSON.stringify(options) : ''}`
}

const dateTimeFormats = createCache<Intl.DateTimeFormat>()
export function dateTimeFormat(locale: string, options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = cacheKey(locale, options)
  let format = dateTimeFormats.get(key)
  if (!format) dateTimeFormats.set(key, (format = new Intl.DateTimeFormat(locale, options)))
  return format
}

const relativeTimeFormats = createCache<Intl.RelativeTimeFormat>()
export function relativeTimeFormat(locale: string, options?: Intl.RelativeTimeFormatOptions): Intl.RelativeTimeFormat {
  const key = cacheKey(locale, options)
  let format = relativeTimeFormats.get(key)
  if (!format) relativeTimeFormats.set(key, (format = new Intl.RelativeTimeFormat(locale, options)))
  return format
}

const numberFormats = createCache<Intl.NumberFormat>()
export function numberFormat(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = cacheKey(locale, options)
  let format = numberFormats.get(key)
  if (!format) numberFormats.set(key, (format = new Intl.NumberFormat(locale, options)))
  return format
}

const locales = createCache<Intl.Locale>()
export function getLocale(tag: string): Intl.Locale {
  let value = locales.get(tag)
  if (!value) locales.set(tag, (value = new Intl.Locale(tag)))
  return value
}
