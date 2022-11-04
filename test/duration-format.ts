import {assert} from '@open-wc/testing'
import {DurationFormat} from '../src/duration-format.js'

suite('duration format', function () {
  let dateNow
  function freezeTime(expected) {
    dateNow = Date

    function MockDate(...args) {
      if (args.length) {
        return new dateNow(...args)
      }
      return new dateNow(expected)
    }

    MockDate.UTC = dateNow.UTC
    MockDate.parse = dateNow.parse
    MockDate.now = () => expected.getTime()
    MockDate.prototype = dateNow.prototype

    // eslint-disable-next-line no-global-assign
    Date = MockDate
  }
  teardown(() => {
    if (dateNow) {
      // eslint-disable-next-line no-global-assign
      Date = dateNow
      dateNow = null
    }
  })

  const referenceDate = '2022-10-24T14:46:00.000Z'
  const tests = new Set([
    // Same as the current time
    // Dates in the future
    {method: 'timeUntil', datetime: '2022-10-24T15:46:00.000Z', expected: [1, 'hour']},
    {method: 'timeUntil', datetime: '2022-10-24T16:00:00.000Z', expected: [1, 'hour']},
    {method: 'timeUntil', datetime: '2022-10-24T16:15:00.000Z', expected: [1, 'hour']},
    {method: 'timeUntil', datetime: '2022-10-24T16:31:00.000Z', expected: [2, 'hour']},
    {method: 'timeUntil', datetime: '2022-10-30T14:46:00.000Z', expected: [6, 'day']},
    {method: 'timeUntil', datetime: '2022-11-24T14:46:00.000Z', expected: [1, 'month']},
    {method: 'timeUntil', datetime: '2023-10-23T14:46:00.000Z', expected: [1, 'year']},
    {method: 'timeUntil', datetime: '2023-10-24T14:46:00.000Z', expected: [1, 'year']},
    {method: 'timeUntil', datetime: '2024-03-31T14:46:00.000Z', expected: [1, 'year']},
    {method: 'timeUntil', datetime: '2024-04-01T14:46:00.000Z', expected: [2, 'year']},
    {
      method: 'timeUntil',
      reference: '2022-12-31T12:00:00.000Z',
      datetime: '2024-03-01T12:00:00.000Z',
      expected: [1, 'year']
    }
  ])

  for (const {method, datetime, expected, reference = referenceDate} of tests) {
    test(`${datetime} ${method} -> ${expected}`, function () {
      freezeTime(new Date(reference))
      assert.deepEqual(new DurationFormat(new Date(datetime))[method](), expected)
    })
  }

})
