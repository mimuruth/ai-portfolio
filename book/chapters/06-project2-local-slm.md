# Chapter 6 — Project 2: Offline Local SLM Lab

**Repository:** `local-slm-lab` · **What you will build:** a fully offline
assistant on Ollama, a rigorous benchmark harness that compares three models on
identical hardware and prompts, a temperature/determinism study, and a
schema-constrained extraction path — all with **no API keys**.

## 6.1 Why run a model locally at all

Cloud LLMs are convenient, but real constraints rule them out:

- **Privacy** — data cannot leave the premises (healthcare, legal, government).
- **Regulatory compliance** — some regimes forbid sending data to third parties.
- **Latency** — a network round-trip is too slow or too jittery for the use case.
- **Cost at scale** — per-token pricing becomes prohibitive at high volume.
- **Edge deployment** — connectivity is not guaranteed.
- **Data sovereignty** — data must remain in a jurisdiction you control.

A **small language model (SLM)** — a few billion parameters — is often "good
enough" for a bounded task and can run on a laptop. This project quantifies
exactly what "good enough" costs in tokens/second and memory.

## 6.2 Setup and models

```bash
git clone https://github.com/mimuruth/local-slm-lab.git && cd local-slm-lab
ollama pull llama3.2 && ollama pull phi4-mini && ollama pull mistral
python -m venv .venv && .\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
```

The three models span a useful size range: **Llama 3.2 (3B)**, **Phi-4 Mini
(~4B)**, and **Mistral (7B)** — served at their default quantization by Ollama.

## 6.3 The application: CLI and API

The project ships both interfaces over the same core:

```bash
python src/cli.py ask "Summarize: the quarterly report shows 12% revenue growth."
python src/cli.py extract "Invoice from Contoso Ltd. Amount due: $1,240.50 USD."
uvicorn api:app --reload            # the FastAPI wrapper
```

## 6.4 Benchmark methodology

A benchmark is only meaningful if everything except the variable under test is
held constant. `bench/runner.py` fixes hardware, the prompt set
(`prompts/standard_set.jsonl`), generation settings, and context size, and varies
only the model. It measures:

- **Time to first token (TTFT)** — responsiveness; when the user first sees text.
- **Tokens per second** — sustained decode throughput
  (`eval_count / eval_duration` from Ollama).
- **Total latency** — full response time.
- **Model-loading (cold-start) time** — measured *separately* via a warm-up pass.
- **Peak memory** — resident set while generating.

> **The warm-vs-cold distinction (the key methodological idea).** The first
> request to an idle model pays a one-time *model-load* penalty. `runner.py` does
> a **warm-up pass first**, records its first-response latency as **cold start**,
> then times steady-state **warm** requests. Reporting a single blended number
> would hide the single most important production decision: keep the model
> resident, or pay the load penalty on every cold request?

Run it:

```bash
python -m bench.runner --models llama3.2 phi4-mini mistral
```

## 6.5 Measured benchmark results

> **MEASURED — Intel Core Ultra 9 285H · 63 GB RAM · RTX 5070 Laptop GPU ·
> Ollama 0.32.5 · Windows · warm steady-state; cold start = first response
> including model load.**
>
> | Model | Params | Mem (GB) | Tokens/sec | Warm TTFT (ms) | Total (ms) | Cold start (ms) |
> |-------|--------|----------|-----------|----------------|------------|-----------------|
> | llama3.2 | 3B | 2.55 | **89.6** | 455 | 2841 | 3008 |
> | phi4-mini | ~4B | 3.09 | 69.6 | 534 | 3113 | 2632 |
> | mistral | 7B | 4.95 | 53.1 | **126** | 2818 | **8414** |

![Measured throughput and cold-start across the three models. Higher tokens/sec is better; lower cold start is better.](assets/benchmark.png)

*Figure 6.1 — Warm throughput (left) and cold-start penalty (right). Llama 3.2
decodes fastest; Mistral 7B pays an 8.4 s model-load penalty.*

Reading the numbers:

- **Fastest throughput:** `llama3.2` at **89.6 tok/s** — the smallest model
  decodes fastest, as expected.
- **Lowest warm TTFT:** `mistral` at **126 ms** once loaded — first-token latency
  and sustained throughput are *independent axes*; the 7B model starts emitting
  quickly but then decodes slowest.
- **Cold start scales with size:** 2.6 s (phi4-mini) → 3.0 s (llama3.2) → **8.4 s
  (mistral 7B)**. Bigger weights take longer to load. This is the deployment
  tradeoff: a 7B model that idles out of memory pays 8 s on the next request.
- **Memory tracks parameters:** 2.5 → 3.1 → 5.0 GB.

**Takeaways.** For latency-sensitive, always-warm serving, `llama3.2` gives the
best throughput-per-GB. For quality-per-token where a heavier model helps, keep
`mistral` **pinned in memory** (`OLLAMA_KEEP_ALIVE`) to avoid its 8 s cold start.

## 6.6 Temperature and determinism study

`bench/temp_study.py` runs each prompt 5× at temperature 0.0 and 0.7 and counts
**distinct outputs** (via SHA-256 of the trimmed text) and **valid-JSON count**.

```bash
python -m bench.temp_study --model llama3.2 --runs 5
```

> **MEASURED — `llama3.2`, 5 runs per prompt.**
>
> | Temp | Distinct outputs / 5 runs | Valid JSON / 5 | Behaviour |
> |------|---------------------------|----------------|-----------|
> | 0.0 | **1 / 5** (every prompt) | 0 / 5 | fully deterministic — reproducible |
> | 0.7 | 4–5 / 5 | 0 / 5 | high variance — diverse |

Two lessons:

1. **Temperature 0 is fully deterministic here** — 1 distinct output across 5
   runs for every prompt. Essential where you need reproducibility (extraction,
   tool calls). Temperature 0.7 diversifies sharply (4–5 distinct/5) — good for
   brainstorming, risky for structured output.
2. **Determinism ≠ parseability.** Even at temperature 0, *plain prompting
   produced 0/5 valid JSON* — the model wrapped JSON in prose or markdown fences.
   That motivates the next section.

## 6.7 Structured output that you can trust

Plain prompting cannot be relied upon to emit valid JSON (the study proves it).
`schema/extract.py` enforces a **Pydantic** schema with **Instructor**, which
validates the model's output and **retries once** on failure, against Ollama's
OpenAI-compatible endpoint.

> **MEASURED — same 3B model, before vs. after.** Plain prompting: **0/5 valid
> JSON**. With Instructor + Pydantic (validate + retry-once): a validated, typed
> object every time.

```console
$ python src/cli.py extract "Invoice from Contoso Ltd. Amount due: $1,240.50 USD, due 2026-09-01." --model llama3.2
{
  "vendor": "Contoso Ltd.",
  "total": 1240.5,
  "currency": "USD",
  "due_date": "2026-09-01"
}
```

> **Interview framing.** "How did you get reliable JSON from a small local model?"
> "I measured that plain prompting gave 0/5 valid JSON even at temperature 0, so I
> stopped hoping and *enforced* a Pydantic schema with Instructor — it validates
> and retries on invalid output. The reliability comes from the validation loop,
> not from the model's goodwill."

## 6.8 Quantization and the quality-vs-speed tradeoff

Ollama serves quantized weights by default (e.g. `Q4_K_M`), which is why a 7B
model fits in ~5 GB (Section 6.5). Lower-bit quantization trades a little quality
for less memory and faster load. The honest extension of this project is a
quantization sweep (`Q4_K_M` vs `Q5` vs `Q8`) recording the quality-vs-speed
delta on a 30–50 prompt set with a 0–5 quality rubric — the harness is built for
exactly this; the current results use the default quantization and a 3-prompt
starter set, which is stated plainly in `results/benchmark.md`.

## 6.9 Reproduce and record

```bash
python -m bench.runner --models llama3.2 phi4-mini mistral   # -> results/benchmark.md
python -m bench.temp_study --model llama3.2 --runs 5         # -> results/temp_variance.md
python scripts/plot_results.py                                # -> docs/benchmark.png
make test
git add results/ docs/ && git -c user.name="mimuruth" -c user.email="mimuruth@users.noreply.github.com" commit -m "docs: refresh benchmarks"
```

The raw result files, summary tables, chart, and hardware caveats all live in the
repo, so anyone can reproduce the experiment and get comparable numbers on their
own hardware.

### References

- Ollama documentation and model library; Instructor
  (`python.useinstructor.com`); Pydantic documentation; model cards for Llama 3.2,
  Phi-4, and Mistral; `llama.cpp` quantization notes (GGUF / K-quants).
