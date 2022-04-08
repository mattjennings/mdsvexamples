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
  await page.goto('/tests/meta/hide-script')
  await expect(page.locator('text=<script>')).not.toBeVisible()
  expect(logs).toContain('hello from hidden script')
})

test('hideStyle', async ({ page }) => {
  await page.goto('/tests/meta/hide-style')
  await expect(page.locator('text=<style>')).not.toBeVisible()
  await expect(page.locator('button')).toHaveCSS('background-color', 'rgb(0, 0, 255)')
})

test('wrapper and custom meta', async ({ page }) => {
  await page.goto('/tests/meta/wrapper')
  await expect(
    page.locator('text={"Wrapper":"./_Wrapper.svelte","example":true,"custom":["hello","world"]}')
  ).toBeVisible()
})
