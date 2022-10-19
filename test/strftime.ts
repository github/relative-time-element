import {assert} from '@open-wc/testing'
import {strftime} from '../src/strftime.ts'

suite('strftime', function () {
  const tests = {
    a: 'Wed',
    A: 'Wednesday',
    b: 'Oct',
    B: 'October',
    c: 'Wed Oct 19 2022 15:31:59 GMT+0400 (Gulf Standard Time)',
    d: '19',
    e: '19',
    H: '15',
    I: '03',
    l: ' 3',
    m: '10',
    M: '31',
    p: 'PM',
    P: 'pm',
    S: '59',
    w: '3',
    y: '22',
    Y: '2022',
    z: '+0400',
    Z: '',
    '%': '%'
  }
  for (const [k, v] of Object.entries(tests)) {
    test(`%${k}`, () => {
      assert.equal(strftime(new Date('2022-10-19T11:31:59.554Z'), `%${k}`), v)
    })
  }
})
