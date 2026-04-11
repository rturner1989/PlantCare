---
name: github-make-pr
description: Push the current branch and create a GitHub pull request
disable-model-invocation: true
---

Push the current branch and create a pull request on GitHub.

Steps:

1. Verify you're not on `main` — if on main, stop and ask the user to create a branch first
2. Run `git status` to confirm no uncommitted changes
3. Run `git push -u origin HEAD` to push the current branch
4. Check the commits on the branch vs main:
   - `git log main..HEAD --oneline`
   - `git diff main...HEAD --stat`
5. Draft a PR title and body based on the commit messages and diff
6. Show the draft to the user and ask for confirmation
7. Create the PR using `gh pr create` with a HEREDOC body:

```
gh pr create --title "..." --body "$(cat <<'EOF'
## Summary
- bullet points

## Test plan
- [ ] Tests pass locally
- [ ] CI pipeline passes
EOF
)"
```

8. Return the PR URL to the user

Do NOT merge the PR — the user will review and merge manually.
