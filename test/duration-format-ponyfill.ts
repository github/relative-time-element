import {assert} from '@open-wc/testing'

import {Duration} from '../src/duration.js'
import DurationFormat from '../src/duration-format-ponyfill.js'
import type {DurationFormatOptions} from '../src/duration-format-ponyfill.js'

suite('duration format ponyfill', function () {
  const tests = new Set([
    {duration: 'PT8S', locale: 'en', parts: [{type: 'element', value: '8 sec'}]},
    {duration: 'PT8S', locale: 'en', style: 'long', parts: [{type: 'element', value: '8 seconds'}]},
    {
      duration: 'P1M2DT4H',
      locale: 'en',
      style: 'long',
      parts: [
        {type: 'element', value: '1 month'},
        {type: 'literal', value: ', '},
        {type: 'element', value: '2 days'},
        {type: 'literal', value: ', '},
        {type: 'element', value: '4 hours'},
      ],
    },
    {
      duration: 'P1M2DT4H',
      locale: 'en',
      style: 'short',
      parts: [
        {type: 'element', value: '1 mth'},
        {type: 'literal', value: ', '},
        {type: 'element', value: '2 days'},
        {type: 'literal', value: ', '},
        {type: 'element', value: '4 hr'},
      ],
    },
    {
      duration: 'P1M2DT4H',
      locale: 'en',
      style: 'narrow',
      parts: [
        {type: 'element', value: '1mo'},
        {type: 'literal', value: ' '},
        {type: 'element', value: '2d'},
        {type: 'literal', value: ' '},
        {type: 'element', value: '4h'},
      ],
    },
    {
      duration: 'P4DT6H8S',
      locale: 'en',
      style: 'long',
      parts: [
        {type: 'element', value: '4 days'},
        {type: 'literal', value: ', '},
        {type: 'element', value: '6 hours'},
        {type: 'literal', value: ', '},
        {type: 'element', value: '8 seconds'},
      ],
    },
    {
      duration: 'P4DT6H8S',
      locale: 'fr',
      style: 'long',
      parts: [
        {type: 'element', value: '4 jours'},
        {type: 'literal', value: ', '},
        {type: 'element', value: '6 heures'},
        {type: 'literal', value: ' et '},
        {type: 'element', value: '8 secondes'},
      ],
    },
    {
      duration: 'P4DT6H8S',
      locale: 'en',
      style: 'narrow',
      parts: [
        {type: 'element', value: '4d'},
        {type: 'literal', value: ' '},
        {type: 'element', value: '6h'},
        {type: 'literal', value: ' '},
        {type: 'element', value: '8s'},
      ],
    },
    {
      duration: 'P4DT6H8S',
      locale: 'fr',
      style: 'narrow',
      parts: [
        {type: 'element', value: '4j'},
        {type: 'literal', value: ' '},
        {type: 'element', value: '6h'},
        {type: 'literal', value: ' '},
        {type: 'element', value: '8s'},
      ],
    },
    {
      duration: 'P1M2DT3M30S',
      locale: 'en',
      style: 'narrow',
      parts: [
        {type: 'element', value: '1mo'},
        {type: 'literal', value: ' '},
        {type: 'element', value: '2d'},
        {type: 'literal', value: ' '},
        {type: 'element', value: '3m'},
        {type: 'literal', value: ' '},
        {type: 'element', value: '30s'},
      ],
    },
  ])

  for (const {duration, locale, parts, ...opts} of tests) {
    test(`DurationFormat(${locale}, ${JSON.stringify(opts)}).formatToParts(${JSON.stringify(
      duration,
    )}) === ${JSON.stringify(parts)}`, function () {
      assert.deepEqual(
        new DurationFormat(locale, opts as unknown as DurationFormatOptions).formatToParts(Duration.from(duration)),
        parts,
      )
    })
  }
})
