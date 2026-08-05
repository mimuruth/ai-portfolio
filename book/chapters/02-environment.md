# Chapter 2 — The Reproducible Environment

A portfolio project that "works on my machine" is a liability. This chapter
pins down exactly what "the machine" is, how to recreate the environment on
Windows, Linux, and macOS, and how to validate that recreation with health
checks. Every **MEASURED** number later in the book was produced on the hardware
in Section 2.1 with the versions in Section 2.2.

## 2.1 Reference hardware

The benchmark numbers in Chapters 4–6 come from this laptop:

| Component | Value |
|-----------|-------|
| CPU | Intel Core Ultra 9 285H |
| System memory | 63 GB |
| GPU | NVIDIA RTX 5070 Laptop GPU (+ Intel Arc 140T iGPU) |
| OS | Windows 11 |
| Ollama | 0.32.5 |
| Python | 3.14.4 |

> **REQUIRES YOU — GPU for fine-tuning.** The four laptop-runnable projects were
> measured on the machine above. **Project 4 (`llm-finetuning`) needs a CUDA GPU
> with more VRAM than a laptop typically provides** (a 4B model in QLoRA wants
> ~16 GB). Chapter 7 gives a one-command script to run it on a rented GPU box;
> its before/after numbers are the one set this book marks **REQUIRES YOU**.

Rough guidance on what each project needs:

| Project | CPU | GPU | RAM | Disk | Network |
|---------|-----|-----|-----|------|---------|
| `prod-rag` | any modern | none (CPU embeddings) | 8 GB+ | ~2 GB (models + index) | OpenAI key for generation/eval |
| `local-slm-lab` | any modern | helps, not required | 16 GB+ (7B model) | ~10 GB (3 models) | **none** (fully offline) |
| `llm-finetuning` | any | **CUDA, ~16 GB VRAM** | 16 GB+ | ~30 GB (base + datasets + adapters) | Hugging Face (downloads) |
| `realtime-voice` | any modern | none | 4 GB+ | <1 GB | keys only for *live* mode |

## 2.2 Language, versions, and why we pin them

Reproducibility means naming versions. This book uses **Python 3.14.4**. Each
repository records its expected interpreter in a `.python-version` file and its
dependency ranges in `pyproject.toml`.

> **Why pin at all?** A silent minor-version bump in a dependency can change a
> benchmark or break an import. Pinning turns "it broke and I don't know why"
> into "the diff shows exactly what changed." Chapter 3 shows how CI enforces the
> pinned versions on every push.

### The one gotcha worth knowing up front

`local-slm-lab`, `prod-rag`, and `realtime-voice` install cleanly on Python 3.14.
`llm-finetuning` depends on the deep-learning stack (PyTorch, TRL, PEFT), whose
wheels track the CUDA toolchain — install PyTorch **from the CUDA index** that
matches your GPU driver (Chapter 7), not from PyPI's default CPU wheel.

## 2.3 Creating and activating a virtual environment

A **virtual environment** (venv) isolates one project's packages from the rest of
your system, so two projects can depend on different versions without conflict.

**Windows (PowerShell):**

```powershell
cd prod-rag
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python --version          # expect: Python 3.14.4
```

**Linux / macOS (bash/zsh):**

```bash
cd prod-rag
python3 -m venv .venv
source .venv/bin/activate
python --version          # expect: Python 3.14.4
```

Deactivate any time with `deactivate`. Repeat per repository — each has its own
`.venv` (which is git-ignored; never commit it).

## 2.4 Installing dependencies

Every repository is an installable package with a `dev` extra (tests + linters):

```bash
pip install -e ".[dev]"
```

`-e` installs in *editable* mode: your source edits take effect without
reinstalling. The optional `[dev]` group adds `pytest` and `ruff`. `prod-rag`
also defines a `[serve]` extra (FastAPI + Uvicorn) for the container, and a
`[cohere]` extra for the optional hosted reranker.

> **EXAMPLE — successful install (tail).**
> ```
> Successfully built prod-rag
> Installing collected packages: prod-rag
> Successfully installed prod-rag-0.1.0
> ```

Each repo also ships a `Makefile` so the common tasks are one word:

```bash
make setup     # pip install -e ".[dev]"
make lint      # ruff check .
make test      # pytest
```

## 2.5 Installing Ollama and pulling models (Project 2)

**Ollama** runs open-weight models locally with a single binary and an
OpenAI-compatible HTTP endpoint on `localhost:11434`.

- **Windows/macOS:** download the installer from `https://ollama.com/download`.
- **Linux:** `curl -fsSL https://ollama.com/install.sh | sh`.

Verify and pull the three models the benchmark uses:

```bash
ollama --version                 # expect: ollama version is 0.32.5
ollama pull llama3.2             # 3B
ollama pull phi4-mini            # ~4B
ollama pull mistral              # 7B
ollama list                      # confirm all three are present
```

> **EXAMPLE — `ollama list`.**
> ```
> NAME               ID            SIZE     MODIFIED
> llama3.2:latest    a80c4f17acd5  2.0 GB   ...
> phi4-mini:latest   1a2b3c...     2.5 GB   ...
> mistral:latest     f974a74358d6  4.1 GB   ...
> ```

A quick smoke test that the server answers:

```bash
ollama run llama3.2 "Reply with the single word: ok"
```

## 2.6 Docker (for deployment)

**Docker** packages an app plus its dependencies into a portable image. You need
it only for Chapter 10 (deployment) and the `prod-rag` container. Verify:

```bash
docker --version                 # e.g. Docker version 27.x
docker compose version           # for the Langfuse stack in Chapter 5
```

`prod-rag` ships a `Dockerfile` (a FastAPI server) and a
`docker-compose.langfuse.yml` (the self-hosted tracing stack). Both are covered
where they are used.

## 2.7 Environment variables and `.env` files

Secrets (API keys) must **never** be hard-coded or committed. Each repo reads
them from environment variables, loaded from a git-ignored `.env` file via
`python-dotenv`. Every repo ships a committed `.env.example` template:

```bash
cp .env.example .env             # then edit .env with your real keys
```

> **REQUIRES YOU — API keys.** Where to obtain each:
> - **OpenAI** (`OPENAI_API_KEY`) — `platform.openai.com` → API keys. Used by
>   `prod-rag` for generation and by the Ragas eval judge. Paid, usage-based.
> - **Cohere** (`COHERE_API_KEY`, optional) — `dashboard.cohere.com`. Hosted
>   reranker; `prod-rag` falls back to a local cross-encoder if absent.
> - **Langfuse** (`LANGFUSE_*`) — self-hosted (Chapter 5) or `cloud.langfuse.com`.
> - **Deepgram / ElevenLabs / OpenAI or Anthropic** — for *live* `realtime-voice`
>   (Chapter 8). The offline demo needs none of them.
> - **Hugging Face** (`HF_TOKEN`) — `huggingface.co/settings/tokens`, for
>   `llm-finetuning` dataset/model downloads and pushing adapters.

Section 3.5 covers keeping these out of git for good (gitleaks + pre-commit).

## 2.8 Validating the environment (health checks)

Before running anything substantial, confirm the pieces are wired up.

```bash
# Python & package import
python -c "import sys; print(sys.version)"
python -c "import rag; print('prod-rag import OK')"      # from prod-rag, PYTHONPATH=src

# Ollama server reachable
curl http://localhost:11434/api/tags                     # JSON list of models

# Lint + tests green
make lint
make test
```

> **EXAMPLE — `make test` summary.**
> ```
> ===== test session starts =====
> collected 9 items
> tests/test_citations.py ....   [ 44%]
> tests/test_chunker.py ...      [ 77%]
> tests/test_metrics.py ..       [100%]
> ===== 9 passed in 1.42s =====
> ```

## 2.9 Starting, stopping, and cleaning up

```bash
# prod-rag API locally
make serve                       # uvicorn api:app --reload  (http://localhost:8000)

# Langfuse tracing stack (Chapter 5)
docker compose -f docker-compose.langfuse.yml up -d
docker compose -f docker-compose.langfuse.yml down       # stop + remove containers
docker compose -f docker-compose.langfuse.yml down -v    # ALSO delete volumes (wipes traces)

# free disk: remove a local model you no longer need
ollama rm mistral
```

## 2.10 Storage, context, and quantization settings

- **Storage budget:** three Ollama models ≈ 10 GB; `prod-rag`'s Chroma index +
  embeddings ≈ 1–2 GB; `llm-finetuning` base model + datasets + adapters ≈ 30 GB.
- **Context window:** `prod-rag` chunks at 500–800 tokens and retrieves a small
  handful, so prompts stay well under any modern model's window (Chapter 4).
- **Quantization:** Ollama serves models quantized by default (e.g. `Q4_K_M`),
  which is why a 7B model fits in ~5 GB of memory (Chapter 6's table). QLoRA
  (Chapter 7) uses 4-bit quantization of the base model during training.

With the environment reproducible and validated, we can adopt the professional
Git habits that make the whole thing credible — Chapter 3.

### References

- Ollama documentation (`ollama.com/docs`), Python `venv` docs, `python-dotenv`,
  Docker & Docker Compose documentation, PyTorch "Get Started" (CUDA wheels).
