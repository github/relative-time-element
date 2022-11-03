import {assert} from '@open-wc/testing'
import {DateTimeFormat} from '../src/datetimeformat-ponyfill.js'

suite('datetimeformat ponyfill', function () {
  const tests = new Set([
    {},
    {month: '2-digit', day: '2-digit', year: '2-digit'},
    {month: 'short', day: '2-digit'},
    {month: 'long', day: '2-digit', year: 'numeric'},
    {month: 'short', day: 'numeric', year: 'numeric'},
    {weekday: 'long', month: 'long', day: '2-digit', year: 'numeric'},
    {weekday: 'long', month: '2-digit', day: '2-digit', year: 'numeric'},
    {weekday: 'long', month: 'short', day: '2-digit', year: 'numeric'},
    {weekday: 'long', month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric'},
    {weekday: 'long', month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric'}
  ])

  for (const {date = new Date('2022-10-24T14:46:00.000Z'), ...opts} of tests) {
    const real = new Intl.DateTimeFormat('en', opts)
    test(`DateTimeFormat('en', ${JSON.stringify(opts)}).format(${date.toISOString()}) === ${real.format(
      date
    )}`, function () {
      assert.equal(new DateTimeFormat('en', opts).format(date), real.format(date))
    })
  }
})
