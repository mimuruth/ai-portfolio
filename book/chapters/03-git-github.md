# Chapter 3 — Git, GitHub, and Repository Security

Hiring managers read your commit history before they read your code. A clean
history, protected main branch, green CI, and *zero* leaked secrets say
"professional" before a single function is reviewed. This chapter is the workflow
used across all four repositories.

## 3.1 Why version control, and why this way

- **What Git is:** a distributed version-control system that records snapshots
  (commits) of your project and lets many lines of work (branches) coexist.
- **Why it exists:** to make change *safe* — every state is recoverable, every
  change is attributable, and collaboration does not overwrite work.
- **What problem it solves here:** it is the substrate for CI gates (Chapter 5),
  release management (Chapter 10), and the audit trail a reviewer trusts.

## 3.2 Starting or cloning a repository

```bash
# Start fresh
git init
git branch -M main
git remote add origin https://github.com/mimuruth/prod-rag.git

# Or clone an existing one
git clone https://github.com/mimuruth/prod-rag.git
cd prod-rag
```

### Commit identity

These repositories set the author **inline per commit** rather than relying on
global config, which guarantees the right identity even on a shared machine:

```bash
git -c user.name="mimuruth" -c user.email="mimuruth@users.noreply.github.com" \
    commit -m "feat: add hybrid retrieval"
```

Using the GitHub `noreply` email keeps your real address out of the public log.

## 3.3 The everyday loop: branch → stage → commit → push

Never commit straight to `main`. Branch per unit of work:

```bash
git checkout -b feat/reranker      # create + switch to a feature branch
# ... edit files ...
git status                         # what changed?
git diff                           # review the exact changes
git add src/rag/retrieve/rerank.py # stage specific files (prefer over `git add -A`)
git commit -m "feat: add cross-encoder reranker with local fallback"
git push -u origin feat/reranker   # publish the branch
```

### Writing meaningful commits

Follow **Conventional Commits**: `type(scope): summary`. Types you will use:
`feat`, `fix`, `docs`, `test`, `refactor`, `ci`, `chore`. A good message says
*what changed and why*, not "update file."

> **EXAMPLE — a readable history.**
> ```
> feat: result badges, results chart, ACA deploy scaffold, Makefile
> ci: build + push container image to GHCR on version tag
> fix: fold token usage into span metadata for Langfuse v4
> docs: add architecture diagram
> ```

## 3.4 Keeping up to date: pull, rebase, merge, conflicts

```bash
git checkout main
git pull origin main               # fetch + merge others' work

git checkout feat/reranker
git rebase main                    # replay your commits on top of latest main
```

**Rebase vs. merge.** Rebase produces a linear, readable history (preferred for
feature branches before opening a PR). Merge preserves the exact branch topology
(used when integrating a reviewed PR). If a rebase hits a **conflict**:

```bash
# Git marks conflicts in the file with <<<<<<< ======= >>>>>>>
# Edit to the desired result, then:
git add path/to/conflicted_file.py
git rebase --continue              # or: git rebase --abort to back out
```

## 3.5 Preventing secrets from ever being committed

This is the single most important security habit. Four layers, weakest to
strongest:

### Layer 1 — `.gitignore`

Every repo ignores secrets, environments, caches, and build output:

```gitignore
.env
.venv/
__pycache__/
.metrics/
.chroma/
build/
*.log
```

### Layer 2 — `.env.example` (commit the shape, not the secret)

Commit a template with empty values so collaborators know what keys exist:

```bash
# .env.example
OPENAI_API_KEY=
COHERE_API_KEY=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=http://localhost:3000
```

### Layer 3 — Gitleaks (scan for secrets)

**Gitleaks** scans your history and working tree for anything that looks like a
key. Install and run:

```bash
# install (macOS: brew install gitleaks; or download a release binary)
gitleaks detect --source . --verbose
```

> **EXAMPLE — a clean scan.**
> ```
> INF scanned ~180 commits
> INF no leaks found
> ```
> **EXAMPLE — a caught leak (what failure looks like).**
> ```
> WRN leaks found: 1
> Finding:  OPENAI_API_KEY=sk-********************************
> File:     notebooks/scratch.ipynb   Rule: openai-api-key
> ```
> When this fires, you *rotate the key* (Section 3.9) — removing it from the file
> is not enough, because it is already in history and possibly already scraped.

### Layer 4 — Pre-commit hooks (block the leak before it happens)

A **pre-commit hook** runs checks automatically before each commit. Every repo
pins `gitleaks` (v8.18.4) in `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.4
    hooks:
      - id: gitleaks
```

```bash
pip install pre-commit
pre-commit install                 # wire the hook into .git/hooks
pre-commit run --all-files         # run on demand
```

Now a commit that contains a secret is rejected locally — the strongest possible
place to stop it.

## 3.6 Pull requests and code review

```bash
# push the branch, then open a PR (GitHub CLI)
gh pr create --fill --base main --head feat/reranker
```

A PR is where CI runs (lint, tests, and the eval gate — Chapter 5), where a
reviewer comments, and where the *squash-merge* happens so `main` gets one clean
commit per feature:

```bash
gh pr merge --squash --delete-branch
```

## 3.7 Continuous integration on every push

Each repo has GitHub Actions workflows under `.github/workflows/`. `prod-rag`
runs four: `lint-test.yml`, `eval.yml` (the quality gate), `gitleaks.yml`, and
`docker.yml` (image build on tag). A minimal lint-test job:

```yaml
name: lint-test
on: [push, pull_request]
jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install pytest ruff
      - run: ruff check .
      - run: pytest -q
```

> **EXAMPLE — a green run vs. a failed run.**
> ```
> ✓ lint-test  (ubuntu-latest)  32s
> ✓ gitleaks   (ubuntu-latest)  11s
> ✗ rag-eval-gate               58s   faithfulness 0.71 < threshold 0.80
> ```
> The third line is Chapter 5's regression gate doing its job: the PR is blocked
> until quality recovers.

## 3.8 Tags, releases, and changelogs

Tag meaningful milestones with **semantic versioning** (`vMAJOR.MINOR.PATCH`):

```bash
git tag -a v1.0.0 -m "v1.0.0 — production RAG + observability + CI gating"
git push origin v1.0.0
gh release create v1.0.0 --generate-notes
```

In `prod-rag`, pushing a `v*` tag also triggers `docker.yml`, which builds and
publishes the container image to GHCR (Chapter 10). Keep a `CHANGELOG.md` grouped
by release with `Added / Changed / Fixed` sections (the "Keep a Changelog"
format), or let `--generate-notes` draft it from PR titles.

## 3.9 Reverting, secret rotation, and repository settings

- **Undo a bad commit safely (already pushed):** `git revert <sha>` creates a new
  commit that inverts the change — history stays intact (preferred over
  `reset --hard` on shared branches).
- **Secret rotation:** if a key is ever exposed, *revoke it at the provider and
  issue a new one*. Then update your local `.env` and the GitHub Actions secret.
  Scrubbing the file is necessary but **not sufficient** — assume any committed
  key is compromised.
- **GitHub Actions secrets:** store CI credentials as encrypted repo secrets, not
  in code: `gh secret set OPENAI_API_KEY --repo mimuruth/prod-rag`. The workflow
  reads them as `${{ secrets.OPENAI_API_KEY }}`.

### Branch protection (the settings that make CI mean something)

On GitHub → Settings → Branches → protect `main`:

- Require a pull request before merging.
- Require status checks to pass (`lint-test`, `gitleaks`, `rag-eval-gate`).
- Require branches to be up to date before merging.
- Optionally require a review and signed commits.

Without protection, a green CI is advisory; with it, a red check *blocks* the
merge — which is the entire point of Chapter 5's eval gate.

## 3.10 Dependency scanning and forks

- **Dependency scanning:** enable GitHub Dependabot alerts, and for Python run
  `pip-audit` in CI to flag known-vulnerable packages.
- **Forks:** when contributing to a repo you cannot push to, fork it, add the
  original as an `upstream` remote, branch, push to your fork, and open a PR
  across repositories:
  ```bash
  git remote add upstream https://github.com/ORG/repo.git
  git fetch upstream && git rebase upstream/main
  ```

With reproducible environments (Chapter 2) and professional Git hygiene
(Chapter 3) in place, we can build the first system: production-grade RAG.

### References

- Pro Git (Chacon & Straub); Conventional Commits; Keep a Changelog; Semantic
  Versioning (semver.org); Gitleaks and pre-commit documentation; GitHub Actions,
  branch protection, and Dependabot documentation.
