# About This Book

## Title and edition

**AI Engineering from Scratch to Shipped** — *A Practical Textbook & Portfolio
Guide.* **Expanded Edition, First Printing, 2026.** Author: **Michael Muruthi**.

This edition keeps the full text of the standard edition and adds the scaffolding
a technical, project-based textbook needs: per-chapter **learning objectives**,
**mathematical formulations**, **bare-metal code**, **production notes**,
**hands-on labs**, **review exercises**, and back matter (glossary, hardware
reference, index).

## Prerequisites

You will get the most from this book if you are comfortable with:

- **Python 3** — functions, classes, packages, virtual environments, `pip`. All
  code is Python 3.14.
- **The command line** — running programs, environment variables, `git`.
- **Linear algebra, lightly** — what a **vector** and a **matrix** are, and the
  **dot product**. We derive everything else (cosine similarity, low-rank updates)
  from these. If $$\mathbf{a}\cdot\mathbf{b}=\sum_i a_i b_i$$ looks familiar, you
  are ready.
- **Calculus, very lightly** — the idea of a **gradient** (a slope that tells an
  optimiser which way to step). You never compute one by hand here.
- **Basic probability** — a probability distribution sums to 1; higher probability
  means "more likely."

You do **not** need prior machine-learning experience. Every ML concept is built
up from first principles before any framework appears.

## Code repository

All source code, notebooks, evaluation scripts, benchmarks, and this book's build
pipeline live in public GitHub repositories under **`github.com/mimuruth`**:

| Repository | Projects | URL |
|-----------|----------|-----|
| `prod-rag` | 1 (RAG) + 3 (Observability) | github.com/mimuruth/prod-rag |
| `local-slm-lab` | 2 (Offline SLM) | github.com/mimuruth/local-slm-lab |
| `llm-finetuning` | 4 (LoRA/QLoRA/DPO) | github.com/mimuruth/llm-finetuning |
| `realtime-voice` | 5 (Real-time voice) | github.com/mimuruth/realtime-voice |
| `ai-portfolio` | hub + this book's source | github.com/mimuruth/ai-portfolio |

Clone the repo for a chapter, follow its **Setup** section, and run the exact
commands the chapter shows. Everything a laptop can run is fully implemented — no
pseudocode where the real thing fits.

## Structural philosophy: a first-principles, three-tier layout

Every concept in this book is introduced in the same **three-tier sequence**, so
you always understand *why* before *how*:

1. **The mental model (visual & analog).** A diagram and an everyday engineering
   metaphor — an embedding as a *coordinate on a map*, retrieval as *finding the
   nearest stars*, a LoRA adapter as a *sticky-note patch on a frozen manual*. No
   code, no heavy math yet. This is where intuition is built.
2. **The first-principles math/logic.** The same idea written out with basic
   arithmetic and small matrices, step by step — not a black-box framework call.
   You see the actual sum, the actual dot product, the actual loss.
3. **The bare-metal implementation.** Clean Python using the standard library (or
   a single small dependency) that implements tier 2 directly, *before* any large
   framework. Once you have built the ten-line version, the framework version is
   obvious — and debuggable.

The chapter body (unchanged from the standard edition) carries the narrative and
the real, measured results. The **Engineering Lab** at the end of each core
chapter adds tiers 2 and 3 explicitly, plus production notes and exercises.

## How the augmented sections read

- **Learning Objectives** open each core chapter — concrete engineering outcomes,
  not vague goals.
- **Production Notes** are amber sidebars on the things that bite in production:
  latency tails, token cost, VRAM limits, cold starts.
- **Hands-on Labs** are numbered, copy-pasteable steps that build one working
  component and show the expected output.
- **Review & Exercises** close each core chapter — troubleshooting scenarios, a
  small proof or derivation, and a system-design prompt.

The evidence discipline from the standard edition still holds throughout:
**MEASURED** numbers come from the reference hardware in Chapter 2, **EXAMPLE**
output is illustrative, and **REQUIRES YOU** marks a step needing hardware, a paid
key, or a manual action. No fabricated benchmarks appear anywhere.
