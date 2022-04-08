import { expect, test } from '@playwright/test'

test('relative', async ({ page }) => {
  await page.goto('/tests/imports/relative')
  expect(await page.textContent('button')).toBe('hello')
})

test('aliased', async ({ page }) => {
  await page.goto('/tests/imports/alias')
  expect(await page.textContent('button')).toBe('hello')
})
