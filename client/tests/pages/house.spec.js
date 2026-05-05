import { expect, test } from '@playwright/test'
import { completeOnboarding, registerUser } from '../helpers/onboarding'

async function registerAndOnboard(page, { spaces = ['Living Room', 'Kitchen'] } = {}) {
  await registerUser(page, 'House Tester')
  await completeOnboarding(page, { spaces })
}

test.describe('House screen', () => {
  test('renders the v2 header and the seeded rooms grid', async ({ page }) => {
    await registerAndOnboard(page)
    await page.goto('/house')

    await expect(page.getByRole('heading', { level: 1, name: /Browse your plants/i })).toBeVisible()

    const viewGroup = page.getByRole('radiogroup', { name: 'View as' })
    const roomsRadio = viewGroup.getByRole('radio', { name: /Rooms/ })
    const listRadio = viewGroup.getByRole('radio', { name: /List/ })
    const habitatRadio = viewGroup.getByRole('radio', { name: /Habitat/ })

    await expect(roomsRadio).toBeChecked()
    await expect(habitatRadio).toBeDisabled()

    // Each seeded space renders as a clickable RoomCard plus an edit
    // pencil button — match the card by its full accessible name
    // ("Living Room 0 plants · indoor") to avoid colliding with the
    // edit button's "Edit Living Room" label.
    await expect(page.getByRole('button', { name: /^Living Room \d+/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Kitchen \d+/ })).toBeVisible()

    // List view ships in R3b; placeholder copy confirms the segment
    // toggle still wires through.
    await viewGroup.getByText('List', { exact: true }).click()
    await expect(listRadio).toBeChecked()
    await expect(page.getByText(/List view ships in TICKET-039b/)).toBeVisible()
  })

  test('Add-a-space tile opens the dialog and saving creates a new room card', async ({ page }) => {
    await registerAndOnboard(page)
    await page.goto('/house')

    await page.getByRole('button', { name: /Add a space/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByLabel('Name').fill('Sunroom')
    await dialog.getByRole('button', { name: 'Add space' }).click()

    await expect(page.getByRole('button', { name: /^Sunroom \d+/ })).toBeVisible()
  })

  test('unauthenticated visit redirects to login', async ({ page }) => {
    await page.goto('/house')
    await expect(page).toHaveURL(/\/login$/)
  })
})
