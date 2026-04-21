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
  // getByRole, not getByLabel — getByLabel uses the <label>'s raw text
  // content which now includes the visual "*", while getByRole uses the
  // computed accessible name (aria-hidden properly excluded).
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password)
  await page.getByLabel('Confirm password').fill(password)
  await page.getByRole('button', { name: /Create account/i }).click()
  await page.waitForURL('/welcome')
  return { email, password }
}

test.describe('Onboarding wizard', () => {
  test('register → wizard → dashboard (full happy path)', async ({ page }) => {
    await registerFreshUser(page)

    // Step 1 — intro
    await expect(page).toHaveURL('/welcome')
    await expect(page.getByText('Step 1 of 5')).toBeVisible()
    await page.getByRole('button', { name: /begin/i }).click()

    // Step 2 — rooms
    await expect(page).toHaveURL(/\/welcome\/rooms$/)
    await expect(page.getByText('Step 2 of 5')).toBeVisible()
    await page.getByRole('checkbox', { name: /Living Room/i }).click()
    await page.getByRole('checkbox', { name: /Bedroom/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 3 — species + room + nickname
    await expect(page).toHaveURL(/\/welcome\/species$/)
    await expect(page.getByText('Step 3 of 5')).toBeVisible()
    await page.getByLabel('Search species', { exact: true }).fill('monstera')
    await page
      .getByRole('option', { name: /Monstera/i })
      .first()
      .click()
    await page.getByLabel(/What should we call them/).fill('Monty')
    await page.getByLabel('Which room?').selectOption({ label: 'Living Room' })
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 4 — environment (defaults fine, just continue)
    await expect(page).toHaveURL(/\/welcome\/environment$/)
    await expect(page.getByText('Step 4 of 5')).toBeVisible()
    await page.getByRole('button', { name: /Continue/i }).click()

    // Step 5 — done
    await expect(page).toHaveURL(/\/welcome\/done$/)
    await expect(page.getByText('All set!')).toBeVisible()
    await page.getByRole('button', { name: /Enter your jungle/i }).click()

    await expect(page).toHaveURL('/')
  })

  test('back from Step 4 restores the species + nickname on Step 3', async ({ page }) => {
    await registerFreshUser(page)

    await page.getByRole('button', { name: /begin/i }).click()
    await page.getByRole('checkbox', { name: /Living Room/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 3: pick Monstera, name it Monty (single room → no picker).
    await page.getByLabel('Search species', { exact: true }).fill('monstera')
    await page
      .getByRole('option', { name: /Monstera/i })
      .first()
      .click()
    await page.getByLabel(/What should we call them/).fill('Monty')
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 4 → Back.
    await expect(page.getByText('Step 4 of 5')).toBeVisible()
    await page.getByRole('button', { name: 'Back' }).click()

    // Species card + nickname persist; search input is not re-shown.
    await expect(page.getByText('Monstera Deliciosa', { exact: true })).toBeVisible()
    await expect(page.getByLabel(/What should we call them/)).toHaveValue('Monty')
    await expect(page.getByLabel('Search species', { exact: true })).toHaveCount(0)
  })

  test('back from Step 3 restores previously-selected rooms on Step 2', async ({ page }) => {
    await registerFreshUser(page)

    await page.getByRole('button', { name: /begin/i }).click()

    // Step 2: tick two preset rooms.
    await page.getByRole('checkbox', { name: /Living Room/i }).click()
    await page.getByRole('checkbox', { name: /Bedroom/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 3 → Back.
    await expect(page.getByText('Step 3 of 5')).toBeVisible()
    await page.getByRole('button', { name: 'Back' }).click()

    // Both rooms still ticked.
    await expect(page.getByText('Step 2 of 5')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /Living Room/i })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByRole('checkbox', { name: /Bedroom/i })).toHaveAttribute('aria-checked', 'true')
  })

  test('skip plant path lands on Step 5 with a generic welcome card', async ({ page }) => {
    await registerFreshUser(page)

    await page.getByRole('button', { name: /begin/i }).click()
    await page.getByRole('checkbox', { name: /Living Room/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 3: click the skip link without picking a species. Skip jumps
    // straight past Step 4 (environment) to Step 5 (done).
    await expect(page.getByText('Step 3 of 5')).toBeVisible()
    await page.getByRole('button', { name: /Skip for now/i }).click()

    await expect(page.getByText('All set!')).toBeVisible()
    // No species = generic welcome card (no personality eyebrow).
    await expect(page.getByText('Your jungle', { exact: true })).toBeVisible()
    await expect(page.getByText(/🎭/)).toHaveCount(0)
    // 0 plants = no avatar row, no "Add another" button.
    await expect(page.locator('[data-testid="added-avatar"]')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Add another/i })).toHaveCount(0)
  })

  test('refreshing on /welcome/species lands on Step 3 with rooms intact', async ({ page }) => {
    await registerFreshUser(page)

    await page.getByRole('button', { name: /begin/i }).click()
    await page.getByRole('checkbox', { name: /Living Room/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL(/\/welcome\/species$/)
    await expect(page.getByText('Step 3 of 5')).toBeVisible()
    await page.reload()

    // URL-driven: refresh on /welcome/species lands straight back on Step 3.
    await expect(page).toHaveURL(/\/welcome\/species$/)
    await expect(page.getByText('Step 3 of 5')).toBeVisible()

    // Back to Step 2 confirms the room really is server-persisted (not just
    // held in client state that the reload would have cleared).
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByText('Step 2 of 5')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /Living Room/i })).toHaveAttribute('aria-checked', 'true')
  })

  test('onboarded user lands on / after logging back in', async ({ page, context }) => {
    const { email, password } = await registerFreshUser(page)

    // Blitz through to the end so onboarding_completed_at gets set.
    await page.getByRole('button', { name: /begin/i }).click()
    await page.getByRole('checkbox', { name: /Living Room/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: /Skip for now/i }).click()
    await page.getByRole('button', { name: /Enter your jungle/i }).click()
    await expect(page).toHaveURL('/')

    // Nuke session state and log back in — proxy for "come back later".
    await context.clearCookies()
    await page.evaluate(() => localStorage.clear())

    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: /Log in/i }).click()

    await expect(page).toHaveURL('/')
  })

  test('un-onboarded user is routed to /welcome after logging back in', async ({ page, context }) => {
    const { email, password } = await registerFreshUser(page)

    // Partial progress — create a room then bail without finishing.
    await page.getByRole('button', { name: /begin/i }).click()
    await page.getByRole('checkbox', { name: /Living Room/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Step 3 of 5')).toBeVisible()

    await context.clearCookies()
    await page.evaluate(() => localStorage.clear())

    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: /Log in/i }).click()

    // ProtectedRoute should bounce them back to /welcome because
    // user.onboarded is still false.
    await expect(page).toHaveURL('/welcome')
  })

  test('deselecting a previously-saved room deletes it from the server', async ({ page }) => {
    await registerFreshUser(page)

    await page.getByRole('button', { name: /begin/i }).click()
    await page.getByRole('checkbox', { name: /Living Room/i }).click()
    await page.getByRole('checkbox', { name: /Bedroom/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Step 2 also has a Back button (to Step 1), so wait for the Step 3
    // landing before clicking Back to avoid clicking Step 2's Back during
    // the submit transition.
    await expect(page.getByText('Step 3 of 5')).toBeVisible()
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByText('Step 2 of 5')).toBeVisible()

    await page.getByRole('checkbox', { name: /Bedroom/i }).click()
    await expect(page.getByRole('checkbox', { name: /Bedroom/i })).toHaveAttribute('aria-checked', 'false')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Step 3 of 5')).toBeVisible()

    // Hard refresh forces the resume query to re-read from the server.
    // If the DELETE hadn't fired, the room would still be there and we'd
    // see Bedroom ticked on Step 2 again.
    await page.reload()
    await expect(page.getByText('Step 3 of 5')).toBeVisible()
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByText('Step 2 of 5')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /Living Room/i })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByRole('checkbox', { name: /Bedroom/i })).toHaveAttribute('aria-checked', 'false')
  })

  test('a second submit with a case-duplicate name surfaces the server error', async ({ page }) => {
    await registerFreshUser(page)

    await page.getByRole('button', { name: /begin/i }).click()
    // First submit: create "Living Room" via the preset toggle.
    await page.getByRole('checkbox', { name: /Living Room/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Step 3 of 5')).toBeVisible()

    // Back to Step 2 (Living Room now in initialRooms, already persisted).
    // Type "living room" as a custom — local `.includes()` is case-sensitive
    // so it doesn't dedup against the existing "Living Room". Server's
    // case-insensitive uniqueness validation rejects it on submit.
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByText('Step 2 of 5')).toBeVisible()
    // Progressive-disclosure: reveal the input via the "+ Add a custom room"
    // button, then type + Add.
    await page.getByRole('button', { name: /Add a custom room/i }).click()
    await page.getByLabel('New room name').fill('living room')
    await page.getByRole('button', { name: 'Add room' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByText(/has already been taken/i)).toBeVisible()
    await expect(page.getByText('Step 2 of 5')).toBeVisible()
  })

  test('browser back from Step 3 returns to Step 2 with rooms intact', async ({ page }) => {
    await registerFreshUser(page)

    await page.getByRole('button', { name: /begin/i }).click()
    await page.getByRole('checkbox', { name: /Living Room/i }).click()
    await page.getByRole('checkbox', { name: /Bedroom/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Step 3 of 5')).toBeVisible()

    // Native browser back — simulates Safari's two-finger swipe or the
    // back button. Historically dropped the user to Step 1 because wizard
    // state lived entirely in useState with no URL representation.
    await page.goBack()

    await expect(page).toHaveURL(/\/welcome\/rooms$/)
    await expect(page.getByText('Step 2 of 5')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /Living Room/i })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByRole('checkbox', { name: /Bedroom/i })).toHaveAttribute('aria-checked', 'true')

    // Forward restores Step 3.
    await page.goForward()
    await expect(page).toHaveURL(/\/welcome\/species$/)
    await expect(page.getByText('Step 3 of 5')).toBeVisible()
  })

  test('add-custom-room: button reveals input, adds a chip, collapses back', async ({ page }) => {
    await registerFreshUser(page)
    await page.getByRole('button', { name: /begin/i }).click()
    await expect(page.getByText('Step 2 of 5')).toBeVisible()

    // Resting state: just the trigger button, no input on screen.
    const trigger = page.getByRole('button', { name: /Add a custom room/i })
    await expect(trigger).toBeVisible()
    await expect(page.getByLabel('New room name')).toHaveCount(0)

    // Reveal.
    await trigger.click()
    const input = page.getByLabel('New room name')
    await expect(input).toBeVisible()
    await expect(input).toBeFocused()

    // Add via Enter.
    await input.fill('Greenhouse')
    await input.press('Enter')

    // Input panel collapses, trigger returns, chip appears as a checked CheckboxCardInput.
    await expect(page.getByRole('button', { name: /Add a custom room/i })).toBeVisible()
    await expect(page.getByLabel('New room name')).toHaveCount(0)
    await expect(page.getByRole('checkbox', { name: 'Greenhouse' })).toHaveAttribute('aria-checked', 'true')

    // Reveal → Escape cancels without adding.
    await page.getByRole('button', { name: /Add a custom room/i }).click()
    await page.getByLabel('New room name').fill('Shed')
    await page.getByLabel('New room name').press('Escape')
    await expect(page.getByLabel('New room name')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Shed' })).toHaveCount(0)
  })

  test('add another plant: Step 5 → back to Step 3 with chip → submit second plant', async ({ page }) => {
    await registerFreshUser(page)

    // First plant: Monty the Monstera in Living Room.
    await page.getByRole('button', { name: /begin/i }).click()
    await page.getByRole('checkbox', { name: /Living Room/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByLabel('Search species', { exact: true }).fill('monstera')
    await page
      .getByRole('option', { name: /Monstera/i })
      .first()
      .click()
    await page.getByLabel(/What should we call them/).fill('Monty')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Step 4 of 5')).toBeVisible()
    await page.getByRole('button', { name: /Continue/i }).click()

    // Step 5 with one plant: both actions visible + one avatar rendered.
    await expect(page).toHaveURL(/\/welcome\/done$/)
    await expect(page.getByRole('button', { name: /Add another/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Enter your jungle/i })).toBeVisible()
    await expect(page.locator('[data-testid="added-avatar"]')).toHaveCount(1)

    // Add another → returns to Step 3 with "Added so far" chip.
    await page.getByRole('button', { name: /Add another/i }).click()
    await expect(page).toHaveURL(/\/welcome\/species$/)
    await expect(page.getByText(/Add another\?/i)).toBeVisible()
    await expect(page.getByText(/Added so far/i)).toBeVisible()
    await expect(page.getByText('Monty', { exact: true })).toBeVisible()

    // Pick a second species (Snake Plant if seeded; fall back to first result).
    await page.getByLabel('Search species', { exact: true }).fill('snake')
    await page.getByRole('option', { name: /Snake/i }).first().click()
    await page.getByLabel(/What should we call them/).fill('Slither')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Step 4 of 5')).toBeVisible()
    await page.getByRole('button', { name: /Continue/i }).click()

    // Step 5 with two plants: eyebrow shows collection copy + avatar row grows.
    await expect(page).toHaveURL(/\/welcome\/done$/)
    await expect(page.getByText(/Your jungle of 2/i)).toBeVisible()
    await expect(page.locator('[data-testid="added-avatar"]')).toHaveCount(2)

    await page.getByRole('button', { name: /Enter your jungle/i }).click()
    await expect(page).toHaveURL('/')
  })

  test('refreshing on Step 5 after adding a plant keeps the avatar + Add another button', async ({ page }) => {
    await registerFreshUser(page)

    await page.getByRole('button', { name: /begin/i }).click()
    await page.getByRole('checkbox', { name: /Living Room/i }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByLabel('Search species', { exact: true }).fill('monstera')
    await page
      .getByRole('option', { name: /Monstera/i })
      .first()
      .click()
    await page.getByLabel(/What should we call them/).fill('Monty')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Step 4 of 5')).toBeVisible()
    await page.getByRole('button', { name: /Continue/i }).click()

    // Step 5 with one plant: avatar + both buttons.
    await expect(page).toHaveURL(/\/welcome\/done$/)
    await expect(page.locator('[data-testid="added-avatar"]')).toHaveCount(1)
    await expect(page.getByRole('button', { name: /Add another/i })).toBeVisible()

    // Refresh — Welcome re-mounts and rehydrates createdPlants from the server,
    // not from component state. Everything should still be there.
    await page.reload()
    await expect(page).toHaveURL(/\/welcome\/done$/)
    await expect(page.locator('[data-testid="added-avatar"]')).toHaveCount(1)
    await expect(page.getByRole('button', { name: /Add another/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Enter your jungle/i })).toBeVisible()
  })

  test('add-custom-room: scroll position is preserved across the reveal/cancel toggle', async ({ page }) => {
    // Short viewport forces CardBody to scroll — matches the desktop
    // condition the user hit (scrolled to bottom of Step 2 to reach the
    // trigger, clicked it, jumped to top).
    await page.setViewportSize({ width: 900, height: 520 })

    await registerFreshUser(page)
    await page.getByRole('button', { name: /begin/i }).click()
    await expect(page.getByText('Step 2 of 5')).toBeVisible()

    // Only the rooms list scrolls now — title/subtitle are pinned to
    // the top of CardBody, matching Step 3's layout. Target the rooms
    // container by class (`mt-5` is unique to it) rather than picking
    // from all overflow-y-auto elements on the page.
    const scrollContainer = page.locator('div.mt-5.overflow-y-auto')
    await scrollContainer.evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    const bottomScroll = await scrollContainer.evaluate((el) => el.scrollTop)
    expect(bottomScroll).toBeGreaterThan(0)

    // Reveal the input. Scroll should stay put — no height collapse.
    await page.getByRole('button', { name: /Add a custom room/i }).click()
    await page.waitForTimeout(250) // let the opacity transition settle
    const afterReveal = await scrollContainer.evaluate((el) => el.scrollTop)
    expect(afterReveal).toBe(bottomScroll)

    // Cancel. Same — no scroll reset on collapse.
    await page.getByRole('button', { name: 'Cancel adding room' }).click()
    await page.waitForTimeout(250)
    const afterCancel = await scrollContainer.evaluate((el) => el.scrollTop)
    expect(afterCancel).toBe(bottomScroll)
  })
})
