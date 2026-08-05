# Appendix B — Command & Results Cheat Sheet

A one-stop reference: the commands to run each project, the consolidated **measured**
results, and the core formulas. Everything here appears in context earlier; this is
the quick lookup.

## B.1 Commands by project

**Common (in any repo):**

```bash
python -m venv .venv && .\.venv\Scripts\Activate.ps1   # Windows (source .venv/bin/activate on *nix)
pip install -e ".[dev]"
make setup   # = the pip install ;  make lint ;  make test
```

**prod-rag (Projects 1 + 3):**

```bash
python -m rag.ingest.loaders --source docs/          # build vector + BM25 indexes
python -m rag.generate.answer "What is Azure Container Apps?"
python -m rag.observability.metrics                  # p50/p90, cost, citation coverage
python eval/run_ragas.py                             # the CI eval gate, locally
make serve                                           # FastAPI on :8000
docker compose -f docker-compose.langfuse.yml up -d  # tracing stack
```

**local-slm-lab (Project 2):**

```bash
ollama pull llama3.2 && ollama pull phi4-mini && ollama pull mistral
python -m bench.runner --models llama3.2 phi4-mini mistral
python -m bench.temp_study --model llama3.2 --runs 5
python src/cli.py extract "Invoice from Contoso Ltd. Amount due: $1,240.50 USD."
python scripts/plot_results.py
```

**llm-finetuning (Project 4, GPU):**

```bash
pip install torch --index-url https://download.pytorch.org/whl/cu121
bash scripts/run_all.sh    # baseline eval -> prep -> SFT -> eval -> DPO -> eval
```

**realtime-voice (Project 5):**

```bash
python -m pipeline.orchestrator                       # offline demo (mock stages)
python -m replay.recorder --play sessions/example.jsonl
python scripts/plot_results.py
```

**Deploy (prod-rag):**

```bash
git tag -a v1.0.0 -m "..." && git push origin v1.0.0  # CI builds + pushes GHCR image
az containerapp up --name prod-rag --resource-group rg-prod-rag --location eastus \
  --image ghcr.io/mimuruth/prod-rag:1.0.0 --ingress external --target-port 8000 \
  --env-vars OPENAI_API_KEY=secretref:openai-key
```

## B.2 Consolidated results (MEASURED, reference machine)

| Project | Metric | Value |
|---------|--------|-------|
| prod-rag (eval) | faithfulness / answer-rel. / context-prec. | 0.87 / 0.85 / 1.00 |
| prod-rag (ops) | p50 / p90 latency | 2326 ms / 3709 ms |
| prod-rag (ops) | cost / citation coverage / failure | $0.00025 / 100% / 0% |
| local-slm-lab | throughput (llama3.2 3B) | 89.6 tok/s |
| local-slm-lab | warm TTFT (mistral 7B) / cold start | 126 ms / 8414 ms |
| local-slm-lab | determinism @T=0 / @T=0.7 | 1/5 / 4–5/5 distinct |
| realtime-voice | per-stage p50 (ASR/LLM/TTS) | 61.8 / 93.0 / 46.9 ms |
| realtime-voice | end-to-end p50 | ~202 ms |
| llm-finetuning | before/after scorecard | REQUIRES YOU (GPU) |

## B.3 Core formulas

$$\operatorname{cos}(\mathbf{a},\mathbf{b})=\frac{\mathbf{a}\cdot\mathbf{b}}{\lVert\mathbf{a}\rVert\lVert\mathbf{b}\rVert}\qquad p_i=\frac{e^{z_i/T}}{\sum_j e^{z_j/T}}$$

$$\operatorname{RRF}(d)=\sum_i\frac{1}{k+\text{rank}_i(d)}\qquad \text{MRR}=\frac{1}{|Q|}\sum_q\frac{1}{\text{rank of first hit}}$$

$$W'=W+\frac{\alpha}{r}BA\quad(\text{trained }r(d{+}k)\text{ of }dk)\qquad \text{tok/s}=\frac{\text{eval\_count}}{\text{eval\_duration}}$$

$$P_p=x_{(\lceil (p/100)N\rceil)}\qquad L=\lambda W\qquad T_{\text{e2e}}=T_{\text{ASR}}+T_{\text{LLM}}+T_{\text{TTS}}+T_o$$
