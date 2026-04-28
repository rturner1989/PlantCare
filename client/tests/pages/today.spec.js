import { expect, test } from '@playwright/test'
import { completeOnboarding, registerUser } from '../helpers/onboarding'

test.describe('Today dashboard', () => {
  test('greets a brand-new user and invites them to add their first plant', async ({ page }) => {
    await registerUser(page, 'Robin')
    await completeOnboarding(page)

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
