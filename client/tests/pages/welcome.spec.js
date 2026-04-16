import { expect, test } from '@playwright/test'

// Each test registers a fresh user with a unique email so parallel
// workers don't clash on the unique-email constraint. Tests hit the real
// dev backend — no mocking — because the onboarding flow's value is
// entirely in the server round-trips (room creates, species search,
// plant create, onboarding completion).
async function registerFreshUser(page) {
  const email = `test-${crypto.randomUUID()}@example.com`
  const password = 'greenthumb99'
  await page.goto('/register')
  await page.getByLabel('Name').fill('Test User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password').fill(password)
  await page.getByRole('button', { name: /Create account/i }).click()
  await expect(page).toHaveURL('/welcome')
  return { email, password }
}

test.describe('Onboarding wizard', () => {
  test('register → wizard → dashboard (full happy path)', async ({ page }) => {
    await registerFreshUser(page)

    // Step 1 — intro
    await expect(page.getByText('Step 1 of 5')).toBeVisible()
    await page.getByRole('button', { name: /begin/i }).click()

    // Step 2 — rooms
    await expect(page.getByText('Step 2 of 5')).toBeVisible()
    await page.getByRole('button', { name: /Living Room/i }).click()
    await page.getByRole('button', { name: /Bedroom/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 3 — species + room + nickname
    await expect(page.getByText('Step 3 of 5')).toBeVisible()
    await page.getByLabel('Search species').fill('monstera')
    await page.getByRole('option', { name: /Monstera/i }).first().click()
    await page.getByLabel(/What should we call them/).fill('Monty')
    await page.getByLabel('Which room?').selectOption({ label: 'Living Room' })
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 4 — environment (defaults fine, just continue)
    await expect(page.getByText('Step 4 of 5')).toBeVisible()
    await page.getByRole('button', { name: /Continue/i }).click()

    // Step 5 — done
    await expect(page.getByText('All set!')).toBeVisible()
    await page.getByRole('button', { name: /Enter your jungle/i }).click()

    await expect(page).toHaveURL('/')
  })

  test('back from Step 4 restores the species + nickname on Step 3', async ({ page }) => {
    await registerFreshUser(page)

    await page.getByRole('button', { name: /begin/i }).click()
    await page.getByRole('button', { name: /Living Room/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 3: pick Monstera, name it Monty (single room → no picker).
    await page.getByLabel('Search species').fill('monstera')
    await page.getByRole('option', { name: /Monstera/i }).first().click()
    await page.getByLabel(/What should we call them/).fill('Monty')
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 4 → Back.
    await expect(page.getByText('Step 4 of 5')).toBeVisible()
    await page.getByRole('button', { name: 'Back' }).click()

    // Species card + nickname persist; search input is not re-shown.
    await expect(page.getByText('Monstera Deliciosa', { exact: true })).toBeVisible()
    await expect(page.getByLabel(/What should we call them/)).toHaveValue('Monty')
    await expect(page.getByLabel('Search species')).toHaveCount(0)
  })

  test('back from Step 3 restores previously-selected rooms on Step 2', async ({ page }) => {
    await registerFreshUser(page)

    await page.getByRole('button', { name: /begin/i }).click()

    // Step 2: tick two preset rooms.
    await page.getByRole('button', { name: /Living Room/i }).click()
    await page.getByRole('button', { name: /Bedroom/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 3 → Back.
    await expect(page.getByText('Step 3 of 5')).toBeVisible()
    await page.getByRole('button', { name: 'Back' }).click()

    // Both rooms still ticked.
    await expect(page.getByText('Step 2 of 5')).toBeVisible()
    await expect(page.getByRole('button', { name: /Living Room/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByRole('button', { name: /Bedroom/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('skip plant path lands on Step 5 with no speech card', async ({ page }) => {
    await registerFreshUser(page)

    await page.getByRole('button', { name: /begin/i }).click()
    await page.getByRole('button', { name: /Living Room/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 3: click the skip link without picking a species. Skip jumps
    // straight past Step 4 (environment) to Step 5 (done).
    await expect(page.getByText('Step 3 of 5')).toBeVisible()
    await page.getByRole('button', { name: /Skip for now/i }).click()

    await expect(page.getByText('All set!')).toBeVisible()
    // No species = no speech card.
    await expect(page.getByText(/I'm having the best day/)).toHaveCount(0)
  })
})
