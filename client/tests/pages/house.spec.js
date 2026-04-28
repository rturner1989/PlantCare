import { expect, test } from '@playwright/test'
import { completeOnboarding, registerUser } from '../helpers/onboarding'

async function registerAndOnboard(page, { spaces = ['Living Room', 'Kitchen'] } = {}) {
  await registerUser(page, 'House Tester')
  await completeOnboarding(page, { spaces })
}

test.describe('House screen', () => {
  test('defaults to Spaces grid and toggles through List + disabled Greenhouse', async ({ page }) => {
    await registerAndOnboard(page)
    await page.goto('/house')

    await expect(page.getByRole('heading', { level: 1, name: 'House' })).toBeVisible()

    const viewGroup = page.getByRole('radiogroup', { name: 'View as' })
    const spacesRadio = viewGroup.getByRole('radio', { name: 'Spaces' })
    const listRadio = viewGroup.getByRole('radio', { name: 'List' })
    const greenhouseRadio = viewGroup.getByRole('radio', { name: 'Greenhouse' })

    await expect(spacesRadio).toBeChecked()
    await expect(greenhouseRadio).toBeDisabled()

    // Spaces grid shows the seeded spaces.
    await expect(page.getByRole('button', { name: /Living Room/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Kitchen/ })).toBeVisible()

    // Switch to List — the visible label span covers the sr-only radio, so
    // click the label text to trigger the native radio change.
    await viewGroup.getByText('List', { exact: true }).click()
    await expect(listRadio).toBeChecked()
    await expect(page.getByRole('heading', { name: /Your jungle starts here/ })).toBeVisible()
  })

  test('tapping a space card jumps to List filtered to that space', async ({ page }) => {
    await registerAndOnboard(page)
    await page.goto('/house')

    await page.getByRole('button', { name: /Living Room/ }).click()

    await expect(page.getByRole('radio', { name: 'List' })).toBeChecked()
    await expect(page.getByText(/Filtered by/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Clear Living Room filter/i })).toBeVisible()

    // Clear the filter — chip disappears.
    await page.getByRole('button', { name: /Clear Living Room filter/i }).click()
    await expect(page.getByText(/Filtered by/i)).not.toBeVisible()
  })

  test('unauthenticated visit redirects to login', async ({ page }) => {
    await page.goto('/house')
    await expect(page).toHaveURL(/\/login$/)
  })
})
