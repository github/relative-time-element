import {esbuildPlugin} from '@web/dev-server-esbuild'
import {playwrightLauncher} from '@web/test-runner-playwright'
const browser = product =>
  playwrightLauncher({
    product,
    createBrowserContext({browser: context}) {
      return context.newContext({timezoneId: 'Asia/Dubai'})
    },
  })

export default {
  files: ['test/*'],
  nodeResolve: true,
  plugins: [esbuildPlugin({ts: true, target: 'es2020'})],
  browsers: [browser('chromium')],
  testFramework: {
    config: {
      ui: 'tdd',
      timeout: 500,
    },
  },
}
