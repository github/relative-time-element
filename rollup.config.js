import babel from 'rollup-plugin-babel'

const pkg = require('./package.json')

export default [
  {
    input: 'src/index.js',
    plugins: [
      babel({
        plugins: ['transform-custom-element-classes'],
        presets: ['@babel/env']
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
        plugins: ['transform-custom-element-classes'],
        presets: ['@babel/env']
      })
    ],
    output: {
      file: pkg['module'],
      format: 'es'
    }
  }
]
