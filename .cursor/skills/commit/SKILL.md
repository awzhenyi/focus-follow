---
name: commit
description: Commits staged changes and pushes to the remote. Use when the user says /commit, asks to commit and push, or wants to commit staged changes and push.
---

# Commit and Push

## Instructions

When the user invokes `/commit` or asks to commit staged changes and push:

1. **Commit** staged changes:
   - If the user provided a message, use it.
   - Otherwise, generate a concise commit message from the staged diff (`git diff --cached`).
   - Run: `git commit -m "<message>"`

2. **Push** to the remote:
   - Run: `git push` (or `git push origin <branch>` if the default push target is unclear)

3. Request `git_write` and `network` permissions for these commands.

## Notes

- If nothing is staged, inform the user and do not commit.
- If the commit or push fails, surface the error to the user.
