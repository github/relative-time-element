import {assert} from '@open-wc/testing'
import {RelativeTimeFormat} from '../src/relative-time-ponyfill.js'

suite('relativetime ponyfill', function () {
  const tests = new Set([
    [0, 'second'],
    [1, 'second'],
    [30, 'second'],
    [60, 'second'],
    [65, 'second'],
    [-1, 'second'],
    [-30, 'second'],
    [-60, 'second'],
    [-65, 'second'],
    [0, 'day'],
    [1, 'day'],
    [15, 'day'],
    [30, 'day'],
    [35, 'day'],
    [-1, 'day'],
    [-15, 'day'],
    [-30, 'day'],
    [-35, 'day'],
    [0, 'week'],
    [1, 'week'],
    [2, 'week'],
    [8, 'week'],
    [55, 'week'],
    [-1, 'week'],
    [-2, 'week'],
    [-8, 'week'],
    [-55, 'week'],
    [-5, 'week'],
    [0, 'month'],
    [1, 'month'],
    [5, 'month'],
    [12, 'month'],
    [18, 'month'],
    [-1, 'month'],
    [-5, 'month'],
    [-12, 'month'],
    [-18, 'month'],
    [0, 'year'],
    [1, 'year'],
    [5, 'year'],
    [12, 'year'],
    [18, 'year'],
    [-1, 'year'],
    [-5, 'year'],
    [-12, 'year'],
    [-18, 'year']
  ])

  for (const opts of tests) {
    const real = new Intl.RelativeTimeFormat('en', {numeric: 'auto'})
    test(`RelativeTimeFormat('en', {numeric: 'auto'}).format(${JSON.stringify(opts)}) === ${real.format(
      ...opts
    )}`, function () {
      assert.equal(new RelativeTimeFormat('en', {numeric: 'auto'}).format(...opts), real.format(...opts))
    })
  }
})
