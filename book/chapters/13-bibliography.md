# Chapter 13 — Bibliography and Further Reading

Sources are grouped by theme. Where a primary paper exists it is cited alongside
the official documentation an engineer actually uses day to day.

## Foundations: transformers, tokens, embeddings

- Vaswani, A. et al. (2017). *Attention Is All You Need.* NeurIPS.
- Devlin, J. et al. (2019). *BERT: Pre-training of Deep Bidirectional
  Transformers for Language Understanding.* NAACL.
- Reimers, N. & Gurevych, I. (2019). *Sentence-BERT.* EMNLP.
- Liu, N. et al. (2023). *Lost in the Middle: How Language Models Use Long
  Contexts.*
- OpenAI Tokenizer documentation; Hugging Face LLM Course.
- Raschka, S. *Build a Large Language Model (From Scratch).* (stylistic model for
  this book.)

## Retrieval-Augmented Generation

- Lewis, P. et al. (2020). *Retrieval-Augmented Generation for Knowledge-Intensive
  NLP Tasks.* NeurIPS.
- Robertson, S. & Zaragoza, H. (2009). *The Probabilistic Relevance Framework:
  BM25 and Beyond.*
- Cormack, G. et al. (2009). *Reciprocal Rank Fusion Outperforms Condorcet and
  Individual Rank Learning Methods.* SIGIR.
- Nogueira, R. & Cho, K. (2019). *Passage Re-ranking with BERT.*
- ChromaDB, sentence-transformers, and Cohere Rerank documentation.

## Evaluation and observability

- Es, S. et al. (2023). *RAGAS: Automated Evaluation of Retrieval Augmented
  Generation.* Ragas documentation.
- Langfuse, LangSmith, and Braintrust documentation.
- OpenTelemetry specification (traces, spans, context propagation).
- Beyer, B. et al. (2016). *Site Reliability Engineering* (Google) — the Four
  Golden Signals and percentile-based monitoring.

## Local models and structured output

- Ollama documentation and model library.
- Model cards: Llama 3.2 (Meta), Phi-4 (Microsoft), Mistral 7B (Mistral AI).
- Instructor (`python.useinstructor.com`) and Pydantic documentation.
- `llama.cpp` / GGUF quantization notes (K-quants).

## Fine-tuning: LoRA, QLoRA, DPO

- Hu, E. et al. (2021). *LoRA: Low-Rank Adaptation of Large Language Models.*
- Dettmers, T. et al. (2023). *QLoRA: Efficient Finetuning of Quantized LLMs.*
- Rafailov, R. et al. (2023). *Direct Preference Optimization: Your Language Model
  is Secretly a Reward Model.*
- Ouyang, L. et al. (2022). *Training Language Models to Follow Instructions with
  Human Feedback* (InstructGPT / RLHF).
- Hugging Face TRL and PEFT documentation; Axolotl documentation; Qwen3 model
  card; dataset cards for `ultrachat_200k` and
  `distilabel-intel-orca-dpo-pairs`.

## Real-time systems

- Nygard, M. (2018). *Release It!* (2nd ed.) — circuit breakers, bulkheads,
  stability patterns.
- Fette, I. & Melnikov, A. (2011). *The WebSocket Protocol* (RFC 6455).
- Pipecat documentation; Deepgram, OpenAI, Anthropic, ElevenLabs, and Cartesia
  API documentation.

## Engineering practice: Git, CI, deployment, security

- Chacon, S. & Straub, B. *Pro Git.*
- Conventional Commits; Semantic Versioning (semver.org); Keep a Changelog.
- Gitleaks and pre-commit documentation; GitHub Actions, branch protection, and
  Dependabot documentation; `pip-audit`.
- Docker and Docker Compose documentation; GitHub Container Registry.
- Azure Container Apps, AWS App Runner/Fargate, Google Cloud Run, and Kubernetes
  documentation.
- Wiggins, A. *The Twelve-Factor App.*
- OWASP Top 10 and OWASP testing guidance.

---

## Colophon

This textbook was written to accompany four public repositories under
`github.com/mimuruth` (`prod-rag`, `local-slm-lab`, `llm-finetuning`,
`realtime-voice`) and the `ai-portfolio` hub. Every number tagged **MEASURED** was
produced on the hardware in Chapter 2; every **REQUIRES YOU** item names the exact
manual, credentialed, or GPU step needed to complete it. The PDF is generated from
Markdown by a reproducible Node + Puppeteer pipeline in `ai-portfolio/book/`;
diagrams are rendered with Mermaid and charts with Matplotlib from the projects'
own result files. Nothing here is a fabricated benchmark — that discipline is the
whole point.
