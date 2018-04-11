import babel from 'rollup-plugin-babel'

const pkg = require('./package.json')

export default [
  {
    input: 'src/index.js',
    plugins: [
      babel({
        plugins: [
          'transform-es2015-template-literals',
          'transform-custom-element-classes',
          'transform-es2015-block-scoping',
          'transform-es2015-classes'
        ]
      })
    ],
    output: {
      file: pkg['main'],
      format: 'umd'
    }
  },
  {
    input: 'src/index.js',
    plugins: [
      babel({
        plugins: [
          'transform-es2015-template-literals',
          'transform-custom-element-classes',
          'transform-es2015-block-scoping',
          'transform-es2015-classes'
        ]
      })
    ],
    output: {
      file: pkg['module'],
      format: 'es'
    }
  }
]
