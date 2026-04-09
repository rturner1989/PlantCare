---
name: pre-commit
description: Run lint and tests before committing, fixing any issues found
disable-model-invocation: true
---

Prepare the codebase for commit by ensuring lint and tests pass. Fix any failures before allowing the user to commit.

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

5. **Final verification** — run `./scripts/lint.sh` AND `./scripts/run_tests.sh` one more time to confirm everything is clean.

6. **Show status** — run `git status` and `git diff --stat` so the user can review all changes (including any fixes you made).

7. **Ask for commit details** — ask the user:
   - Which files to stage (default: all modified files)
   - The commit message

8. **Commit** — stage the files and create the commit. Do NOT push.

Important:
- Never use `--no-verify` or bypass hooks
- Never skip tests — fix them
- If a fix requires a significant refactor, pause and ask the user first
- The goal is a clean, passing codebase ready for commit — not just "it ran"
