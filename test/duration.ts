import {assert} from '@open-wc/testing'
import {applyDuration, withinDuration} from '../src/duration.ts'

suite('duration', function () {
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
        assert.equal(applyDuration(new Date(referenceDate), input)?.toISOString(), expected)
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
