process.env.CHROME_BIN = require('chromium').path

module.exports = function (config) {
  config.set({
    frameworks: ['mocha', 'chai'],
    files: [
      { pattern: '../dist/index.js', type: 'module' },
      'constructor.js',
      'local-time.js',
      'relative-time.js',
      'time-ago.js',
      'time-until.js',
      'title-format.js'
    ],
    reporters: ['mocha'],
    port: 9876,
    client: { mocha: { ui: 'tdd' } },
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadless'],
    autoWatch: false,
    singleRun: true,
    concurrency: Infinity
  })
}
