---
name: pre-commit
description: Run lint and tests before committing, fixing any issues found
disable-model-invocation: true
---

Prepare the codebase for commit by ensuring lint, tests, and accessibility pass. Fix any failures before allowing the user to commit.

For a full review of work against the active ticket's acceptance criteria, design spec, and code quality, use `/review-ticket` separately — typically once per ticket before opening the PR, not per-commit.

Steps:

1. **Run lint** — execute `./scripts/lint.sh`. This auto-fixes most issues (RuboCop -A, Biome lint:fix).

2. **If lint still fails after auto-fix** (remaining warnings/errors that couldn't be auto-corrected):
   - Read the failing files and diagnose each issue
   - Fix them manually one by one
   - Re-run `./scripts/lint.sh` to verify
   - Repeat until clean
   - If you cannot fix an issue after 2 attempts, stop and ask the user what to do

3. **Run tests** — execute `./scripts/run_tests.sh`.

4. **If tests fail**:
   - Read the failure output carefully
   - Identify the failing test(s) and the root cause
   - Fix the underlying issue (could be in production code OR the test itself — use judgment)
   - Re-run the failing tests specifically to confirm the fix
   - Re-run the full suite to make sure you didn't break anything else
   - If you cannot fix a test after 2 attempts, stop and ask the user

5. **Accessibility pass on frontend changes** — if `git diff --stat` shows any changes under `client/src/`, run a targeted a11y review of the changed files BEFORE commit so issues don't ship. Invoke the `/accessibility` skill and audit the diff for:
   - **Form inputs** — every new `<input>` / `<textarea>` / `<select>` has a `<label>` (TextInput wraps for you). Error messages wired via `aria-invalid` + `aria-describedby`.
   - **Interactive elements** — new icon-only buttons/links have `aria-label`; icons inside buttons with visible text don't need anything (the text is the name).
   - **Images** — new `<img>` tags have `alt` (empty alt is correct for decorative; descriptive alt for informational).
   - **Contrast** — new `text-*` / `bg-*` combinations pass WCAG AA on normal text (4.5:1) and large text / UI components (3:1). Use `coral-deep` not `coral` for text on light backgrounds.
   - **Landmarks** — new `<nav>` elements have `aria-label` if more than one nav can be in the landmarks list at once.
   - **Focus** — no `outline: none` without a `focus-visible` replacement; new interactive elements are keyboard-reachable.
   - **Headings** — new pages have one `<h1>`; no heading level is skipped (h1 → h3 without h2 in between). `EmptyState` consumers consider `headingLevel="h1"` when the empty state is the page's primary content.
   - **Live regions / status** — new async feedback uses the existing `ToastContext` or `role="status"` / `role="alert"`, not a naked `<div>` update.
   - **Reduced motion** — new animations either use Framer Motion (`useReducedMotion` aware) or respect the global `@media (prefers-reduced-motion: reduce)` rule.

   Report findings as a short list. If issues are found, fix them inline before committing — they shouldn't ship to PR stage.

6. **Final verification** — run `./scripts/lint.sh` AND `./scripts/run_tests.sh` one more time to confirm everything is clean.

7. **Show status** — run `git status` and `git diff --stat` so the user can review all changes (including any fixes you made).

8. **Ask for commit details** — ask the user:
   - Which files to stage (default: all modified files)
   - The commit message

9. **Commit** — stage the files and create the commit. Do NOT push.

Important:
- Never use `--no-verify` or bypass hooks
- Never skip tests — fix them
- If a fix requires a significant refactor, pause and ask the user first
- The goal is a clean, passing, accessible codebase ready for commit — not just "it ran"
