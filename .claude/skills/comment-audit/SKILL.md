---
name: comment-audit
description: Audit code comments against the project's WHY-only discipline and remove anything that restates the code, explains the current task, or covers for a weak identifier name. Use before commits or on demand via /comment-audit.
disable-model-invocation: true
---

Audit code comments in the working tree (or a specified path) against the project's WHY-only discipline. Remove comments that shouldn't exist; leave the minimum that genuinely aid a future reader.

## The rule

Rob's standard — *code should speak for itself*. Comments exist to **reinforce something the code can't say on its own**, not to narrate what the reader can see.

### Keep a comment when, and only when, ALL of these are true

1. The **WHY is non-obvious** — hidden constraint, subtle invariant, workaround for a specific bug, surprising behaviour, cross-system coupling.
2. **The code alone cannot convey it.** A better identifier, a small refactor, or a constant with a clear name would not make the comment redundant.
3. **Removing it would cost the next reader something real** — not just "extra reading time," but an actual risk of misunderstanding or re-breaking.

### Delete a comment when ANY of these are true

- **Restates WHAT the code does** (`// Loop over users`, `# Find the species`, `// Set the default`).
- **Explains a well-named identifier** (`// authService handles login` above a call to `authService.login()`).
- **References the current task, PR, ticket, or caller** (`// For TICKET-013`, `// Added when fixing the Step 3 bug`, `// Used by Dashboard`). This context belongs in the commit message, PR body, or ticket.
- **Narrates the diff** (`// Now using X instead of Y`, `// Changed from async`). Git history has this.
- **Copies the identifier into English** (`// The user's first name` above `const firstName = …`).
- **Lists steps the code already lists** (a numbered comment above sequential statements).
- **Is a TODO without an owner, date, or ticket number.** Convert to an issue or delete.
- **A banner / divider** (`// === HELPERS ===`). Structure should be visible in the file shape.
- **Changelog-in-code** (`// v2: now supports …`).
- **Explains defensive code that shouldn't exist** — if the comment is explaining a check that "shouldn't happen," delete both the check and the comment, or prove it can happen and fix properly.

### Borderline cases — bias toward deletion

- **WHY comments that could be a better variable name.** `// Only fetch when window is focused, otherwise browsers throttle` above a flag called `shouldFetch` → rename the flag to `onlyWhenFocused` or `respectsTabThrottle` and drop the comment.
- **WHY comments describing what a unit test's name should describe.** Move the intent into the test description.
- **Long multi-paragraph comments on a single function.** If the context is that large, the explanation belongs in the PR description, a design doc, or the ticket — not inline. Leave a one-line pointer at most.
- **Comments that describe behaviour that a contributor could learn from the library's own docs.** Don't explain React Query, Framer Motion, Rails, or other common dependencies.

## How to run

1. **Determine scope.**
   - If the user passed a path or pattern, audit those files only.
   - Otherwise, audit the staged + unstaged diff: `git diff --stat` then focus on files under `api/app/` and `client/src/`. Don't audit `tests/`, fixtures, migrations, config, or third-party code unless the user asked.

2. **Read each file in scope.** For every comment in the diff (and any comment in the surrounding block that looks recently added), apply the "keep" vs "delete" checklist above. A comment outside the diff that was already there can stay unless clearly stale.

3. **Propose a plan before editing.** List:
   - The file and line of each comment you'd remove, with a one-line reason ("restates code", "task narration", "explained by name").
   - The comments you'd keep, with a one-line reason (so the user can push back if you're being too generous).
   - Any renames / small refactors that would let a kept comment be deleted. These are optional — flag them, don't force them.

4. **Wait for confirmation.** If the user says "go" or "yes", proceed. If they call specific items back, honour that list only.

5. **Apply the edits.** Remove comments cleanly; don't leave trailing blank lines or orphaned `// ` lines. Preserve intentional blank lines between logical blocks.

6. **Lint + test after editing.** Run `./scripts/lint.sh` to auto-fix formatting drift. If a comment removal somehow trips a test (very rare — doc tests or brittle snapshot tests), surface the failure rather than fighting it.

7. **Show the final diff.** `git diff --stat` and optionally `git diff -- path/to/one/file.rb` so the user can review before the next step.

8. **Do NOT commit.** This skill's output is a tidied working tree. Staging and commit messages are the user's call.

## What NOT to touch

- **Commit messages, PR bodies, tickets, `docs/`**. Those aren't code comments.
- **Documentation files (`*.md`, CLAUDE.md, README).** Those are documentation, not code comments.
- **YARD / JSDoc on public library APIs** when the project exposes a library surface. PlantCare doesn't currently ship a public library, so in practice this never applies here — but if it ever does, don't strip the doc comments that external consumers rely on.
- **Copyright / licence headers** (the `# frozen_string_literal: true` magic comment in Ruby files).
- **Linter pragma comments** (`// biome-ignore …`, `# rubocop:disable …`). These ARE functional.
- **Migration comments** that explain data shape choices the schema annotation doesn't carry. These are usually justified.

## Examples

### Delete

```js
// Fetch the user's rooms from the backend
const rooms = await apiGet('/api/v1/rooms')
```
→ Function name says it. Delete.

```js
// TODO(ticket 14): real counts from dashboard + house queries.
```
→ Task narration. Convert to a follow-up ticket if still relevant, else delete.

```ruby
# This creates a new species from the API
def self.find_or_fetch_from_api(perenual_id, fallback: {}, client: PerenualClient.new)
```
→ Method name + signature already tell you this. Delete.

### Keep

```ruby
# db 2 keeps Rails.cache.clear from nuking Sidekiq (db 0) or ActionCable (db 1).
config.cache_store = :redis_cache_store, { url: ENV.fetch('REDIS_CACHE_URL', 'redis://redis:6379/2') }
```
→ Explains a cross-system coupling invisible from this line alone. Keep.

```js
// Strict Mode double-mounts components in dev; reading+clearing synchronously via
// a ref makes the second mount's read a no-op so the reveal can't replay.
```
→ Explains a framework-level subtlety that's the entire reason the code is structured this way. Keep.

## When applying this skill to your own output

If you just wrote a comment and are reading it back, apply the same test. A comment you wrote a moment ago isn't more valuable than one written last year — same bar.
