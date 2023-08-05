import { expect, test } from '@playwright/test'

test('csr', async ({ page }) => {
  await page.goto('/tests/meta/csr')
  expect(await page.textContent('h1')).toBe('hello')
})

test('hideScript', async ({ page }) => {
  let logs = []
  page.on('console', async (msg) => {
    for (const arg of msg.args()) {
      logs.push(await arg.jsonValue())
    }
  })
  await page.goto('/tests/meta/hide-script', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('text=<script>')).not.toBeVisible()
  await page.waitForTimeout(1000) // wait for logs
  expect(logs).toContain('hello from hidden script')
})

test('hideStyle', async ({ page }) => {
  await page.goto('/tests/meta/hide-style')
  await expect(page.locator('text=<style>')).not.toBeVisible()
  await expect(page.locator('button')).toHaveCSS('background-color', 'rgb(0, 0, 255)')
})

test('wrapper and custom meta', async ({ page }) => {
  await page.goto('/tests/meta/wrapper')
  const meta = await getMeta(page)

  expect(meta.Wrapper).toBe('../MetaWrapper.svelte')
  expect(meta.example).toBe(true)
})

test('array meta', async ({ page }) => {
  await page.goto('/tests/meta/array')

  const meta = await getMeta(page)

  expect(meta.space).toEqual(['hello', 'world'])
  expect(meta.nospace).toEqual(['hello', 'world'])
})

test('filename meta', async ({ page }) => {
  await page.goto('/tests/meta/filename')
  const meta = await getMeta(page)

  expect(meta.filename).toBe('/src/routes/tests/meta/filename/+page.svx')
})

async function getMeta(page) {
  return JSON.parse(await page.locator('#meta').textContent())
}
