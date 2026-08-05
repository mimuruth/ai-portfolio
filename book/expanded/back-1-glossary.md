# Glossary

Machine-learning terms, infrastructure acronyms, and DevOps concepts used in this
book. Bold cross-references point to where a term is developed.

**Abstention.** A system's refusal to answer when evidence is insufficient,
returning a fixed "I don't have enough information" instead of a guess. A trust
feature, not a bug (Ch. 4).

**Adapter.** The small set of trainable weights a LoRA fine-tune produces; portable
and swappable without touching the frozen base model (Ch. 7).

**Attention.** The transformer mechanism by which each token weighs every other
token; quadratic in sequence length, which is why context windows are finite
(Ch. 1).

**Backpressure.** Slowing or shedding a fast producer when a downstream consumer
cannot keep up; made explicit with bounded queues (Ch. 8).

**Barge-in.** A user speaking while the assistant is talking; a real-time system
cancels the current turn and listens (Ch. 8).

**Benchmark.** A controlled measurement holding everything constant except the
variable under test (Ch. 6).

**Bi-encoder.** An embedding model that encodes query and passage *separately* —
fast, scalable, used for retrieval (Ch. 4).

**BM25.** A lexical ranking function scoring documents by weighted term overlap;
strong on exact terms, blind to paraphrase (Ch. 4).

**Catastrophic forgetting.** Loss of general ability when a model is over-trained
on a narrow task; mitigated by PEFT and few epochs (Ch. 7).

**Chunking.** Splitting documents into passages (here 500–800 tokens, ~100
overlap) so retrieval is precise and fits the context window (Ch. 1, 4).

**CI/CD.** Continuous Integration / Continuous Delivery — automated checks on every
change (CI) and automated release (CD) (Ch. 3, 5, 10).

**Circuit breaker.** After repeated failures, stop calling a dependency for a
cool-off period instead of timing out on every request (Ch. 8).

**Cold start.** The one-time cost of loading a model into memory before it can
serve; distinct from warm throughput (Ch. 6).

**Container.** An app plus its exact dependencies frozen into a portable image;
here built with Docker (Ch. 10).

**Context window.** The maximum number of tokens a model can consider at once
(input + output) (Ch. 1).

**Cosine similarity.** The cosine of the angle between two vectors; the standard
measure of semantic closeness for embeddings (Ch. 1, 4).

**Cross-encoder.** A reranker that reads query and passage *together* for accuracy;
too slow for the whole corpus, ideal for a shortlist (Ch. 4).

**DPO (Direct Preference Optimization).** Training directly on (chosen, rejected)
pairs to widen the model's preference margin, without a separate reward model
(Ch. 7).

**Embedding.** A vector representing the meaning of text such that similar meanings
have nearby vectors (Ch. 1).

**Evaluation leakage.** Test examples (or near-duplicates) contaminating training,
inflating scores; prevented by cross-split deduplication (Ch. 4, 7).

**Faithfulness.** Whether every claim in an answer is supported by the retrieved
context; the direct measure of hallucination (Ch. 4, 5).

**Fine-tuning.** Changing a model's weights to add a skill or format (contrast with
retrieval, which adds facts) (Ch. 1, 7).

**GGUF / K-quants.** File format and quantization schemes used by the local model
runtime to store weights compactly (Ch. 6).

**GHCR.** GitHub Container Registry; where `prod-rag`'s image is auto-published on a
version tag (Ch. 10).

**gitleaks.** A scanner that detects secrets in a repository's tree and history
(Ch. 3).

**Golden dataset.** A fixed set of questions with known-good answers used for
reproducible, gated evaluation (Ch. 4).

**Gradient.** The slope that tells an optimiser which direction to step to reduce a
loss (Ch. 1, 7).

**Hybrid retrieval.** Combining lexical (BM25) and semantic (vector) retrieval,
fused with RRF (Ch. 4).

**Idempotency.** A property whereby repeating an operation has no additional
effect; important under retries (Ch. 8).

**Instruction tuning / SFT.** Supervised fine-tuning on (prompt, ideal response)
pairs so the model follows instructions in a format (Ch. 7).

**Latency percentiles (p50/p90/p95/p99).** The value below which that fraction of
requests complete; the correct lens on latency, never the average (Ch. 5).

**Little's Law.** For a stable queue, $$L=\lambda W$$: in-flight work equals arrival
rate times time-in-system (Ch. 8).

**Load shedding.** Dropping work under overload to protect latency (Ch. 8).

**Logit.** The raw score a model assigns a candidate token before softmax (Ch. 1).

**LoRA (Low-Rank Adaptation).** Freezing the base and training small low-rank
matrices $$BA$$ added to each layer (Ch. 7).

**MRR (Mean Reciprocal Rank).** The average of $$1/\text{rank}$$ of the first
relevant hit across queries (Ch. 4).

**Ollama.** A runtime that serves open-weight models locally with an OpenAI-
compatible endpoint (Ch. 2, 6).

**Overfitting.** Memorising the training set rather than generalising; caught by a
held-out validation split (Ch. 7).

**PEFT (Parameter-Efficient Fine-Tuning).** Training a tiny number of new
parameters instead of all of them; LoRA is the dominant method (Ch. 7).

**Pre-commit hook.** A check that runs before each commit, e.g., to block secrets
(Ch. 3).

**Precision@K / Recall@K.** Fraction of the top-K that are relevant / fraction of
all relevant items retrieved (Ch. 4).

**Prompt.** The input text that programs an LLM's behaviour for one request; here
versioned as code (Ch. 4).

**QLoRA.** LoRA on a 4-bit-quantized base, letting a 4B model train in ~16 GB
(Ch. 7).

**Quantization.** Storing weights at lower precision (e.g., 4-bit) to cut memory
and load time (Ch. 2, 6, 7).

**Ragas.** An LLM-as-judge framework scoring faithfulness, answer relevancy, and
context precision (Ch. 4, 5).

**RAG (Retrieval-Augmented Generation).** Injecting retrieved evidence into the
prompt so the model answers from facts you control (Ch. 4).

**Reranker.** A model that reorders retrieved candidates by true relevance (here a
cross-encoder) (Ch. 4).

**RRF (Reciprocal Rank Fusion).** Rank-based fusion of multiple ranked lists,
$$\sum_i 1/(k+\text{rank}_i)$$ (Ch. 4).

**Semantic versioning.** `MAJOR.MINOR.PATCH` release numbering; a tag triggers the
image build (Ch. 3, 10).

**Softmax.** Turns logits into a probability distribution; temperature rescales it
(Ch. 1).

**Span / Trace.** A single timed operation / the tree of spans for one request
(Ch. 5).

**Temperature.** The sampling knob controlling determinism vs. diversity (Ch. 1,
6).

**Token / Tokenizer.** The sub-word unit models process / the component that
produces them; the unit of cost and context (Ch. 1).

**TTFT (Time-to-First-Token).** How soon the first output token appears; a
responsiveness metric distinct from throughput (Ch. 6, 8).

**Vector store.** A database of embeddings supporting nearest-neighbour search
(here ChromaDB) (Ch. 4).

**Warm vs. cold.** Steady-state serving (warm) vs. first request including model
load (cold); reported separately (Ch. 6).
