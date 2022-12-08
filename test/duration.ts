import {assert} from '@open-wc/testing'
import {Duration, applyDuration, withinDuration, elapsedTime} from '../src/duration.ts'
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

  suite('withinDuration', function () {
    const within = new Set([
      {inputA: '2022-10-21T16:48:44.104Z', inputB: '2022-01-21T16:48:44.104Z', duration: 'P1Y'},
      {inputA: '2022-10-21T16:48:44.104Z', inputB: '2022-10-21T16:44:44.104Z', duration: 'PT5M'},
      {inputA: '2022-10-21T16:48:44.104Z', inputB: '2022-09-22T16:48:44.104Z', duration: 'P30D'},
    ])
    const exceeds = new Set([
      {inputA: '2022-10-21T16:48:44.104Z', inputB: '2021-09-21T16:48:44.104Z', duration: 'P1Y'},
      {inputA: '2022-10-21T16:48:44.104Z', inputB: '2022-10-21T16:42:44.104Z', duration: 'PT5M'},
      {inputA: '2022-10-21T16:48:44.104Z', inputB: '2022-09-12T16:48:44.104Z', duration: 'P30D'},
    ])
    for (const {inputA, inputB, duration} of within) {
      test(`${inputA} within ${duration} of ${inputB}`, () => {
        assert.ok(withinDuration(new Date(inputA), new Date(inputB), duration))
        assert.ok(withinDuration(new Date(inputB), new Date(inputA), duration))
      })
    }
    for (const {inputA, inputB, duration} of exceeds) {
      test(`${inputA} not within ${duration} of ${inputB}`, () => {
        assert.notOk(withinDuration(new Date(inputA), new Date(inputB), duration))
        assert.notOk(withinDuration(new Date(inputB), new Date(inputA), duration))
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
})
