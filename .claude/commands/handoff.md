---
description: End-of-session ritual — sync status docs, log decisions, commit & push
---

Wrap up the current work session so any future session (any machine, any AI
tool) can resume with full context. Do these steps in order:

1. **Verify the tree is healthy.** Run `npm test` and `npm run build`. If
   either fails, stop and report — never hand off a broken tree without
   saying so explicitly.

2. **Sync the two status locations** (the ONLY files allowed to carry status):
   - `docs/ROADMAP.md` — update the sub-project checkboxes / "← next" marker
     to match reality.
   - `CLAUDE.md` → "Current status & next step" — rewrite to say what is now
     built/tested and what the next task is.

3. **Log decisions.** For every non-obvious choice made this session (anything
   a future reader would question), add a dated entry to `docs/DECISIONS.md`
   (newest first, matching the existing entry style).

4. **Structural docs, only if structure changed.** If files, commands, or
   conventions were added/removed this session, update the file lists in
   `README.md`, `AGENTS.md`, and `docs/ARCHITECTURE.md`. Do NOT add status
   claims to README.md or AGENTS.md — they are status-free by design.

5. **Capture new gotchas.** If this session hit a pitfall a future session
   would hit again (test quirk, tooling trap, subtle domain rule), add a
   bullet to CLAUDE.md → "Working in this repo".

6. **Commit and push.** Review `git status` — stage everything that belongs,
   write a conventional summary commit message, commit, and push to
   `origin/main`. Confirm the push succeeded. Uncommitted work is invisible
   to every other session.

7. **Report.** End with a short summary: what was synced, what was committed
   (hash), and the stated next step.
