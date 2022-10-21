import {assert} from '@open-wc/testing'
import {applyDuration, withinDuration} from '../src/duration.ts'

suite('duration', function () {
  suite('applyDuration', function () {
    const referenceDate = '2022-10-21T16:48:44.104Z'
    const tests = [
      ['P4Y', '2026-10-21T16:48:44.104Z'],
      ['-P4Y', '2018-10-21T16:48:44.104Z'],
      ['-P3MT5M', '2022-07-21T16:43:44.104Z'],
      ['P1Y2M3DT4H5M6S', '2023-12-24T20:53:50.104Z'],
      ['P5W', '2022-11-25T16:48:44.104Z'],
      ['-P5W', '2022-09-16T16:48:44.104Z']
    ]
    for (const [k, v] of tests) {
      test(`${referenceDate} -> ${k} -> ${v}`, () => {
        assert.equal(applyDuration(new Date(referenceDate), `${k}`)?.toISOString(), v)
      })
    }
  })

  suite('withinDuration', function () {
    const within = [
      ['2022-10-21T16:48:44.104Z', '2022-01-21T16:48:44.104Z', 'P1Y'],
      ['2022-10-21T16:48:44.104Z', '2022-10-21T16:44:44.104Z', 'PT5M'],
      ['2022-10-21T16:48:44.104Z', '2022-09-22T16:48:44.104Z', 'P30D']
    ]
    const exceeds = [
      ['2022-10-21T16:48:44.104Z', '2021-09-21T16:48:44.104Z', 'P1Y'],
      ['2022-10-21T16:48:44.104Z', '2022-10-21T16:42:44.104Z', 'PT5M'],
      ['2022-10-21T16:48:44.104Z', '2022-09-12T16:48:44.104Z', 'P30D']
    ]
    for (const [a, b, d] of within) {
      test(`${a} within ${d} of ${b}`, () => {
        assert.ok(withinDuration(new Date(a), new Date(b), d))
        assert.ok(withinDuration(new Date(b), new Date(a), d))
      })
    }
    for (const [a, b, d] of exceeds) {
      test(`${a} not within ${d} of ${b}`, () => {
        assert.notOk(withinDuration(new Date(a), new Date(b), d))
        assert.notOk(withinDuration(new Date(b), new Date(a), d))
      })
    }
  })
})
