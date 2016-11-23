import babel from 'rollup-plugin-babel'

const pkg = require('./package.json')

export default {
  entry: 'src/index.js',
  plugins: [
    babel({
      plugins: [
        'transform-custom-element-classes',
        'transform-es2015-block-scoping',
        'transform-es2015-classes'
      ]
    })
  ],
  dest: pkg['main'],
  format: 'umd'
}
