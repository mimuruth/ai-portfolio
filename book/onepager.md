# AI Engineering Portfolio — Executive Summary

**Michael Muruthi** · four public repositories · `github.com/mimuruth` · every headline number is **measured**, not illustrative.

Five production AI-engineering projects across four repositories, covering the core competencies of a production AI engineer: **retrieval, evaluation, observability, offline inference, model training, and real-time systems.** Each repo is self-contained — architecture diagram, tests, CI, security scanning, and a results table with real numbers.

## Results at a glance

| Repository | What it demonstrates | Measured headline |
|------------|----------------------|-------------------|
| **prod-rag** (Projects 1 + 3) | Production RAG: hybrid retrieval + rerank + enforced citations, plus full observability and a CI eval gate | faithfulness **0.87** · answer-rel. **0.85** · context-prec. **1.00** · p50 **2.3 s** · **$0.00025**/req · **100%** citations · **0%** failure |
| **local-slm-lab** (Project 2) | Offline model benchmarking + schema-constrained output | **89.6 tok/s** (Llama 3.2 3B) · cold start **2.6–8.4 s** · temp 0 **fully deterministic** · plain JSON 0/5 → Instructor **valid** |
| **realtime-voice** (Project 5) | Streaming ASR→LLM→TTS with a latency budget + graceful degradation | per-stage p50 ASR **61.8** / LLM **93.0** / TTS **46.9 ms** · **~202 ms** end-to-end (instrumentation baseline) |
| **llm-finetuning** (Project 4) | LoRA/QLoRA SFT + DPO, one-command GPU run | before/after scorecard *(awaiting a GPU run — honestly marked, not fabricated)* |

## The engineering story

- **prod-rag** fuses BM25 + vector retrieval with Reciprocal Rank Fusion, reranks with a cross-encoder, and **enforces citations** so it *abstains* rather than hallucinate. Quality is a Ragas golden-set eval wired into CI as a **regression gate** (fails the build below threshold). Every request emits a Langfuse trace and a cost/latency metric. Ships a Dockerfile + FastAPI API, auto-published to GHCR on tag, one `az containerapp up` from live.
- **local-slm-lab** benchmarks three local models on identical hardware, separating **warm throughput from cold start** (the real serving decision), and proves plain prompting yields 0/5 valid JSON while a Pydantic + Instructor schema fixes it.
- **realtime-voice** measures a per-stage latency budget and plans three outcomes for every call — success, slow (timeout→fallback), failure (circuit-break→degrade) — with a deterministic replay mode.
- **llm-finetuning** specialises a 4B model for structured extraction with QLoRA + DPO; fully implemented, one command from before/after numbers on a GPU.

## Engineering discipline

Strict typing · unit + integration + evaluation tests · GitHub Actions CI · gitleaks + pre-commit (no leaked secrets) · pinned environments + `Makefile` · reproducible benchmarks · Mermaid architecture diagrams · honest labelling of **measured vs. estimated vs. requires-a-resource**.

## Deep dive

Full **~70-page textbook** (concepts from first principles, complete implementation walkthroughs, real results, deployment, and interview prep):
**github.com/mimuruth/ai-portfolio → `book/ai-engineering-textbook.pdf`**
