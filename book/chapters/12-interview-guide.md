# Chapter 12 — Hiring-Manager Presentation Guide

You built the systems; this chapter is how to *talk* about them. For each project
you get a 30-second hook, a 2-minute technical summary, and the specific answers
to the questions interviewers actually ask. The golden rule: **lead with a
measured number, then explain the decision behind it.**

## 12.1 prod-rag (Projects 1 + 3)

- **30 seconds.** "A production RAG system over real Azure docs: hybrid retrieval,
  cross-encoder reranking, and enforced citations that make it *refuse* rather
  than hallucinate. It's fully observable and CI-gated — faithfulness 0.87 with a
  build that fails if quality regresses."
- **2 minutes.** "Ingestion chunks docs at 500–800 tokens with overlap and builds
  a Chroma vector index plus a BM25 index. At query time I fuse both with
  Reciprocal Rank Fusion, rerank the shortlist with a cross-encoder, then generate
  with `gpt-4o-mini` under a grounding prompt and enforce citations — if the
  answer isn't supported, it abstains. Every request emits a Langfuse trace and a
  metrics record: I measured p50 2.3 s, p90 3.7 s, $0.00025 per request, 100%
  citation coverage. Quality is a golden-set Ragas eval wired into CI as a gate at
  0.80 / 0.78 / 0.80, so a PR that lowers faithfulness can't merge."
- **Main challenge:** making quality *non-regressable* — turning "seems good" into
  a threshold a build enforces.
- **Key decision:** citation enforcement + abstention (trust over coverage).
- **Main tradeoff:** hybrid + rerank add latency for accuracy; the p90 tail is
  generation, not retrieval, so it was worth it.
- **A failure & fix:** the eval initially returned `nan` for answer relevancy
  because I wasn't passing an explicit judge LLM/embeddings to Ragas; I also found
  `nan` was slipping through the gate as a pass. I fixed the wrapper and made
  `nan` count as a *failure* — "no signal" must never read as green.
- **Most meaningful metric:** faithfulness — it directly measures hallucination.
- **In production I'd change:** grow the golden set and add Precision@K labels;
  sample live faithfulness, not just offline.
- **What I did / what needs resources:** all code, eval, observability, and CI are
  mine; enforcing the CI gate needs the `OPENAI_API_KEY` secret; live traces need
  the Langfuse stack running.

## 12.2 local-slm-lab (Project 2)

- **30 seconds.** "A fully offline model lab: I benchmarked three local models on
  identical hardware and prompts — Llama 3.2 hits 89.6 tokens/sec — and proved
  that plain prompting gives 0/5 valid JSON while a Pydantic+Instructor schema
  fixes it."
- **2 minutes.** "The harness separates warm throughput from cold start via a
  warm-up pass, because the real production decision is whether to keep a model
  resident. Llama 3.2 (3B) decodes fastest at 89.6 tok/s; Mistral 7B has the
  lowest warm TTFT at 126 ms but an 8.4-second cold start. A temperature study
  shows temp 0 is fully deterministic (1 distinct output / 5 runs) and temp 0.7
  diverges (4–5 / 5). Crucially, even at temp 0 the model wrapped JSON in prose —
  0/5 valid — so I enforce a schema with Instructor and retry-on-invalid."
- **Key decision:** measure warm vs. cold separately.
- **Main tradeoff:** smaller model = higher throughput; larger model = better
  quality but an 8 s load penalty.
- **A failure & fix:** first JSON attempts were unparseable; the fix was to stop
  trusting the prompt and enforce a validated schema.
- **Most meaningful metric:** tokens/sec (throughput per GB drives serving cost).
- **What needs resources:** nothing — it's fully offline.

## 12.3 llm-finetuning (Project 4)

- **30 seconds.** "A QLoRA + DPO pipeline that specialises a 4B model for
  structured JSON extraction, with an objective before/after scorecard and a
  one-command GPU run."
- **2 minutes.** "I picked a task with crisp metrics — JSON validity, exact-match,
  refusal correctness — because fine-tuning only makes sense when you can score
  it. SFT with LoRA teaches the format; DPO on preference pairs, stacked on the
  SFT adapter, aligns the softer behaviours like clean refusals. QLoRA lets a 4B
  base train in ~16 GB and produces a few-MB adapter I can version and swap. The
  whole thing runs with `bash scripts/run_all.sh`."
- **Key decision:** fine-tune for *skill/format*, retrieve for *facts*.
- **Main tradeoff:** QLoRA vs. full fine-tuning — comparable quality for a
  fraction of VRAM and storage.
- **What needs resources:** a CUDA GPU to produce the before/after numbers — I'm
  explicit that those are not yet measured rather than inventing them.
- **Interview honesty win:** "If DPO doesn't beat SFT, that's a real finding — it
  means the preference pairs weren't discriminative, and the fix is better data,
  not more epochs."

## 12.4 realtime-voice (Project 5)

- **30 seconds.** "A streaming voice assistant built around a latency budget —
  ~202 ms mouth-to-ear across ASR, LLM, and TTS — with timeouts, fallbacks, and a
  replay mode so failures are debuggable."
- **2 minutes.** "It's ASR → LLM → TTS over a pipeline where each stage is timed
  and every external call has three planned outcomes: success, slow (timeout →
  fallback), and failure (circuit-break → degrade). The instrumentation measures
  per-stage p50/p90 and sums them to the user-perceived delay. The same code runs
  fully mocked (no keys) or with real providers per key set. A replay mode
  reproduces recorded sessions deterministically, and failure injection verifies
  the user always gets a timely, useful response — never dead air."
- **Key decision:** measure *per stage*, not just end-to-end.
- **Main tradeoff:** graceful degradation adds complexity but is the difference
  between "feels real" and "hangs."
- **Most meaningful metric:** end-to-end p50 (the felt delay).
- **What needs resources:** provider keys for a live latency capture; the
  instrumentation and resilience are real and testable offline.

## 12.5 The question bank

Strong, concise answers to the questions these projects invite.

**Why use hybrid retrieval?** BM25 matches exact terms; vectors match meaning.
Real questions mix both, so fusing them with RRF beats either alone — and RRF is
rank-based, so it needs no score calibration.

**Why a cross-encoder reranker?** A bi-encoder embeds query and passage
separately for speed; a cross-encoder reads them together for accuracy. You can't
afford the cross-encoder over the whole corpus, so you use it to reorder the
shortlist — best of both.

**How did you measure faithfulness?** Ragas with `gpt-4o-mini` as judge over an
18-pair golden set; it checks whether each claim is supported by the retrieved
context. I gated it in CI at 0.80 and made `nan` a failure.

**Why a local model instead of an API?** Privacy/compliance, latency, cost at
scale, edge/offline. I quantified the cost: 89.6 tok/s and a few GB of memory for
a 3B model — enough for a bounded task with zero data egress.

**How did you benchmark tokens/sec?** Fixed hardware, prompt set, and generation
settings; a warm-up pass to isolate cold start; throughput from Ollama's
`eval_count / eval_duration`. Warm and cold reported separately.

**Why QLoRA instead of full fine-tuning?** ~16 GB vs. tens of GB VRAM, a few-MB
swappable adapter vs. a full checkpoint, comparable quality for a single-task
skill.

**What did DPO improve?** It aligns preferences SFT can't — cleaner refusals,
fewer hallucinated fields — stacked on the SFT adapter. And if it doesn't help,
that's a data-quality signal.

**How did you prevent evaluation leakage?** Golden answers derived from the docs,
never shown to the model; disjoint train/val/test with cross-split dedup;
thresholds tuned on validation, reported on held-out test.

**How did you calculate latency percentiles?** Record every request's per-stage
and end-to-end latency to a log, then compute p50/p90 (p95/p99 with enough
volume). I report percentiles, never averages, because the tail is the user who
churns.

**How does the system degrade when a provider fails?** Every call has a timeout →
fallback and a circuit breaker → degraded mode. TTS fails → text fallback; LLM
times out → spoken acknowledgement; WebSocket drops → session recovers. Never dead
air.

**How would you scale it?** Stateless API behind a load balancer, scale-to-zero
on a serverless container platform, immutable tagged images, cache and cap
model concurrency, and alert on p90/cost/failure.

**How would you reduce cost?** Tighter reranked context (fewer input tokens), a
smaller or local model where quality allows, and caching. My measured unit cost is
$0.00025/request, so I can project spend precisely.

**How would you secure the application?** Secrets in a platform secret store never
in git (gitleaks + pre-commit enforce this), least-privilege keys, dependency
scanning, and input validation at the API boundary.

**What would you monitor in production?** p50/p90/p95/p99 latency, cost/request,
failure rate, citation coverage, empty-retrieval and retry rates, and sampled
faithfulness — with alerts on the tail and on quality drift.

> **Closing principle for every answer.** State the number, name the decision,
> admit the tradeoff. "faithfulness 0.87 because I enforce citations and abstain;
> the cost is coverage on thin-evidence questions, which I accept for trust." That
> cadence — measured, deliberate, honest — is what gets the offer.
