---
name: GitHub empty repositories
description: Constraint when publishing a workspace to a GitHub repository with no commits
---

GitHub's Git Data API rejects blob creation while a repository has no commit history.

**Why:** An empty repository has no tree or ref for the low-level Git endpoints to attach to, even though the repository itself exists.

**How to apply:** Create one small initial file through the Contents API on the target branch, then use the resulting ref as the parent for the full tree and commit. If local and remote histories later diverge, build a new tree from the current remote ref plus only the intended changed files; never force-push the unrelated local history.