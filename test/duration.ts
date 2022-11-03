import {assert} from '@open-wc/testing'
import {Duration, applyDuration, withinDuration} from '../src/duration.ts'
import {Temporal} from '@js-temporal/polyfill'

suite('duration', function () {

  suite('Duration class', () => {
    const tests = new Set([
      {input: 'P4Y', years: 4},
      {input: '-P4Y', years: -4},
      {input: '-P3MT5M', months: -3, minutes: -5},
      {input: 'P1Y2M3DT4H5M6S', years: 1, months: 2, days: 3, hours: 4, minutes: 5, seconds: 6},
      {input: 'P5W', weeks: 5},
      {input: '-P5W', weeks: -5}
    ])

    const extractValues = x => ({
      years: x.years || 0,
      months: x.months || 0,
      weeks: x.weeks || 0,
      days: x.days || 0,
      hours: x.hours || 0,
      minutes: x.minutes || 0,
      seconds: x.seconds || 0
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
  })

  suite('applyDuration', function () {
    const referenceDate = '2022-10-21T16:48:44.104Z'
    const tests = new Set([
      {input: 'P4Y', expected: '2026-10-21T16:48:44.104Z'},
      {input: '-P4Y', expected: '2018-10-21T16:48:44.104Z'},
      {input: '-P3MT5M', expected: '2022-07-21T16:43:44.104Z'},
      {input: 'P1Y2M3DT4H5M6S', expected: '2023-12-24T20:53:50.104Z'},
      {input: 'P5W', expected: '2022-11-25T16:48:44.104Z'},
      {input: '-P5W', expected: '2022-09-16T16:48:44.104Z'}
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
      {inputA: '2022-10-21T16:48:44.104Z', inputB: '2022-09-22T16:48:44.104Z', duration: 'P30D'}
    ])
    const exceeds = new Set([
      {inputA: '2022-10-21T16:48:44.104Z', inputB: '2021-09-21T16:48:44.104Z', duration: 'P1Y'},
      {inputA: '2022-10-21T16:48:44.104Z', inputB: '2022-10-21T16:42:44.104Z', duration: 'PT5M'},
      {inputA: '2022-10-21T16:48:44.104Z', inputB: '2022-09-12T16:48:44.104Z', duration: 'P30D'}
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
})
