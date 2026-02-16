## Overview

Commit file changes. Always verify the build, update the session handoff file, and review changes before committing.

## Steps

1. **Verify the build** before anything else. Run the checks relevant to what changed:

   | What changed                     | Run                                                 |
   | -------------------------------- | --------------------------------------------------- |
   | Any TypeScript (`src/`)          | `npm run typecheck`                                 |
   | Any source code                  | `npm run lint`                                      |
   | YAML content (`content-source/`) | `npm run content:build && npm run content:validate` |
   | Tests or tested code             | `npm run test:run`                                  |
   | Multiple categories              | Run all applicable checks                           |

   If any check fails, **fix the issue first** — do not commit broken code.

2. **Update `readfirst.md`** to reflect the current project state:
   - Run `git log --oneline -20` to get recent commits
   - Run `git status --short` to see uncommitted files
   - Run `git branch --show-current` to get the current branch
   - Read the current `docs/MODERNIZATION_ROADMAP.md` phase statuses (if it exists)
   - Rewrite `readfirst.md` with updated sections:
     - **Recent Commits**: from git log
     - **Uncommitted Work**: from git status (after the commit this will be empty, so list what is about to be committed)
     - **Current Roadmap Phase**: update the phase table based on what work has actually been done
     - **What's Been Built**: add any new features/modules completed since last update
     - **Known Issues**: update if any were fixed or new ones discovered
   - Keep the file structure and all other sections (Project, Tech Stack, Key Files, Session Instructions) intact
   - Stage `readfirst.md` along with the other changes

3. **Review changes** before committing:
   - Run `git status` to see all files that will be committed
   - Run `git diff --staged` to review the actual diff
   - Confirm no secrets, credentials, or `.env` files are staged
   - Confirm generated files (e.g. `content/stories/*.json`) are staged alongside their source files if applicable
   - If anything looks wrong, unstage it or fix it before proceeding

4. **Commit** with an appropriate conventional commit message.

## Notes

- Don't push
- The `readfirst.md` update is mandatory — never skip it
- Keep `readfirst.md` concise and scannable (not a full history, just current state)
- If unsure which checks to run, run them all: `npm run typecheck && npm run lint && npm run test:run`
- Husky pre-commit hooks will run lint-staged automatically, but step 1 catches issues earlier with better error messages
