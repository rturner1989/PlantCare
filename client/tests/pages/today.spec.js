import { expect, test } from '@playwright/test'

async function registerAndOnboard(page, name = 'Test User') {
  const email = `test-${crypto.randomUUID()}@example.com`
  const password = 'greenthumb99'
  await page.goto('/register')
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password)
  await page.getByLabel('Confirm password').fill(password)
  await page.getByRole('button', { name: /Create account/i }).click()
  await page.waitForURL('/welcome')
  await page.getByRole('button', { name: /begin/i }).click()
  await page.getByRole('checkbox', { name: /Living Room/i }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: /Skip for now/i }).click()
  await page.getByRole('button', { name: /Enter your jungle/i }).click()
  await page.waitForURL('/')
}

test.describe('Today dashboard', () => {
  test('greets a brand-new user and invites them to add their first plant', async ({ page }) => {
    await registerAndOnboard(page, 'Robin')

    await expect(page.getByRole('heading', { level: 1, name: /Robin/ })).toBeVisible()
    await expect(page.getByText(/Good (morning|afternoon|evening)/)).toBeVisible()

    // Zero-plants empty state: inviting copy + CTA routing to /add-plant.
    await expect(page.getByRole('heading', { name: /Your jungle starts here/ })).toBeVisible()
    await expect(page.getByText(/Add a plant to see it come alive/)).toBeVisible()
    await expect(page.getByRole('link', { name: /Add a plant/ })).toBeVisible()
  })

  test('unauthenticated visit redirects to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)
  })
})
