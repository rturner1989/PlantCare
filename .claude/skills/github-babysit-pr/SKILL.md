---
name: github-babysit-pr
description: Watch the current branch's PR for CI failures and fix them automatically
disable-model-invocation: true
---

Watch the current branch's PR and fix any CI failures as they occur.

Steps:

1. Identify the current branch: `git branch --show-current`
2. Find the PR for this branch: `gh pr view --json number,url,statusCheckRollup`
3. If no PR exists, stop and tell the user to run `/github-make-pr` first
4. Show the user the PR URL and current status
5. Poll the PR every 60 seconds using `gh pr view --json statusCheckRollup`
6. For each failing check:
   - Fetch the failure logs: `gh run view <run-id> --log-failed`
   - Diagnose the failure (lint, test, build, security, etc.)
   - Fix the issue locally using the project's existing tooling (check for scripts in ./scripts, Makefile, package.json, or Gemfile before inventing your own commands)
   - Verify the fix works before committing
   - Commit the fix with a descriptive message
   - Push: `git push`
7. Continue polling until all checks pass
8. When all checks pass, notify the user and stop — do NOT merge

Important:
- Never use `--no-verify` or skip hooks
- Never force-push
- If you can't fix a failure after 2 attempts, stop and ask the user
- Do NOT merge the PR — the user will merge manually after reviewing
- Respect the project's existing tooling and scripts
