const pkg = require('./package.json')

export default {
  entry: 'src/index.js',
  dest: pkg['jsnext:main']
}
