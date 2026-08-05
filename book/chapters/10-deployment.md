# Chapter 10 — Deployment and Shipping

"Runs on my laptop" is a prototype. "Anyone can pull an image and run it, and a
tagged release deploys itself" is a product. This chapter takes `prod-rag` from
local code to a self-publishing container, and surveys the deployment options and
their tradeoffs for all five projects.

## 10.1 Containerising with Docker

- **What a container is:** your app plus its exact dependencies, frozen into a
  portable image that runs identically anywhere Docker runs.
- **Why it exists:** to kill "works on my machine" — the image *is* the machine.
- **Where it fits:** it is the deployable unit for every cloud target below.

`prod-rag` ships a `Dockerfile` that installs the `[serve]` extra (FastAPI +
Uvicorn), copies the source, prompts, config, and corpus, and on first boot
builds the indexes then serves:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONPATH=/app/src PYTHONUNBUFFERED=1
COPY pyproject.toml ./
COPY src ./src
COPY api.py ./
COPY prompts ./prompts
COPY config ./config
COPY docs ./docs
RUN pip install --no-cache-dir -e ".[serve]"
EXPOSE 8000
CMD ["sh", "-c", "[ -d .chroma ] || python -m rag.ingest.loaders --source docs/; uvicorn api:app --host 0.0.0.0 --port 8000"]
```

The FastAPI wrapper (`api.py`) exposes `GET /healthz` (liveness) and `POST /ask`.

Build and run locally:

```bash
docker build -t prod-rag:local .
docker run -p 8000:8000 -e OPENAI_API_KEY=sk-... prod-rag:local
curl -X POST localhost:8000/ask -H "content-type: application/json" -d '{"question":"What is Azure Container Apps?"}'
```

## 10.2 Health checks and readiness

- **Liveness (`/healthz`)** — "is the process up?" If it fails, restart the
  container.
- **Readiness** — "is it ready to serve?" The `prod-rag` container builds indexes
  on first boot, so readiness should wait until the index exists before routing
  traffic. In Container Apps/Kubernetes you map these to health probes so a
  still-warming instance does not receive requests.

## 10.3 Docker Compose (multi-service)

`prod-rag`'s `docker-compose.langfuse.yml` stands up the full observability stack
(Postgres, ClickHouse, Redis, MinIO, Langfuse web + worker) with one command
(Chapter 5). Compose is ideal for *local* multi-service development; for
production you graduate to a managed platform or Kubernetes.

## 10.4 Registries and the self-publishing pipeline

A **container registry** stores images. `prod-rag` publishes to **GitHub
Container Registry (GHCR)** automatically: `.github/workflows/docker.yml` builds
and pushes on any `vX.Y.Z` tag, using the built-in `GITHUB_TOKEN` (no secrets to
configure), with semver + SHA tags and layer caching.

```bash
git tag -a v1.0.0 -m "v1.0.0 — production RAG + observability + CI gating"
git push origin v1.0.0            # -> triggers the build; image appears at
                                  #    ghcr.io/mimuruth/prod-rag:1.0.0 and :latest
```

> **MEASURED (repo state).** `prod-rag` is tagged `v1.0.0`; the `docker` workflow
> is wired to publish on that tag. Making the resulting GHCR package **public** is
> a one-click manual step (Package settings → visibility).

## 10.5 Deploying to the cloud (Azure Container Apps)

With the image published, one command deploys it:

```bash
az containerapp up \
  --name prod-rag --resource-group rg-prod-rag --location eastus \
  --image ghcr.io/mimuruth/prod-rag:1.0.0 \
  --ingress external --target-port 8000 \
  --env-vars OPENAI_API_KEY=secretref:openai-key
```

> **REQUIRES YOU — an Azure subscription.** The Dockerfile, image, and command are
> ready; the actual deploy needs your subscription and an `OPENAI_API_KEY` stored
> as a Container Apps secret. Add `LANGFUSE_*` env vars to stream live traces.

## 10.6 Secrets, configuration, logging, monitoring in production

- **Secrets:** never in the image. Inject at runtime as platform secrets
  (Container Apps secrets, Kubernetes Secrets, cloud secret managers).
- **Configuration:** environment variables (the same `.env` keys), not code.
- **Logging:** structured logs to stdout; the platform aggregates them.
- **Monitoring:** the Chapter 5 metrics + Langfuse traces; wire p90/cost/failure
  alerts.

## 10.7 Choosing a target: the tradeoff table

| Target | Best for | Tradeoff |
|--------|----------|----------|
| **Local only** | Dev, demos, air-gapped | No scaling, no availability guarantees |
| **Azure Container Apps** | Serverless containers, scale-to-zero | Less control than raw K8s; used here for `prod-rag` |
| **AWS (Fargate/App Runner)** | AWS-native serverless containers | Ecosystem lock-in |
| **Google Cloud Run** | Simple serverless containers | Similar tradeoffs to ACA |
| **Kubernetes (AKS/EKS/GKE)** | Full control, complex topologies | Highest operational burden |
| **Serverless functions** | Spiky, short, stateless work | Cold starts; not ideal for warm models |
| **Dedicated VM** | Full control, steady load | You own patching, scaling, HA |
| **Managed AI services** | Fastest path, no infra | Least control; data leaves your box |
| **Self-hosted models** | Privacy, cost at scale | You run the GPUs |

Per project:

- **`prod-rag`** — a container on ACA/Cloud Run (stateless API + local index).
- **`local-slm-lab`** — the whole point is *not* the cloud; ship as a container or
  binary to the edge/on-prem, GPU optional.
- **`llm-finetuning`** — a **GPU** VM or managed training job; adapters to the HF
  Hub; the resulting model deploys like any other.
- **`realtime-voice`** — a stateful, WebSocket service; a container platform that
  supports long-lived connections (ACA, a VM, or K8s), *not* short-lived
  serverless functions.

## 10.8 Scaling, cost control, rollback, releases

- **Scaling:** stateless services (`prod-rag`) scale horizontally behind a load
  balancer; the model API is the bottleneck, so cache and cap concurrency.
- **Cost control:** scale-to-zero for spiky traffic; a smaller model or the local
  SLM (Chapter 6) where quality allows; the **measured** $0.00025/request
  (Chapter 5) is your unit economics.
- **Rollback:** deployments reference an *immutable image tag*; roll back by
  pointing at the previous tag (`:1.0.0` ← `:0.9.0`). Never deploy `:latest` to
  production for exactly this reason.
- **Release management:** tag → CI builds image → deploy the tag → keep a
  changelog. GHCR + `docker.yml` make the first two automatic.

> **Interview framing — "How would you deploy and scale this?"** "Containerise;
> publish an immutable, tagged image on every release via CI; deploy that tag to a
> serverless container platform with health probes and scale-to-zero; keep secrets
> in the platform's secret store; and monitor p90/cost/failure with alerts. Roll
> back by re-pointing at the previous tag. For the fine-tuning and voice services
> I'd diverge — GPU jobs and long-lived WebSocket hosts respectively."

### References

- Docker & Docker Compose docs; GitHub Actions + GHCR docs; Azure Container Apps,
  AWS App Runner/Fargate, Google Cloud Run, and Kubernetes documentation; the
  Twelve-Factor App (config, logs, disposability).
