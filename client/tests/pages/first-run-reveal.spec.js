import { expect, test } from '@playwright/test'

const STORAGE_KEY = 'plantcare_tour_pending'

async function registerFreshUser(page) {
  const email = `test-${crypto.randomUUID()}@example.com`
  const password = 'greenthumb99'
  await page.goto('/register')
  await page.getByLabel('Name').fill('Reveal User')
  await page.getByLabel('Email').fill(email)
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password)
  await page.getByLabel('Confirm password').fill(password)
  await page.getByRole('button', { name: /Create account/i }).click()
  await page.waitForURL('/welcome')
  return { email, password }
}

async function completeWizardSkippingPlant(page) {
  await page.getByRole('button', { name: /begin/i }).click()
  await page.getByRole('checkbox', { name: /Living Room/i }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: /Skip for now/i }).click()
  await page.getByRole('button', { name: /Enter your jungle/i }).click()
  await page.waitForURL('/')
}

test.describe('First-run wizard → Today reveal', () => {
  test('reveal fires exactly once per signup: welcome toast + cleared flag', async ({ page }) => {
    const { email, password } = await registerFreshUser(page)
    await completeWizardSkippingPlant(page)

    await expect(page.getByText(/Welcome, Reveal/i)).toBeVisible()
    const flag = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)
    expect(flag).toBeNull()

    await page.reload()
    await expect(page).toHaveURL('/')
    await expect(page.getByText(/Welcome, Reveal/i)).toHaveCount(0)

    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name: /Discover/i })
      .click()
    await expect(page).toHaveURL(/\/discover$/)
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: /Today/i }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByText(/Welcome, Reveal/i)).toHaveCount(0)

    // Log out → log back in → land on / but no reveal (flag already consumed).
    await page.goto('/')
    // Sidebar logout on desktop viewports; Dock on mobile. Playwright defaults to 1280x720 → desktop.
    await page.getByRole('button', { name: /Log out/i }).click()
    await page.waitForURL('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password)
    await page.getByRole('button', { name: /Log in/i }).click()
    await page.waitForURL('/')
    await expect(page.getByText(/Welcome, Reveal/i)).toHaveCount(0)
  })
})
