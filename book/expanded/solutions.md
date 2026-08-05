# Solutions to Review & Exercises

Worked answers to every **Review & Exercises** prompt in the Engineering Labs
(Chapters 1–13). Where a computation is involved, the arithmetic is shown.

## Chapter 1 — Foundations

**Troubleshooting (softmax `nan`).** The stabilising line is `m = max(scaled)`
followed by `math.exp(z - m)`. Subtracting the maximum makes the largest exponent
$$e^{0}=1$$ and all others $$\le 1$$, so nothing overflows. It does not change the
result because softmax is shift-invariant: multiplying numerator and denominator by
$$e^{-m}$$ cancels, leaving the same probabilities.

**Proof (temperature preserves argmax).** Dividing every logit by $$T>0$$ is a
strictly increasing transformation, so it preserves the *order* of the logits. The
softmax is monotonic in its input, hence $$\arg\max_i p_i$$ is unchanged. Temperature
only reshapes *how much* probability the non-top tokens receive — never *which* token
is most likely.

**System design (weekly price list).** **Retrieve.** The deciding factor is that the
knowledge is **private and changes frequently** — put it in a retrieval index you can
update instantly, not into weights you would have to retrain. (Fine-tune only for a
persistent skill/format, not for facts.)

## Chapter 2 — Environment

**Troubleshooting (`import rag` fails).** Either (1) run with the package installed in
editable mode (`pip install -e .`, which registers the `src` layout), or (2) set
`PYTHONPATH=src` for the session. The error means `src` is not on the import path.

**Estimation (40 GB enough?).** Three Ollama models ≈ 10 GB; Chroma index +
embeddings ≈ 1–2 GB; a fine-tune's base + datasets + adapters ≈ 30 GB. Total ≈
41–42 GB — so **40 GB is not quite enough**; free ~5 GB more or skip the local
fine-tune (it belongs on a GPU box anyway).

**System design (20% slower).** Compare, first: the **model + quantization tag**, the
**runtime version** (e.g. Ollama), and **warm vs. cold** measurement (are they timing
a cold start?). These three explain most "same setup" discrepancies.

## Chapter 3 — Git & security

**Troubleshooting (deleted key, pushed).** **Not safe.** The key is still in history
and was public on push. Required action: **rotate it** — revoke at the provider and
issue a new key; scrubbing the file is necessary but insufficient.

**Derivation (layered defence).** With $$k$$ independent layers each failing with
probability $$p$$, a secret slips through all of them with probability $$p^{k}$$. For
$$p=0.1,\ k=4$$: $$0.1^{4}=0.0001$$ — about **1 in 10,000**.

**System design (required CI checks).** For `prod-rag`: `lint-test` (style + unit
tests), `gitleaks` (no secrets), and `rag-eval-gate` (quality ≥ thresholds). Each
protects a different failure mode — broken code, leaked credentials, and silent
quality regression.

## Chapter 4 — RAG

**Troubleshooting (off-topic drift).** Tune the **reranker** first: retrieval is
surfacing lexically similar but off-topic passages, and the cross-encoder's job is to
reorder by *true* relevance. If it still drifts, revisit chunk size (too large dilutes
context), then fusion.

**Computation.** $$R=\{d1,d4\}$$, retrieved top-4 $$[d1,d3,d7,d4]$$, so
$$R\cap\text{retrieved}=\{d1,d4\}$$ (size 2). **Precision@4** $$=2/4=0.5$$; **Recall@4**
$$=2/2=1.0$$; the first relevant hit is `d1` at rank 1, so the **reciprocal rank**
$$=1/1=1.0$$.

**System design (Precision@K labels).** Add, per golden question, the **ids of the
truly relevant chunks**. Compute Precision@K against the retrieved top-K. Prevent
leakage by keeping any threshold/chunk-size tuning on a **validation** slice and
reporting Precision@K on a disjoint, de-duplicated **test** slice.

## Chapter 5 — Observability

**Troubleshooting (stalls hidden).** You are missing a **tail percentile** (p90/p95).
Surface the offenders by opening the traces of the slowest requests and finding the
span that grew.

**Computation.** Latencies $$[120,130,140,150,4000]$$ ms. Mean
$$=(120{+}130{+}140{+}150{+}4000)/5=4540/5=\mathbf{908}$$ ms. p90 (N=5,
$$\lceil0.9\times5\rceil=5$$) $$=\mathbf{4000}$$ ms. The **p90** better represents the
experience — it exposes the 4-second stall the mean hides.

**System design (quality signal).** Sample **faithfulness** on live traffic (an
LLM-judge over a small daily sample) and alert if the rolling value drops below, say,
0.80 — catching quality drift that system-health metrics cannot see.

## Chapter 6 — Local SLM

**Troubleshooting (first request 8× slower).** You are accidentally measuring **cold
start** (model load) mixed into throughput. The harness isolates it with a **warm-up
pass** whose first-response latency is recorded separately as cold start; timed
requests then measure warm steady state.

**Computation.** $$512/5.7\approx\mathbf{89.8}$$ tok/s. Total time to a 512-token
answer $$=\text{TTFT}+\text{decode}=0.300+5.7=\mathbf{6.0}$$ s.

**System design (sporadic, latency-sensitive, on-prem).** Choose a **small model
(3B)** and **keep it warm** (`OLLAMA_KEEP_ALIVE`) so sporadic requests never pay the
cold-start penalty — trading a little idle memory for consistent low latency.

## Chapter 7 — Fine-tuning

**Troubleshooting (over-refusal after DPO).** The fix is **better preference pairs**,
not more epochs (which overfit) — the model learned to prefer refusal because the
`chosen`/`rejected` pairs were not discriminative enough. A modestly lower $$\beta$$
can help, but the root cause is data.

**Computation.** $$d=2048,\ k=8192,\ r=16$$: full $$=2048\times8192=16{,}777{,}216$$;
lora $$=16\times(2048{+}8192)=163{,}840$$; ratio $$=163{,}840/16{,}777{,}216\approx
\mathbf{0.98\%}$$. A non-square $$W$$ changes the numbers but not the story — the
saving $$r(d{+}k)/(dk)$$ stays tiny whenever $$r\ll\min(d,k)$$.

**System design (measurable task).** Task: structured JSON extraction. Metric: JSON
validity + exact-match + refusal correctness. Splits: train / validation / test,
disjoint and **de-duplicated across splits** to prevent leakage; tune on validation,
report on test.

## Chapter 8 — Real-time voice

**Troubleshooting (unbounded latency).** The missing mechanism is a **bounded queue
(with load shedding)**. By Little's Law $$L=\lambda W$$: if arrivals $$\lambda$$ exceed
the drain rate, $$L$$ grows without bound and $$W$$ (latency) climbs forever — a
bounded queue forces the system to shed rather than accumulate.

**Computation.** $$L=\lambda W=20\times0.25=\mathbf{5}$$ in flight on average. With a
concurrency budget of 4 (< 5), the queue grows; you must **raise concurrency to ≥ 5**,
**reduce $$W$$** (faster processing), or **cap/shed $$\lambda$$**.

**System design (TTS outcomes).** Success: audio streams to the speaker.
Slow (timeout): after ~1.5 s, deliver the reply as **on-screen/spoken text fallback**.
Failure (circuit-break): switch to the secondary TTS provider or text, and open a
breaker so the dead provider is skipped for a cool-off period.

## Chapter 9 — Testing

**Troubleshooting (`ModuleNotFoundError: rag` in CI).** CI runs without your local
editable install / `PYTHONPATH`. Fix: `pip install -e .` in the workflow (or set
`PYTHONPATH=src`), matching the local environment.

**Computation.** Coverage $$=850/1000=\mathbf{85\%}$$. It is **not** telling you that
outcomes are correct — only 400 lines are actually asserted, so 450 covered lines ran
without their results being checked.

**System design (voice failure-injection).** Require: ASR failure (→ "please repeat"),
LLM timeout (→ spoken acknowledgement, never dead air), TTS failure (→ text fallback),
and WebSocket disconnect (→ session recovers). Each verifies a specific, timely,
user-visible degraded behaviour.

## Chapter 10 — Deployment

**Troubleshooting (500 on first request).** The **readiness** probe is misconfigured —
traffic is routed before the container has built its index on first boot. Gate
readiness on the index existing so a still-warming instance receives no requests.

**Computation.** $$250{,}000\times\$0.00025=\$62.5$$/day; monthly
$$\approx30\times62.5=\mathbf{\$1{,}875}$$. The single biggest lever: a **smaller or
local model** (or caching) to cut per-request token cost.

**System design (WebSocket service).** Scale-to-zero serverless **functions** drop
long-lived connections and suffer cold starts, breaking a streaming session. Pick a
**container platform that supports long-lived connections** (Azure Container Apps, a
VM, or Kubernetes).

## Chapter 11 — Portfolio readiness

**Troubleshooting (not reproducible).** You are likely missing three methodology facts
from the results file: the **exact device + driver/runtime versions**, the **workload
(prompt set + generation settings)**, and **warm-vs-cold + sample size $$N$$**.

**System design (Known limitations).** *Example:* "The corpus and golden set are small
(18 QA pairs), so scores are a calibrated baseline rather than a leaderboard claim.
Precision@K awaits per-question relevance labels, and a single embedding model and
reranker are used. Next steps: grow the golden set, add relevance labels, and sample
live faithfulness."

## Chapter 12 — Interview

**Scenario (why not fine-tune on docs).** "Because company documents are **facts that
change** — those belong in a retrieval index, not baked into weights I'd have to
retrain. Fine-tune for a persistent **skill or format**, retrieve for facts."

**Scenario (halve the cost).** "My measured unit cost is **$0.00025/request**, mostly
input tokens, so the first lever is **tighter reranked context** (fewer input tokens);
then a smaller or local model where quality allows, plus caching."

**System design (scale 100×).** Stateless API behind a load balancer; horizontal
autoscale (scale-to-zero for spiky traffic); cache and cap model concurrency;
immutable tagged images with fast rollback; **alert on p90 latency first**.

## Chapter 13 — Study path

**Reflection (résumé sentences).** *Examples:* "Built a production RAG system with
enforced citations and a CI eval gate — faithfulness 0.87, p50 2.3 s, $0.00025/req."
· "Benchmarked three local models offline — 89.6 tok/s — and made structured output
reliable via schema validation." · "Specialised a 4B model for JSON extraction with
QLoRA + DPO." · "Engineered a streaming voice pipeline to a ~202 ms latency budget with
graceful degradation."

**Synthesis (one diagram).** The connective story: the **local model** (Project 2) can
serve as `prod-rag`'s generator; **observability** (Project 3) gates the RAG pipeline
(Project 1); the **fine-tuned model** (Project 4) provides fast structured turns for
the **voice assistant** (Project 5). Five repos, one system.
