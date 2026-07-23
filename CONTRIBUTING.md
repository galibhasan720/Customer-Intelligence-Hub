# Contributing to Seat-Flow

This project uses a **issue → branch → PR → merge → auto-close** workflow.  
GitHub **automation keywords** in pull request descriptions (and commit messages) link work to issues and close them when the PR merges.

## Stack

- Frontend: React + TypeScript → Vercel  
- API: FastAPI + Docker → Hugging Face Spaces  
- DB / Auth: Supabase  

## Required flow (every change)

1. Pick an open GitHub issue (see [Issues](https://github.com/galibhasan720/Seat-Flow/issues)).
2. Move the issue to **In Progress** on the project board.
3. Create a branch from `main` named after the issue number.
4. Open a pull request into `main`.
5. Put a **closing keyword + issue number** in the **PR description**.
6. Wait for CI to pass, get review if needed, then merge.
7. Confirm the issue auto-closed and the board card moved to **Done**.

Do **not** commit directly to `main`. Do **not** leave issues open after the work shipped — keywords must close them.

---

## GitHub automation keywords (required)

GitHub scans **pull request descriptions** and **commit messages** for these keywords. When the PR merges into the default branch, matching issues are **linked** and **automatically closed**.

### Closing keywords (use one)

| Keyword | Example | Result on merge |
|---------|---------|-----------------|
| `Closes` | `Closes #37` | Issue #37 closes |
| `Close` | `Close #37` | Same |
| `Closed` | `Closed #37` | Same |
| `Fixes` | `Fixes #19` | Preferred for bugs |
| `Fix` | `Fix #19` | Same |
| `Fixed` | `Fixed #19` | Same |
| `Resolves` | `Resolves #40` | Same |
| `Resolve` | `Resolve #40` | Same |
| `Resolved` | `Resolved #40` | Same |

### Non-closing link (reference only)

| Keyword | Example | Result |
|---------|---------|--------|
| `Refs` / `References` | `Refs #39` | Links discussion; issue stays open |

### Rules

- Prefer the keyword in the **PR body** (most reliable), not only in a commit subject.
- One PR should usually close **one** issue: `Closes #42`.
- Multiple issues only when the PR fully finishes each:  
  `Closes #44`  
  `Closes #45`
- Never rely on manually clicking “Close issue” after merge if a keyword would have done it.
- Partial work: use `Refs #N` and leave the issue open.

### Good PR description example

```markdown
## Summary
- Add frontend and backend GitHub Actions workflows.

## Test plan
- [x] Open a draft PR touching frontend/ and confirm CI runs
- [x] Open a draft PR touching backend/ and confirm pytest job runs

Closes #37
```

### Good commit message example (optional extra)

```text
chore(ci): add frontend and backend GitHub Actions

Closes #37
```

---

## Branch naming

| Pattern | Use |
|---------|-----|
| `feature/<issue>-short-name` | Features |
| `fix/<issue>-short-name` | Bugs |
| `chore/<issue>-short-name` | CI, docs, infra |

Examples:

```text
chore/37-github-actions-ci
chore/38-contributing-keywords
feature/40-supabase-schema
fix/55-seat-map-double-select
```

## Commands

```powershell
git checkout main
git pull origin main
git checkout -b chore/37-github-actions-ci

# ... commits ...

git push -u origin HEAD
gh pr create --title "chore(ci): implement GitHub Actions (#37)" --body "$(@'
## Summary
- Fill empty CI workflows for frontend and backend.

## Test plan
- [ ] CI runs on this PR

Closes #37
'@)"
```

## PR title style

```text
feat(auth): Supabase JWT validation and RBAC (#41)
fix(frontend): prevent double seat selection (#55)
chore(ci): add frontend lint/build and backend pytest (#37)
docs: CONTRIBUTING and PR template with issue keywords (#38)
```

## Merge checklist

- [ ] PR body contains `Closes #N` / `Fixes #N` / `Resolves #N`
- [ ] CI green
- [ ] Issue acceptance criteria checked
- [ ] No `.env` or secrets committed
- [ ] Prefer **squash merge** for a clean `main` history

## MVP issue map (tracking set)

| Work item | Issue |
|-----------|------:|
| Phase 0–1 prerequisites (done) | #35 |
| Phase 0–1 env bootstrap (done) | #36 |
| CI Actions | #37 |
| CONTRIBUTING / keywords | #38 |
| Frontend audit | #39 |
| Supabase schema | #40 |
| Auth + JWT + RBAC | #41 |
| OpenAPI contract | #42 |
| App shell / routing | #43 |
| Event discovery | #44 |
| Seat selection | #45 |
| Booking lifecycle | #46 |
| Notifications | #47 |
| Organizer panel | #48 |
| Analytics | #49 |
| Admin | #50 |
| Vitest + Pytest baseline | #51 |
| Deploy smoke (Vercel + HF) | #52 |

Full process: [MVP/Project Documentation/github workflow.md](MVP/Project%20Documentation/github%20workflow.md)
