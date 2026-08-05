# Chapter 11 — Portfolio Readiness

"Implemented" and "portfolio-ready with real numbers" are different milestones.
This chapter is the checklist that closes the gap, plus an honest scorecard of
where the four repositories actually stand.

## 11.1 The readiness checklist (apply to every project)

| # | Item | Why it matters to a reviewer |
|---|------|------------------------------|
| 1 | Clean repository structure | They can find things; signals discipline |
| 2 | Complete README | The 60-second judgement is made here |
| 3 | Architecture diagram | Shows you think in systems, not scripts |
| 4 | Setup instructions | "Can I run this?" must be answerable |
| 5 | Reproducible environment | `.python-version`, pinned deps, `Makefile` |
| 6 | Working demo | One command to *see it work* |
| 7 | Automated tests | Green tests = you can change it safely |
| 8 | CI pipeline | Quality is enforced, not aspirational |
| 9 | Security scanning | gitleaks + pre-commit; no leaked secrets |
| 10 | Real benchmarks | Numbers, not adjectives |
| 11 | Evaluation report | You *measured* quality |
| 12 | Screenshots / charts | Skimmable proof |
| 13 | Known limitations | Honesty reads as senior |
| 14 | Cost analysis | You think about unit economics |
| 15 | Deployment instructions | You can ship, not just prototype |
| 16 | Demo script | You can present under time pressure |
| 17 | Interview talking points | Chapter 12 |

> **The "real numbers" bar.** Items 10–11 are what separate a portfolio from a
> tutorial. A reviewer's first probe is "is this real?" A repo that answers with
> `faithfulness 0.87`, `89.6 tok/s`, `p50 2.3 s`, `$0.00025/request` has already
> won the argument.

## 11.2 Turning "implemented" into "ready" — the concrete moves

For each repository, the specific actions that flip the last checkboxes:

- **`prod-rag`** — architecture diagram ✅, results chart ✅, eval + observability
  numbers ✅, CI gate wired ✅. *To finish:* set the `OPENAI_API_KEY` CI secret so
  the gate *enforces* (not skips); run the Langfuse stack once for trace
  screenshots.
- **`local-slm-lab`** — benchmark + temperature tables ✅, chart ✅, structured-
  output before/after ✅. *To finish:* grow the prompt set to 30–50 and add a
  quality rubric + quantization sweep (optional depth).
- **`realtime-voice`** — latency budget ✅, chart ✅, resilience + replay ✅,
  Mermaid pipeline ✅. *To finish:* add live provider keys for one real end-to-end
  latency capture.
- **`llm-finetuning`** — full pipeline + one-command `run_all.sh` ✅, metrics code
  ✅, diagram ✅. *To finish:* run on a GPU box to fill the before/after table (the
  book's single **REQUIRES YOU** result set).

## 11.3 The portfolio scorecard

Status legend: ✅ done · ◐ done, needs a manual/resource step to *activate* · ○
awaiting your resources.

| Capability | prod-rag (P1+P3) | local-slm-lab (P2) | llm-finetuning (P4) | realtime-voice (P5) |
|------------|:---:|:---:|:---:|:---:|
| Clean structure + README | ✅ | ✅ | ✅ | ✅ |
| Architecture diagram | ✅ | ✅ | ✅ | ✅ |
| Reproducible env (`.python-version`, `Makefile`) | ✅ | ✅ | ✅ | ✅ |
| Working demo (one command) | ✅ | ✅ | ✅ (GPU) | ✅ |
| Automated tests | ✅ | ✅ | ✅ | ✅ |
| CI pipeline | ✅ | ✅ | ✅ | ✅ |
| Security scanning (gitleaks + pre-commit) | ✅ | ✅ | ✅ | ✅ |
| Real benchmarks / eval | ✅ 0.87 / 0.85 / 1.00 | ✅ 89.6 tok/s, temp study | ○ awaiting GPU | ◐ ~202 ms (mock-stage baseline) |
| Observability | ✅ p50 2.3s · $0.00025 · 100% cite | — | — | ✅ latency tracker |
| Results chart | ✅ | ✅ | — | ✅ |
| Deployment | ✅ Docker + GHCR + ACA one-liner | container/edge | GPU job | container (WebSocket) |
| CI eval gate *enforced* | ◐ set `OPENAI_API_KEY` secret | n/a | n/a | n/a |
| Live traces / live latency | ◐ run Langfuse stack | n/a | n/a | ◐ add provider keys |

### Reading the scorecard honestly

- **Three of four projects carry real, verified numbers today** (`prod-rag`,
  `local-slm-lab`, and `realtime-voice`'s instrumentation baseline).
- **`llm-finetuning` is a single GPU run from complete** — implemented, tested,
  one-command, and honest about the missing table rather than filling it with
  fiction.
- The ◐ items are *activation* steps (a CI secret, a Docker stack, provider keys)
  — not missing engineering.

## 11.4 The hub: tie it together

The `ai-portfolio` hub repository presents all four projects on one page with a
"results at a glance" scoreboard and cross-links. A reviewer should be able to
land on the hub, read one table, and click into whichever project matches the
role. Pin the four project repos on your GitHub profile and give each a
description and topics (`rag`, `llm`, `fine-tuning`, `observability`,
`real-time`).

> **REQUIRES YOU — final polish.** Pin the repos, set descriptions/topics, and
> (optionally) record a ~90-second Loom walking one `prod-rag` query end to end
> (retrieve → rerank → cite → trace). A short video linked from each README is the
> single highest-leverage addition to a portfolio.

With the work polished and scored, the last step is presenting it — Chapter 12.
