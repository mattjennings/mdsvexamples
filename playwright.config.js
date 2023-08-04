/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: './src/routes/tests',
  timeout: 10000,
  webServer: {
    command: 'npm run build:site && npm run preview',
    port: 4173
  }
}

export default config
