---
name: github-post-merge
description: Sync main, clean up the merged feature branch, and update Claude's memory with merge details
disable-model-invocation: true
---

After the user confirms a PR has been merged on GitHub, sync the local repo, delete the feature branch, and record progress in memory.

Steps:

1. **Identify the feature branch** — `git branch --show-current`. If currently on `main`, ask the user which branch to clean up.

2. **Verify the PR is actually merged.** Run:
   ```
   gh pr view --json number,state,mergeCommit,url,title
   ```
   - If `state` is not `MERGED`, stop and tell the user the PR isn't merged yet (`OPEN` / `CLOSED` without merge). Do not proceed with destructive cleanup.
   - Capture the PR number, merge commit SHA, title, and URL for the memory update.

3. **Switch to main and pull.**
   ```
   git checkout main
   git pull origin main
   ```
   Verify the merge commit is in the log. Show the user `git log --oneline -3`.

4. **Delete the local feature branch.**
   - `git branch -d <feature-branch>` (safe delete — fails if commits aren't merged)
   - If the safe delete fails, stop and ask the user before forcing — unmerged commits would be lost.
   - Remote branch is normally auto-deleted by GitHub on merge. If it still exists (`git ls-remote --heads origin <feature-branch>` returns a row), ask the user before deleting it.

5. **Update Claude's memory.** The memory directory is `~/.claude/projects/-Users-rob-Development-PlantCare/memory/`. Read `MEMORY.md` to find the relevant project progress file (look for entries tagged `project_*progress*` or similar). Update it with:
   - PR number + URL
   - Merge commit SHA (short)
   - Date (use the user's current date — see `currentDate` in context)
   - One-line summary of what landed (use the PR title + a short factual note)
   - Next ticket / next branch hint if the plan makes it obvious

   Update the frontmatter `description` if the active state has shifted.

   Do NOT invent next-step details that aren't in the plan or the user's prior conversation. If unsure what comes next, leave the "next" field as a TODO and ask the user.

6. **Report status.** Show the user:
   - Confirmation that main is synced and the feature branch is deleted
   - The merge commit SHA + PR URL
   - The memory file path that was updated
   - The proposed next action (if obvious from the plan), framed as a question

Important:
- Never delete an unmerged branch
- Never force-delete (`-D`) without explicit user permission
- Never push to main
- Never modify the feature branch's history (no rebases, force-pushes, etc.)
- This skill is non-destructive on remote — it only cleans local state
