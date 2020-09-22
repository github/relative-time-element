import pkg from './package.json'

export default [
  {
    input: 'dist/index.js',
    output: {
      file: pkg['module'],
      format: 'es'
    }
  }
]
