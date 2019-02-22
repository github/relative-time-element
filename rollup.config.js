/* @flow strict */

import babel from 'rollup-plugin-babel'

const pkg = require('./package.json')

export default [
  {
    input: 'src/index.js',
    plugins: [
      babel({
        presets: ['github']
      })
    ],
    output: {
      file: pkg['main'],
      format: 'umd',
      name: 'TimeElements'
    }
  },
  {
    input: 'src/index.js',
    plugins: [
      babel({
        presets: ['github']
      })
    ],
    output: {
      file: pkg['module'],
      format: 'es'
    }
  }
]
