# Appendix A — Hardware Reference

This appendix collects the hardware facts a reader needs to size a project and to
read the book's benchmarks correctly. It separates **measured** numbers (produced
on the reference machine) from **published specifications** (vendor figures, given
for planning only — this book did not benchmark these devices).

## A.1 The reference machine (MEASURED)

Every number tagged **MEASURED** in Chapters 4–6 and 8 was produced here:

| Component | Value |
|-----------|-------|
| CPU | Intel Core Ultra 9 285H |
| System memory | 63 GB |
| GPU | NVIDIA RTX 5070 Laptop GPU (+ Intel Arc 140T iGPU) |
| OS | Windows 11 |
| Python | 3.14.4 |
| Ollama | 0.32.5 |

Representative measured results (see the chapters for full tables): local
throughput up to **89.6 tok/s** (Llama 3.2 3B); 7B cold start **8.4 s**; RAG p50
**2.3 s** / p90 **3.7 s** at **$0.00025/request**; voice per-stage p50 summing to
**~202 ms**.

## A.2 GPU planning table (PUBLISHED SPECS — approximate, not measured)

The figures below are **approximate published specifications** intended only to
help you choose a device for the fine-tuning project (Ch. 7). They are **not**
benchmarks run by this book; always confirm against the vendor's current datasheet.

| Class | Example | VRAM | Rough role |
|-------|---------|------|-----------|
| Consumer laptop | RTX 40/50-series Laptop | 8–16 GB | Inference; QLoRA on ≤4B with care |
| Consumer desktop | RTX 4090 / 5090 class | 24–32 GB | QLoRA on 7–13B; SFT on small models |
| Workstation / cloud | L40S / A100 40–80 GB | 40–80 GB | Full fine-tunes, larger models |
| Datacentre | H100 / H200 class | 80–141 GB | Large-scale training / serving |
| TPU (cloud) | TPU v5e / v5p pods | pod-scale HBM | Large-scale training via XLA |

> **Reading this table.** "Rough role" is guidance, not a guarantee — it depends on
> model size, batch size, sequence length, and quantization. Use §A.3 to compute an
> actual budget rather than trusting a category.

## A.3 Sizing VRAM for a fine-tune (first-principles)

A practical lower bound for **QLoRA** memory:

$$\text{VRAM} \approx \underbrace{0.5\,P}_{\text{4-bit weights}} + \underbrace{\text{adapter} + \text{optimizer state}}_{\text{small}} + \underbrace{\text{activations}}_{\propto\ \text{batch}\times\text{seq len}}$$

where $$P$$ is the parameter count. For a 4B model the 4-bit weights alone are
$$0.5 \times 4\times10^{9} \approx 2$$ GB; the adapter and its optimizer state are
megabytes; activations dominate the rest and scale with batch size and sequence
length. This is why a 4B QLoRA run fits in ~16 GB but the *same* model in full
precision (≈ 16 GB for weights alone) does not.

**Levers when you run out of memory:** lower the batch size (and raise gradient
accumulation to compensate), shorten sequence length, reduce LoRA rank $$r$$, or
move to a larger card.

## A.4 Benchmarking methodology checklist

A hardware number is only comparable if the method is stated. When you publish one,
record all of:

- **Device**: exact CPU/GPU, VRAM, driver/CUDA version, OS.
- **Software**: runtime version (e.g., Ollama 0.32.5), model + quantization tag,
  library versions.
- **Workload**: the exact prompt set, generation settings, context size, sampling
  (temperature).
- **Warm vs. cold**: report the model-load cost separately from steady-state
  throughput (Ch. 6).
- **Statistics**: percentiles (p50/p90), not averages; the sample size $$N$$.
- **Repeatability**: the command to reproduce, and the raw result file.

The project repos follow this checklist — e.g., `results/benchmark.md` states the
hardware, runtime, method, and raw table so anyone can reproduce comparable numbers
on their own device.
