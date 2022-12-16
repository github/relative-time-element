import {assert} from '@open-wc/testing'
import {Duration, applyDuration, elapsedTime, roundToSingleUnit, getRelativeTimeUnit} from '../src/duration.ts'
import {Temporal} from '@js-temporal/polyfill'

suite('duration', function () {
  suite('Duration class', () => {
    const tests = new Set([
      {input: 'P4Y', years: 4},
      {input: '-P4Y', years: -4},
      {input: '-P3MT5M', months: -3, minutes: -5},
      {input: 'P1Y2M3DT4H5M6S', years: 1, months: 2, days: 3, hours: 4, minutes: 5, seconds: 6},
      {input: 'P5W', weeks: 5},
      {input: '-P5W', weeks: -5},
    ])

    const extractValues = x => ({
      years: x.years || 0,
      months: x.months || 0,
      weeks: x.weeks || 0,
      days: x.days || 0,
      hours: x.hours || 0,
      minutes: x.minutes || 0,
      seconds: x.seconds || 0,
    })
    for (const {input, ...expected} of tests) {
      test(`${input} -> from(${JSON.stringify(expected)})`, () => {
        assert.deepEqual(extractValues(Temporal.Duration.from(input)), extractValues(expected))
        assert.deepEqual(extractValues(Duration.from(input)), extractValues(expected))
      })
    }
    for (const {input} of tests) {
      test(`${input} -> abs()`, () => {
        const temporalAbs = extractValues(Temporal.Duration.from(input).abs())
        const abs = extractValues(Duration.from(input).abs())
        assert.deepEqual(temporalAbs, abs)
      })
    }

    test('has `sign` property representing the sign of the duration', () => {
      assert.propertyVal(new Duration(-1), 'sign', -1)
      assert.propertyVal(new Duration(1), 'sign', 1)
      assert.propertyVal(new Duration(), 'sign', 0)
    })

    test('has `blank` property which is true when the duration is 0', () => {
      assert.propertyVal(Duration.from('PT0S'), 'blank', true)
      assert.propertyVal(Duration.from('PT1S'), 'blank', false)
    })

    suite('compare', () => {
      const compareTests = new Set([
        ['P1Y', 'P6M', -1],
        ['P1Y', 'P18M', 1],
        ['P2Y', 'P18M', -1],
        ['PT60S', 'PT60S', 0],
        ['PT1M', 'PT60S', 0],
        ['PT1M', 'PT61S', 1],
        ['PT1M1S', 'PT60S', -1],
        ['P31D', 'P30D', -1],
        ['-P31D', 'P30D', -1],
        ['P55Y', 'P30D', -1],
        ['-P55Y', 'P30D', -1],
        ['PT1S', 'PT0S', -1],
        ['PT0S', 'PT0S', 0],
      ])

      for (const [one, two, expected] of compareTests) {
        test(`Duraiton.compare("${one}", "${two}") === ${expected}`, () => {
          assert.equal(Duration.compare(one, two), expected)
        })
      }
    })
  })

  suite('applyDuration', function () {
    const referenceDate = '2022-10-21T16:48:44.104Z'
    const tests = new Set([
      {input: 'P4Y', expected: '2026-10-21T16:48:44.104Z'},
      {input: '-P4Y', expected: '2018-10-21T16:48:44.104Z'},
      {input: '-P3MT5M', expected: '2022-07-21T16:43:44.104Z'},
      {input: 'P1Y2M3DT4H5M6S', expected: '2023-12-24T20:53:50.104Z'},
      {input: 'P5W', expected: '2022-11-25T16:48:44.104Z'},
      {input: '-P5W', expected: '2022-09-16T16:48:44.104Z'},
    ])
    for (const {input, expected} of tests) {
      test(`${referenceDate} -> ${input} -> ${expected}`, () => {
        assert.equal(applyDuration(new Date(referenceDate), Duration.from(input))?.toISOString(), expected)
      })
    }
  })

  suite('elapsedTime', function () {
    const elapsed = new Set([
      {now: '2022-01-21T16:48:44.104Z', input: '2022-10-21T16:48:44.104Z', expected: 'P9M3D'},
      {now: '2022-01-21T16:48:44.104Z', input: '2022-10-21T16:48:45.104Z', expected: 'P9M3DT1S'},
      {now: '2022-01-21T16:48:44.104Z', input: '2022-10-21T16:48:45.104Z', precision: 'day', expected: 'P9M3D'},
      {now: '2022-10-21T16:44:44.104Z', input: '2022-10-21T16:48:44.104Z', expected: 'PT4M'},
      {now: '2022-09-22T16:48:44.104Z', input: '2022-10-21T16:48:44.104Z', expected: 'P29D'},
      {now: '2022-10-24T14:46:00.000Z', input: '2022-10-24T14:46:10.000Z', expected: 'PT10S'},
      {now: '2022-10-24T14:46:00.000Z', input: '2022-10-24T14:45:50.000Z', expected: '-PT10S'},
      {now: '2022-10-24T14:46:00.000Z', input: '2022-10-24T14:45:50.000Z', precision: 'minute', expected: 'PT0M'},
      {now: '2022-10-24T14:46:00.000Z', input: '2022-10-24T14:47:40.000Z', expected: 'PT1M40S'},
      {now: '2022-10-24T14:46:00.000Z', input: '2022-10-24T14:44:20.000Z', expected: '-PT1M40S'},
      {now: '2022-10-24T14:46:00.000Z', input: '2022-10-24T14:44:20.000Z', precision: 'minute', expected: '-PT1M'},
      {now: '2022-10-24T14:46:00.000Z', input: '2022-10-24T15:51:40.000Z', expected: 'PT1H5M40S'},
      {now: '2022-10-24T14:46:00.000Z', input: '2022-10-24T15:51:40.000Z', precision: 'minute', expected: 'PT1H5M'},
      {now: '2022-10-24T14:46:00.000Z', input: '2022-10-24T15:52:00.000Z', expected: 'PT1H6M'},
      {now: '2022-10-24T14:46:00.000Z', input: '2022-10-24T17:46:00.000Z', expected: 'PT3H'},
      {now: '2022-10-24T14:46:00.000Z', input: '2022-10-24T10:46:00.000Z', expected: '-PT4H'},
      {now: '2022-10-24T14:46:00.000Z', input: '2022-10-25T18:46:00.000Z', expected: 'P1DT4H'},
      {now: '2022-10-24T14:46:00.000Z', input: '2022-10-23T10:46:00.000Z', expected: '-P1DT4H'},
      {now: '2022-10-24T14:46:00.000Z', input: '2022-10-23T10:46:00.000Z', precision: 'day', expected: '-P1D'},
      {now: '2022-10-24T14:46:00.000Z', input: '2021-10-30T14:46:00.000Z', expected: '-P11M29D'},
      {now: '2022-10-24T14:46:00.000Z', input: '2021-10-30T14:46:00.000Z', precision: 'month', expected: '-P11M'},
      {now: '2022-10-24T14:46:00.000Z', input: '2021-10-29T14:46:00.000Z', expected: '-P1Y'},
    ])
    for (const {input, now, precision = 'millisecond', expected} of elapsed) {
      test(`${input} is ${expected} elapsed from ${now} (precision ${precision})`, () => {
        assert.deepEqual(elapsedTime(new Date(input), precision, new Date(now).getTime()), Duration.from(expected))
      })
    }
  })

  suite('roundToSingleUnit', function () {
    const roundTests = new Set([
      ['PT20S', 'PT20S'],
      ['PT31S', 'PT31S'],
      ['PT55S', 'PT1M'],
      ['PT1H', 'PT1H'],
      ['PT1H14M', 'PT1H'],
      ['PT1H29M', 'PT1H'],
      ['PT1H31M', 'PT1H'],
      ['PT1H55M', 'PT2H'],
      ['PT20H', 'PT20H'],
      ['PT21H', 'P1D'],
      ['P4D', 'P4D'],
      ['P6D', 'P1W'],
      ['P2W', 'P2W'],
      ['P3W3D', 'P3W'],
      ['P3W6D', 'P1M'],
      ['P21D', 'P3W'],
      ['P24D', 'P3W'],
      ['P24DT25H', 'P1M'],
      ['P25D', 'P1M'],
      ['P8M', 'P8M'],
      ['P9M', 'P9M'],
      ['P1M1D', 'P1M'],
      ['P9M20DT25H', 'P9M'],
      ['P9M24DT25H', 'P10M'],
      ['P11M', 'P1Y'],
      ['P1Y4D', 'P1Y'],
      ['P1Y5M13D', 'P1Y'],
      ['P1Y5M15D', 'P1Y'],
      ['P1Y5M20D', 'P1Y'],
      ['P1Y11M', 'P2Y'],
    ])
    for (const [input, expected] of roundTests) {
      test(`roundToSingleUnit(${input}) === ${expected}`, () => {
        assert.deepEqual(roundToSingleUnit(Duration.from(input)), Duration.from(expected))
      })
      test(`roundToSingleUnit(-${input}) === -${expected}`, () => {
        assert.deepEqual(roundToSingleUnit(Duration.from(`-${input}`)), Duration.from(`-${expected}`))
      })
    }
  })

  suite('getRelativeTimeUnit', function () {
    const relativeTests = new Set([
      ['PT20S', [20, 'second']],
      ['PT31S', [31, 'second']],
      ['PT55S', [1, 'minute']],
      ['PT1H', [1, 'hour']],
      ['PT1H14M', [1, 'hour']],
      ['PT1H29M', [1, 'hour']],
      ['PT1H31M', [1, 'hour']],
      ['PT1H55M', [2, 'hour']],
      ['PT20H', [20, 'hour']],
      ['PT21H', [1, 'day']],
      ['P4D', [4, 'day']],
      ['P6D', [1, 'week']],
      ['P2W', [2, 'week']],
      ['P3W3D', [3, 'week']],
      ['P3W6D', [1, 'month']],
      ['P21D', [3, 'week']],
      ['P24D', [3, 'week']],
      ['P24DT25H', [1, 'month']],
      ['P25D', [1, 'month']],
      ['P8M', [8, 'month']],
      ['P9M', [9, 'month']],
      ['P1M1D', [1, 'month']],
      ['P9M20DT25H', [9, 'month']],
      ['P9M24DT25H', [10, 'month']],
      ['P11M', [1, 'year']],
      ['P1Y4D', [1, 'year']],
      ['P1Y5M13D', [1, 'year']],
      ['P1Y5M15D', [1, 'year']],
      ['P1Y5M20D', [1, 'year']],
      ['P1Y11M', [2, 'year']],
    ])
    for (const [input, [val, unit]] of relativeTests) {
      test(`roundToSingleUnit(${input}) === [${val}, ${unit}]`, () => {
        assert.deepEqual(getRelativeTimeUnit(Duration.from(input)), [val, unit])
      })
      test(`roundToSingleUnit(-${input}) === [-${val}, ${unit}]`, () => {
        assert.deepEqual(getRelativeTimeUnit(Duration.from(`-${input}`)), [-val, unit])
      })
    }
  })
})
