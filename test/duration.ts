import {assert} from '@open-wc/testing'
import {
  applyDuration,
  Duration,
  elapsedTime,
  relativeTime,
  getRoundedRelativeTimeUnit,
  roundToSingleUnit,
  roundBalancedToSingleUnit,
} from '../src/duration.ts'
import {Temporal} from '@js-temporal/polyfill'

suite('duration', function () {
  suite('Duration class', () => {
    const tests = new Set([
      {input: 'P4Y', years: 4},
      {input: '-P4Y', years: -4},
      {input: '-P3MT5M', months: -3, minutes: -5},
      {
        input: 'P1Y2M3DT4H5M6S',
        years: 1,
        months: 2,
        days: 3,
        hours: 4,
        minutes: 5,
        seconds: 6,
      },
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
    const elapsedTests = [
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2022-01-21T16:48:45.104Z',
        expected: 'PT1S',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2022-01-21T16:49:43.104Z',
        expected: 'PT59S',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2022-01-21T16:49:44.104Z',
        expected: 'PT1M',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2022-01-21T16:49:46.104Z',
        expected: 'PT1M2S',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2022-01-21T17:47:43.104Z',
        expected: 'PT58M59S',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2022-01-21T17:48:44.104Z',
        expected: 'PT1H',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2022-01-21T17:50:47.104Z',
        expected: 'PT1H2M3S',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2022-01-22T15:47:43.104Z',
        expected: 'PT22H58M59S',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2022-01-22T16:48:44.104Z',
        expected: 'P1D',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2022-01-22T18:51:48.104Z',
        expected: 'P1DT2H3M4S',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2022-02-20T15:47:43.104Z',
        expected: 'P29DT22H58M59S',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2022-02-21T16:48:44.104Z',
        expected: 'P1M',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2022-02-23T19:52:49.104Z',
        expected: 'P1M2DT3H4M5S',
      },
      {
        now: '2022-02-21T16:48:44.104Z',
        input: '2023-01-20T15:47:43.104Z',
        expected: 'P10M29DT22H58M59S',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2023-01-21T16:48:44.104Z',
        expected: 'P1Y',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2023-03-24T20:53:50.104Z',
        expected: 'P1Y2M3DT4H5M6S',
      },

      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2023-03-24T20:53:50.104Z',
        precision: 'second',
        expected: 'P1Y2M3DT4H5M6S',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2023-03-24T20:53:50.104Z',
        precision: 'minute',
        expected: 'P1Y2M3DT4H5M',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2023-03-24T20:53:50.104Z',
        precision: 'hour',
        expected: 'P1Y2M3DT4H',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2023-03-24T20:53:50.104Z',
        precision: 'day',
        expected: 'P1Y2M3D',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2023-03-24T20:53:50.104Z',
        precision: 'month',
        expected: 'P1Y2M',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2023-03-24T20:53:50.104Z',
        precision: 'year',
        expected: 'P1Y',
      },
      {
        now: '2022-01-21T16:48:44.104Z',
        input: '2023-03-24T20:53:50.104Z',
        precision: 'garbage',
        expected: 'P1Y2M3DT4H5M6S',
      },

      {
        now: '2022-01-21T16:48:45.104Z',
        input: '2022-01-21T16:48:44.104Z',
        expected: '-PT1S',
      },
      {
        now: '2022-01-21T16:49:43.104Z',
        input: '2022-01-21T16:48:44.104Z',
        expected: '-PT59S',
      },
      {
        now: '2022-01-21T16:49:44.104Z',
        input: '2022-01-21T16:48:44.104Z',
        expected: '-PT1M',
      },
      {
        now: '2022-01-21T16:49:46.104Z',
        input: '2022-01-21T16:48:44.104Z',
        expected: '-PT1M2S',
      },
      {
        now: '2022-01-21T17:47:43.104Z',
        input: '2022-01-21T16:48:44.104Z',
        expected: '-PT58M59S',
      },
      {
        now: '2022-01-21T17:48:44.104Z',
        input: '2022-01-21T16:48:44.104Z',
        expected: '-PT1H',
      },
      {
        now: '2022-01-21T17:50:47.104Z',
        input: '2022-01-21T16:48:44.104Z',
        expected: '-PT1H2M3S',
      },
      {
        now: '2022-01-22T15:47:43.104Z',
        input: '2022-01-21T16:48:44.104Z',
        expected: '-PT22H58M59S',
      },
      {
        now: '2022-01-22T16:48:44.104Z',
        input: '2022-01-21T16:48:44.104Z',
        expected: '-P1D',
      },
      {
        now: '2022-01-22T18:51:48.104Z',
        input: '2022-01-21T16:48:44.104Z',
        expected: '-P1DT2H3M4S',
      },
      {
        now: '2022-02-20T15:47:43.104Z',
        input: '2022-01-21T16:48:44.104Z',
        expected: '-P29DT22H58M59S',
      },
      {
        now: '2022-02-21T16:48:44.104Z',
        input: '2022-01-21T16:48:44.104Z',
        expected: '-P1M',
      },
      {
        now: '2022-02-23T19:52:49.104Z',
        input: '2022-01-21T16:48:44.104Z',
        expected: '-P1M2DT3H4M5S',
      },
      {
        now: '2023-01-20T15:47:43.104Z',
        input: '2022-02-21T16:48:44.104Z',
        expected: '-P10M29DT22H58M59S',
      },
      {
        now: '2023-01-21T16:48:44.104Z',
        input: '2022-01-21T16:48:44.104Z',
        expected: '-P1Y',
      },
      {
        now: '2023-03-24T20:53:50.104Z',
        input: '2022-01-21T16:48:44.104Z',
        expected: '-P1Y2M3DT4H5M6S',
      },

      {
        now: '2022-01-31T00:00:00.000Z',
        input: '2022-02-28T00:00:00.000Z',
        expected: 'P28D',
      },
      {
        now: '2022-02-28T00:00:00.000Z',
        input: '2022-03-31T00:00:00.000Z',
        expected: 'P1M3D',
      },
      {
        now: '2022-03-30T00:00:00.000Z',
        input: '2022-05-01T00:00:00.000Z',
        expected: 'P1M1D',
      },
      {
        now: '2022-03-31T00:00:00.000Z',
        input: '2022-05-01T00:00:00.000Z',
        expected: 'P1M1D',
      },
      {
        now: '2022-04-30T00:00:00.000Z',
        input: '2022-06-01T00:00:00.000Z',
        expected: 'P1M2D',
      },
      {
        now: '2024-02-29T00:00:00.000Z',
        input: '2025-02-28T00:00:00.000Z',
        expected: 'P11M30D',
      },
    ]
    for (const {input, now, precision = 'millisecond', expected} of elapsedTests) {
      test(`${input} is ${expected} elapsed from ${now} (precision ${precision})`, () => {
        assert.deepEqual(elapsedTime(new Date(input), precision, new Date(now).getTime()), Duration.from(expected))
      })
    }
  })

  suite('relativeTime', function () {
    const relativeTests = [
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T12:00:00',
        expected: [0, 'second'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T12:00:01',
        expected: [1, 'second'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T11:59:59',
        expected: [-1, 'second'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T12:00:58',
        expected: [1, 'minute'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T11:59:02',
        expected: [-1, 'minute'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T12:05:00',
        expected: [5, 'minute'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T11:55:00',
        expected: [-5, 'minute'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T12:58:00',
        expected: [1, 'hour'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T11:02:00',
        expected: [-1, 'hour'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T12:54:55',
        expected: [1, 'hour'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T11:05:05',
        expected: [-1, 'hour'],
      },
      {
        now: '2024-10-15T00:00:00',
        date: '2024-10-15T23:59:59',
        expected: [23, 'hour'],
      },
      {
        now: '2024-10-15T23:59:59',
        date: '2024-10-15T00:00:00',
        expected: [-23, 'hour'],
      },
      {
        now: '2024-10-15T18:00:00',
        date: '2024-10-16T00:00:00',
        expected: [6, 'hour'],
      },
      {
        now: '2024-10-15T00:00:00',
        date: '2024-10-14T18:00:00',
        expected: [-6, 'hour'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-16T00:00:00',
        expected: [1, 'day'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-14T23:00:00',
        expected: [-1, 'day'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-25T12:00:00',
        expected: [1, 'week'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-05T12:00:00',
        expected: [-1, 'week'],
      },
      {
        now: '2024-10-01T12:00:00',
        date: '2024-10-21T12:00:00',
        expected: [3, 'week'],
      },
      {
        now: '2024-10-21T12:00:00',
        date: '2024-10-01T12:00:00',
        expected: [-3, 'week'],
      },
      {
        now: '2024-10-05T12:00:00',
        date: '2024-11-01T12:00:00',
        expected: [1, 'month'],
      },
      {
        now: '2024-10-01T12:00:00',
        date: '2024-09-04T12:00:00',
        expected: [-1, 'month'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-12-15T12:00:00',
        expected: [2, 'month'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-08-15T12:00:00',
        expected: [-2, 'month'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2025-01-15T12:00:00',
        expected: [3, 'month'],
      },
      {
        now: '2025-01-15T12:00:00',
        date: '2024-10-15T12:00:00',
        expected: [-3, 'month'],
      },
      {
        now: '2024-10-15T12:00:00Z',
        date: '2025-07-15T12:00:00Z',
        expected: [1, 'year'],
      },
      {
        now: '2024-10-15T12:00:00Z',
        date: '2023-12-31T12:00:00Z',
        expected: [-1, 'year'],
      },
      {
        now: '2024-10-15T12:00:00Z',
        date: '2029-10-15T12:00:00Z',
        expected: [5, 'year'],
      },
      {
        now: '2024-10-15T12:00:00Z',
        date: '2019-10-15T12:00:00Z',
        expected: [-5, 'year'],
      },

      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T12:00:00',
        precision: 'minute',
        expected: [0, 'minute'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T12:00:00',
        precision: 'hour',
        expected: [0, 'hour'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T12:00:00',
        precision: 'day',
        expected: [0, 'day'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T12:00:00',
        precision: 'week',
        expected: [0, 'week'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T12:00:00',
        precision: 'month',
        expected: [0, 'month'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T12:00:00',
        precision: 'year',
        expected: [0, 'year'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T12:00:50',
        precision: 'minute',
        expected: [0, 'minute'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T12:50:00',
        precision: 'hour',
        expected: [0, 'hour'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-15T22:00:00',
        precision: 'day',
        expected: [0, 'day'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-20T12:00:00',
        precision: 'week',
        expected: [0, 'week'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-10-31T12:00:00',
        precision: 'month',
        expected: [0, 'month'],
      },
      {
        now: '2024-10-15T12:00:00',
        date: '2024-12-15T12:00:00',
        precision: 'year',
        expected: [0, 'year'],
      },
    ]
    for (const {
      now,
      date,
      precision = 'second',
      expected: [val, unit],
    } of relativeTests) {
      test(`relativeTime(${date}, ${precision}, ${now}) === [${val}, ${unit}]`, () => {
        assert.deepEqual(relativeTime(new Date(date), precision, new Date(now)), [val, unit])
      })
    }
  })

  suite('roundBalancedToSingleUnit', function () {
    const roundTests = [
      ['PT0S', 'PT0S'],
      ['PT1S', 'PT1S'],
      ['PT55S', 'PT1M'],
      ['PT57S', 'PT1M'],
      ['PT1M', 'PT1M'],
      ['PT1M10S', 'PT1M'],
      ['PT1M55S', 'PT2M'],
      ['PT54M55S', 'PT1H'],
      ['PT55M', 'PT1H'],
      ['PT57M', 'PT1H'],
      ['PT1H', 'PT1H'],
      ['PT1H10M', 'PT1H'],
      ['PT1H54M55S', 'PT1H'],
      ['PT1H55M', 'PT2H'],
      ['PT20H54M55S', 'PT20H'],
      ['PT20H55M', 'P1D'],
      ['PT22H', 'P1D'],
      ['P1D', 'P1D'],
      ['P1DT10H', 'P1D'],
      ['P1DT20H55M', 'P1D'],
      ['P1DT21H', 'P2D'],
      ['P5DT20H55M', 'P5D'],
      ['P5DT21H', 'P1W'],
      ['P6D', 'P1W'],
      ['P7D', 'P1W'],
      ['P12DT20H55M', 'P1W'],
      ['P12DT21H', 'P1W'],
      ['P13DT', 'P2W'],
      ['P14DT', 'P2W'],
      ['P26DT20H55M', 'P3W'],
      ['P26DT21H', 'P3W'],
      ['P27D', 'P1M'],
      ['P28D', 'P1M'],
      ['P30D', 'P1M'],
      ['P1M', 'P1M'],
      ['P1M27DT21H', 'P1M'],
      ['P1M28D', 'P2M'],
      ['P10M27DT21H', 'P10M'],
      ['P10M28D', 'P1Y'],
      ['P11M', 'P1Y'],
      ['P1Y', 'P1Y'],
      ['P1Y10M27D', 'P1Y'],
      ['P1Y11M', 'P2Y'],
      ['-PT1S', '-PT1S'],
      ['-PT55S', '-PT1M'],
      ['-PT57S', '-PT1M'],
      ['-PT1M', '-PT1M'],
      ['-PT1M10S', '-PT1M'],
      ['-PT1M55S', '-PT2M'],
      ['-PT54M55S', '-PT1H'],
      ['-PT55M', '-PT1H'],
      ['-PT57M', '-PT1H'],
      ['-PT1H', '-PT1H'],
      ['-PT1H10M', '-PT1H'],
      ['-PT1H54M55S', '-PT1H'],
      ['-PT1H55M', '-PT2H'],
      ['-PT20H54M55S', '-PT20H'],
      ['-PT20H55M', '-P1D'],
      ['-PT22H', '-P1D'],
      ['-P1D', '-P1D'],
      ['-P1DT10H', '-P1D'],
      ['-P1DT20H55M', '-P1D'],
      ['-P1DT21H', '-P2D'],
      ['-P5DT20H55M', '-P5D'],
      ['-P5DT21H', '-P1W'],
      ['-P6D', '-P1W'],
      ['-P7D', '-P1W'],
      ['-P12DT20H55M', '-P1W'],
      ['-P12DT21H', '-P1W'],
      ['-P13DT', '-P2W'],
      ['-P14DT', '-P2W'],
      ['-P26DT20H55M', '-P3W'],
      ['-P26DT21H', '-P3W'],
      ['-P27D', '-P1M'],
      ['-P28D', '-P1M'],
      ['-P30D', '-P1M'],
      ['-P1M', '-P1M'],
      ['-P1M27DT21H', '-P1M'],
      ['-P1M28D', '-P2M'],
      ['-P10M27DT21H', '-P10M'],
      ['-P10M28D', '-P1Y'],
      ['-P11M', '-P1Y'],
      ['-P1Y', '-P1Y'],
      ['-P1Y10M27D', '-P1Y'],
      ['-P1Y11M', '-P2Y'],
    ]
    for (const [input, expected] of roundTests) {
      test(`roundBalancedToSingleUnit(${input}) === ${expected}`, () => {
        assert.deepEqual(roundBalancedToSingleUnit(Duration.from(input)), Duration.from(expected))
      })
    }
  })

  suite('roundToSingleUnit', function () {
    const roundTests = [
      ['PT1S', 'PT1S'],
      ['PT58S', 'PT1M'],
      ['PT66S', 'PT1M'],
      ['PT5M', 'PT5M'],
      ['PT58M', 'PT1H'],
      ['PT66M', 'PT1H'],
      ['PT20H55M', 'P1D'],
      ['PT32H', 'P1D'],
      ['P5DT21H', 'P1W'],
      ['P6D', 'P1W'],
      ['P16D', 'P2W'],
      ['P20D', 'P3W'],
      ['P27D', 'P1M'],
      ['P45D', 'P1M'],
      ['P1M27D', 'P1M'],
      ['P5M', 'P5M'],
      ['P10M28D', 'P1Y'],
      ['P18M', 'P1Y'],
      ['P3Y', 'P3Y'],
      ['P2M28D', 'P3M', {relativeTo: new Date('2023-07-15T00:00:00Z')}],
      ['-P2M28D', '-P3M', {relativeTo: new Date('2023-10-15T00:00:00Z')}],
    ]
    for (const [input, expected, opts] of roundTests) {
      test(`roundToSingleUnit(${input}) === ${expected}`, () => {
        assert.deepEqual(
          roundToSingleUnit(Duration.from(input), opts || {relativeTo: new Date('2023-07-01T00:00:00')}),
          Duration.from(expected),
        )
      })
      if (opts?.relativeTo) continue
      test(`roundToSingleUnit(-${input}) === -${expected}`, () => {
        assert.deepEqual(
          roundToSingleUnit(Duration.from(`-${input}`), opts || {relativeTo: new Date('2023-07-01T00:00:00')}),
          Duration.from(`-${expected}`),
        )
      })
    }
  })

  suite('getRoundedRelativeTimeUnit', function () {
    const relativeTests = [
      ['PT1S', [1, 'second']],
      ['PT2M', [2, 'minute']],
      ['PT3H', [3, 'hour']],
      ['P4D', [4, 'day']],
      ['P3W', [3, 'week']],
      ['P2M', [2, 'month']],
      ['P1Y', [1, 'year']],
    ]
    for (const [input, [val, unit]] of relativeTests) {
      test(`getRoundedRelativeTimeUnit(${input}) === [${val}, ${unit}]`, () => {
        assert.deepEqual(getRoundedRelativeTimeUnit(Duration.from(input)), [val, unit])
      })
    }
  })
})
